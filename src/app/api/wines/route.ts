import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wines, priceSnapshots } from "@/lib/db/schema";
import { like, or, eq, desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const id = searchParams.get("id");
  const ids = searchParams.get("ids");
  const classification = searchParams.get("classification");
  const color = searchParams.get("color");

  if (id) {
    const wine = db
      .select()
      .from(wines)
      .where(eq(wines.id, parseInt(id)))
      .get();

    if (!wine) {
      return NextResponse.json({ error: "Wine not found" }, { status: 404 });
    }

    // Get latest price snapshot
    const latestPrice = db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.wineId, wine.id))
      .orderBy(desc(priceSnapshots.fetchedAt))
      .limit(1)
      .get();

    return NextResponse.json({ ...wine, latestPrice });
  }

  if (ids) {
    const idList = ids.split(",").map((i) => parseInt(i)).filter(Boolean);
    if (idList.length === 0) {
      return NextResponse.json([]);
    }

    const wineList = db
      .select()
      .from(wines)
      .where(inArray(wines.id, idList))
      .all();

    const enrichedList = wineList.map((wine) => {
      // Get all price snapshots for this wine
      const prices = db
        .select()
        .from(priceSnapshots)
        .where(eq(priceSnapshots.wineId, wine.id))
        .orderBy(desc(priceSnapshots.fetchedAt))
        .all();

      // Group by vintage, take latest per vintage
      const pricesByVintage: Record<number, typeof priceSnapshots.$inferSelect> = {};
      prices.forEach((p) => {
        if (!pricesByVintage[p.vintage]) {
          pricesByVintage[p.vintage] = p;
        }
      });

      return {
        ...wine,
        latestPrice: prices[0] || null,
        pricesByVintage,
      };
    });

    return NextResponse.json(enrichedList);
  }

  let query = db.select().from(wines).$dynamic();

  if (q) {
    const searchTerm = `%${q}%`;
    query = query.where(
      or(
        like(wines.producer, searchTerm),
        like(wines.wineName, searchTerm),
        like(wines.appellation, searchTerm),
        like(wines.commune, searchTerm),
        like(wines.vineyard, searchTerm)
      )
    );
  }

  if (classification) {
    query = query.where(eq(wines.classification, classification));
  }

  if (color) {
    query = query.where(eq(wines.color, color));
  }

  const results = query.all();

  // Enrich with latest price for each wine
  const enriched = results.map((wine) => {
    const latestPrice = db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.wineId, wine.id))
      .orderBy(desc(priceSnapshots.fetchedAt))
      .limit(1)
      .get();
    return { ...wine, latestPrice: latestPrice || null };
  });

  return NextResponse.json(enriched);
}
