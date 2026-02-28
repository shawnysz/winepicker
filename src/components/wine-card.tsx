"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceBadge } from "./price-badge";
import { Wine } from "@/lib/db/schema";
import Link from "next/link";

interface WineCardProps {
  wine: Wine;
  price?: number | null;
  showLink?: boolean;
}

export function WineCard({ wine, price, showLink = true }: WineCardProps) {
  const classificationVariant = (classification: string) => {
    switch (classification) {
      case "Grand Cru":
        return "default" as const;
      case "Premier Cru":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/producer/${encodeURIComponent(wine.producer)}`}
              className="text-xs text-muted-foreground font-medium uppercase tracking-wider hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {wine.producer}
            </Link>
            <CardTitle className="text-lg mt-1">{wine.wineName}</CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={classificationVariant(wine.classification)}>
              {wine.classification}
            </Badge>
            <span className="text-xs">
              {wine.color === "red" ? "🔴" : "⚪"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{wine.appellation}</p>
            <p className="text-xs text-muted-foreground">
              {wine.commune}, {wine.region}
            </p>
            {wine.vineyard && (
              <p className="text-xs text-muted-foreground italic">
                {wine.vineyard}
              </p>
            )}
          </div>
          {price !== undefined && <PriceBadge price={price} />}
        </div>
      </CardContent>
    </Card>
  );

  if (showLink) {
    return <Link href={`/wine/${wine.id}`}>{content}</Link>;
  }

  return content;
}
