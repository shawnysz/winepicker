"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface StatsData {
  classificationBreakdown: Array<{ name: string; value: number }>;
  producerBreakdown: Array<{ name: string; value: number }>;
  appellationBreakdown: Array<{ name: string; value: number }>;
  valueOverTime: Array<{ date: string; value: number }>;
}

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
];

export function CellarCharts() {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch("/api/cellar/stats")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return null;

  const hasData =
    data.classificationBreakdown.length > 0 ||
    data.valueOverTime.length > 0;

  if (!hasData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cellar Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="breakdown" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            {data.valueOverTime.length > 1 && (
              <TabsTrigger value="value">Value Over Time</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="breakdown">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.classificationBreakdown.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 text-center">
                    By Classification
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.classificationBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, value }) => `${name} (${value})`}
                        labelLine={false}
                      >
                        {data.classificationBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {data.producerBreakdown.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 text-center">
                    By Producer
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.producerBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, value }) => `${String(name ?? "").substring(0, 12)} (${value})`}
                        labelLine={false}
                      >
                        {data.producerBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {data.appellationBreakdown.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 text-center">
                    By Appellation
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.appellationBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, value }) => `${String(name ?? "").substring(0, 12)} (${value})`}
                        labelLine={false}
                      >
                        {data.appellationBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </TabsContent>

          {data.valueOverTime.length > 1 && (
            <TabsContent value="value">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.valueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value ?? 0).toLocaleString()}`,
                      "Portfolio Value",
                    ]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString()
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-chart-1)"
                    fill="var(--color-chart-1)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
