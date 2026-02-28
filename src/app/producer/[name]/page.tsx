"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { WineCard } from "@/components/wine-card";
import { Wine, PriceSnapshot } from "@/lib/db/schema";
import Link from "next/link";

type WineWithPrice = Wine & { latestPrice: PriceSnapshot | null };

export default function ProducerPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  const [wines, setWines] = useState<WineWithPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/wines?q=${encodeURIComponent(name)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter to exact producer match
          const filtered = data.filter(
            (w: WineWithPrice) => w.producer === name
          );
          setWines(filtered.length > 0 ? filtered : data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // Group wines by classification
  const grouped: Record<string, WineWithPrice[]> = {};
  wines.forEach((wine) => {
    if (!grouped[wine.classification]) grouped[wine.classification] = [];
    grouped[wine.classification].push(wine);
  });

  const classOrder = ["Grand Cru", "Premier Cru", "Village", "Regional"];
  const sortedGroups = classOrder.filter((c) => grouped[c]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        ← Back to search
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
        <p className="text-muted-foreground mt-1">
          {wines.length} wine{wines.length !== 1 ? "s" : ""}
        </p>
      </div>

      {sortedGroups.map((classification) => (
        <div key={classification} className="space-y-3">
          <h2 className="text-lg font-semibold">{classification}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped[classification].map((wine) => (
              <WineCard
                key={wine.id}
                wine={wine}
                price={wine.latestPrice?.avgPrice ?? undefined}
              />
            ))}
          </div>
        </div>
      ))}

      {wines.length === 0 && (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">No wines found</h2>
          <p className="text-muted-foreground mt-2">
            No wines found for producer &quot;{name}&quot;.
          </p>
        </div>
      )}
    </div>
  );
}
