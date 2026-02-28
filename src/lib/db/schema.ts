import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const wines = sqliteTable("wines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  producer: text("producer").notNull(),
  wineName: text("wine_name").notNull(),
  appellation: text("appellation").notNull(),
  classification: text("classification").notNull(), // Grand Cru, Premier Cru, Village, Regional
  region: text("region").notNull(), // Côte de Nuits, Côte de Beaune, Chablis, etc.
  commune: text("commune").notNull(),
  vineyard: text("vineyard"),
  color: text("color").notNull(), // red, white
});

export const priceSnapshots = sqliteTable("price_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineId: integer("wine_id")
    .notNull()
    .references(() => wines.id),
  vintage: integer("vintage").notNull(),
  avgPrice: real("avg_price"),
  minPrice: real("min_price"),
  maxPrice: real("max_price"),
  currency: text("currency").notNull().default("USD"),
  source: text("source").notNull().default("wine-searcher"),
  fetchedAt: text("fetched_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const cellarItems = sqliteTable("cellar_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineId: integer("wine_id")
    .notNull()
    .references(() => wines.id),
  vintage: integer("vintage").notNull(),
  purchasePrice: real("purchase_price"),
  purchaseDate: text("purchase_date"),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
  status: text("status").notNull().default("in_cellar"), // in_cellar, consumed, sold
  rating: integer("rating"), // 1-100
  tastingNotes: text("tasting_notes"),
});

export type Wine = typeof wines.$inferSelect;
export type NewWine = typeof wines.$inferInsert;
export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type NewPriceSnapshot = typeof priceSnapshots.$inferInsert;
export type CellarItem = typeof cellarItems.$inferSelect;
export type NewCellarItem = typeof cellarItems.$inferInsert;
