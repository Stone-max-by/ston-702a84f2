import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Key, Activity, Zap, Search, Ban, Check, Settings2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserData } from "@/types/user";

interface UserWithApiKey extends UserData {
  docId: string;
}

export default function AdminApiKeys() {
  const [users, setUsers] = useState<UserWithApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserWithApiKey | null>(null);
  const [newCredits, setNewCredits] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersData = snapshot.docs
          .map((doc) => ({ ...doc.data(), docId: doc.id } as UserWithApiKey))
          .filter((user) => user.apiKey);
        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.telegramId?.toString().includes(searchQuery) ||
      user.apiKey?.keyPrefix?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = async (user: UserWithApiKey) => {
    try {
      const newStatus = !user.apiKey?.isActive;
      await updateDoc(doc(db, "users", user.docId), {
        "apiKey.isActive": newStatus,
        updatedAt: new Date().toISOString(),
      });
      toast.success(newStatus ? "Key enabled" : "Key disabled");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleUpdateCredits = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, "users", editingUser.docId), {
        apiCredits: newCredits,
        updatedAt: new Date().toISOString(),
      });
      setEditingUser(null);
      toast.success("Credits updated");
    } catch (error) {
      toast.error("Failed to update credits");
    }
  };

  const totalCredits = users.reduce((sum, u) => sum + (u.apiCredits || 0), 0);
  const activeKeys = users.filter((u) => u.apiKey?.isActive).length;

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
        <h1 className="text-lg font-bold text-foreground">API Keys</h1>
        <p className="text-xs text-muted-foreground">{users.length} users with keys</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card rounded-lg p-3 border border-border/50 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Key className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">{activeKeys}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </div>
        <div className="bg-card rounded-lg p-3 border border-border/50 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-warning" />
          </div>
          <p className="text-lg font-bold text-foreground">{totalCredits}</p>
          <p className="text-[10px] text-muted-foreground">Credits</p>
        </div>
        <div className="bg-card rounded-lg p-3 border border-border/50 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Ban className="w-3.5 h-3.5 text-destructive" />
          </div>
          <p className="text-lg font-bold text-foreground">{users.length - activeKeys}</p>
          <p className="text-[10px] text-muted-foreground">Disabled</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm bg-card border-border/50"
        />
      </div>

      {/* Keys List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
          <Key className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No API keys found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <div
              key={user.docId}
              className="bg-card rounded-xl border border-border/50 p-3 flex items-center gap-3"
            >
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{user.displayName}</span>
                  {user.activePlan && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-primary/20 text-primary rounded">
                      {user.activePlan.planName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-muted-foreground">{user.apiKey?.keyPrefix}...</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-foreground font-medium">{user.apiCredits || 0} credits</span>
                </div>
              </div>

              {/* Status */}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                  user.apiKey?.isActive
                    ? "bg-success/20 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {user.apiKey?.isActive ? "Active" : "Off"}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditingUser(user);
                    setNewCredits(user.apiCredits || 0);
                  }}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${user.apiKey?.isActive ? "text-destructive" : "text-success"}`}
                  onClick={() => handleToggleStatus(user)}
                >
                  {user.apiKey?.isActive ? <Ban className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Credits Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              User: <span className="font-medium text-foreground">{editingUser?.displayName}</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">API Credits</label>
              <Input
                type="number"
                value={newCredits}
                onChange={(e) => setNewCredits(Number(e.target.value))}
                min={0}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingUser(null)} className="flex-1">
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdateCredits} className="flex-1">
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
