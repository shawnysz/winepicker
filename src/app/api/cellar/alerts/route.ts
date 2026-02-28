import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cellarItems, wines, priceSnapshots } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET() {
  const items = db
    .select({
      cellarItem: cellarItems,
      wine: wines,
    })
    .from(cellarItems)
    .innerJoin(wines, eq(cellarItems.wineId, wines.id))
    .where(eq(cellarItems.status, "in_cellar"))
    .all();

  const alerts: Array<{
    wineId: number;
    wineName: string;
    producer: string;
    vintage: number;
    previousPrice: number;
    currentPrice: number;
    changePercent: number;
  }> = [];

  for (const { cellarItem, wine } of items) {
    // Get two most recent price snapshots
    const snapshots = db
      .select()
      .from(priceSnapshots)
      .where(
        and(
          eq(priceSnapshots.wineId, wine.id),
          eq(priceSnapshots.vintage, cellarItem.vintage)
        )
      )
      .orderBy(desc(priceSnapshots.fetchedAt))
      .limit(2)
      .all();

    if (snapshots.length < 2) continue;
    if (!snapshots[0].avgPrice || !snapshots[1].avgPrice) continue;

    const current = snapshots[0].avgPrice;
    const previous = snapshots[1].avgPrice;
    const changePercent = ((current - previous) / previous) * 100;

    if (Math.abs(changePercent) >= 5) {
      alerts.push({
        wineId: wine.id,
        wineName: wine.wineName,
        producer: wine.producer,
        vintage: cellarItem.vintage,
        previousPrice: previous,
        currentPrice: current,
        changePercent,
      });
    }
  }

  // Sort by absolute change descending
  alerts.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  return NextResponse.json(alerts);
}
