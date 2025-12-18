import { LucideIcon } from "lucide-react";

interface ProfileInfoCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
}

export function ProfileInfoCard({ icon: Icon, value, label }: ProfileInfoCardProps) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className="icon-box">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
