"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WineSearch } from "@/components/wine-search";
import { WineCard } from "@/components/wine-card";
import { AddToCellarDialog } from "@/components/add-to-cellar-dialog";
import { Button } from "@/components/ui/button";
import { Wine, PriceSnapshot } from "@/lib/db/schema";

type WineWithPrice = Wine & { latestPrice: PriceSnapshot | null };

export default function HomePage() {
  const router = useRouter();
  const [selectedWines, setSelectedWines] = useState<WineWithPrice[]>([]);
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
  const [cellarWine, setCellarWine] = useState<Wine | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleCompare = (id: number) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (wine: Wine) => {
    setSelectedWines((prev) => {
      if (prev.find((w) => w.id === wine.id)) return prev;
      return [wine as WineWithPrice, ...prev];
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Burgundy Wine Lookup
        </h1>
        <p className="text-muted-foreground">
          Search top Burgundy producers and wines. Check prices. Build your cellar.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-8">
        <WineSearch onSelect={handleSelect} />
      </div>

      {selectedWines.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Results ({selectedWines.length})
            </h2>
            <div className="flex items-center gap-2">
              {compareIds.size >= 2 && (
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/compare?ids=${Array.from(compareIds).join(",")}`
                    )
                  }
                >
                  Compare ({compareIds.size})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedWines([]);
                  setCompareIds(new Set());
                }}
              >
                Clear all
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedWines.map((wine) => (
              <div key={wine.id} className="relative group">
                <WineCard
                  wine={wine}
                  price={wine.latestPrice?.avgPrice ?? undefined}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant={compareIds.has(wine.id) ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleCompare(wine.id);
                    }}
                  >
                    {compareIds.has(wine.id) ? "✓ Compare" : "Compare"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      setCellarWine(wine);
                      setDialogOpen(true);
                    }}
                  >
                    + Cellar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedWines.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🍷</div>
          <h2 className="text-xl font-semibold mb-2">
            Search for Burgundy Wines
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start typing a producer name (DRC, Leroy, Roumier...), wine name,
            appellation, or commune to find wines and their market prices.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              "Romanée-Conti",
              "Musigny",
              "Chambertin",
              "Meursault",
              "Chablis",
              "Roumier",
              "Dujac",
            ].map((term) => (
              <button
                key={term}
                className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-full hover:bg-accent transition-colors"
                onClick={async () => {
                  const res = await fetch(
                    `/api/wines?q=${encodeURIComponent(term)}`
                  );
                  const data = await res.json();
                  setSelectedWines(data);
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      <AddToCellarDialog
        wine={cellarWine}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={() => {
          setCellarWine(null);
        }}
      />
    </div>
  );
}
