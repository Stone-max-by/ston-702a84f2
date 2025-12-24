import { useState } from "react";
import { Save, Plus, X, Loader2, Shield, Gift, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAdminSettings } from "@/hooks/useAdminSettings";

export default function AdminSettings() {
  const { settings, loading, saving, saveSettings, updateSetting } = useAdminSettings();
  const [newAdminId, setNewAdminId] = useState("");

  const handleSave = async () => {
    const success = await saveSettings(settings);
    if (success) {
      toast.success("Settings saved successfully");
    } else {
      toast.error("Failed to save settings");
    }
  };

  const addAdminId = () => {
    const id = parseInt(newAdminId);
    if (isNaN(id)) {
      toast.error("Please enter a valid Telegram ID");
      return;
    }
    if (settings.adminTelegramIds.includes(id)) {
      toast.error("This ID is already an admin");
      return;
    }
    updateSetting("adminTelegramIds", [...settings.adminTelegramIds, id]);
    setNewAdminId("");
    toast.success("Admin ID added (remember to save)");
  };

  const removeAdminId = (id: number) => {
    updateSetting("adminTelegramIds", settings.adminTelegramIds.filter((i) => i !== id));
    toast.success("Admin ID removed (remember to save)");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure platform settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Admin Access */}
      <div className="bg-card rounded-xl p-5 border border-white/5 space-y-5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Admin Access</h2>
        </div>

        <div className="space-y-3">
          <Label>Admin Telegram IDs</Label>
          <p className="text-xs text-muted-foreground">
            Users with these Telegram IDs can access the admin panel
          </p>
          
          <div className="flex gap-2">
            <Input
              type="number"
              value={newAdminId}
              onChange={(e) => setNewAdminId(e.target.value)}
              placeholder="Enter Telegram ID"
              className="bg-background border-white/10"
            />
            <Button onClick={addAdminId} variant="outline" className="shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {settings.adminTelegramIds.map((id) => (
              <div
                key={id}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 rounded-full text-sm"
              >
                <span className="font-mono">{id}</span>
                <button
                  onClick={() => removeAdminId(id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {settings.adminTelegramIds.length === 0 && (
              <p className="text-sm text-muted-foreground">No admin IDs configured</p>
            )}
          </div>
        </div>
      </div>

      {/* Coin Economy */}
      <div className="bg-card rounded-xl p-5 border border-white/5 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Coin Economy</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="coinsPerAd">Coins per Ad Watch</Label>
            <Input
              id="coinsPerAd"
              type="number"
              value={settings.coinsPerAd}
              onChange={(e) => updateSetting("coinsPerAd", parseInt(e.target.value) || 0)}
              className="bg-background border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxAdsPerDay">Max Ads per Day</Label>
            <Input
              id="maxAdsPerDay"
              type="number"
              value={settings.maxAdsPerDay}
              onChange={(e) => updateSetting("maxAdsPerDay", parseInt(e.target.value) || 0)}
              className="bg-background border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyBonus">Daily Bonus (coins)</Label>
            <Input
              id="dailyBonus"
              type="number"
              value={settings.dailyBonusAmount}
              onChange={(e) => updateSetting("dailyBonusAmount", parseInt(e.target.value) || 0)}
              className="bg-background border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coinsRate">Coins to ₹1 Rate</Label>
            <Input
              id="coinsRate"
              type="number"
              value={settings.coinsToInrRate}
              onChange={(e) => updateSetting("coinsToInrRate", parseInt(e.target.value) || 0)}
              className="bg-background border-white/10"
            />
            <p className="text-xs text-muted-foreground">
              {settings.coinsToInrRate} coins = ₹1
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversionFee">Conversion Fee (%)</Label>
            <Input
              id="conversionFee"
              type="number"
              value={settings.conversionFee}
              onChange={(e) => updateSetting("conversionFee", parseInt(e.target.value) || 0)}
              className="bg-background border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeBonus">Welcome Bonus (₹)</Label>
            <Input
              id="welcomeBonus"
              type="number"
              value={settings.welcomeBonus}
              onChange={(e) => updateSetting("welcomeBonus", parseInt(e.target.value) || 0)}
              className="bg-background border-white/10"
            />
          </div>
        </div>
      </div>

      {/* Referral System */}
      <div className="bg-card rounded-xl p-5 border border-white/5 space-y-5">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Referral System</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Referral System</Label>
            <p className="text-xs text-muted-foreground">Allow users to earn rewards for referrals</p>
          </div>
          <Switch
            checked={settings.referralEnabled}
            onCheckedChange={(checked) => updateSetting("referralEnabled", checked)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="referralBonus">Referral Bonus (₹)</Label>
            <Input
              id="referralBonus"
              type="number"
              value={settings.referralBonus}
              onChange={(e) => updateSetting("referralBonus", parseInt(e.target.value) || 0)}
              className="bg-background border-white/10"
            />
            <p className="text-xs text-muted-foreground">
              Balance given to referrer when friend joins channel
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 pt-3">
            <Send className="w-4 h-4 text-primary" />
            <Label className="font-medium">Telegram Channel Settings</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channelId">Channel ID</Label>
            <Input
              id="channelId"
              value={settings.telegramChannelId}
              onChange={(e) => updateSetting("telegramChannelId", e.target.value)}
              placeholder="@channelname or -1001234567890"
              className="bg-background border-white/10 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use @username for public channels or numeric ID for private ones
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channelUrl">Channel URL</Label>
            <Input
              id="channelUrl"
              value={settings.telegramChannelUrl}
              onChange={(e) => updateSetting("telegramChannelUrl", e.target.value)}
              placeholder="https://t.me/yourchannel"
              className="bg-background border-white/10 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Public link for users to join the channel
            </p>
          </div>
        </div>
      </div>

      {/* Bonuses */}
      <div className="bg-card rounded-xl p-5 border border-white/5 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Other Bonuses</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstDeposit">First Deposit Bonus (%)</Label>
            <Input
              id="firstDeposit"
              type="number"
              value={settings.firstDepositBonus}
              onChange={(e) => updateSetting("firstDepositBonus", parseInt(e.target.value) || 0)}
              className="bg-background border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstPurchase">First Purchase Bonus (coins)</Label>
            <Input
              id="firstPurchase"
              type="number"
              value={settings.firstPurchaseBonus}
              onChange={(e) => updateSetting("firstPurchaseBonus", parseInt(e.target.value) || 0)}
              className="bg-background border-white/10"
            />
          </div>
        </div>
      </div>

      {/* API Settings */}
      <div className="bg-card rounded-xl p-5 border border-white/5 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">API Settings</h2>

        <div className="space-y-2">
          <Label htmlFor="apiBaseUrl">API Base URL</Label>
          <Input
            id="apiBaseUrl"
            value={settings.apiBaseUrl}
            onChange={(e) => updateSetting("apiBaseUrl", e.target.value)}
            placeholder="https://api.example.com/v1"
            className="bg-background border-white/10 font-mono text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-fill API Key</Label>
            <p className="text-xs text-muted-foreground">Automatically add user's API key in code examples</p>
          </div>
          <Switch
            checked={settings.autoFillApiKey}
            onCheckedChange={(checked) => updateSetting("autoFillApiKey", checked)}
          />
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-card rounded-xl p-5 border border-white/5 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Features</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Ad Unlock</Label>
              <p className="text-xs text-muted-foreground">Allow users to unlock products by watching ads</p>
            </div>
            <Switch
              checked={settings.enableAdUnlock}
              onCheckedChange={(checked) => updateSetting("enableAdUnlock", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Coin Payments</Label>
              <p className="text-xs text-muted-foreground">Allow users to pay with coins</p>
            </div>
            <Switch
              checked={settings.enableCoinPayments}
              onCheckedChange={(checked) => updateSetting("enableCoinPayments", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-destructive">Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">Disable access for non-admin users</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
