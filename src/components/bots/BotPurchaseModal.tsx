import { useState } from "react";
import { Bot, CheckCircle2, Loader2, AlertCircle, Zap, Shield, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TelegramBot } from "@/types/bot";
import { useUserData } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTransactions } from "@/hooks/useTransactions";

interface BotPurchaseModalProps {
  bot: TelegramBot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PurchaseStep = 'confirm' | 'processing' | 'success' | 'failed';

export function BotPurchaseModal({ bot, open, onOpenChange }: BotPurchaseModalProps) {
  const [step, setStep] = useState<PurchaseStep>('confirm');
  const [error, setError] = useState<string | null>(null);
  
  const { balance, addBalance } = useUserData();
  const { addTransaction } = useTransactions();
  const { user } = useAuth();
  const { toast } = useToast();

  if (!bot) return null;

  const canAfford = balance >= bot.price;

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to purchase bots",
        variant: "destructive"
      });
      return;
    }

    if (!canAfford) {
      toast({
        title: "Insufficient Balance",
        description: "Please add money to your wallet",
        variant: "destructive"
      });
      return;
    }

    setStep('processing');
    setError(null);

    try {
      // Deduct balance from user account
      await addBalance(-bot.price);

      // Add transaction for the purchase
      await addTransaction({
        type: "purchase",
        amount: -bot.price,
        description: `Bot: ${bot.name}`,
        status: "completed",
      });

      // Try webhook delivery if available
      let webhookSuccess = false;
      if (bot.webhookUrl) {
        try {
          await fetch(bot.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'no-cors',
            body: JSON.stringify({
              botId: bot.id,
              botName: bot.name,
              userId: user.id,
              userName: user.displayName,
              telegramId: user.telegramId,
              amount: bot.price,
              timestamp: new Date().toISOString()
            })
          });
          webhookSuccess = true;
        } catch (webhookError) {
          console.error('Webhook failed:', webhookError);
        }
      }

      setStep('success');
      toast({
        title: "Purchase Successful! 🎉",
        description: webhookSuccess 
          ? "Bot is being delivered to your account" 
          : "Admin will deliver your bot shortly"
      });

    } catch (err) {
      console.error('Purchase failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed. Please try again.';
      setError(errorMessage);
      setStep('failed');
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            {step === 'confirm' && 'Confirm Purchase'}
            {step === 'processing' && 'Processing...'}
            {step === 'success' && 'Purchase Complete!'}
            {step === 'failed' && 'Purchase Failed'}
          </DialogTitle>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-4">
            {/* Bot Preview - only show image if available */}
            <div className={`flex gap-3 p-3 rounded-xl bg-muted/30 ${!bot.image ? 'items-center' : ''}`}>
              {bot.image && (
                <img 
                  src={bot.image} 
                  alt={bot.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{bot.name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{bot.shortDescription}</p>
                {!bot.image && (
                  <p className="text-xs text-primary mt-1">₹{bot.price}</p>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 rounded-lg bg-primary/5">
                <Zap className="w-4 h-4 text-primary mb-1" />
                <span className="text-xs text-muted-foreground">Instant</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-success/5">
                <Shield className="w-4 h-4 text-success mb-1" />
                <span className="text-xs text-muted-foreground">Secure</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-yellow-500/5">
                <Clock className="w-4 h-4 text-yellow-500 mb-1" />
                <span className="text-xs text-muted-foreground">24/7</span>
              </div>
            </div>

            {/* Price Summary */}
            <div className="space-y-2 p-3 rounded-xl bg-muted/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bot Price</span>
                <span>₹{bot.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Balance</span>
                <span className={canAfford ? "text-success" : "text-destructive"}>
                  ₹{balance}
                </span>
              </div>
              <div className="border-t border-border/50 pt-2 flex justify-between font-semibold">
                <span>After Purchase</span>
                <span className={canAfford ? "text-success" : "text-destructive"}>
                  ₹{balance - bot.price}
                </span>
              </div>
            </div>

            {!canAfford && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Insufficient balance. Add ₹{bot.price - balance} more.</span>
              </div>
            )}

            <Button 
              onClick={handlePurchase} 
              disabled={!canAfford}
              className="w-full"
              size="lg"
            >
              Pay ₹{bot.price}
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-8 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Processing your purchase...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-1">Purchase Successful!</h4>
              <p className="text-sm text-muted-foreground">
                Your bot will be delivered shortly. Check your Telegram!
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}

        {step === 'failed' && (
          <div className="py-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-1">Purchase Failed</h4>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setStep('confirm')} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
