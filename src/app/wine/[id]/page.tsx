"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PriceBadge } from "@/components/price-badge";
import { PriceChart } from "@/components/price-chart";
import { AddToCellarDialog } from "@/components/add-to-cellar-dialog";
import { DrinkWindowIndicator } from "@/components/drink-window-indicator";
import { SimilarWines } from "@/components/similar-wines";
import { Wine, PriceSnapshot } from "@/lib/db/schema";
import Link from "next/link";

export default function WineDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [wine, setWine] = useState<(Wine & { latestPrice?: PriceSnapshot }) | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupVintage, setLookupVintage] = useState(new Date().getFullYear() - 3);
  const [lookingUp, setLookingUp] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchWine = useCallback(async () => {
    try {
      const res = await fetch(`/api/wines?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setWine(data);
      }
    } catch (error) {
      console.error("Failed to fetch wine:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPriceHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineId: parseInt(id) }),
      });
      if (res.ok) {
        const data = await res.json();
        setPriceHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch price history:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchWine();
    fetchPriceHistory();
  }, [fetchWine, fetchPriceHistory]);

  const handlePriceLookup = async () => {
    setLookingUp(true);
    try {
      await fetch(
        `/api/prices?wineId=${id}&vintage=${lookupVintage}&refresh=true`
      );
      await fetchPriceHistory();
      await fetchWine();
    } catch (error) {
      console.error("Price lookup failed:", error);
    } finally {
      setLookingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!wine) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Wine not found</h1>
        <Link href="/" className="text-primary mt-4 inline-block">
          Back to search
        </Link>
      </div>
    );
  }

  const classificationColor = (classification: string) => {
    switch (classification) {
      case "Grand Cru":
        return "default" as const;
      case "Premier Cru":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        ← Back to search
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/producer/${encodeURIComponent(wine.producer)}`}
            className="text-sm text-muted-foreground font-medium uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {wine.producer}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            {wine.wineName}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={classificationColor(wine.classification)}>
              {wine.classification}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {wine.color === "red" ? "🔴 Red" : "⚪ White"}
            </span>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>+ Add to Cellar</Button>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wine Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Appellation</span>
              <span className="text-sm font-medium">{wine.appellation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Region</span>
              <span className="text-sm font-medium">{wine.region}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Commune</span>
              <span className="text-sm font-medium">{wine.commune}</span>
            </div>
            {wine.vineyard && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vineyard</span>
                <span className="text-sm font-medium">{wine.vineyard}</span>
              </div>
            )}

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Drink Window</p>
              <DrinkWindowIndicator
                classification={wine.classification}
                vintage={lookupVintage}
                color={wine.color}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Lookup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="vintage">Vintage</Label>
                <Input
                  id="vintage"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={lookupVintage}
                  onChange={(e) => setLookupVintage(parseInt(e.target.value))}
                />
              </div>
              <Button onClick={handlePriceLookup} disabled={lookingUp}>
                {lookingUp ? "Looking up..." : "Get Price"}
              </Button>
            </div>
            {wine.latestPrice && (
              <div className="pt-2">
                <PriceBadge price={wine.latestPrice.avgPrice} size="lg" />
                {wine.latestPrice.minPrice && wine.latestPrice.maxPrice && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: ${wine.latestPrice.minPrice.toLocaleString()} - $
                    {wine.latestPrice.maxPrice.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {priceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price History</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceChart priceHistory={priceHistory} />
          </CardContent>
        </Card>
      )}

      <SimilarWines wineId={parseInt(id)} />

      <AddToCellarDialog
        wine={wine}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={() => {}}
      />
    </div>
  );
}
