import { LayoutGrid, Coins, Code2, User, Bot } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutGrid, label: "Explore", path: "/" },
  { icon: Bot, label: "Bots", path: "/bots" },
  { icon: Coins, label: "Coins", path: "/coins" },
  { icon: Code2, label: "API", path: "/api-docs" },
  { icon: User, label: "Me", path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-bottom-nav bg-background/95 backdrop-blur-sm border-t border-border/50">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-5 py-2 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
