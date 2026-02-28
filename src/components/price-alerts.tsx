"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, TrendingUp, TrendingDown } from "lucide-react";

interface Alert {
  wineId: number;
  wineName: string;
  producer: string;
  vintage: number;
  previousPrice: number;
  currentPrice: number;
  changePercent: number;
}

export function PriceAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetch("/api/cellar/alerts")
      .then((res) => res.json())
      .then(setAlerts)
      .catch(console.error);
  }, []);

  if (alerts.length === 0) return null;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(v);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Bell className="h-4 w-4" />
        Price Alerts
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.map((alert) => {
          const isUp = alert.changePercent > 0;
          return (
            <Card
              key={`${alert.wineId}-${alert.vintage}`}
              className={`border-l-4 ${
                isUp
                  ? "border-l-green-500 dark:border-l-green-400"
                  : "border-l-red-500 dark:border-l-red-400"
              }`}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {alert.wineName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.producer} &middot; {alert.vintage}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isUp ? (
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <span
                      className={`text-sm font-mono font-bold ${
                        isUp
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isUp ? "+" : ""}
                      {alert.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(alert.previousPrice)} →{" "}
                  {formatCurrency(alert.currentPrice)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
