"use client";

import { useState, useEffect, useCallback } from "react";
import { PortfolioSummary } from "@/components/portfolio-summary";
import { CellarTable } from "@/components/cellar-table";
import { CellarCharts } from "@/components/cellar-charts";
import { PriceAlerts } from "@/components/price-alerts";
import { EditCellarItemDialog } from "@/components/edit-cellar-item-dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface CellarData {
  items: Array<{
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
    wine: {
      id: number;
      producer: string;
      wineName: string;
      appellation: string;
      classification: string;
      region: string;
      commune: string;
      vineyard: string | null;
      color: string;
    };
    currentPrice: number | null;
    gainLoss: number | null;
    gainLossPercent: number | null;
  }>;
  summary: {
    totalBottles: number;
    totalPurchaseValue: number;
    totalCurrentValue: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    wineCount: number;
  };
}

export default function CellarPage() {
  const [data, setData] = useState<CellarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<CellarData["items"][0] | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchCellar = useCallback(async () => {
    try {
      const res = await fetch("/api/cellar");
      const cellarData = await res.json();
      setData(cellarData);
    } catch (error) {
      console.error("Failed to fetch cellar:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCellar();
  }, [fetchCellar]);

  const handleDelete = async (id: number) => {
    await fetch(`/api/cellar?id=${id}`, { method: "DELETE" });
    fetchCellar();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch("/api/cellar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchCellar();
  };

  const handleExport = () => {
    window.location.href = "/api/cellar/export";
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Cellar</h1>
          <p className="text-muted-foreground mt-1">
            Track your Burgundy wine collection like a portfolio
          </p>
        </div>
        {data && data.items.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <PriceAlerts />

      {data && data.summary.totalBottles > 0 && (
        <PortfolioSummary summary={data.summary} />
      )}

      <CellarCharts />

      <CellarTable
        items={data?.items || []}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onEdit={(item) => {
          setEditItem(item);
          setEditOpen(true);
        }}
      />

      <EditCellarItemDialog
        item={editItem}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={fetchCellar}
      />
    </div>
  );
}
