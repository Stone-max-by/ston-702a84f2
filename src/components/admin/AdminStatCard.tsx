import { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  color?: "primary" | "success" | "warning" | "destructive";
}

export function AdminStatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = "primary"
}: AdminStatCardProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border/50 hover:border-border transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-2 pt-2 border-t border-border/30">
          {trend ? (
            <p className={`text-xs ${trend.isPositive ? "text-success" : "text-destructive"}`}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          ) : subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
