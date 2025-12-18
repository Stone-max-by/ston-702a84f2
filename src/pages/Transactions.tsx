import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUserApiCredits } from "@/contexts/UserApiCreditsContext";
import { format } from "date-fns";
import { ArrowDownLeft, Coins, ShoppingCart, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function Transactions() {
  const navigate = useNavigate();
  const { transactions, balance, loading } = useUserApiCredits();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { from: "/transactions" } });
    }
  }, [user, authLoading, navigate]);

  const getIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case "purchase":
        return <ShoppingCart className="h-5 w-5 text-red-500" />;
      case "coin_earning":
      case "ad_reward":
        return <Coins className="h-5 w-5 text-yellow-500" />;
      default:
        return <Wallet className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? "text-green-500" : "text-red-500";
  };

  const formatAmount = (amount: number) => {
    const prefix = amount >= 0 ? "+" : "";
    return `${prefix}₹${Math.abs(amount)}`;
  };

  if (authLoading || loading) {
    return (
      <AppLayout title="Transactions" showBack onBack={() => navigate(-1)}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout title="Transactions" showBack onBack={() => navigate(-1)}>
      <div className="p-4 space-y-4">
        {/* Balance Card */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold text-success">₹{balance}</p>
            </div>
            <Button onClick={() => navigate("/deposit")} size="sm">
              Add Money
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">
            Transaction History
          </h2>

          {transactions.length === 0 ? (
            <div className="bg-card rounded-xl p-8 border border-border text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="bg-card rounded-xl p-4 border border-border flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {getIcon(txn.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {txn.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(txn.date), "dd MMM yyyy, hh:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${getAmountColor(txn.amount)}`}>
                      {formatAmount(txn.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {txn.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
