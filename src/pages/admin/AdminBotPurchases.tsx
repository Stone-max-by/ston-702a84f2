import { useState } from "react";
import { ShoppingBag, Search, User, Bot, IndianRupee, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useBotPurchases } from "@/hooks/useBotPurchases";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { formatDistanceToNow } from "date-fns";

export default function AdminBotPurchases() {
  const { purchases, loading, error, totalRevenue, pendingCount, deliveredCount } = useBotPurchases();
  const [search, setSearch] = useState("");

  const filteredPurchases = purchases.filter(p => 
    p.botName.toLowerCase().includes(search.toLowerCase()) ||
    p.userName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-success/20 text-success text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 text-[10px]"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/20 text-destructive text-[10px]"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground text-[10px]">{status}</Badge>;
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Bot Purchases</h1>
          <p className="text-xs text-muted-foreground">Track all bot sales</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <AdminStatCard
          title="Total Revenue"
          value={`₹${totalRevenue}`}
          icon={IndianRupee}
          color="success"
        />
        <AdminStatCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          color="warning"
        />
        <AdminStatCard
          title="Delivered"
          value={deliveredCount}
          icon={CheckCircle}
          color="primary"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by bot or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-muted/30"
        />
      </div>

      {/* Purchases List */}
      {error ? (
        <div className="text-center py-8 text-muted-foreground">{error}</div>
      ) : filteredPurchases.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No purchases yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPurchases.map((purchase) => (
            <div 
              key={purchase.id}
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{purchase.botName}</p>
                  {getStatusBadge(purchase.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <User className="w-3 h-3" />
                  <span className="truncate">{purchase.userName}</span>
                  {purchase.telegramId && (
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      ID: {purchase.telegramId}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-success">₹{purchase.amount}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(purchase.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
