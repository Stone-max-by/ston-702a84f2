import { useState } from "react";
import { Search, MoreHorizontal, Ban, Coins, DollarSign, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      toast.success(`User ${user.banned ? "unbanned" : "banned"} successfully`);
    } catch (error) {
      toast.error("Failed to update user status");
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

      toast.success(
        `Added ${creditDialog.type === "balance" ? "₹" : ""}${amount}${creditDialog.type === "coins" ? " coins" : ""} to ${creditDialog.user.displayName}`
      );
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">{users.length} registered users</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, or Telegram ID..."
          className="pl-10 bg-card border-white/10"
        />
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-white/5 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-white/5 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Telegram ID</TableHead>
                <TableHead className="text-muted-foreground">Balance</TableHead>
                <TableHead className="text-muted-foreground">Coins</TableHead>
                <TableHead className="text-muted-foreground">Referrals</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.telegramId}`}
                        alt={user.displayName}
                        className="w-9 h-9 rounded-full bg-white/5"
                      />
                      <div>
                        <p className="font-medium text-foreground">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{user.username || "no_username"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{user.telegramId}</TableCell>
                  <TableCell className="text-foreground">₹{user.balance.toFixed(2)}</TableCell>
                  <TableCell className="text-foreground">{user.coins}</TableCell>
                  <TableCell className="text-muted-foreground">{user.referral?.referralCount || 0}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        !user.banned
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {user.banned ? "banned" : "active"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-white/10">
                          <DropdownMenuItem
                            onClick={() => setCreditDialog({ user, type: "balance" })}
                            className="gap-2"
                          >
                            <DollarSign className="w-4 h-4" />
                            Add Balance
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setCreditDialog({ user, type: "coins" })}
                            className="gap-2"
                          >
                            <Coins className="w-4 h-4" />
                            Add Coins
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleBan(user)}
                            className={`gap-2 ${!user.banned ? "text-destructive" : "text-success"}`}
                          >
                            <Ban className="w-4 h-4" />
                            {!user.banned ? "Ban User" : "Unban User"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Credit Dialog */}
      <Dialog open={!!creditDialog} onOpenChange={() => setCreditDialog(null)}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Add {creditDialog?.type === "balance" ? "Balance" : "Coins"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Adding to: <span className="text-foreground">{creditDialog?.user.displayName}</span>
            </p>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder={creditDialog?.type === "balance" ? "100.00" : "100"}
                className="bg-background border-white/10"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setCreditDialog(null)}
                className="flex-1"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleCredit} className="flex-1" disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Add ${creditDialog?.type === "balance" ? "Balance" : "Coins"}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
