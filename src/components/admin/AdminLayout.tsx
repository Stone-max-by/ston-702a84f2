import { ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Gamepad2, Users, Settings, ArrowLeft, Menu, Code, Loader2, ShieldAlert, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/products", icon: Gamepad2, label: "Products" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/api", icon: Code, label: "API Endpoints" },
  { to: "/admin/api-keys", icon: Key, label: "API Keys" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();

  return (
    <>
      <div className="p-4 border-b border-white/5">
        <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
        <p className="text-xs text-muted-foreground">Management Dashboard</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.end 
            ? location.pathname === item.to 
            : location.pathname.startsWith(item.to);
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onItemClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <NavLink
          to="/"
          onClick={onItemClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to App
        </NavLink>
      </div>
    </>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin, loading, user } = useAdminAuth();

  // For Telegram users - check admin status (only after loading)
  if (!loading && user?.telegramId && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have admin privileges.
          </p>
          <p className="text-sm text-muted-foreground">
            Your Telegram ID: {user.telegramId}
          </p>
          <Button asChild variant="outline">
            <NavLink to="/">Go Back Home</NavLink>
          </Button>
        </div>
      </div>
    );
  }

  // Show content with loading indicator if still loading
  const content = loading ? (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ) : children;

  // Allow access for web users without password (for development)
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-white/5 flex-col">
        <NavContent />
      </aside>

      {/* Mobile Header + Sheet */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center gap-3 p-4 border-b border-white/5 bg-card">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-card border-white/5">
              <NavContent onItemClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div>
            <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Management Dashboard</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">{content}</div>
        </main>
      </div>
    </div>
  );
}
