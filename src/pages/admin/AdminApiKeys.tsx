import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Key, Activity, Users, Zap, Search, Ban, Check, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { UserData } from "@/types/user";

interface UserWithApiKey extends UserData {
  docId: string;
}

export default function AdminApiKeys() {
  const { toast } = useToast();
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
      toast({ title: newStatus ? "Key Enabled" : "Key Disabled" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
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
      toast({ title: "Credits Updated" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update credits", variant: "destructive" });
    }
  };

  const totalCredits = users.reduce((sum, u) => sum + (u.apiCredits || 0), 0);
  const activeKeys = users.filter((u) => u.apiKey?.isActive).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted/50 rounded-xl" />
          <div className="h-96 bg-muted/50 rounded-xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-sm text-muted-foreground">Manage all user API keys</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Key} label="Total Users" value={users.length} />
          <StatCard icon={Activity} label="Active Keys" value={activeKeys} />
          <StatCard icon={Zap} label="Total Credits" value={totalCredits} />
          <StatCard icon={Users} label="Inactive Keys" value={users.length - activeKeys} color="text-destructive" />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, telegram ID, or key prefix..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Keys Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Telegram ID</th>
                  <th className="text-left p-3">Key Prefix</th>
                  <th className="text-left p-3">Credits</th>
                  <th className="text-left p-3">Plan</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.docId} className="hover:bg-muted/30">
                    <td className="p-3">
                      <span className="font-medium text-foreground">{user.displayName}</span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground font-mono">{user.telegramId}</td>
                    <td className="p-3 text-sm font-mono">{user.apiKey?.keyPrefix}...</td>
                    <td className="p-3">
                      <span className="text-sm font-semibold text-foreground">{user.apiCredits || 0}</span>
                    </td>
                    <td className="p-3">
                      {user.activePlan ? (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                          {user.activePlan.planName}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Free</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded ${user.apiKey?.isActive ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"}`}>
                        {user.apiKey?.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingUser(user);
                            setNewCredits(user.apiCredits || 0);
                          }}
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${user.apiKey?.isActive ? "text-destructive" : "text-green-400"}`}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.apiKey?.isActive ? <Ban className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No users with API keys found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Credits Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit API Credits</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                User: <span className="font-medium text-foreground">{editingUser?.displayName}</span>
              </p>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">API Credits</label>
                <Input
                  type="number"
                  value={newCredits}
                  onChange={(e) => setNewCredits(Number(e.target.value))}
                  min={0}
                  step={100}
                />
              </div>
              <Button className="w-full" onClick={handleUpdateCredits}>
                Update Credits
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value, color = "text-primary" }: { icon: any; label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
