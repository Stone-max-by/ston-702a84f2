import { useState } from "react";
import { Search, MoreHorizontal, Ban, Coins, DollarSign, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAdminUsers } from "@/hooks/useAdminData";
import { UserData } from "@/types/user";

export default function AdminUsers() {
  const { users, loading, updateUserBalance, updateUserCoins, banUser } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [creditDialog, setCreditDialog] = useState<{ user: UserData; type: "balance" | "coins" } | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (u.username?.toLowerCase().includes(search.toLowerCase())) ||
      String(u.telegramId).includes(search)
  );

  const toggleBan = async (user: UserData) => {
    setActionLoading(true);
    try {
      await banUser(user.id, !user.banned);
      toast.success(`User ${user.banned ? "unbanned" : "banned"}`);
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCredit = async () => {
    if (!creditDialog || !creditAmount) return;
    
    const amount = parseFloat(creditAmount);
    if (isNaN(amount)) return;

    setActionLoading(true);
    try {
      if (creditDialog.type === "balance") {
        await updateUserBalance(creditDialog.user.id, amount);
      } else {
        await updateUserCoins(creditDialog.user.id, amount);
      }

      toast.success(`Added ${creditDialog.type === "balance" ? "₹" : ""}${amount}${creditDialog.type === "coins" ? " coins" : ""}`);
      setCreditDialog(null);
      setCreditAmount("");
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Users</h1>
        <p className="text-xs text-muted-foreground">{users.length} registered</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="pl-9 h-9 text-sm bg-card border-border/50"
        />
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-card rounded-xl border border-border/50 p-3 flex items-center gap-3"
            >
              {/* Avatar & Info */}
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.telegramId}`}
                alt={user.displayName}
                className="w-10 h-10 rounded-full bg-muted shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{user.displayName}</p>
                  {user.banned && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-destructive/20 text-destructive">
                      BANNED
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username || user.telegramId} • ₹{user.balance} • {user.coins} coins
                </p>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => setCreditDialog({ user, type: "balance" })}
                    className="gap-2 text-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Add Balance
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCreditDialog({ user, type: "coins" })}
                    className="gap-2 text-xs"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    Add Coins
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toggleBan(user)}
                    className={`gap-2 text-xs ${!user.banned ? "text-destructive" : "text-success"}`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {!user.banned ? "Ban" : "Unban"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Credit Dialog */}
      <Dialog open={!!creditDialog} onOpenChange={() => setCreditDialog(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">
              Add {creditDialog?.type === "balance" ? "Balance" : "Coins"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              To: <span className="text-foreground font-medium">{creditDialog?.user.displayName}</span>
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount</Label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder={creditDialog?.type === "balance" ? "100" : "100"}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreditDialog(null)}
                className="flex-1"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleCredit} className="flex-1" disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
