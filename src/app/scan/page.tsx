"use client";

import { useState } from "react";
import { LabelScanner } from "@/components/label-scanner";
import { WineSearch } from "@/components/wine-search";
import { WineCard } from "@/components/wine-card";
import { AddToCellarDialog } from "@/components/add-to-cellar-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wine } from "@/lib/db/schema";

interface ScanResult {
  producer: string | null;
  wineName: string | null;
  vintage: number | null;
  appellation: string | null;
  classification: string | null;
  confidence: number;
  rawText: string;
}

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [matchedWines, setMatchedWines] = useState<Wine[]>([]);
  const [searching, setSearching] = useState(false);
  const [cellarWine, setCellarWine] = useState<Wine | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleScanResult = async (result: ScanResult) => {
    setScanResult(result);

    // Auto-search for matching wines
    if (result.producer || result.wineName) {
      setSearching(true);
      const searchTerms = [result.producer, result.wineName]
        .filter(Boolean)
        .join(" ");
      try {
        const res = await fetch(
          `/api/wines?q=${encodeURIComponent(searchTerms)}`
        );
        const data = await res.json();
        setMatchedWines(data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setSearching(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan Wine Label</h1>
        <p className="text-muted-foreground mt-1">
          Take a photo of a wine label to identify the wine and look up prices
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LabelScanner onResult={handleScanResult} />

        {scanResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Scan Result
                <Badge variant={scanResult.confidence > 0.8 ? "default" : "secondary"}>
                  {Math.round(scanResult.confidence * 100)}% confident
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scanResult.producer && (
                <div>
                  <p className="text-xs text-muted-foreground">Producer</p>
                  <p className="font-medium">{scanResult.producer}</p>
                </div>
              )}
              {scanResult.wineName && (
                <div>
                  <p className="text-xs text-muted-foreground">Wine</p>
                  <p className="font-medium">{scanResult.wineName}</p>
                </div>
              )}
              {scanResult.vintage && (
                <div>
                  <p className="text-xs text-muted-foreground">Vintage</p>
                  <p className="font-medium">{scanResult.vintage}</p>
                </div>
              )}
              {scanResult.appellation && (
                <div>
                  <p className="text-xs text-muted-foreground">Appellation</p>
                  <p className="font-medium">{scanResult.appellation}</p>
                </div>
              )}
              {scanResult.classification && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Classification
                  </p>
                  <Badge variant="outline">{scanResult.classification}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {scanResult && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {searching
              ? "Searching for matches..."
              : matchedWines.length > 0
              ? `Found ${matchedWines.length} match${matchedWines.length === 1 ? "" : "es"}`
              : "No matches found - try searching manually"}
          </h2>

          {matchedWines.length === 0 && !searching && (
            <div className="max-w-md">
              <WineSearch
                onSelect={(wine) => setMatchedWines([wine])}
                placeholder="Search manually..."
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchedWines.map((wine) => (
              <div key={wine.id} className="relative group">
                <WineCard wine={wine} />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    setCellarWine(wine);
                    setDialogOpen(true);
                  }}
                >
                  + Cellar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddToCellarDialog
        wine={cellarWine}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={() => setCellarWine(null)}
      />
    </div>
  );
}
