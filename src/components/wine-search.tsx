"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Wine } from "@/lib/db/schema";

interface WineSearchProps {
  onSelect: (wine: Wine) => void;
  placeholder?: string;
}

export function WineSearch({
  onSelect,
  placeholder = "Search wines by producer, name, appellation...",
}: WineSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Wine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/wines?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const classificationColor = (classification: string) => {
    switch (classification) {
      case "Grand Cru":
        return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800";
      case "Premier Cru":
        return "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-800";
      case "Village":
        return "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-800/30 dark:border-gray-700";
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 h-12 text-base"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((wine) => (
            <button
              key={wine.id}
              className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-0"
              onClick={() => {
                onSelect(wine);
                setQuery("");
                setIsOpen(false);
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {wine.producer}
                  </p>
                  <p className="text-foreground text-sm">{wine.wineName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {wine.appellation} &middot; {wine.commune}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${classificationColor(
                    wine.classification
                  )}`}
                >
                  {wine.classification}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          No wines found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
