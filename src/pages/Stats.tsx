import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/stats/StatCard";
import { ActivityChart } from "@/components/stats/ActivityChart";
import {
  Users,
  Gamepad2,
  Files,
  HardDrive,
  Download,
} from "lucide-react";
import {
  platformStats,
  userActivityData,
  downloadActivityData,
} from "@/data/mockGames";

export default function Stats() {
  return (
    <AppLayout title="PC Games Archive Bot">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Platform Statistics</h2>
          <p className="text-sm text-muted-foreground">updated 10 mins ago</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Users}
            value={platformStats.users}
            label="users"
          />
          <StatCard
            icon={Gamepad2}
            value={platformStats.games}
            label="games"
          />
          <StatCard
            icon={Files}
            value={platformStats.files}
            label="files"
          />
          <StatCard
            icon={HardDrive}
            value={`${platformStats.storageTB} TB`}
            label="storage"
          />
          <StatCard
            icon={Download}
            value={platformStats.downloads}
            label="downloads"
            fullWidth
          />
        </div>

        <ActivityChart
          title="User Activity"
          dateRange="21 Jul 2024 – 07 Dec 2025"
          data={userActivityData}
          color="blue"
          toggleOptions={[
            { label: "New Users", value: "new" },
            { label: "Total Users", value: "total" },
          ]}
        />

        <ActivityChart
          title="Download Activity"
          dateRange="14 Jun 2025 – 07 Dec 2025"
          data={downloadActivityData}
          color="green"
          toggleOptions={[
            { label: "Per Day", value: "day" },
            { label: "Total", value: "total" },
          ]}
        />
      </div>
    </AppLayout>
  );
}
