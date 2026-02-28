"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScanResult {
  producer: string | null;
  wineName: string | null;
  vintage: number | null;
  appellation: string | null;
  classification: string | null;
  confidence: number;
  rawText: string;
}

interface LabelScannerProps {
  onResult: (result: ScanResult) => void;
}

export function LabelScanner({ onResult }: LabelScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload and scan
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to scan label");
      }

      const result = await response.json();
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan label");
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
          Scan Wine Label
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!preview ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
          >
            <svg className="mx-auto h-12 w-12 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <p className="mt-2 text-sm text-muted-foreground">
              Take a photo or upload an image of a wine label
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, or WebP
            </p>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Wine label preview"
                className="w-full max-h-64 object-contain"
              />
              {scanning && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm font-medium">Analyzing label...</p>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreview(null);
                setError(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Try another photo
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
