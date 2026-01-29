import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  UserPlus,
  Code,
  ChevronRight,
  LogOut,
  AtSign,
  Loader2,
  Coins,
  Wallet,
  Package,
  FileText,
  Download,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";
import { format } from "date-fns";

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
  } = useUserData();
  const navigate = useNavigate();

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
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (dataError) {
    return (
      <AppLayout title="Profile">
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-4">
          <div className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center">
            <AtSign className="w-7 h-7 text-destructive" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Error Loading Data</p>
            <p className="text-sm text-muted-foreground mt-1">{dataError}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout title="Profile">
        <div className="flex flex-col items-center justify-center h-64 gap-4 p-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <AtSign className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Login Required</p>
            <p className="text-sm text-muted-foreground mt-1">
              Open this app from Telegram to access your profile
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/explore")} className="mt-2">
            <ExternalLink className="w-4 h-4 mr-2" />
            Browse Products
          </Button>
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
        {/* Profile Header with Balance */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-14 h-14 border-2 border-primary/30">
              <AvatarImage src={user?.photoURL} />
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                {user?.displayName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">
                {user?.displayName || "Guest"}
              </h2>
              {user?.username && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <AtSign className="w-3 h-3" />
                  {user.username}
                </p>
              )}
            </div>
          </div>
          
          {/* Balance Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/60 backdrop-blur rounded-xl p-3 border border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">₹{balance}</p>
                  <p className="text-[10px] text-muted-foreground">Balance</p>
                </div>
              </div>
            </div>
            <div className="bg-background/60 backdrop-blur rounded-xl p-3 border border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{coins}</p>
                  <p className="text-[10px] text-muted-foreground">Coins</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <p className="text-lg font-bold text-foreground">{purchasedFiles.length}</p>
            <p className="text-[10px] text-muted-foreground">Purchases</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <p className="text-lg font-bold text-foreground">{referral.referralCount || 0}</p>
            <p className="text-[10px] text-muted-foreground">Referrals</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <p className="text-lg font-bold text-success">₹{referral.referralEarnings || 0}</p>
            <p className="text-[10px] text-muted-foreground">Earned</p>
          </div>
        </div>

        {/* Purchased Files */}
        {purchasedFiles.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">My Purchases</h3>
              </div>
              <span className="text-xs text-muted-foreground">{purchasedFiles.length} items</span>
            </div>
            <div className="space-y-2">
              {purchasedFiles.slice(0, 3).map((fileId) => (
                <div 
                  key={fileId} 
                  className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg"
                >
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">{fileId}</span>
                  <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              ))}
              {purchasedFiles.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{purchasedFiles.length - 3} more items
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="space-y-2">
          <Link
            to="/coins"
            className="flex items-center justify-between p-3.5 bg-card rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Coins className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Earn Coins</p>
                <p className="text-[10px] text-muted-foreground">Watch ads & earn rewards</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <Link
            to="/api-docs"
            className="flex items-center justify-between p-3.5 bg-card rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <Code className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">API Docs</p>
                <p className="text-[10px] text-muted-foreground">View endpoints & examples</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Account Info */}
        <div className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Account Info</h3>
          
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Joined</span>
            </div>
            <span className="text-sm font-medium text-foreground">{createdDate}</span>
          </div>
          
          {referral.referredBy && (
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserPlus className="w-4 h-4" />
                <span className="text-sm">Referred by</span>
              </div>
              <span className="text-sm font-medium text-foreground">{referral.referredBy}</span>
            </div>
          )}
          
          {isTelegram && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AtSign className="w-4 h-4" />
                <span className="text-sm">Platform</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                Telegram
              </span>
            </div>
          )}
        </div>

        {/* Logout */}
        {user && !isTelegram && (
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
