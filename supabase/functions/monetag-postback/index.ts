// Monetag Postback Handler
// Monetag sends GET requests with these macros:
// {ymid}, {zone_id}, {sub_zone_id}, {request_var}, {telegram_id}, 
// {event_type}, {reward_event_type}, {estimated_price}

const VALID_ZONE_IDS = ['10001705'];
const COINS_PER_AD = 5;

const FIREBASE_PROJECT_ID = 'gtwy-bf375';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// ========== Firebase Service Account JWT ==========
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

// ========== Firestore Helpers ==========
function toFV(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFV) } };
  if (typeof val === 'object') {
    const fields: any = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFV(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFV(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) return (val.arrayValue?.values || []).map(fromFV);
  if ('mapValue' in val) {
    const r: any = {};
    for (const [k, v] of Object.entries(val.mapValue?.fields || {})) r[k] = fromFV(v);
    return r;
  }
  if ('timestampValue' in val) return val.timestampValue;
  return null;
}

function fromDoc(doc: any): any {
  const r: any = {};
  for (const [k, v] of Object.entries(doc.fields || {})) r[k] = fromFV(v);
  return r;
}

async function fsGet(token: string, path: string): Promise<any> {
  const res = await fetch(`${FIRESTORE_BASE}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore GET failed: ${res.status}`);
  return fromDoc(await res.json());
}

async function fsUpdate(token: string, path: string, fields: Record<string, any>): Promise<void> {
  const body: any = { fields: {} };
  const masks: string[] = [];
  for (const [key, value] of Object.entries(fields)) { masks.push(key); body.fields[key] = toFV(value); }
  const mask = masks.map(p => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join('&');
  const res = await fetch(`${FIRESTORE_BASE}/${path}?${mask}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Firestore UPDATE failed: ${res.status} - ${await res.text()}`);
}

async function fsCreate(token: string, col: string, fields: Record<string, any>): Promise<string> {
  const body: any = { fields: {} };
  for (const [k, v] of Object.entries(fields)) body.fields[k] = toFV(v);
  const res = await fetch(`${FIRESTORE_BASE}/${col}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Firestore CREATE failed: ${res.status}`);
  const doc = await res.json();
  return doc.name.split('/').pop();
}

// ========== Postback Handler ==========
Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    
    // Monetag postback params
    const ymid = url.searchParams.get('ymid');              // unique ID passed from SDK
    const zoneId = url.searchParams.get('zone_id');          // main zone ID
    const subZoneId = url.searchParams.get('sub_zone_id');   // actual delivering zone
    const requestVar = url.searchParams.get('request_var');  // placement identifier
    const telegramId = url.searchParams.get('telegram_id');  // auto-collected TG user ID
    const eventType = url.searchParams.get('event_type');    // impression or click
    const rewardEventType = url.searchParams.get('reward_event_type'); // valued or not_valued
    const estimatedPrice = url.searchParams.get('estimated_price');    // revenue in USD

    console.log('Postback received:', { ymid, zoneId, subZoneId, telegramId, eventType, rewardEventType, estimatedPrice, requestVar });

    // Only reward for "valued" events (paid impressions/clicks)
    if (rewardEventType === 'not_valued') {
      console.log('Skipping not_valued event');
      return new Response('OK', { status: 200 });
    }

    // Verify zone ID
    if (!zoneId || !VALID_ZONE_IDS.includes(zoneId)) {
      console.error('Invalid zone_id:', zoneId);
      return new Response('Invalid zone', { status: 403 });
    }

    // Determine user ID — prefer telegram_id (auto-collected), fallback to ymid
    const userIdRaw = telegramId || ymid;
    if (!userIdRaw) {
      console.error('No user identifier found');
      return new Response('Missing user ID', { status: 400 });
    }

    const tgId = parseInt(userIdRaw);
    if (isNaN(tgId) || tgId <= 0) {
      console.error('Invalid user ID:', userIdRaw);
      return new Response('Invalid user', { status: 400 });
    }

    const userId = String(tgId);
    const tk = await getFirestoreAccessToken();

    // Idempotency: use ymid as unique key if available
    const idempotencyKey = ymid || `${telegramId}_${Date.now()}`;
    if (ymid) {
      const existing = await fsGet(tk, `ad_postbacks/${ymid}`);
      if (existing) {
        console.log('Duplicate postback:', ymid);
        return new Response('OK', { status: 200 });
      }
    }

    // Get user
    const user = await fsGet(tk, `users/${userId}`);
    if (!user) {
      console.error('User not found:', userId);
      return new Response('User not found', { status: 404 });
    }

    // Rate limiting
    const ar = user.adRewards || { adsWatchedToday: 0, lastWatchDate: '', totalAdsWatched: 0, bonusClaimed: false, lastAdTimestamp: '' };
    const today = new Date().toISOString().split('T')[0];

    if (ar.lastWatchDate !== today) {
      ar.adsWatchedToday = 0;
      ar.bonusClaimed = false;
    }

    if (ar.adsWatchedToday >= 40) {
      console.log('Daily limit reached:', userId);
      return new Response('Daily limit', { status: 429 });
    }

    if (ar.lastAdTimestamp) {
      const lastTime = new Date(ar.lastAdTimestamp).getTime();
      if (Date.now() - lastTime < 10000) {
        console.log('Too fast:', userId);
        return new Response('Too fast', { status: 429 });
      }
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

    // Record for idempotency & analytics
    await fsCreate(tk, 'ad_postbacks', {
      ymid: ymid || '',
      userId,
      zoneId: zoneId || '',
      subZoneId: subZoneId || '',
      eventType: eventType || '',
      rewardEventType: rewardEventType || '',
      estimatedPrice: estimatedPrice || '0',
      requestVar: requestVar || '',
      coinsAwarded: COINS_PER_AD,
      processedAt: new Date().toISOString(),
    });

    console.log(`Postback OK: user=${userId}, coins=+${COINS_PER_AD}, ymid=${ymid}, event=${eventType}`);
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Postback error:', error);
    return new Response('Internal error', { status: 500 });
  }
});
