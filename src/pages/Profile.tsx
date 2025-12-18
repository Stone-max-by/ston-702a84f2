import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  UserPlus,
  Users,
  Download,
  Code,
  ChevronRight,
  LogOut,
  AtSign,
  Loader2,
  Copy,
  Gift,
  Coins,
  Wallet,
  FileText,
  Package,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";
import { format } from "date-fns";
import { ApiKeyManager } from "@/components/profile/ApiKeyManager";

export default function Profile() {
  const { user, signOut, isTelegram, loading: authLoading } = useAuth();
  const { 
    userData,
    loading: dataLoading,
    error: dataError,
    balance, 
    coins, 
    purchasedFiles,
    referral, 
    referralBonusCoins,
    newApiKey,
    clearNewApiKey,
    revokeApiKey,
    regenerateApiKey,
  } = useUserData();
  const navigate = useNavigate();

  const botUsername = "PyWalletBot";
  const referralLink = `https://t.me/${botUsername}?start=${referral.referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const loading = authLoading || dataLoading;

  useEffect(() => {
    if (!authLoading && !user && !isTelegram) {
      navigate("/auth", { state: { from: "/profile" } });
    }
  }, [user, authLoading, navigate, isTelegram]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <AppLayout title="Profile">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your data...</p>
        </div>
      </AppLayout>
    );
  }

  // Show error state
  if (dataError) {
    return (
      <AppLayout title="Profile">
        <div className="flex flex-col items-center justify-center h-64 gap-3 p-4">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
            <AtSign className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-lg font-semibold text-foreground">Error Loading Data</p>
          <p className="text-sm text-muted-foreground text-center">{dataError}</p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Please make sure Firebase rules are configured correctly.
          </p>
        </div>
      </AppLayout>
    );
  }

  // Show message for non-telegram users without data
  if (!user) {
    return (
      <AppLayout title="Profile">
        <div className="flex flex-col items-center justify-center h-64 gap-3 p-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <AtSign className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">No User Found</p>
          <p className="text-sm text-muted-foreground text-center">
            Please open this app from Telegram to access your profile.
          </p>
        </div>
      </AppLayout>
    );
  }

  const createdDate = userData?.createdAt 
    ? format(new Date(userData.createdAt), "dd MMM yyyy")
    : "N/A";

  return (
    <AppLayout title="Profile">
      <div className="space-y-4 pb-20">
        {/* User Profile Header */}
        <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user?.photoURL} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl">
              {user?.displayName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{user?.displayName || "Guest"}</h2>
            {user?.username && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AtSign className="w-3 h-3" />
                {user.username}
              </p>
            )}
            {isTelegram && (
              <p className="text-xs text-primary mt-1">via Telegram</p>
            )}
          </div>
        </div>

        {/* Balance & Coins Card */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gradient-to-br from-success/20 to-success/5 rounded-xl border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-success" />
              <span className="text-sm text-muted-foreground">Balance</span>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{balance}</p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Coins</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{coins}</p>
          </div>
        </div>

        {/* Purchased Files Section */}
        <div className="p-4 bg-card rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Purchased Files</h3>
            </div>
            <span className="text-sm text-muted-foreground">{purchasedFiles.length} items</span>
          </div>
          
          {purchasedFiles.length > 0 ? (
            <div className="space-y-2">
              {purchasedFiles.map((fileId, index) => (
                <div 
                  key={fileId} 
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground flex-1 truncate">{fileId}</span>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <Package className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No purchased files yet</p>
              <Link to="/explore">
                <Button variant="link" size="sm" className="mt-1">
                  Browse Products
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Referral Section */}
        <div className="p-4 bg-card rounded-xl border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Refer & Earn</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Share your referral link. Earn {referralBonusCoins} coins when your friend makes a purchase!
          </p>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-muted/50 rounded-lg text-sm text-foreground truncate font-mono">
              {referralLink}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyReferralLink}
              className="shrink-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                <Users className="w-4 h-4 text-primary" />
                {referral.referralCount}
              </div>
              <p className="text-xs text-muted-foreground">Friends Referred</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                <Coins className="w-4 h-4 text-yellow-500" />
                {referral.referralEarnings}
              </div>
              <p className="text-xs text-muted-foreground">Coins Earned</p>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined on</p>
              <p className="font-medium text-foreground">{createdDate}</p>
            </div>
          </div>

          {referral.referredBy && (
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referred by</p>
                <p className="font-medium text-foreground">{referral.referredBy}</p>
              </div>
            </div>
          )}
        </div>

        {/* API Key & Plan Management */}
        <ApiKeyManager 
          apiKey={userData?.apiKey || null}
          apiCredits={userData?.apiCredits || 0}
          activePlan={userData?.activePlan || null}
          newApiKey={newApiKey}
          onRevokeKey={revokeApiKey}
          onClearNewKey={clearNewApiKey}
          onRegenerateKey={regenerateApiKey}
        />

        {/* API Documentation Link */}
        <Link
          to="/api-docs"
          className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Code className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">API Documentation</p>
              <p className="text-xs text-muted-foreground">View endpoints and examples</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>

        {/* Buy API Credits Card */}
        <Link
          to="/coins"
          className="flex items-center justify-between p-4 bg-gradient-to-r from-success/20 to-primary/20 rounded-xl border border-success/30 hover:from-success/30 hover:to-primary/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground">Buy API Credits</p>
              <p className="text-xs text-muted-foreground">Get more credits for API usage</p>
            </div>
          </div>
          <ShoppingCart className="w-5 h-5 text-success" />
        </Link>

        {/* Logout Button - Only for browser users */}
        {user && !isTelegram && (
          <Button
            variant="outline"
            className="w-full mt-4 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        )}

        {/* Debug Info (only in development) */}
        {userData && (
          <div className="p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
            <p>User ID: {userData.id}</p>
            <p>Telegram ID: {userData.telegramId}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
