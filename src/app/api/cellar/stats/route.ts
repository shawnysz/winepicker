import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cellarItems, wines, priceSnapshots } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET() {
  // Get all cellar items with wine info
  const items = db
    .select({
      cellarItem: cellarItems,
      wine: wines,
    })
    .from(cellarItems)
    .innerJoin(wines, eq(cellarItems.wineId, wines.id))
    .all();

  // Classification breakdown
  const classificationBreakdown: Record<string, number> = {};
  const producerBreakdown: Record<string, number> = {};
  const appellationBreakdown: Record<string, number> = {};

  items.forEach(({ cellarItem, wine }) => {
    const qty = cellarItem.quantity;
    classificationBreakdown[wine.classification] =
      (classificationBreakdown[wine.classification] || 0) + qty;
    producerBreakdown[wine.producer] =
      (producerBreakdown[wine.producer] || 0) + qty;
    appellationBreakdown[wine.appellation] =
      (appellationBreakdown[wine.appellation] || 0) + qty;
  });

  // Portfolio value over time — use purchase dates and price snapshots
  const valueOverTime: Array<{ date: string; value: number }> = [];

  // Get all price snapshots for cellar wines, sorted by date
  const allSnapshots = db
    .select({
      wineId: priceSnapshots.wineId,
      vintage: priceSnapshots.vintage,
      avgPrice: priceSnapshots.avgPrice,
      fetchedAt: priceSnapshots.fetchedAt,
    })
    .from(priceSnapshots)
    .orderBy(priceSnapshots.fetchedAt)
    .all();

  // Group snapshots by date (day)
  const snapshotsByDate: Record<string, Record<string, number>> = {};
  allSnapshots.forEach((snap) => {
    const date = snap.fetchedAt.split("T")[0];
    const key = `${snap.wineId}-${snap.vintage}`;
    if (!snapshotsByDate[date]) snapshotsByDate[date] = {};
    if (snap.avgPrice) {
      snapshotsByDate[date][key] = snap.avgPrice;
    }
  });

  // Build cumulative price map and compute portfolio value per date
  const cumulativePrices: Record<string, number> = {};
  const cellarKeys = items.map(
    ({ cellarItem }) => `${cellarItem.wineId}-${cellarItem.vintage}`
  );
  const cellarQty: Record<string, number> = {};
  items.forEach(({ cellarItem }) => {
    const key = `${cellarItem.wineId}-${cellarItem.vintage}`;
    cellarQty[key] = (cellarQty[key] || 0) + cellarItem.quantity;
  });

  const sortedDates = Object.keys(snapshotsByDate).sort();
  sortedDates.forEach((date) => {
    Object.assign(cumulativePrices, snapshotsByDate[date]);
    let totalValue = 0;
    cellarKeys.forEach((key) => {
      if (cumulativePrices[key]) {
        totalValue += cumulativePrices[key] * (cellarQty[key] || 1);
      }
    });
    if (totalValue > 0) {
      valueOverTime.push({ date, value: Math.round(totalValue) });
    }
  });

  const toBreakdownArray = (obj: Record<string, number>) =>
    Object.entries(obj)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  return NextResponse.json({
    classificationBreakdown: toBreakdownArray(classificationBreakdown),
    producerBreakdown: toBreakdownArray(producerBreakdown).slice(0, 10),
    appellationBreakdown: toBreakdownArray(appellationBreakdown).slice(0, 10),
    valueOverTime,
  });
}
