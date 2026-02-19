const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FIREBASE_PROJECT_ID = 'gtwy-bf375';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function base64url(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function base64urlStr(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

let cachedToken: { token: string; expiry: number } | null = null;

async function getFirestoreAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiry - 60000) return cachedToken.token;
  const sa = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!);
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64urlStr(JSON.stringify({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now,
  }));
  const signingInput = `${header}.${payload}`;
  const pemContents = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), (c: string) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${base64url(signature)}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('Failed to get Firebase access token');
  cachedToken = { token: tokenData.access_token, expiry: Date.now() + 3500000 };
  return tokenData.access_token;
}

function fromFV(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFV);
  if ('mapValue' in val) {
    const r: any = {};
    for (const [k, v] of Object.entries(val.mapValue?.fields || {})) r[k] = fromFV(v);
    return r;
  }
  return null;
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createSessionToken(username: string): Promise<string> {
  const payload = { sub: username, iat: Date.now(), exp: Date.now() + 24 * 60 * 60 * 1000 };
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return btoa(JSON.stringify(payload)) + '.' + sigHex;
}

async function verifySessionToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const [payloadB64, sigHex] = token.split('.');
    if (!payloadB64 || !sigHex) return { valid: false };
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp < Date.now()) return { valid: false };
    const data = new TextEncoder().encode(JSON.stringify(payload));
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
    const expectedSig = await crypto.subtle.sign('HMAC', key, data);
    const expectedHex = Array.from(new Uint8Array(expectedSig)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (expectedHex !== sigHex) return { valid: false };
    return { valid: true, username: payload.sub };
  } catch { return { valid: false }; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'login') {
      const { username, password } = body;
      if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Username and password required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tk = await getFirestoreAccessToken();
      const res = await fetch(`${FIRESTORE_BASE}/config/admin`, { headers: { Authorization: `Bearer ${tk}` } });
      if (!res.ok) {
        return new Response(JSON.stringify({ error: 'Server error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const doc = await res.json();
      const fields: any = {};
      for (const [k, v] of Object.entries(doc.fields || {})) fields[k] = fromFV(v);

      const storedUsername = fields.adminUsername;
      const storedPasswordHash = fields.adminPasswordHash;

      if (!storedUsername || !storedPasswordHash) {
        return new Response(JSON.stringify({ error: 'Admin credentials not configured. Set adminUsername and adminPasswordHash in Firestore config/admin.' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const inputHash = await hashPassword(password);
      if (username !== storedUsername || inputHash !== storedPasswordHash) {
        return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const sessionToken = await createSessionToken(username);
      return new Response(JSON.stringify({ success: true, token: sessionToken }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify') {
      const { token } = body;
      if (!token) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const result = await verifySessionToken(token);
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
