const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-init-data, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FIREBASE_PROJECT_ID = 'gtwy-bf375';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// ========== Telegram Auth Validation ==========
async function validateTelegramInitData(initData: string, botToken: string): Promise<{ valid: boolean; userId?: number; user?: any }> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { valid: false };
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const enc = new TextEncoder();
    const secretKeyMat = await crypto.subtle.importKey('raw', enc.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const secretHash = await crypto.subtle.sign('HMAC', secretKeyMat, enc.encode(botToken));
    const hmacKey = await crypto.subtle.importKey('raw', secretHash, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', hmacKey, enc.encode(dataCheckString));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (computed !== hash) return { valid: false };
    const userStr = params.get('user');
    if (!userStr) return { valid: false };
    return { valid: true, userId: JSON.parse(userStr).id, user: JSON.parse(userStr) };
  } catch (e) {
    console.error('Telegram validation error:', e);
    return { valid: false };
  }
}

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
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const signingInput = `${header}.${payload}`;
  const pemContents = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), (c: string) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${base64url(signature)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

  for (const [key, value] of Object.entries(fields)) {
    masks.push(key);
    body.fields[key] = toFV(value);
  }

  const mask = masks.map(p => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join('&');
  const res = await fetch(`${FIRESTORE_BASE}/${path}?${mask}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore UPDATE failed: ${res.status} - ${err}`);
  }
}

async function fsCreate(token: string, col: string, fields: Record<string, any>): Promise<string> {
  const body: any = { fields: {} };
  for (const [k, v] of Object.entries(fields)) body.fields[k] = toFV(v);

  const res = await fetch(`${FIRESTORE_BASE}/${col}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Firestore CREATE failed: ${res.status}`);
  const doc = await res.json();
  return doc.name.split('/').pop();
}

async function fsQuery(token: string, collectionId: string, filters: { field: string; op: string; value: any }[]): Promise<any[]> {
  const where = filters.length === 1
    ? { fieldFilter: { field: { fieldPath: filters[0].field }, op: filters[0].op, value: toFV(filters[0].value) } }
    : { compositeFilter: { op: 'AND', filters: filters.map(f => ({ fieldFilter: { field: { fieldPath: f.field }, op: f.op, value: toFV(f.value) } })) } };

  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], where } }),
  });
  if (!res.ok) throw new Error(`Firestore query failed: ${res.status}`);
  const results = await res.json();
  return results.filter((r: any) => r.document).map((r: any) => ({ id: r.document.name.split('/').pop(), ...fromDoc(r.document) }));
}

// ========== Telegram File Send ==========
async function sendTelegramFile(tgUserId: number, fileId: string, fileName: string, title: string): Promise<boolean> {
  const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!BOT_TOKEN) return false;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tgUserId, text: `✅ *Purchase Successful!*\n\n📦 *${title}*\n📄 ${fileName}\n\nSending file...`, parse_mode: 'Markdown' }),
    });
    const sendRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tgUserId, document: fileId, caption: `📦 ${title}\n📄 ${fileName}` }),
    });
    return (await sendRes.json()).ok;
  } catch (e) { console.error('Telegram send error:', e); return false; }
}

// ========== API Key Helpers ==========
async function hashApiKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function genApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return `pr-live-${Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`;
}

// ========== ACTION HANDLERS ==========

async function handlePurchaseProduct(userId: string, tgId: number, body: any, tk: string) {
  const { productId } = body;
  if (!productId) return { error: 'productId required' };

  const user = await fsGet(tk, `users/${userId}`);
  if (!user) return { error: 'User not found' };

  // Already owned → re-send
  if (user.purchasedFiles?.includes(productId)) {
    const product = await fsGet(tk, `products/${productId}`);
    if (product?.files?.length > 0) {
      for (const f of product.files) await sendTelegramFile(tgId, f.telegramFileId, f.name, product.title);
    }
    return { success: true, alreadyOwned: true };
  }

  const product = await fsGet(tk, `products/${productId}`);
  if (!product) return { error: 'Product not found' };

  const price = product.price || 0;
  const isFree = product.isFree && !product.unlockByAds && price === 0;

  if (!isFree && price > 0 && (user.balance || 0) < price) {
    return { error: `Insufficient balance. Need ₹${price}, have ₹${user.balance || 0}` };
  }

  const updates: Record<string, any> = {
    purchasedFiles: [...(user.purchasedFiles || []), productId],
    updatedAt: new Date().toISOString(),
  };
  if (!isFree && price > 0) updates.balance = (user.balance || 0) - price;
  await fsUpdate(tk, `users/${userId}`, updates);

  if (!isFree && price > 0) {
    await fsCreate(tk, 'transactions', {
      userId, type: 'purchase', amount: -price,
      description: `Product: ${product.title}`,
      date: new Date().toISOString(), status: 'completed',
    });
  }

  let fileSent = false;
  if (product.files?.length > 0) {
    for (const f of product.files) {
      if (await sendTelegramFile(tgId, f.telegramFileId, f.name, product.title)) fileSent = true;
    }
  }

  return { success: true, fileSent, newBalance: isFree ? user.balance : (user.balance || 0) - price };
}

async function handlePurchaseBot(userId: string, tgId: number, displayName: string, body: any, tk: string) {
  const { botId, botName, botPrice, webhookUrl } = body;
  if (!botId || !botName || botPrice === undefined) return { error: 'Missing bot details' };

  const user = await fsGet(tk, `users/${userId}`);
  if (!user) return { error: 'User not found' };
  if ((user.balance || 0) < botPrice) return { error: `Insufficient balance. Need ₹${botPrice}, have ₹${user.balance || 0}` };

  await fsUpdate(tk, `users/${userId}`, { balance: (user.balance || 0) - botPrice, updatedAt: new Date().toISOString() });

  await fsCreate(tk, 'transactions', {
    userId, type: 'purchase', amount: -botPrice,
    description: `Bot: ${botName}`, date: new Date().toISOString(), status: 'completed',
  });

  await fsCreate(tk, 'bot_purchases', {
    botId, botName, userId: `tg_${tgId}`, userName: displayName,
    telegramId: tgId, amount: botPrice, status: 'pending', createdAt: new Date().toISOString(),
  });

  await fsCreate(tk, 'admin_notifications', {
    type: 'bot_purchase', title: botName,
    message: `${displayName} purchased for ₹${botPrice}`,
    userId: `tg_${tgId}`, userName: displayName, amount: botPrice,
    read: false, createdAt: new Date().toISOString(),
  });

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId, botName, userId: `tg_${tgId}`, userName: displayName, telegramId: tgId, amount: botPrice, timestamp: new Date().toISOString() }),
      });
    } catch (e) { console.error('Webhook failed:', e); }
  }

  return { success: true, newBalance: (user.balance || 0) - botPrice };
}

async function handleConvertCoins(userId: string, body: any, tk: string) {
  const { coinsAmount } = body;
  if (!coinsAmount || coinsAmount < 10 || coinsAmount % 10 !== 0) return { error: 'Invalid amount (min 10, multiple of 10)' };

  const user = await fsGet(tk, `users/${userId}`);
  if (!user) return { error: 'User not found' };
  if ((user.coins || 0) < coinsAmount) return { error: `Not enough coins. Have ${user.coins || 0}` };

  const balanceToAdd = coinsAmount / 10;
  await fsUpdate(tk, `users/${userId}`, {
    coins: (user.coins || 0) - coinsAmount,
    balance: (user.balance || 0) + balanceToAdd,
    updatedAt: new Date().toISOString(),
  });

  await fsCreate(tk, 'transactions', {
    userId, type: 'coin_earning', amount: balanceToAdd,
    description: `Converted ${coinsAmount} coins`,
    date: new Date().toISOString(), status: 'completed',
  });

  return { success: true, newCoins: (user.coins || 0) - coinsAmount, newBalance: (user.balance || 0) + balanceToAdd };
}

async function handleRecordAdWatch(userId: string, body: any, tk: string) {
  const { coinsToAdd = 5 } = body;
  const user = await fsGet(tk, `users/${userId}`);
  if (!user) return { error: 'User not found' };

  const ar = user.adRewards || { adsWatchedToday: 0, lastWatchDate: '', totalAdsWatched: 0, bonusClaimed: false, lastAdTimestamp: '' };
  const today = new Date().toISOString().split('T')[0];

  if (ar.lastWatchDate !== today) { ar.adsWatchedToday = 0; ar.bonusClaimed = false; }
  if (ar.adsWatchedToday >= 40) return { error: 'Daily ad limit reached' };

  // Server-side cooldown: minimum 10 seconds between ad rewards
  if (ar.lastAdTimestamp) {
    const lastTime = new Date(ar.lastAdTimestamp).getTime();
    const now = Date.now();
    if (now - lastTime < 10000) {
      return { error: 'Too fast. Wait before watching another ad.' };
    }
  }

  await fsUpdate(tk, `users/${userId}`, {
    coins: (user.coins || 0) + coinsToAdd,
    adRewards: { 
      adsWatchedToday: ar.adsWatchedToday + 1, 
      totalAdsWatched: (ar.totalAdsWatched || 0) + 1, 
      lastWatchDate: today, 
      bonusClaimed: ar.bonusClaimed,
      lastAdTimestamp: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  });

  return { success: true, newCoins: (user.coins || 0) + coinsToAdd, adsWatchedToday: ar.adsWatchedToday + 1 };
}

async function handleClaimDailyBonus(userId: string, body: any, tk: string) {
  const { bonusAmount = 10 } = body;
  const user = await fsGet(tk, `users/${userId}`);
  if (!user) return { error: 'User not found' };

  const ar = user.adRewards || { adsWatchedToday: 0, lastWatchDate: '', totalAdsWatched: 0, bonusClaimed: false };
  if (ar.bonusClaimed) return { error: 'Already claimed' };
  if (ar.adsWatchedToday < 10) return { error: 'Watch all ads first' };

  await fsUpdate(tk, `users/${userId}`, {
    coins: (user.coins || 0) + bonusAmount,
    adRewards: { ...ar, bonusClaimed: true },
    updatedAt: new Date().toISOString(),
  });

  return { success: true, newCoins: (user.coins || 0) + bonusAmount };
}

async function handleClaimStreak(userId: string, body: any, tk: string) {
  const { coinsReward } = body;
  if (!coinsReward || coinsReward < 0 || coinsReward > 100) return { error: 'Invalid reward' };

  const user = await fsGet(tk, `users/${userId}`);
  if (!user) return { error: 'User not found' };

  await fsUpdate(tk, `users/${userId}`, {
    coins: (user.coins || 0) + coinsReward,
    updatedAt: new Date().toISOString(),
  });

  return { success: true, newCoins: (user.coins || 0) + coinsReward };
}

async function handleRedeemCode(userId: string, body: any, tk: string) {
  const { code } = body;
  if (!code) return { error: 'Code required' };

  const codes = await fsQuery(tk, 'redeemCodes', [
    { field: 'code', op: 'EQUAL', value: code.toUpperCase() },
    { field: 'isActive', op: 'EQUAL', value: true },
  ]);
  if (codes.length === 0) return { error: 'Invalid code' };

  const cd = codes[0];
  if (cd.usedBy?.includes(userId)) return { error: 'Already used this code' };
  if ((cd.currentUses || 0) >= cd.maxUses) return { error: 'Code limit reached' };
  if (cd.expiresAt && new Date(cd.expiresAt) < new Date()) return { error: 'Code expired' };

  const user = await fsGet(tk, `users/${userId}`);
  if (!user) return { error: 'User not found' };

  const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
  if (cd.rewardType === 'coins') updates.coins = (user.coins || 0) + cd.rewardAmount;
  else updates.balance = (user.balance || 0) + cd.rewardAmount;

  await fsUpdate(tk, `users/${userId}`, updates);
  await fsUpdate(tk, `redeemCodes/${cd.id}`, {
    currentUses: (cd.currentUses || 0) + 1,
    usedBy: [...(cd.usedBy || []), userId],
  });

  return { success: true, rewardType: cd.rewardType, rewardAmount: cd.rewardAmount };
}

async function handleRegenerateApiKey(userId: string, tk: string) {
  const rawKey = genApiKey();
  const keyHash = await hashApiKey(rawKey);

  await fsUpdate(tk, `users/${userId}`, {
    apiKey: { key: rawKey, keyPrefix: rawKey.slice(0, 8), keyHash: keyHash, isActive: true, createdAt: new Date().toISOString() },
    updatedAt: new Date().toISOString(),
  });

  return { success: true, apiKey: rawKey };
}

async function handleRevokeApiKey(userId: string, tk: string) {
  const user = await fsGet(tk, `users/${userId}`);
  if (!user?.apiKey) return { error: 'No API key found' };

  await fsUpdate(tk, `users/${userId}`, {
    apiKey: { ...user.apiKey, isActive: false },
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
}

async function handlePurchaseApiPlan(userId: string, body: any, tk: string) {
  const { planId, planName, credits, validityDays, price } = body;
  if (!planId || !credits || !validityDays) return { error: 'Missing plan details' };

  const user = await fsGet(tk, `users/${userId}`);
  if (!user) return { error: 'User not found' };

  if (price && price > 0 && (user.balance || 0) < price) {
    return { error: `Insufficient balance. Need ₹${price}, have ₹${user.balance || 0}` };
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + validityDays);

  const updates: Record<string, any> = {
    activePlan: { planId, planName: planName || planId, purchaseDate: new Date().toISOString(), expiryDate: expiryDate.toISOString(), totalCredits: credits },
    apiCredits: credits,
    updatedAt: new Date().toISOString(),
  };
  if (price && price > 0) updates.balance = (user.balance || 0) - price;

  await fsUpdate(tk, `users/${userId}`, updates);

  await fsCreate(tk, 'purchases', {
    planId, userId, purchaseDate: new Date().toISOString(),
    expiryDate: expiryDate.toISOString(), totalRequests: credits,
    usedRequests: 0, status: 'active',
  });

  // Referral bonus
  if (user.referral?.referredBy) {
    try {
      const referrer = await fsGet(tk, `users/${user.referral.referredBy}`);
      if (referrer) {
        await fsUpdate(tk, `users/${user.referral.referredBy}`, {
          coins: (referrer.coins || 0) + 50,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) { console.error('Referral bonus error:', e); }
  }

  return { success: true, newBalance: price ? (user.balance || 0) - price : user.balance };
}

async function handleWatchAdForProduct(userId: string, tgId: number, body: any, tk: string) {
  const { productId } = body;
  if (!productId) return { error: 'productId required' };

  const user = await fsGet(tk, `users/${userId}`);
  if (!user) return { error: 'User not found' };

  // Already owned → re-send file
  if (user.purchasedFiles?.includes(productId)) {
    const product = await fsGet(tk, `products/${productId}`);
    if (product?.files?.length > 0) {
      for (const f of product.files) await sendTelegramFile(tgId, f.telegramFileId, f.name, product.title);
    }
    return { success: true, alreadyOwned: true, adsWatched: 0, adsRequired: 0 };
  }

  const product = await fsGet(tk, `products/${productId}`);
  if (!product) return { error: 'Product not found' };
  if (!product.unlockByAds) return { error: 'This product cannot be unlocked by ads' };

  const adsRequired = product.adCreditsRequired || 1;

  // Rate limiting - 10s cooldown between ad watches
  const ar = user.adRewards || { adsWatchedToday: 0, lastWatchDate: '', totalAdsWatched: 0, bonusClaimed: false, lastAdTimestamp: '' };
  const today = new Date().toISOString().split('T')[0];
  if (ar.lastWatchDate !== today) { ar.adsWatchedToday = 0; ar.bonusClaimed = false; }
  if (ar.adsWatchedToday >= 40) return { error: 'Daily ad limit reached (40)' };
  if (ar.lastAdTimestamp) {
    const gap = Date.now() - new Date(ar.lastAdTimestamp).getTime();
    if (gap < 10000) return { error: 'Too fast. Wait before watching another ad.' };
  }

  // Track per-product ad progress
  const productAdProgress = user.productAdProgress || {};
  const currentWatched = (productAdProgress[productId] || 0) + 1;
  productAdProgress[productId] = currentWatched;

  const unlocked = currentWatched >= adsRequired;

  const updates: Record<string, any> = {
    productAdProgress,
    adRewards: {
      adsWatchedToday: ar.adsWatchedToday + 1,
      totalAdsWatched: (ar.totalAdsWatched || 0) + 1,
      lastWatchDate: today,
      bonusClaimed: ar.bonusClaimed,
      lastAdTimestamp: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  if (unlocked) {
    updates.purchasedFiles = [...(user.purchasedFiles || []), productId];
    // Clean up progress for this product
    delete productAdProgress[productId];
    updates.productAdProgress = productAdProgress;
  }

  await fsUpdate(tk, `users/${userId}`, updates);

  // If unlocked, send file and log transaction
  let fileSent = false;
  if (unlocked) {
    await fsCreate(tk, 'transactions', {
      userId, type: 'ad_unlock', amount: 0,
      description: `Ad unlock: ${product.title} (${adsRequired} ads)`,
      date: new Date().toISOString(), status: 'completed',
    });

    if (product.files?.length > 0) {
      for (const f of product.files) {
        if (await sendTelegramFile(tgId, f.telegramFileId, f.name, product.title)) fileSent = true;
      }
    }
  }

  return {
    success: true,
    unlocked,
    fileSent,
    adsWatched: unlocked ? adsRequired : currentWatched,
    adsRequired,
  };
}

// ========== MAIN HANDLER ==========
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const initData = req.headers.get('x-telegram-init-data');
    if (!initData) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
    const auth = await validateTelegramInitData(initData, botToken);
    if (!auth.valid || !auth.userId) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = String(auth.userId);
    const tgId = auth.userId;
    const displayName = [auth.user?.first_name, auth.user?.last_name].filter(Boolean).join(' ');

    const body = await req.json();
    const { action } = body;
    if (!action) return new Response(JSON.stringify({ error: 'Action required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const tk = await getFirestoreAccessToken();

    let result;
    switch (action) {
      case 'purchase-product': result = await handlePurchaseProduct(userId, tgId, body, tk); break;
      case 'purchase-bot': result = await handlePurchaseBot(userId, tgId, displayName, body, tk); break;
      case 'convert-coins': result = await handleConvertCoins(userId, body, tk); break;
      case 'record-ad-watch': result = await handleRecordAdWatch(userId, body, tk); break;
      case 'claim-daily-bonus': result = await handleClaimDailyBonus(userId, body, tk); break;
      case 'claim-streak': result = await handleClaimStreak(userId, body, tk); break;
      case 'redeem-code': result = await handleRedeemCode(userId, body, tk); break;
      case 'watch-ad-for-product': result = await handleWatchAdForProduct(userId, tgId, body, tk); break;
      case 'regenerate-api-key': result = await handleRegenerateApiKey(userId, tk); break;
      case 'revoke-api-key': result = await handleRevokeApiKey(userId, tk); break;
      case 'purchase-api-plan': result = await handlePurchaseApiPlan(userId, body, tk); break;
      default: result = { error: `Unknown action: ${action}` };
    }

    return new Response(JSON.stringify(result), {
      status: result.error ? 400 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Secure API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
