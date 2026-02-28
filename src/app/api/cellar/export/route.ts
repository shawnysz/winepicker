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
    .all();

  const rows = items.map(({ cellarItem, wine }) => {
    const latestPrice = db
      .select()
      .from(priceSnapshots)
      .where(
        and(
          eq(priceSnapshots.wineId, wine.id),
          eq(priceSnapshots.vintage, cellarItem.vintage)
        )
      )
      .orderBy(desc(priceSnapshots.fetchedAt))
      .limit(1)
      .get();

    return {
      Producer: wine.producer,
      Wine: wine.wineName,
      Appellation: wine.appellation,
      Classification: wine.classification,
      Region: wine.region,
      Color: wine.color,
      Vintage: cellarItem.vintage,
      Quantity: cellarItem.quantity,
      "Purchase Price": cellarItem.purchasePrice ?? "",
      "Purchase Date": cellarItem.purchaseDate ?? "",
      "Current Price": latestPrice?.avgPrice ?? "",
      Status: cellarItem.status,
      Rating: cellarItem.rating ?? "",
      "Tasting Notes": cellarItem.tastingNotes ?? "",
      Notes: cellarItem.notes ?? "",
    };
  });

  if (rows.length === 0) {
    return new NextResponse("No data to export", { status: 404 });
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h as keyof typeof row]);
          // Escape CSV values containing commas, quotes, or newlines
          if (val.includes(",") || val.includes('"') || val.includes("\n")) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(",")
    ),
  ];

  const csv = csvLines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="winepicker-cellar-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
