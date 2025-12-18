import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  fullWidth?: boolean;
}

export function StatCard({ icon: Icon, value, label, fullWidth }: StatCardProps) {
  return (
    <div className={`stat-card ${fullWidth ? "col-span-2" : ""}`}>
      <div className="icon-box">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
