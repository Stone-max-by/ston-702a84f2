import { Users, Package, Download, TrendingUp, DollarSign, ShoppingCart, Loader2 } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ActivityChart } from "@/components/stats/ActivityChart";
import { userActivityData, downloadActivityData, mockGames } from "@/data/mockGames";
import { useAdminStats, useAdminUsers } from "@/hooks/useAdminData";

export default function AdminDashboard() {
  const { stats, loading: statsLoading } = useAdminStats();
  const { users, loading: usersLoading } = useAdminUsers();

  const recentUsers = users.slice(0, 5);

  if (statsLoading) {
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
        <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Platform overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <AdminStatCard
          title="Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          color="primary"
          trend={{ value: 12.5, isPositive: true }}
        />
        <AdminStatCard
          title="Products"
          value={mockGames.length.toString()}
          icon={Package}
          color="success"
        />
        <AdminStatCard
          title="Purchases"
          value={stats.totalPurchases.toLocaleString()}
          icon={ShoppingCart}
          color="warning"
        />
        <AdminStatCard
          title="Transactions"
          value={stats.totalTransactions.toLocaleString()}
          icon={Download}
          subtitle="all time"
        />
        <AdminStatCard
          title="Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="success"
        />
        <AdminStatCard
          title="Growth"
          value="+24%"
          icon={TrendingUp}
          color="primary"
          subtitle="This month"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <h3 className="text-sm font-medium text-foreground mb-3">User Activity</h3>
          <ActivityChart data={userActivityData} color="blue" />
        </div>
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <h3 className="text-sm font-medium text-foreground mb-3">Downloads</h3>
          <ActivityChart data={downloadActivityData} color="green" />
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-medium text-foreground">Recent Users</h3>
        </div>
        <div className="divide-y divide-border/30">
          {usersLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentUsers.length > 0 ? (
            recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.telegramId}`}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{user.balance} • {user.coins} coins
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground py-6">No users yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
