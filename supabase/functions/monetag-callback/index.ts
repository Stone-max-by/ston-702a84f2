const VALID_ZONE_IDS = ['10001705'];
const COINS_PER_AD = 5;
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
  const rawSa = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  if (!rawSa) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
  let sa;
  try {
    sa = JSON.parse(rawSa);
  } catch {
    // If stored as base64
    try {
      sa = JSON.parse(atob(rawSa));
    } catch {
      throw new Error('Cannot parse FIREBASE_SERVICE_ACCOUNT: ' + rawSa.substring(0, 30));
    }
  }
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64urlStr(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));
  const signingInput = `${header}.${payload}`;
  const pem = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pem), (c: string) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key,
    new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${base64url(signature)}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('No access token');
  cachedToken = { token: tokenData.access_token, expiry: Date.now() + 3500000 };
  return tokenData.access_token;
}

// deno-lint-ignore no-explicit-any
function toFV(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number')
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFV) } };
  if (typeof val === 'object') {
    // deno-lint-ignore no-explicit-any
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFV(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// deno-lint-ignore no-explicit-any
function fromFV(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFV);
  if ('mapValue' in val) {
    // deno-lint-ignore no-explicit-any
    const r: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue?.fields || {})) r[k] = fromFV(v);
    return r;
  }
  if ('timestampValue' in val) return val.timestampValue;
  return null;
}

// deno-lint-ignore no-explicit-any
function fromDoc(doc: any): any {
  // deno-lint-ignore no-explicit-any
  const r: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields || {})) r[k] = fromFV(v);
  return r;
}

// deno-lint-ignore no-explicit-any
async function fsGet(token: string, path: string): Promise<any> {
  const res = await fetch(`${FIRESTORE_BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore GET ${res.status}`);
  return fromDoc(await res.json());
}

async function fsUpdate(
  token: string,
  path: string,
  // deno-lint-ignore no-explicit-any
  fields: Record<string, any>
): Promise<void> {
  // deno-lint-ignore no-explicit-any
  const body: any = { fields: {} };
  const masks: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    masks.push(key);
    body.fields[key] = toFV(value);
  }
  const mask = masks.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join('&');
  const res = await fetch(`${FIRESTORE_BASE}/${path}?${mask}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Firestore UPDATE ${res.status}`);
}

async function fsCreate(
  token: string,
  col: string,
  // deno-lint-ignore no-explicit-any
  fields: Record<string, any>
): Promise<string> {
  // deno-lint-ignore no-explicit-any
  const body: any = { fields: {} };
  for (const [k, v] of Object.entries(fields)) body.fields[k] = toFV(v);
  const res = await fetch(`${FIRESTORE_BASE}/${col}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Firestore CREATE ${res.status}`);
  const doc = await res.json();
  return doc.name.split('/').pop();
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const ymid = url.searchParams.get('ymid') || '';
    const zoneId = url.searchParams.get('zone_id') || '';
    const subZoneId = url.searchParams.get('sub_zone_id') || '';
    const requestVar = url.searchParams.get('request_var') || '';
    const telegramId = url.searchParams.get('telegram_id') || '';
    const eventType = url.searchParams.get('event_type') || '';
    const rewardEventType = url.searchParams.get('reward_event_type') || '';
    const estimatedPrice = url.searchParams.get('estimated_price') || '0';

    console.log('Postback received:', JSON.stringify({ ymid, zoneId, telegramId, eventType, rewardEventType }));

    // Skip non-valued events
    if (rewardEventType === 'not_valued') {
      return new Response('OK');
    }

    // Verify zone
    if (!VALID_ZONE_IDS.includes(zoneId)) {
      console.error('Bad zone:', zoneId);
      return new Response('Invalid zone', { status: 403 });
    }

    // Get user ID: prefer telegram_id, fallback ymid
    const userIdRaw = telegramId || ymid;
    if (!userIdRaw) {
      return new Response('No user', { status: 400 });
    }
    const tgId = parseInt(userIdRaw);
    if (isNaN(tgId) || tgId <= 0) {
      return new Response('Bad user', { status: 400 });
    }
    const userId = String(tgId);

    const tk = await getFirestoreAccessToken();

    // Idempotency via ymid
    if (ymid) {
      const dup = await fsGet(tk, `ad_postbacks/${ymid}`);
      if (dup) return new Response('OK');
    }

    const user = await fsGet(tk, `users/${userId}`);
    if (!user) {
      console.error('User not found:', userId);
      return new Response('No user', { status: 404 });
    }

    // Rate limiting
    const ar = user.adRewards || {
      adsWatchedToday: 0,
      lastWatchDate: '',
      totalAdsWatched: 0,
      bonusClaimed: false,
      lastAdTimestamp: '',
    };
    const today = new Date().toISOString().split('T')[0];
    if (ar.lastWatchDate !== today) {
      ar.adsWatchedToday = 0;
      ar.bonusClaimed = false;
    }
    if (ar.adsWatchedToday >= 40) {
      return new Response('Limit', { status: 429 });
    }
    if (ar.lastAdTimestamp) {
      const gap = Date.now() - new Date(ar.lastAdTimestamp).getTime();
      if (gap < 10000) return new Response('Fast', { status: 429 });
    }

    // Credit coins
    await fsUpdate(tk, `users/${userId}`, {
      coins: (user.coins || 0) + COINS_PER_AD,
      adRewards: {
        adsWatchedToday: ar.adsWatchedToday + 1,
        totalAdsWatched: (ar.totalAdsWatched || 0) + 1,
        lastWatchDate: today,
        bonusClaimed: ar.bonusClaimed,
        lastAdTimestamp: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });

    // Record postback
    await fsCreate(tk, 'ad_postbacks', {
      ymid, userId, zoneId, subZoneId,
      eventType, rewardEventType, estimatedPrice,
      requestVar, coinsAwarded: COINS_PER_AD,
      processedAt: new Date().toISOString(),
    });

    console.log(`OK user=${userId} +${COINS_PER_AD}`);
    return new Response('OK');
  } catch (err) {
    console.error('Error:', err);
    return new Response('Error', { status: 500 });
  }
});
