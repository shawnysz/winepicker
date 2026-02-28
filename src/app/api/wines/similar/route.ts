import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wines, priceSnapshots } from "@/lib/db/schema";
import { eq, and, ne, or, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wineId = searchParams.get("wineId");

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

  // Find wines from same appellation or commune, excluding the current wine
  const similar = db
    .select()
    .from(wines)
    .where(
      and(
        ne(wines.id, wine.id),
        or(
          eq(wines.appellation, wine.appellation),
          eq(wines.commune, wine.commune)
        )
      )
    )
    .limit(6)
    .all();

  // Enrich with latest price
  const enriched = similar.map((w) => {
    const latestPrice = db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.wineId, w.id))
      .orderBy(desc(priceSnapshots.fetchedAt))
      .limit(1)
      .get();
    return { ...w, latestPrice: latestPrice || null };
  });

  return NextResponse.json(enriched);
}
