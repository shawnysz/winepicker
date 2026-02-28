"use client";

import { useState, useEffect } from "react";
import { WineCard } from "@/components/wine-card";
import { Wine, PriceSnapshot } from "@/lib/db/schema";

type WineWithPrice = Wine & { latestPrice: PriceSnapshot | null };

interface SimilarWinesProps {
  wineId: number;
}

export function SimilarWines({ wineId }: SimilarWinesProps) {
  const [wines, setWines] = useState<WineWithPrice[]>([]);

  useEffect(() => {
    fetch(`/api/wines/similar?wineId=${wineId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setWines(data);
      })
      .catch(console.error);
  }, [wineId]);

  if (wines.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Similar Wines</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wines.map((wine) => (
          <WineCard
            key={wine.id}
            wine={wine}
            price={wine.latestPrice?.avgPrice ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}
