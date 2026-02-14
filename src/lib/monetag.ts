import createAdHandler from 'monetag-tg-sdk';

const ZONE_ID = 10001705;

// Create ad handler once
const showAd = createAdHandler(ZONE_ID);

/**
 * Show a Monetag Rewarded Interstitial ad.
 * Returns true if the user completed watching the ad.
 */
export async function showRewardedAd(): Promise<boolean> {
  try {
    await showAd();
    return true;
  } catch (e) {
    console.error('Monetag ad error:', e);
    return false;
  }
}

/**
 * Show a Monetag Rewarded Pop ad.
 * Returns true if the user completed watching the ad.
 */
export async function showRewardedPop(): Promise<boolean> {
  try {
    await showAd('pop');
    return true;
  } catch (e) {
    console.error('Monetag pop ad error:', e);
    return false;
  }
}
