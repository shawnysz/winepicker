import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wines, priceSnapshots } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { scrapeWineSearcher } from "@/lib/scraper/wine-searcher";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wineId = searchParams.get("wineId");
  const vintage = searchParams.get("vintage");
  const refresh = searchParams.get("refresh") === "true";

  if (!wineId) {
    return NextResponse.json(
      { error: "wineId is required" },
      { status: 400 }
    );
  }

  const wine = db
    .select()
    .from(wines)
    .where(eq(wines.id, parseInt(wineId)))
    .get();

  if (!wine) {
    return NextResponse.json({ error: "Wine not found" }, { status: 404 });
  }

  // Check for cached price (less than 24 hours old)
  if (!refresh) {
    const conditions = [eq(priceSnapshots.wineId, parseInt(wineId))];
    if (vintage) {
      conditions.push(eq(priceSnapshots.vintage, parseInt(vintage)));
    }

    const cached = db
      .select()
      .from(priceSnapshots)
      .where(and(...conditions))
      .orderBy(desc(priceSnapshots.fetchedAt))
      .limit(1)
      .get();

    if (cached) {
      const cachedAge =
        Date.now() - new Date(cached.fetchedAt).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (cachedAge < twentyFourHours) {
        return NextResponse.json(cached);
      }
    }
  }

  // Scrape fresh price
  const vintageNum = vintage ? parseInt(vintage) : undefined;
  const price = await scrapeWineSearcher(
    wine.producer,
    wine.wineName,
    vintageNum
  );

  // Store the snapshot
  const snapshot = db
    .insert(priceSnapshots)
    .values({
      wineId: parseInt(wineId),
      vintage: vintageNum || new Date().getFullYear() - 3,
      avgPrice: price.avgPrice,
      minPrice: price.minPrice,
      maxPrice: price.maxPrice,
      currency: price.currency,
      source: price.source,
    })
    .returning()
    .get();

  return NextResponse.json(snapshot);
}

// Get price history for a wine
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { wineId } = body;

  if (!wineId) {
    return NextResponse.json(
      { error: "wineId is required" },
      { status: 400 }
    );
  }

  const history = db
    .select()
    .from(priceSnapshots)
    .where(eq(priceSnapshots.wineId, wineId))
    .orderBy(desc(priceSnapshots.fetchedAt))
    .all();

  return NextResponse.json(history);
}
