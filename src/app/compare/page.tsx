"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

interface CompareWine {
  id: number;
  producer: string;
  wineName: string;
  appellation: string;
  classification: string;
  region: string;
  commune: string;
  vineyard: string | null;
  color: string;
  latestPrice: { avgPrice: number | null; vintage: number } | null;
  pricesByVintage: Record<
    number,
    { avgPrice: number | null; vintage: number }
  >;
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids");
  const [wines, setWines] = useState<CompareWine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids) {
      setLoading(false);
      return;
    }
    fetch(`/api/wines?ids=${ids}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setWines(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ids]);

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Collect all vintages across all wines
  const allVintages = new Set<number>();
  wines.forEach((w) => {
    if (w.pricesByVintage) {
      Object.keys(w.pricesByVintage).forEach((v) => allVintages.add(parseInt(v)));
    }
  });
  const sortedVintages = Array.from(allVintages).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (wines.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">No wines to compare</h1>
        <p className="text-muted-foreground mt-2">
          Select wines from the search page to compare them.
        </p>
        <Link href="/" className="text-primary mt-4 inline-block">
          Back to search
        </Link>
      </div>
    );
  }

  const attributes = [
    { label: "Producer", getValue: (w: CompareWine) => w.producer },
    { label: "Wine", getValue: (w: CompareWine) => w.wineName },
    { label: "Appellation", getValue: (w: CompareWine) => w.appellation },
    { label: "Classification", getValue: (w: CompareWine) => w.classification },
    { label: "Region", getValue: (w: CompareWine) => w.region },
    { label: "Commune", getValue: (w: CompareWine) => w.commune },
    { label: "Vineyard", getValue: (w: CompareWine) => w.vineyard || "-" },
    { label: "Color", getValue: (w: CompareWine) => w.color === "red" ? "🔴 Red" : "⚪ White" },
    {
      label: "Latest Price",
      getValue: (w: CompareWine) => formatCurrency(w.latestPrice?.avgPrice),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          ← Back to search
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">
          Compare Wines
        </h1>
        <p className="text-muted-foreground mt-1">
          Side-by-side comparison of {wines.length} wines
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Attribute</TableHead>
                  {wines.map((w) => (
                    <TableHead key={w.id}>
                      <Link
                        href={`/wine/${w.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {w.wineName}
                      </Link>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributes.map((attr) => (
                  <TableRow key={attr.label}>
                    <TableCell className="font-medium text-muted-foreground">
                      {attr.label}
                    </TableCell>
                    {wines.map((w) => (
                      <TableCell key={w.id}>
                        {attr.label === "Classification" ? (
                          <Badge
                            variant={
                              w.classification === "Grand Cru"
                                ? "default"
                                : w.classification === "Premier Cru"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {attr.getValue(w)}
                          </Badge>
                        ) : (
                          attr.getValue(w)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {sortedVintages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prices by Vintage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">Vintage</TableHead>
                    {wines.map((w) => (
                      <TableHead key={w.id}>{w.wineName}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVintages.map((vintage) => (
                    <TableRow key={vintage}>
                      <TableCell className="font-mono font-medium">
                        {vintage}
                      </TableCell>
                      {wines.map((w) => (
                        <TableCell key={w.id} className="font-mono">
                          {formatCurrency(
                            w.pricesByVintage?.[vintage]?.avgPrice
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
