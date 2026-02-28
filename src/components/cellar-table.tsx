"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Wine } from "@/lib/db/schema";

interface CellarItemWithWine {
  id: number;
  wineId: number;
  vintage: number;
  purchasePrice: number | null;
  purchaseDate: string | null;
  quantity: number;
  notes: string | null;
  status: string;
  rating: number | null;
  tastingNotes: string | null;
  wine: Wine;
  currentPrice: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
}

interface CellarTableProps {
  items: CellarItemWithWine[];
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onEdit?: (item: CellarItemWithWine) => void;
}

export function CellarTable({ items, onDelete, onStatusChange, onEdit }: CellarTableProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const statusColors: Record<string, string> = {
    in_cellar: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    consumed: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
    sold: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Wine</TableHead>
            <TableHead>Vintage</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Rating</TableHead>
            <TableHead className="text-right">Purchase</TableHead>
            <TableHead className="text-right">Current</TableHead>
            <TableHead className="text-right">Return</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No wines in your cellar yet. Search for a wine to add it.
              </TableCell>
            </TableRow>
          )}
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{item.wine.wineName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.wine.producer}
                  </p>
                  {item.tastingNotes && (
                    <p className="text-xs text-muted-foreground italic mt-0.5 max-w-48 truncate">
                      {item.tastingNotes}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono">{item.vintage}</TableCell>
              <TableCell className="text-right font-mono">
                {item.quantity}
              </TableCell>
              <TableCell className="text-right font-mono">
                {item.rating ? (
                  <span className="text-sm">{item.rating}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(item.purchasePrice)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(item.currentPrice)}
              </TableCell>
              <TableCell className="text-right">
                {item.gainLoss !== null ? (
                  <div className="flex flex-col items-end">
                    <span
                      className={`font-mono text-sm ${
                        item.gainLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {item.gainLoss >= 0 ? "+" : ""}
                      {formatCurrency(item.gainLoss)}
                    </span>
                    <span
                      className={`text-xs ${
                        item.gainLossPercent! >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {item.gainLossPercent! >= 0 ? "+" : ""}
                      {item.gainLossPercent!.toFixed(1)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={statusColors[item.status] || ""}
                >
                  {item.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      title="Edit"
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {item.status === "in_cellar" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange(item.id, "consumed")}
                      title="Mark as consumed"
                    >
                      🍷
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
