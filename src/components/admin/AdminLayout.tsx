import { ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  ArrowLeft, 
  Menu, 
  Code, 
  Loader2, 
  ShieldAlert, 
  Key, 
  Bot, 
  Ticket,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/products", icon: Package, label: "Products" },
  { to: "/admin/bots", icon: Bot, label: "Bots" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/api", icon: Code, label: "API" },
  { to: "/admin/api-keys", icon: Key, label: "API Keys" },
  { to: "/admin/redeem-codes", icon: Ticket, label: "Codes" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Admin</h1>
            <p className="text-[10px] text-muted-foreground">Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
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
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border/50">
        <NavLink
          to="/"
          onClick={onItemClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </NavLink>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin, loading, user } = useAdminAuth();

  if (!loading && user?.telegramId && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You don't have admin privileges.
          </p>
          <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded">
            ID: {user.telegramId}
          </p>
          <Button asChild variant="outline" size="sm">
            <NavLink to="/">Go Home</NavLink>
          </Button>
        </div>
      </div>
    );
  }

  const content = loading ? (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  ) : children;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 bg-card border-r border-border/50 flex-col shrink-0">
        <NavContent />
      </aside>

      {/* Mobile + Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-3 border-b border-border/50 bg-card">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">Admin</span>
          </div>
          
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0 bg-card border-border/50">
              <NavContent onItemClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {content}
        </main>
      </div>
    </div>
  );
}
