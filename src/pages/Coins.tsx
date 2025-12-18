import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Coins, Play, Gift, CheckCircle, Clock, Sparkles, Loader2, ArrowRightLeft, Wallet, Minus, Plus, Timer } from "lucide-react";
import { useUserApiCredits } from "@/contexts/UserApiCreditsContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";

// Exchange rate: 10 coins = ₹1
const COINS_PER_RUPEE = 10;
const MIN_COINS_TO_CONVERT = 10;
const MAX_ADS_PER_NETWORK = 10;
const COOLDOWN_SECONDS = 15;

// Ad Networks Configuration
const AD_NETWORKS = [
  { id: "monetag", name: "Monetag", color: "from-blue-500 to-blue-600", coins: 5 },
  { id: "adsterra", name: "Adsterra", color: "from-green-500 to-green-600", coins: 5 },
  { id: "propeller", name: "Propeller", color: "from-purple-500 to-purple-600", coins: 5 },
  { id: "adcash", name: "Adcash", color: "from-orange-500 to-orange-600", coins: 5 },
];

// Get today's date key for localStorage
const getTodayKey = () => new Date().toISOString().split('T')[0];

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
  
  const { coins, updateCoins, updateBalance, userData } = useUserData();
  const { requireAuth } = useRequireAuth();
  const { user } = useAuth();
  
  const [watchingAd, setWatchingAd] = useState<string | null>(null);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [converting, setConverting] = useState(false);
  const [coinsToConvert, setCoinsToConvert] = useState(MIN_COINS_TO_CONVERT);
  const [cooldown, setCooldown] = useState(0);
  const [networkAdsWatched, setNetworkAdsWatched] = useState<Record<string, number>>({});

  // Load ads watched from localStorage
  useEffect(() => {
    const todayKey = getTodayKey();
    const stored = localStorage.getItem(`adsWatched_${todayKey}`);
    if (stored) {
      setNetworkAdsWatched(JSON.parse(stored));
    } else {
      // Reset for new day
      setNetworkAdsWatched({});
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const saveAdsWatched = (newData: Record<string, number>) => {
    const todayKey = getTodayKey();
    localStorage.setItem(`adsWatched_${todayKey}`, JSON.stringify(newData));
    setNetworkAdsWatched(newData);
  };

  const getNetworkAdsWatched = (networkId: string) => networkAdsWatched[networkId] || 0;
  
  const getTotalAdsWatched = () => Object.values(networkAdsWatched).reduce((a, b) => a + b, 0);

  const maxConvertibleCoins = Math.floor(coins / COINS_PER_RUPEE) * COINS_PER_RUPEE;
  const balanceToReceive = coinsToConvert / COINS_PER_RUPEE;

  const handleWatchAd = async (networkId: string, networkCoins: number) => {
    if (!requireAuth('earn coins by watching ads')) return;
    
    const networkWatched = getNetworkAdsWatched(networkId);
    if (networkWatched >= MAX_ADS_PER_NETWORK) {
      toast.error(`${networkId} limit reached!`);
      return;
    }

    if (cooldown > 0) {
      toast.error(`Wait ${cooldown}s before next ad`);
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
        
        // Start cooldown
        setCooldown(COOLDOWN_SECONDS);
      }
      setWatchingAd(null);
    }, 2500);
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

        {/* Watch Ads Section */}
        <div className="bg-card rounded-xl p-3 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Play className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Watch Ads</h2>
            </div>
            <div className="flex items-center gap-2">
              {cooldown > 0 && (
                <div className="flex items-center gap-1 text-warning text-xs">
                  <Timer className="w-3 h-3" />
                  <span>{cooldown}s</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">{getTotalAdsWatched()}/{AD_NETWORKS.length * MAX_ADS_PER_NETWORK}</span>
            </div>
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
                    disabled={watchingAd !== null || isNetworkDone || cooldown > 0 || !user}
                    className="h-8 px-4 text-xs"
                    variant={isNetworkDone ? "outline" : "default"}
                  >
                    {watchingAd === network.id ? (
                      <Clock className="w-3.5 h-3.5 animate-spin" />
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
