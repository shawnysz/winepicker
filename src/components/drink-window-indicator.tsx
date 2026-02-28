"use client";

import { getDrinkWindow, DrinkStatus } from "@/lib/drink-window";
import { Badge } from "@/components/ui/badge";

interface DrinkWindowIndicatorProps {
  classification: string;
  vintage: number;
  color: string;
}

const statusColors: Record<DrinkStatus, string> = {
  too_young:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  approaching:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  ready:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  peak:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  past_peak:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

export function DrinkWindowIndicator({
  classification,
  vintage,
  color,
}: DrinkWindowIndicatorProps) {
  const window = getDrinkWindow(classification, vintage, color);
  if (!window) return null;

  const currentYear = new Date().getFullYear();
  const totalSpan = window.peakEnd - (window.readyStart - 2);
  const progress = Math.max(
    0,
    Math.min(100, ((currentYear - (window.readyStart - 2)) / totalSpan) * 100)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={statusColors[window.status]}>
          {window.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {window.currentAge} years old
        </span>
      </div>

      {/* Timeline bar */}
      <div className="relative">
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          <div
            className="bg-blue-400 dark:bg-blue-600"
            style={{
              width: `${((window.readyStart - vintage - (window.readyStart - vintage - 2)) / totalSpan) * 100}%`,
            }}
          />
          <div
            className="bg-green-400 dark:bg-green-600"
            style={{
              width: `${((window.peakStart - window.readyStart) / totalSpan) * 100}%`,
            }}
          />
          <div
            className="bg-amber-400 dark:bg-amber-600"
            style={{
              width: `${((window.peakEnd - window.peakStart) / totalSpan) * 100}%`,
            }}
          />
        </div>
        {/* Current position marker */}
        <div
          className="absolute top-0 w-0.5 h-4 -mt-1 bg-foreground rounded-full"
          style={{ left: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Ready {window.readyStart}</span>
        <span>Peak {window.peakStart}–{window.peakEnd}</span>
      </div>
    </div>
  );
}
