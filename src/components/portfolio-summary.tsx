"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortfolioSummaryProps {
  summary: {
    totalBottles: number;
    totalPurchaseValue: number;
    totalCurrentValue: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    wineCount: number;
  };
}

export function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const isPositive = summary.totalGainLoss >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Bottles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{summary.totalBottles}</p>
          <p className="text-xs text-muted-foreground">
            {summary.wineCount} unique wines
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Cost Basis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(summary.totalPurchaseValue)}
          </p>
          <p className="text-xs text-muted-foreground">Total invested</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(summary.totalCurrentValue)}
          </p>
          <p className="text-xs text-muted-foreground">Market value</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${
              isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(summary.totalGainLoss)}
          </p>
          <p
            className={`text-xs font-medium ${
              isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {summary.totalGainLossPercent.toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
