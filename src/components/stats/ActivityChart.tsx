import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface ActivityChartProps {
  title?: string;
  dateRange?: string;
  data: { date: string; value: number }[];
  color: "blue" | "green" | string;
  toggleOptions?: { label: string; value: string }[];
  timeRangeOptions?: { label: string; value: string }[];
}

export function ActivityChart({
  title,
  dateRange,
  data,
  color,
  toggleOptions = [
    { label: "New Users", value: "new" },
    { label: "Total Users", value: "total" },
  ],
  timeRangeOptions = [
    { label: "All", value: "all" },
    { label: "Last 30 Days", value: "30" },
    { label: "Last 7 Days", value: "7" },
  ],
}: ActivityChartProps) {
  const [activeToggle, setActiveToggle] = useState(toggleOptions[0].value);
  const [activeTimeRange, setActiveTimeRange] = useState(timeRangeOptions[0].value);

  const strokeColor = color === "blue" 
    ? "hsl(211, 100%, 52%)" 
    : color === "green" 
    ? "hsl(156, 77%, 44%)" 
    : color;

  // Compact mode for admin dashboard (no title/controls)
  const isCompact = !title;

  if (isCompact) {
    return (
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(200, 10%, 58%)", fontSize: 10 }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(200, 14%, 8%)",
                border: "1px solid hsl(200, 10%, 15%)",
                borderRadius: "8px",
                color: "white",
              }}
              labelStyle={{ color: "hsl(200, 10%, 58%)" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: strokeColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-4">
      <div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{dateRange}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {toggleOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setActiveToggle(option.value)}
            className={cn(
              "toggle-btn",
              activeToggle === option.value
                ? "toggle-btn-active"
                : "toggle-btn-inactive"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {timeRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setActiveTimeRange(option.value)}
            className={cn(
              "toggle-btn",
              activeTimeRange === option.value
                ? "toggle-btn-active"
                : "toggle-btn-inactive"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="h-48 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(200, 10%, 58%)", fontSize: 10 }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(200, 14%, 8%)",
                border: "1px solid hsl(200, 10%, 15%)",
                borderRadius: "8px",
                color: "white",
              }}
              labelStyle={{ color: "hsl(200, 10%, 58%)" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: strokeColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
