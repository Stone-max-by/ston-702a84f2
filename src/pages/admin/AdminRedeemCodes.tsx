import { useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Ticket, Copy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRedeemCodes } from "@/hooks/useRedeemCodes";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminRedeemCodes() {
  const { codes, loading, createCode, deleteCode, toggleCodeStatus } = useRedeemCodes();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    rewardType: "coins" as "coins" | "balance",
    rewardAmount: 10,
    maxUses: 100,
    expiresAt: null as Date | null,
  });

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("Enter a code");
      return;
    }
    const success = await createCode(formData, user?.id || "admin");
    if (success) {
      setDialogOpen(false);
      setFormData({
        code: "",
        rewardType: "coins",
        rewardAmount: 10,
        maxUses: 100,
        expiresAt: null,
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Redeem Codes</h1>
          <p className="text-sm text-muted-foreground">Manage promo codes for coins/balance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Code</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Redeem Code</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PROMO2024"
                    className="flex-1 uppercase"
                  />
                  <Button type="button" variant="outline" onClick={generateRandomCode}>
                    Generate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reward Type</Label>
                  <Select
                    value={formData.rewardType}
                    onValueChange={(value: "coins" | "balance") =>
                      setFormData({ ...formData, rewardType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coins">Coins</SelectItem>
                      <SelectItem value="balance">Balance (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={formData.rewardAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, rewardAmount: parseInt(e.target.value) || 0 })
                    }
                    min={1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })
                  }
                  min={1}
                />
              </div>

              <Button type="submit" className="w-full">
                Create Code
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border/50">
          <p className="text-2xl font-bold text-foreground">{codes.length}</p>
          <p className="text-xs text-muted-foreground">Total Codes</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border/50">
          <p className="text-2xl font-bold text-success">{codes.filter((c) => c.isActive).length}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border/50">
          <p className="text-2xl font-bold text-warning">
            {codes.reduce((sum, c) => sum + c.currentUses, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Total Uses</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border/50">
          <p className="text-2xl font-bold text-primary">
            {codes.reduce((sum, c) => sum + c.rewardAmount * c.currentUses, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Rewards Given</p>
        </div>
      </div>

      {/* Codes List */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Code</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Reward</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Uses</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No codes yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                codes.map((code) => (
                  <tr key={code.id} className="hover:bg-muted/10">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-primary" />
                        <span className="font-mono font-medium">{code.code}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(code.code)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`text-sm font-medium ${code.rewardType === 'coins' ? 'text-yellow-500' : 'text-success'}`}>
                        {code.rewardType === 'coins' ? `${code.rewardAmount} coins` : `₹${code.rewardAmount}`}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{code.currentUses}/{code.maxUses}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          code.isActive
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {code.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleCodeStatus(code.id, !code.isActive)}
                        >
                          {code.isActive ? (
                            <ToggleRight className="w-4 h-4 text-success" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteCode(code.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
