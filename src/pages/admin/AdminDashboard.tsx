import { Users, Gamepad2, Download, TrendingUp, DollarSign, ShoppingCart, Loader2 } from "lucide-react";
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminStatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
        />
        <AdminStatCard
          title="Products"
          value={mockGames.length.toString()}
          icon={Gamepad2}
          trend={{ value: 3, isPositive: true }}
        />
        <AdminStatCard
          title="Purchases"
          value={stats.totalPurchases.toLocaleString()}
          icon={ShoppingCart}
          trend={{ value: 8.2, isPositive: true }}
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
          trend={{ value: 15.3, isPositive: true }}
        />
        <AdminStatCard
          title="Growth"
          value="+24%"
          icon={TrendingUp}
          subtitle="This month"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-medium text-foreground mb-4">User Activity</h3>
          <ActivityChart data={userActivityData} color="blue" />
        </div>
        <div className="bg-card rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-medium text-foreground mb-4">Download Activity</h3>
          <ActivityChart data={downloadActivityData} color="green" />
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-card rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-medium text-foreground mb-4">Recent Users</h3>
        <div className="space-y-3">
          {usersLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentUsers.length > 0 ? (
            recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-3 bg-background rounded-lg"
              >
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.telegramId}`}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full object-cover bg-white/5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    @{user.username || user.telegramId} • ₹{user.balance} • {user.coins} coins
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">No users yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
