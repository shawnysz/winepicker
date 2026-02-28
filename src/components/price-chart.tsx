"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from "recharts";
import { PriceSnapshot } from "@/lib/db/schema";
import { useState } from "react";

type Props = {
  priceHistory: PriceSnapshot[];
};

type ChartPoint = {
  date: string;
  timestamp: number;
  vintage: number;
  avg: number;
  min: number;
  max: number;
};

const VINTAGE_COLORS = [
  "#dc2626", // red-600
  "#ea580c", // orange-600
  "#d97706", // amber-600
  "#65a30d", // lime-600
  "#16a34a", // green-600
  "#0d9488", // teal-600
  "#0891b2", // cyan-600
  "#2563eb", // blue-600
  "#7c3aed", // violet-600
  "#9333ea", // purple-600
  "#c026d3", // fuchsia-600
  "#db2777", // pink-600
  "#e11d48", // rose-600
  "#78716c", // stone-500
];

function formatPrice(value: number): string {
  if (value >= 10000) return `$${(value / 1000).toFixed(0)}k`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function PriceChart({ priceHistory }: Props) {
  const vintages = [...new Set(priceHistory.map((s) => s.vintage))].sort();
  const [selectedVintages, setSelectedVintages] = useState<Set<number>>(
    () => new Set(vintages)
  );

  if (priceHistory.length === 0) return null;

  const toggleVintage = (v: number) => {
    setSelectedVintages((prev) => {
      const next = new Set(prev);
      if (next.has(v)) {
        if (next.size > 1) next.delete(v);
      } else {
        next.add(v);
      }
      return next;
    });
  };

  // Group by date, with one avg-price column per vintage
  const dateMap = new Map<string, Record<string, number>>();
  for (const snap of priceHistory) {
    if (!selectedVintages.has(snap.vintage)) continue;
    const dateKey = snap.fetchedAt.split("T")[0];
    if (!dateMap.has(dateKey)) dateMap.set(dateKey, {});
    const row = dateMap.get(dateKey)!;
    row[`v${snap.vintage}`] = snap.avgPrice ?? 0;
    row[`min${snap.vintage}`] = snap.minPrice ?? snap.avgPrice ?? 0;
    row[`max${snap.vintage}`] = snap.maxPrice ?? snap.avgPrice ?? 0;
  }

  const chartData = [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date: formatDate(date),
      rawDate: date,
      ...values,
    }));

  const filteredVintages = vintages.filter((v) => selectedVintages.has(v));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any) => {
          const vintage = entry.dataKey.replace("v", "");
          const row = entry.payload;
          const min = row[`min${vintage}`];
          const max = row[`max${vintage}`];
          return (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{vintage}:</span>
              <span className="font-mono font-medium">
                ${entry.value?.toLocaleString()}
              </span>
              {min && max && min !== max && (
                <span className="text-xs text-muted-foreground">
                  (${min.toLocaleString()} - ${max.toLocaleString()})
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Vintage filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {vintages.map((v, i) => {
          const active = selectedVintages.has(v);
          return (
            <button
              key={v}
              onClick={() => toggleVintage(v)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                active
                  ? "text-white border-transparent"
                  : "bg-muted text-muted-foreground border-border opacity-50"
              }`}
              style={
                active
                  ? { backgroundColor: VINTAGE_COLORS[i % VINTAGE_COLORS.length] }
                  : undefined
              }
            >
              {v}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatPrice}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            {filteredVintages.map((v, i) => {
              const idx = vintages.indexOf(v);
              return (
                <Line
                  key={v}
                  type="monotone"
                  dataKey={`v${v}`}
                  name={`${v}`}
                  stroke={VINTAGE_COLORS[idx % VINTAGE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
