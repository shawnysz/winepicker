CREATE TABLE `cellar_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wine_id` integer NOT NULL,
	`vintage` integer NOT NULL,
	`purchase_price` real,
	`purchase_date` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`notes` text,
	`status` text DEFAULT 'in_cellar' NOT NULL,
	FOREIGN KEY (`wine_id`) REFERENCES `wines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `price_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wine_id` integer NOT NULL,
	`vintage` integer NOT NULL,
	`avg_price` real,
	`min_price` real,
	`max_price` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`source` text DEFAULT 'wine-searcher' NOT NULL,
	`fetched_at` text NOT NULL,
	FOREIGN KEY (`wine_id`) REFERENCES `wines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producer` text NOT NULL,
	`wine_name` text NOT NULL,
	`appellation` text NOT NULL,
	`classification` text NOT NULL,
	`region` text NOT NULL,
	`commune` text NOT NULL,
	`vineyard` text,
	`color` text NOT NULL
);
