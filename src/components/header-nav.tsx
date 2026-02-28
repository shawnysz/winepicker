"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function HeaderNav() {
  return (
    <header className="border-b bg-card">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-primary">
            WinePicker
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            by SZ
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Search
          </Link>
          <Link
            href="/cellar"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cellar
          </Link>
          <Link
            href="/scan"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Scan
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
