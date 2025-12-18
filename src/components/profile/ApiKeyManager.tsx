import { useState } from "react";
import { Key, Copy, Eye, EyeOff, Check, Trash2, Zap, Crown, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserApiKey, UserActivePlan } from "@/types/user";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApiKeyManagerProps {
  apiKey: UserApiKey | null;
  apiCredits: number;
  activePlan: UserActivePlan | null;
  newApiKey: string | null;
  onRevokeKey: () => Promise<void>;
  onClearNewKey: () => void;
  onRegenerateKey?: () => Promise<string | null>;
}

export function ApiKeyManager({ 
  apiKey, 
  apiCredits, 
  activePlan, 
  newApiKey, 
  onRevokeKey, 
  onClearNewKey,
  onRegenerateKey 
}: ApiKeyManagerProps) {
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(!!newApiKey);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRevokeKey = async () => {
    try {
      await onRevokeKey();
      toast({ title: "API Key Revoked", description: "Your API key has been deactivated", variant: "destructive" });
      setShowRevokeDialog(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to revoke key", variant: "destructive" });
    }
  };

  const handleRegenerateKey = async () => {
    if (!onRegenerateKey) return;
    setIsRegenerating(true);
    try {
      const newKey = await onRegenerateKey();
      if (newKey) {
        toast({ title: "New API Key Generated", description: "Please copy and save your new key" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate new key", variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    toast({ title: "Copied!", description: "API key copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const maskKey = (prefix: string) => `${prefix}${"•".repeat(20)}`;

  const isPlanExpired = activePlan ? new Date(activePlan.expiryDate) < new Date() : false;

  return (
    <>
      {/* Active Plan Card */}
      {activePlan && (
        <div className={`p-4 rounded-xl border ${isPlanExpired ? 'bg-destructive/10 border-destructive/20' : 'bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className={`w-5 h-5 ${isPlanExpired ? 'text-destructive' : 'text-yellow-500'}`} />
              <span className="font-semibold text-foreground">{activePlan.planName}</span>
            </div>
            {isPlanExpired && (
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">Expired</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>{activePlan.totalCredits} credits</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Expires: {format(new Date(activePlan.expiryDate), "dd MMM yyyy")}</span>
            </div>
          </div>
        </div>
      )}

      {/* API Key Card */}
      {apiKey && apiKey.isActive && (
        <div className="p-4 bg-card rounded-xl border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">API Key</h3>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{apiCredits.toLocaleString()} Credits</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Created: {format(new Date(apiKey.createdAt), "dd MMM yyyy")}
          </div>

          {/* Key Display */}
          <div className="bg-muted/50 rounded-lg p-3">
            <code className="text-sm text-foreground font-mono block break-all select-all">
              {showKey ? (apiKey.key || `${apiKey.keyPrefix}${"•".repeat(20)}`) : maskKey(apiKey.keyPrefix)}
            </code>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => copyKey(apiKey.key || apiKey.keyPrefix)}
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              Copy Key
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showKey ? "Hide" : "Show"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {onRegenerateKey && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={handleRegenerateKey}
                disabled={isRegenerating}
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setShowRevokeDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
              Revoke Key
            </Button>
          </div>
        </div>
      )}

      {/* Revoked Key Message */}
      {apiKey && !apiKey.isActive && (
        <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 space-y-3">
          <div className="text-center">
            <Key className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-foreground font-medium">API Key Revoked</p>
            <p className="text-xs text-muted-foreground">Your API key has been deactivated</p>
          </div>
          {onRegenerateKey && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleRegenerateKey}
              disabled={isRegenerating}
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Generate New Key
            </Button>
          )}
        </div>
      )}

      {/* No API Key */}
      {!apiKey && onRegenerateKey && (
        <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
          <div className="text-center">
            <Key className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-foreground font-medium">No API Key</p>
            <p className="text-xs text-muted-foreground">Generate a key to access the API</p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="w-full gap-2"
            onClick={handleRegenerateKey}
            disabled={isRegenerating}
          >
            <Key className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Generate API Key
          </Button>
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your API key will be permanently deactivated and all API requests using this key will fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeKey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New API Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={(open) => {
        setShowNewKeyDialog(open);
        if (!open) onClearNewKey();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-success" />
              Your New API Key
            </DialogTitle>
            <DialogDescription>
              ⚠️ Save this key now! You won't be able to see the full key again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <code className="text-sm text-foreground bg-background px-3 py-2 rounded-md block break-all font-mono select-all">
                {newApiKey}
              </code>
            </div>
            <Button className="w-full gap-2" onClick={() => {
              if (newApiKey) copyKey(newApiKey);
            }}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy Full Key
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewKeyDialog(false);
              onClearNewKey();
            }}>
              I've Saved It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
