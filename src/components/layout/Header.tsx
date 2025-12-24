import { Settings, Wallet, Plus, History, LogIn, LogOut, Coins, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useUserApiCredits } from "@/contexts/UserApiCreditsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/hooks/useUserData";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBack, onBack }: HeaderProps) {
  const navigate = useNavigate();
  const { balance } = useUserApiCredits();
  const { coins } = useUserData();
  const { user, signOut, isTelegram } = useAuth();

  const displayName = user?.displayName || "Guest";
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/40">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left - Title */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-foreground hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        </div>

        {/* Right - User section */}
        {user ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-1 text-success text-xs font-semibold">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>₹{balance}</span>
                </div>
                <div className="w-px h-4 bg-border/50" />
                <div className="flex items-center gap-1 text-yellow-500 text-xs font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{coins}</span>
                </div>
                <Avatar className="w-7 h-7 ring-2 ring-primary/20">
                  <AvatarImage src={user.photoURL} alt={displayName} />
                  <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2 bg-card border-border/50">
              <div className="space-y-1">
                {/* User Info */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.photoURL} alt={displayName} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    {user.username && (
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-1 p-1">
                  <div className="flex items-center gap-1.5 p-2 rounded-md bg-success/10">
                    <Wallet className="w-3.5 h-3.5 text-success" />
                    <span className="text-sm font-bold text-success">₹{balance}</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-md bg-yellow-500/10">
                    <Coins className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-sm font-bold text-yellow-500">{coins}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-1 border-t border-border/50 space-y-0.5">
                  <button 
                    onClick={() => navigate('/deposit')}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" />
                      <span className="text-sm">Add Money</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button 
                    onClick={() => navigate('/transactions')}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Transactions</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {!isTelegram && (
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 h-8 text-xs rounded-full px-4"
            onClick={() => navigate('/auth')}
          >
            <LogIn className="w-3.5 h-3.5" />
            Login
          </Button>
        )}
      </div>
    </header>
  );
}
