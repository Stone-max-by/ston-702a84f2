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
    toast.success("Copied!");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Redeem Codes</h1>
          <p className="text-xs text-muted-foreground">{codes.length} codes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Create Code</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PROMO2024"
                    className="flex-1 uppercase h-9 text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generateRandomCode}>
                    Generate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={formData.rewardType}
                    onValueChange={(value: "coins" | "balance") =>
                      setFormData({ ...formData, rewardType: value })
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coins">Coins</SelectItem>
                      <SelectItem value="balance">Balance ₹</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    value={formData.rewardAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, rewardAmount: parseInt(e.target.value) || 0 })
                    }
                    min={1}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Max Uses</Label>
                <Input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })
                  }
                  min={1}
                  className="h-9 text-sm"
                />
              </div>

              <Button type="submit" className="w-full h-9 text-sm">
                Create Code
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card rounded-lg p-3 border border-border/50 text-center">
          <p className="text-lg font-bold text-foreground">{codes.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="bg-card rounded-lg p-3 border border-border/50 text-center">
          <p className="text-lg font-bold text-success">{codes.filter((c) => c.isActive).length}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </div>
        <div className="bg-card rounded-lg p-3 border border-border/50 text-center">
          <p className="text-lg font-bold text-warning">
            {codes.reduce((sum, c) => sum + c.currentUses, 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Uses</p>
        </div>
        <div className="bg-card rounded-lg p-3 border border-border/50 text-center">
          <p className="text-lg font-bold text-primary">
            {codes.reduce((sum, c) => sum + c.rewardAmount * c.currentUses, 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Given</p>
        </div>
      </div>

      {/* Codes List */}
      {codes.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
          <Ticket className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No codes yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map((code) => (
            <div
              key={code.id}
              className="bg-card rounded-xl border border-border/50 p-3 flex items-center gap-3"
            >
              {/* Code & Copy */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm text-foreground">{code.code}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyCode(code.code)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-medium ${code.rewardType === 'coins' ? 'text-warning' : 'text-success'}`}>
                    {code.rewardType === 'coins' ? `${code.rewardAmount} coins` : `₹${code.rewardAmount}`}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{code.currentUses}/{code.maxUses} used</span>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                  code.isActive
                    ? "bg-success/20 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {code.isActive ? "Active" : "Off"}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
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
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteCode(code.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
