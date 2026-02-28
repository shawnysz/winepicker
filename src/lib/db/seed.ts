import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "winepicker.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

// Run migrations
migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

// Load seed data
const seedDataPath = path.join(process.cwd(), "src/data/burgundy-wines.json");
const seedData = JSON.parse(fs.readFileSync(seedDataPath, "utf-8"));

// Clear existing data
sqlite.exec("DELETE FROM cellar_items");
sqlite.exec("DELETE FROM price_snapshots");
sqlite.exec("DELETE FROM wines");

// Vintage multipliers — older vintages of fine Burgundy tend to cost more
// Great vintages get a bump, weaker ones a discount
const vintageData: Record<number, { mult: number; quality: string }> = {
  2005: { mult: 1.60, quality: "exceptional" },
  2009: { mult: 1.45, quality: "exceptional" },
  2010: { mult: 1.50, quality: "exceptional" },
  2012: { mult: 1.25, quality: "great" },
  2014: { mult: 1.10, quality: "good" },
  2015: { mult: 1.30, quality: "great" },
  2016: { mult: 1.20, quality: "great" },
  2017: { mult: 1.05, quality: "good" },
  2018: { mult: 1.15, quality: "great" },
  2019: { mult: 1.20, quality: "great" },
  2020: { mult: 1.10, quality: "great" },
  2021: { mult: 0.95, quality: "good" },
  2022: { mult: 1.00, quality: "great" },
  2023: { mult: 0.90, quality: "good" },
};

// Historical price snapshots — simulate market movement over time
// Burgundy has appreciated significantly over the past few years
const snapshotDates = [
  { date: "2023-06-15", marketMult: 0.85 },
  { date: "2024-01-10", marketMult: 0.90 },
  { date: "2024-06-20", marketMult: 0.95 },
  { date: "2025-01-15", marketMult: 0.97 },
  { date: "2025-07-01", marketMult: 1.00 },
  { date: "2026-01-10", marketMult: 1.02 },
  { date: "2026-02-25", marketMult: 1.00 }, // current
];

// Add slight random jitter to prices (deterministic based on wineId + vintage + date)
function jitter(seed: number): number {
  // Simple hash-based pseudo-random in range [-0.03, +0.03]
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return ((x - Math.floor(x)) - 0.5) * 0.06;
}

let wineCount = 0;
let priceCount = 0;

for (const producerEntry of seedData) {
  for (const wine of producerEntry.wines) {
    const inserted = db
      .insert(schema.wines)
      .values({
        producer: producerEntry.producer,
        wineName: wine.wine_name,
        appellation: wine.appellation,
        classification: wine.classification,
        region: wine.region,
        commune: wine.commune,
        vineyard: wine.vineyard,
        color: wine.color,
      })
      .returning()
      .get();
    wineCount++;

    if (!wine.avg_price) continue;

    // For each vintage x snapshot date, create a price record
    for (const [vintage, vInfo] of Object.entries(vintageData)) {
      const vintageNum = parseInt(vintage);

      for (let si = 0; si < snapshotDates.length; si++) {
        const snap = snapshotDates[si];

        // Don't create price snapshots for vintages that haven't been released yet
        // Most Burgundy released ~2 years after vintage
        const releaseYear = vintageNum + 2;
        const snapYear = parseInt(snap.date.split("-")[0]);
        if (snapYear < releaseYear) continue;

        const seed = inserted.id * 1000 + vintageNum * 10 + si;
        const noise = 1 + jitter(seed);
        const totalMult = vInfo.mult * snap.marketMult * noise;

        const avg = Math.round(wine.avg_price * totalMult);
        const min = Math.round(wine.min_price * totalMult);
        const max = Math.round(wine.max_price * totalMult);

        db.insert(schema.priceSnapshots)
          .values({
            wineId: inserted.id,
            vintage: vintageNum,
            avgPrice: avg,
            minPrice: min,
            maxPrice: max,
            currency: "USD",
            source: "wine-searcher",
            fetchedAt: snap.date + "T12:00:00.000Z",
          })
          .run();
        priceCount++;
      }
    }
  }
}

console.log(
  `Seeded ${wineCount} wines from ${seedData.length} producers with ${priceCount} price snapshots.`
);
sqlite.close();
