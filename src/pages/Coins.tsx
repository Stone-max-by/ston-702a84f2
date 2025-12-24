import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coins, Play, Gift, CheckCircle, Clock, Sparkles, Loader2, ArrowRightLeft, Wallet, Minus, Plus, Timer, Ticket, Flame, Users, Copy, Check, TrendingUp } from "lucide-react";
import { useUserApiCredits } from "@/contexts/UserApiCreditsContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";
import { useRedeemCode } from "@/hooks/useRedeemCodes";

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
  { day: 4, coins: 20 },
  { day: 5, coins: 30 },
  { day: 6, coins: 40 },
  { day: 7, coins: 100 },
];

// Ad Networks Configuration
const AD_NETWORKS = [
  { id: "monetag", name: "Monetag", color: "from-blue-500 to-blue-600", coins: 5 },
  { id: "adsterra", name: "Adsterra", color: "from-green-500 to-green-600", coins: 5 },
  { id: "propeller", name: "Propeller", color: "from-purple-500 to-purple-600", coins: 5 },
  { id: "adcash", name: "Adcash", color: "from-orange-500 to-orange-600", coins: 5 },
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
    balance, 
    addCoins,
    dailyBonusAmount,
    canClaimBonus,
    recordAdWatch,
    claimDailyBonus,
    loading 
  } = useUserApiCredits();
  
  const { coins, updateCoins, updateBalance, userData, referral } = useUserData();
  const { requireAuth } = useRequireAuth();
  const { user } = useAuth();
  
  const [watchingAd, setWatchingAd] = useState<string | null>(null);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [converting, setConverting] = useState(false);
  const [coinsToConvert, setCoinsToConvert] = useState(MIN_COINS_TO_CONVERT);
  const [networkCooldowns, setNetworkCooldowns] = useState<Record<string, number>>({});
  const [networkAdsWatched, setNetworkAdsWatched] = useState<Record<string, number>>({});
  const [redeemCodeInput, setRedeemCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Streak state
  const [streakData, setStreakData] = useState({ currentStreak: 0, lastClaimDate: "", claimedToday: false });
  const [claimingStreak, setClaimingStreak] = useState(false);
  
  const { redeemCode, redeeming } = useRedeemCode();

  // Load streak data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('streakData');
    if (stored) {
      const data = JSON.parse(stored);
      const today = getTodayKey();
      
      // Check if streak is still valid
      if (data.lastClaimDate === today) {
        setStreakData({ ...data, claimedToday: true });
      } else if (isConsecutiveDay(data.lastClaimDate, today)) {
        setStreakData({ ...data, claimedToday: false });
      } else if (data.lastClaimDate !== today) {
        // Streak broken, reset to 0
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
    
    // Simulate ad watching (integrate actual SDK here)
    setTimeout(async () => {
      const success = await recordAdWatch();
      if (success) {
        await addCoins(networkCoins);
        
        // Update network-specific count
        const newData = { ...networkAdsWatched, [networkId]: networkWatched + 1 };
        saveAdsWatched(newData);
        
        toast.success(`+${networkCoins} coins!`);
        
        // Start cooldown for this network only
        setNetworkCooldowns(prev => ({ ...prev, [networkId]: COOLDOWN_SECONDS }));
      }
      setWatchingAd(null);
    }, 2500);
  };

  const handleClaimStreak = async () => {
    if (!requireAuth('claim streak reward')) return;
    if (streakData.claimedToday) return;
    
    setClaimingStreak(true);
    const today = getTodayKey();
    const newStreak = streakData.currentStreak + 1;
    const streakDay = Math.min(newStreak, 7);
    const reward = STREAK_REWARDS[streakDay - 1].coins;
    
    await addCoins(reward);
    
    const newData = {
      currentStreak: newStreak > 7 ? 1 : newStreak, // Reset after 7 days
      lastClaimDate: today,
      claimedToday: true,
    };
    localStorage.setItem('streakData', JSON.stringify(newData));
    setStreakData(newData);
    
    toast.success(`+${reward} streak coins! Day ${streakDay}`);
    setClaimingStreak(false);
  };

  const handleClaimBonus = async () => {
    if (!canClaimBonus) return;
    
    setClaimingBonus(true);
    const success = await claimDailyBonus();
    if (success) {
      await addCoins(dailyBonusAmount);
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
      const newCoins = coins - coinsToConvert;
      const addedBalance = coinsToConvert / COINS_PER_RUPEE;
      const newBalance = (userData?.balance || 0) + addedBalance;
      
      await updateCoins(newCoins);
      await updateBalance(newBalance);
      
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

    await redeemCode(redeemCodeInput, user.id, async (rewardType, amount) => {
      if (rewardType === 'coins') {
        await addCoins(amount);
      } else {
        const newBalance = (userData?.balance || 0) + amount;
        await updateBalance(newBalance);
      }
    });
    setRedeemCodeInput("");
  };

  if (loading) {
    return (
      <AppLayout title="Earn Coins">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Earn Coins">
      <div className="space-y-4 pb-6">
        {/* Balance & Coins - Compact */}
        <div className="flex gap-2">
          <div className="flex-1 bg-success/10 rounded-lg p-3 border border-success/20">
            <div className="flex items-center gap-1.5 text-success">
              <Wallet className="w-4 h-4" />
              <span className="text-lg font-bold">{user ? `₹${balance}` : "---"}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Balance</p>
          </div>
          <div className="flex-1 bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
            <div className="flex items-center gap-1.5 text-yellow-500">
              <Coins className="w-4 h-4" />
              <span className="text-lg font-bold">{user ? coins : "---"}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Coins</p>
          </div>
        </div>

        {/* Daily Streak Section */}
        {user && (
          <div className="bg-card rounded-xl p-3 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold">Daily Streak</h2>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-3 h-3" />
                <span className="text-xs font-bold">{streakData.currentStreak} days</span>
              </div>
            </div>
            
            {/* Streak Days */}
            <div className="flex gap-1 mb-3">
              {STREAK_REWARDS.map((reward, index) => {
                const dayNum = index + 1;
                const isCompleted = streakData.currentStreak >= dayNum || (streakData.claimedToday && streakData.currentStreak === dayNum);
                const isCurrent = !streakData.claimedToday && streakData.currentStreak + 1 === dayNum;
                
                return (
                  <div
                    key={dayNum}
                    className={`flex-1 p-1.5 rounded-lg text-center border ${
                      isCompleted 
                        ? 'bg-orange-500/20 border-orange-500/30' 
                        : isCurrent 
                          ? 'bg-primary/20 border-primary/30 animate-pulse' 
                          : 'bg-muted/30 border-border/30'
                    }`}
                  >
                    <p className={`text-[9px] font-medium ${isCompleted ? 'text-orange-500' : isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                      D{dayNum}
                    </p>
                    <p className={`text-[10px] font-bold ${isCompleted ? 'text-orange-400' : isCurrent ? 'text-primary' : 'text-foreground'}`}>
                      +{reward.coins}
                    </p>
                    {isCompleted && <CheckCircle className="w-2.5 h-2.5 mx-auto text-orange-500" />}
                  </div>
                );
              })}
            </div>
            
            <Button
              onClick={handleClaimStreak}
              disabled={claimingStreak || streakData.claimedToday || !user}
              className="w-full h-9 text-sm"
              variant={streakData.claimedToday ? "outline" : "default"}
            >
              {claimingStreak ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : streakData.claimedToday ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Claimed Today
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-1.5" />
                  Claim Day {Math.min(streakData.currentStreak + 1, 7)} Reward
                </>
              )}
            </Button>
          </div>
        )}

        {/* Referral Earnings Section */}
        {user && (
          <div className="bg-card rounded-xl p-3 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Referral Earnings</h2>
              </div>
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-bold">₹{referral.referralEarnings || 0}</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-muted/30 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-foreground">{referral.referralCount || 0}</p>
                <p className="text-[10px] text-muted-foreground">Total Referrals</p>
              </div>
              <div className="bg-success/10 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-success">₹{referral.referralEarnings || 0}</p>
                <p className="text-[10px] text-muted-foreground">Total Earned</p>
              </div>
            </div>
            
            {/* Referral Code */}
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground">Your Code</p>
                <p className="text-sm font-mono font-bold truncate">{referral.referralCode || "---"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyReferralLink}
                disabled={!referral.referralCode}
                className="h-8 px-3"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            <p className="text-[10px] text-muted-foreground text-center">
              Earn ₹ when friends join via your link & verify channel
            </p>
          </div>
        )}

        {/* Redeem Code Section */}
        <div className="bg-card rounded-xl p-3 border border-border/50">
          <div className="flex items-center gap-1.5 mb-3">
            <Ticket className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Redeem Code</h2>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter code"
              value={redeemCodeInput}
              onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
              className="flex-1 h-9 text-sm uppercase"
              disabled={redeeming || !user}
            />
            <Button
              onClick={handleRedeemCode}
              disabled={redeeming || !redeemCodeInput.trim() || !user}
              className="h-9 px-4 text-sm"
            >
              {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
        </div>

        {/* Watch Ads Section */}
        <div className="bg-card rounded-xl p-3 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Play className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Watch Ads</h2>
            </div>
            <span className="text-xs text-muted-foreground">{getTotalAdsWatched()}/{AD_NETWORKS.length * MAX_ADS_PER_NETWORK}</span>
          </div>

          {/* Ad Networks - List Layout */}
          <div className="space-y-2">
            {AD_NETWORKS.map((network) => {
              const networkWatched = getNetworkAdsWatched(network.id);
              const isNetworkDone = networkWatched >= MAX_ADS_PER_NETWORK;
              
              return (
                <div
                  key={network.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${isNetworkDone ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${network.color} flex items-center justify-center`}>
                      {isNetworkDone ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{network.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {networkWatched}/{MAX_ADS_PER_NETWORK} • +{network.coins} coins
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleWatchAd(network.id, network.coins)}
                    disabled={watchingAd !== null || isNetworkDone || getNetworkCooldown(network.id) > 0 || !user}
                    className="h-8 px-4 text-xs"
                    variant={isNetworkDone ? "outline" : "default"}
                  >
                    {watchingAd === network.id ? (
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                    ) : isNetworkDone ? (
                      "Done"
                    ) : getNetworkCooldown(network.id) > 0 ? (
                      `${getNetworkCooldown(network.id)}s`
                    ) : (
                      "Watch"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Bonus - Compact */}
        {canClaimBonus && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-warning/20 to-success/20 border border-warning/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-warning" />
              <div>
                <p className="text-xs font-semibold">Daily Bonus!</p>
                <p className="text-[10px] text-muted-foreground">All {AD_NETWORKS.length * MAX_ADS_PER_NETWORK} ads watched</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={handleClaimBonus}
              disabled={claimingBonus}
              className="h-7 text-xs bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {claimingBonus ? "..." : `+${dailyBonusAmount}`}
            </Button>
          </div>
        )}

        {/* Convert Coins - Compact */}
        {user && coins >= MIN_COINS_TO_CONVERT && (
          <div className="bg-card rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-1.5 mb-3">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Convert to Balance</h2>
              <span className="text-[10px] text-muted-foreground ml-auto">{COINS_PER_RUPEE}:₹1</span>
            </div>
            
            <div className="flex items-center justify-between gap-2 mb-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustCoins(-10)}
                disabled={coinsToConvert <= MIN_COINS_TO_CONVERT}
                className="h-8 w-8"
              >
                <Minus className="w-3 h-3" />
              </Button>
              
              <div className="flex-1 text-center">
                <p className="text-xl font-bold">{coinsToConvert}</p>
                <p className="text-[10px] text-muted-foreground">= ₹{balanceToReceive}</p>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustCoins(10)}
                disabled={coinsToConvert >= maxConvertibleCoins}
                className="h-8 w-8"
              >
                <Plus className="w-3 h-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCoinsToConvert(maxConvertibleCoins)}
                className="h-8 text-xs text-primary"
              >
                Max
              </Button>
            </div>
            
            <Button
              onClick={handleConvertCoins}
              disabled={converting || coinsToConvert < MIN_COINS_TO_CONVERT}
              className="w-full h-9 text-sm"
            >
              {converting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `Convert to ₹${balanceToReceive}`
              )}
            </Button>
          </div>
        )}

        {/* How It Works - Compact */}
        <div className="bg-card rounded-xl p-3 border border-border/50">
          <div className="flex items-center gap-1.5 mb-2">
            <Gift className="w-4 h-4 text-warning" />
            <h2 className="text-sm font-semibold">How It Works</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Watch Ads</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-1">
                <span className="text-xs font-bold text-success">2</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Earn Coins</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-1">
                <span className="text-xs font-bold text-warning">3</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Convert ₹</p>
            </div>
          </div>
        </div>

        {/* Bonus Reminder - Compact */}
        {!canClaimBonus && getTotalAdsWatched() < AD_NETWORKS.length * MAX_ADS_PER_NETWORK && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20">
            <Sparkles className="w-4 h-4 text-warning shrink-0" />
            <p className="text-xs text-muted-foreground">
              Watch {(AD_NETWORKS.length * MAX_ADS_PER_NETWORK) - getTotalAdsWatched()} more ads for +{dailyBonusAmount} bonus!
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
