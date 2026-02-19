import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Coins, Play, Gift, CheckCircle, Clock, Sparkles, Loader2, 
  ArrowRightLeft, Wallet, Minus, Plus, Ticket, Flame, Users, 
  Copy, Check, TrendingUp, Zap 
} from "lucide-react";
import { useUserApiCredits } from "@/contexts/UserApiCreditsContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";
import { showRewardedAd } from "@/lib/monetag";


// Exchange rate: 10 coins = ₹1
const COINS_PER_RUPEE = 10;
const MIN_COINS_TO_CONVERT = 10;
const MAX_ADS_PER_NETWORK = 10;
const COOLDOWN_SECONDS = 15;

// Streak rewards configuration
const STREAK_REWARDS = [
  { day: 1, coins: 5 },
  { day: 2, coins: 10 },
  { day: 3, coins: 15 },
  { day: 4, coins: 25 },
  { day: 5, coins: 40 },
  { day: 6, coins: 60 },
  { day: 7, coins: 100 },
];

// Ad Networks Configuration - Only Monetag (secured via server postback)
const AD_NETWORKS = [
  { id: "monetag", name: "Monetag", color: "from-blue-500 to-blue-600", coins: 5 },
];

// Get today's date key for localStorage
const getTodayKey = () => new Date().toISOString().split('T')[0];

// Check if two dates are consecutive
const isConsecutiveDay = (lastDate: string, today: string) => {
  const last = new Date(lastDate);
  const current = new Date(today);
  const diffTime = current.getTime() - last.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

export default function CoinsPage() {
  const { 
    userData,
    loading,
    balance,
    coins,
    convertCoins,
    claimStreak,
    redeemCode: secureRedeemCode,
    referral,
    adRewards,
    recordAdWatch,
    claimDailyBonus,
    maxAdsPerDay,
    coinsPerAd,
    dailyBonusAmount,
  } = useUserData();
  
  const { addTransaction } = useUserApiCredits();
  const { requireAuth } = useRequireAuth();
  const { user } = useAuth();
  
  const canClaimBonus = adRewards.adsWatchedToday >= maxAdsPerDay && !adRewards.bonusClaimed;
  
  const [watchingAd, setWatchingAd] = useState<string | null>(null);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [converting, setConverting] = useState(false);
  const [coinsToConvert, setCoinsToConvert] = useState(MIN_COINS_TO_CONVERT);
  const [networkCooldowns, setNetworkCooldowns] = useState<Record<string, number>>({});
  const [networkAdsWatched, setNetworkAdsWatched] = useState<Record<string, number>>({});
  const [redeemCodeInput, setRedeemCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [streakData, setStreakData] = useState({ currentStreak: 0, lastClaimDate: "", claimedToday: false });
  const [claimingStreak, setClaimingStreak] = useState(false);
  
  const redeeming = false; // Managed by secureRedeemCode now

  // Load streak data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('streakData');
    if (stored) {
      const data = JSON.parse(stored);
      const today = getTodayKey();
      
      if (data.lastClaimDate === today) {
        setStreakData({ ...data, claimedToday: true });
      } else if (isConsecutiveDay(data.lastClaimDate, today)) {
        setStreakData({ ...data, claimedToday: false });
      } else if (data.lastClaimDate !== today) {
        setStreakData({ currentStreak: 0, lastClaimDate: "", claimedToday: false });
      }
    }
  }, []);

  // Load ads watched from localStorage
  useEffect(() => {
    const todayKey = getTodayKey();
    const stored = localStorage.getItem(`adsWatched_${todayKey}`);
    if (stored) {
      setNetworkAdsWatched(JSON.parse(stored));
    } else {
      setNetworkAdsWatched({});
    }
  }, []);

  // Cooldown timer for each network
  useEffect(() => {
    const activeNetworks = Object.entries(networkCooldowns).filter(([_, time]) => time > 0);
    if (activeNetworks.length === 0) return;
    
    const timer = setTimeout(() => {
      setNetworkCooldowns(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key] > 0) updated[key] -= 1;
        });
        return updated;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [networkCooldowns]);

  const saveAdsWatched = (newData: Record<string, number>) => {
    const todayKey = getTodayKey();
    localStorage.setItem(`adsWatched_${todayKey}`, JSON.stringify(newData));
    setNetworkAdsWatched(newData);
  };

  const getNetworkAdsWatched = (networkId: string) => networkAdsWatched[networkId] || 0;
  const getTotalAdsWatched = () => Object.values(networkAdsWatched).reduce((a, b) => a + b, 0);

  const maxConvertibleCoins = Math.floor(coins / COINS_PER_RUPEE) * COINS_PER_RUPEE;
  const balanceToReceive = coinsToConvert / COINS_PER_RUPEE;

  const getNetworkCooldown = (networkId: string) => networkCooldowns[networkId] || 0;

  const handleWatchAd = async (networkId: string, networkCoins: number) => {
    if (!requireAuth('earn coins by watching ads')) return;
    
    const networkWatched = getNetworkAdsWatched(networkId);
    if (networkWatched >= MAX_ADS_PER_NETWORK) {
      toast.error(`${networkId} limit reached!`);
      return;
    }

    const networkCooldown = getNetworkCooldown(networkId);
    if (networkCooldown > 0) {
      toast.error(`Wait ${networkCooldown}s for ${networkId}`);
      return;
    }

    setWatchingAd(networkId);
    
    try {
      // Show real Monetag ad — coins are credited via server-to-server postback
      const adCompleted = await showRewardedAd();
      if (!adCompleted) {
        toast.error("Ad not completed. Try again.");
        setWatchingAd(null);
        return;
      }
      
      // Ad completed — coins will be added via Monetag postback automatically
      const newData = { ...networkAdsWatched, [networkId]: networkWatched + 1 };
      saveAdsWatched(newData);
      toast.success(`Ad watched! Coins will be credited shortly.`);
      setNetworkCooldowns(prev => ({ ...prev, [networkId]: COOLDOWN_SECONDS }));
    } catch (err) {
      console.error('Ad watch error:', err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setWatchingAd(null);
    }
  };

  const handleClaimStreak = async () => {
    if (!requireAuth('claim streak reward')) return;
    if (streakData.claimedToday) return;
    
    setClaimingStreak(true);
    try {
      const result = await claimStreak(0); // Server calculates reward
      const today = getTodayKey();
      
      // Use server response for streak data
      const serverDay = result?.day || (streakData.currentStreak + 1);
      const serverReward = result?.reward || STREAK_REWARDS[Math.min(serverDay - 1, 6)].coins;
      
      const newData = {
        currentStreak: serverDay >= 7 ? 1 : serverDay,
        lastClaimDate: today,
        claimedToday: true,
      };
      localStorage.setItem('streakData', JSON.stringify(newData));
      setStreakData(newData);
      
      toast.success(`+${serverReward} streak coins! Day ${serverDay}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to claim streak');
    }
    setClaimingStreak(false);
  };

  const handleClaimBonus = async () => {
    if (!canClaimBonus) return;
    
    setClaimingBonus(true);
    const success = await claimDailyBonus(dailyBonusAmount);
    if (success) {
      toast.success(`+${dailyBonusAmount} bonus!`);
    }
    setClaimingBonus(false);
  };

  const copyReferralLink = () => {
    if (!referral.referralCode) return;
    const link = `https://t.me/YourBotName?start=${referral.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Referral link copied!");
  };

  const handleConvertCoins = async () => {
    if (!requireAuth('convert coins')) return;
    
    if (coinsToConvert < MIN_COINS_TO_CONVERT || coinsToConvert > coins) {
      toast.error("Invalid amount");
      return;
    }

    setConverting(true);
    try {
      await convertCoins(coinsToConvert);
      const addedBalance = coinsToConvert / COINS_PER_RUPEE;
      toast.success(`₹${addedBalance} added!`);
      setCoinsToConvert(MIN_COINS_TO_CONVERT);
    } catch {
      toast.error("Failed");
    }
    setConverting(false);
  };

  const adjustCoins = (delta: number) => {
    const newValue = coinsToConvert + delta;
    if (newValue >= MIN_COINS_TO_CONVERT && newValue <= maxConvertibleCoins) {
      setCoinsToConvert(newValue);
    }
  };

  const handleRedeemCode = async () => {
    if (!requireAuth('redeem a code')) return;
    if (!user?.id) return;

    try {
      const result = await secureRedeemCode(redeemCodeInput);
      if (result.success) {
        toast.success(`+${result.rewardAmount} ${result.rewardType === 'coins' ? 'coins' : '₹'} added!`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to redeem');
    }
    setRedeemCodeInput("");
  };

  if (loading) {
    return (
      <AppLayout title="Coins">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Coins">
      <div className="space-y-4 pb-6">
        {/* Balance Header - Always Visible */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{user ? coins : "---"}</p>
                <p className="text-xs text-muted-foreground">Total Coins</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-success">
                <Wallet className="w-4 h-4" />
                <span className="text-lg font-bold">₹{user ? balance : "---"}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Wallet Balance</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="earn" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="earn" className="text-xs gap-1">
              <Zap className="w-3.5 h-3.5" />
              Earn
            </TabsTrigger>
            <TabsTrigger value="wallet" className="text-xs gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Convert
            </TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs gap-1">
              <Gift className="w-3.5 h-3.5" />
              Rewards
            </TabsTrigger>
          </TabsList>

          {/* EARN TAB */}
          <TabsContent value="earn" className="space-y-4 mt-4">
            {/* Daily Streak */}
            {user && (
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Daily Streak</h3>
                      <p className="text-[10px] text-muted-foreground">{streakData.currentStreak} day streak</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleClaimStreak}
                    disabled={claimingStreak || streakData.claimedToday || !user}
                    variant={streakData.claimedToday ? "outline" : "default"}
                    className="h-8"
                  >
                    {claimingStreak ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : streakData.claimedToday ? (
                      <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Claimed</>
                    ) : (
                      <>Claim +{STREAK_REWARDS[Math.min(streakData.currentStreak, 6)].coins}</>
                    )}
                  </Button>
                </div>
                
                {/* Streak Days Progress */}
                <div className="flex gap-1">
                  {STREAK_REWARDS.map((reward, index) => {
                    const dayNum = index + 1;
                    const isCompleted = streakData.currentStreak >= dayNum || (streakData.claimedToday && streakData.currentStreak === dayNum);
                    const isCurrent = !streakData.claimedToday && streakData.currentStreak + 1 === dayNum;
                    
                    return (
                      <div
                        key={dayNum}
                        className={`flex-1 py-1.5 rounded-lg text-center border transition-all ${
                          isCompleted 
                            ? 'bg-orange-500/20 border-orange-500/40' 
                            : isCurrent 
                              ? 'bg-primary/20 border-primary/40 ring-1 ring-primary/30' 
                              : 'bg-muted/30 border-border/30'
                        }`}
                      >
                        <p className={`text-[9px] font-medium ${isCompleted ? 'text-orange-500' : isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                          D{dayNum}
                        </p>
                        <p className={`text-[10px] font-bold ${isCompleted ? 'text-orange-400' : isCurrent ? 'text-primary' : 'text-foreground/70'}`}>
                          +{reward.coins}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Watch Ads Section */}
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Play className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Watch Ads</h3>
                    <p className="text-[10px] text-muted-foreground">
                      {getTotalAdsWatched()}/{AD_NETWORKS.length * MAX_ADS_PER_NETWORK} watched
                    </p>
                  </div>
                </div>
                {canClaimBonus && (
                  <Button 
                    size="sm" 
                    onClick={handleClaimBonus}
                    disabled={claimingBonus}
                    className="h-8 bg-gradient-to-r from-warning to-success text-white"
                  >
                    {claimingBonus ? <Loader2 className="w-4 h-4 animate-spin" /> : `Bonus +${dailyBonusAmount}`}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {AD_NETWORKS.map((network) => {
                  const networkWatched = getNetworkAdsWatched(network.id);
                  const isNetworkDone = networkWatched >= MAX_ADS_PER_NETWORK;
                  const cooldown = getNetworkCooldown(network.id);
                  
                  return (
                    <div
                      key={network.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isNetworkDone 
                          ? 'bg-success/5 border-success/20' 
                          : 'bg-muted/20 border-border/30 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${network.color} flex items-center justify-center shadow-lg`}>
                          {isNetworkDone ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <Play className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{network.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              {networkWatched}/{MAX_ADS_PER_NETWORK}
                            </span>
                            <span className="text-[10px] text-primary font-medium">
                              +{network.coins} coins
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleWatchAd(network.id, network.coins)}
                        disabled={watchingAd !== null || isNetworkDone || cooldown > 0 || !user}
                        variant={isNetworkDone ? "outline" : "default"}
                        className="h-9 px-4"
                      >
                        {watchingAd === network.id ? (
                          <Clock className="w-4 h-4 animate-spin" />
                        ) : isNetworkDone ? (
                          "Done"
                        ) : cooldown > 0 ? (
                          `${cooldown}s`
                        ) : (
                          "Watch"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* CONVERT TAB */}
          <TabsContent value="wallet" className="space-y-4 mt-4">
            {/* Convert Section */}
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Convert to Balance</h3>
                  <p className="text-[10px] text-muted-foreground">{COINS_PER_RUPEE} coins = ₹1</p>
                </div>
              </div>
              
              {user && coins >= MIN_COINS_TO_CONVERT ? (
                <>
                  <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-xl bg-muted/30">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => adjustCoins(-10)}
                      disabled={coinsToConvert <= MIN_COINS_TO_CONVERT}
                      className="h-10 w-10"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-2xl font-bold">{coinsToConvert}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-success font-medium">₹{balanceToReceive}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => adjustCoins(10)}
                      disabled={coinsToConvert >= maxConvertibleCoins}
                      className="h-10 w-10"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    {[25, 50, 100].map((percent) => {
                      const value = Math.floor((maxConvertibleCoins * percent) / 100 / 10) * 10;
                      if (value < MIN_COINS_TO_CONVERT) return null;
                      return (
                        <Button
                          key={percent}
                          variant="outline"
                          size="sm"
                          onClick={() => setCoinsToConvert(value)}
                          className="flex-1 h-8 text-xs"
                        >
                          {percent}%
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCoinsToConvert(maxConvertibleCoins)}
                      className="flex-1 h-8 text-xs text-primary"
                    >
                      Max
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleConvertCoins}
                    disabled={converting || coinsToConvert < MIN_COINS_TO_CONVERT}
                    className="w-full h-11"
                  >
                    {converting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Convert to ₹{balanceToReceive}
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <Coins className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Need at least {MIN_COINS_TO_CONVERT} coins</p>
                  <p className="text-xs text-muted-foreground/70">Watch ads to earn coins!</p>
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
                <p className="text-lg font-bold text-primary">{COINS_PER_RUPEE}</p>
                <p className="text-[10px] text-muted-foreground">Coins/₹1</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
                <p className="text-lg font-bold text-success">{MIN_COINS_TO_CONVERT}</p>
                <p className="text-[10px] text-muted-foreground">Min Convert</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
                <p className="text-lg font-bold text-yellow-500">{maxConvertibleCoins}</p>
                <p className="text-[10px] text-muted-foreground">Available</p>
              </div>
            </div>
          </TabsContent>

          {/* REWARDS TAB */}
          <TabsContent value="rewards" className="space-y-4 mt-4">
            {/* Referral Section */}
            {user && (
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Referral Program</h3>
                      <p className="text-[10px] text-muted-foreground">Invite friends & earn</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-success">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-bold">₹{referral.referralEarnings || 0}</span>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted/30 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{referral.referralCount || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Total Referrals</p>
                  </div>
                  <div className="bg-success/10 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-success">₹{referral.referralEarnings || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Earnings</p>
                  </div>
                </div>
                
                {/* Referral Link */}
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground">Your Referral Link</p>
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate text-foreground">
                        {referral.referralCode 
                          ? `https://t.me/PyWalletBot?start=${referral.referralCode}` 
                          : "---"}
                      </p>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={copyReferralLink}
                      disabled={!referral.referralCode}
                      className="h-9 px-4 shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Redeem Code */}
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Redeem Code</h3>
                  <p className="text-[10px] text-muted-foreground">Enter promo code</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={redeemCodeInput}
                  onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 h-11 uppercase font-mono"
                  disabled={redeeming || !user}
                />
                <Button
                  onClick={handleRedeemCode}
                  disabled={redeeming || !redeemCodeInput.trim() || !user}
                  className="h-11 px-6"
                >
                  {redeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : "Apply"}
                </Button>
              </div>
            </div>

            {/* Login Prompt for non-users */}
            {!user && (
              <div className="bg-muted/30 rounded-xl p-6 text-center border border-border/50">
                <Gift className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Login to access rewards</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
