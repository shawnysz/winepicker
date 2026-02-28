import { NextRequest, NextResponse } from "next/server";
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
    .all();

  // Enrich with latest prices
  const enriched = items.map((item) => {
    const latestPrice = db
      .select()
      .from(priceSnapshots)
      .where(
        and(
          eq(priceSnapshots.wineId, item.wine.id),
          eq(priceSnapshots.vintage, item.cellarItem.vintage)
        )
      )
      .orderBy(desc(priceSnapshots.fetchedAt))
      .limit(1)
      .get();

    const currentValue = latestPrice?.avgPrice || null;
    const purchasePrice = item.cellarItem.purchasePrice;
    const gainLoss =
      currentValue && purchasePrice ? currentValue - purchasePrice : null;
    const gainLossPercent =
      gainLoss && purchasePrice
        ? ((gainLoss / purchasePrice) * 100)
        : null;

    return {
      ...item.cellarItem,
      wine: item.wine,
      currentPrice: currentValue,
      gainLoss,
      gainLossPercent,
    };
  });

  // Portfolio summary
  const totalPurchaseValue = enriched.reduce(
    (sum, item) =>
      sum + (item.purchasePrice || 0) * item.quantity,
    0
  );
  const totalCurrentValue = enriched.reduce(
    (sum, item) =>
      sum + (item.currentPrice || item.purchasePrice || 0) * item.quantity,
    0
  );
  const totalGainLoss = totalCurrentValue - totalPurchaseValue;
  const totalGainLossPercent =
    totalPurchaseValue > 0
      ? ((totalGainLoss / totalPurchaseValue) * 100)
      : 0;

  return NextResponse.json({
    items: enriched,
    summary: {
      totalBottles: enriched.reduce((sum, item) => sum + item.quantity, 0),
      totalPurchaseValue,
      totalCurrentValue,
      totalGainLoss,
      totalGainLossPercent,
      wineCount: enriched.length,
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { wineId, vintage, purchasePrice, purchaseDate, quantity, notes } =
    body;

  if (!wineId || !vintage) {
    return NextResponse.json(
      { error: "wineId and vintage are required" },
      { status: 400 }
    );
  }

  const wine = db.select().from(wines).where(eq(wines.id, wineId)).get();
  if (!wine) {
    return NextResponse.json({ error: "Wine not found" }, { status: 404 });
  }

  const item = db
    .insert(cellarItems)
    .values({
      wineId,
      vintage,
      purchasePrice: purchasePrice || null,
      purchaseDate: purchaseDate || new Date().toISOString().split("T")[0],
      quantity: quantity || 1,
      notes: notes || null,
      status: "in_cellar",
    })
    .returning()
    .get();

  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = db
    .select()
    .from(cellarItems)
    .where(eq(cellarItems.id, id))
    .get();
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const updated = db
    .update(cellarItems)
    .set(updates)
    .where(eq(cellarItems.id, id))
    .returning()
    .get();

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  db.delete(cellarItems)
    .where(eq(cellarItems.id, parseInt(id)))
    .run();

  return NextResponse.json({ success: true });
}
