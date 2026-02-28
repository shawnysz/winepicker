"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wine } from "@/lib/db/schema";

interface AddToCellarDialogProps {
  wine: Wine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
}

export function AddToCellarDialog({
  wine,
  open,
  onOpenChange,
  onAdd,
}: AddToCellarDialogProps) {
  const [vintage, setVintage] = useState(new Date().getFullYear() - 3);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wine) return;

    setSaving(true);
    try {
      const res = await fetch("/api/cellar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wineId: wine.id,
          vintage,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
          purchaseDate: new Date().toISOString().split("T")[0],
          quantity,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        onAdd();
        onOpenChange(false);
        setVintage(new Date().getFullYear() - 3);
        setPurchasePrice("");
        setQuantity(1);
        setNotes("");
      }
    } catch (error) {
      console.error("Failed to add to cellar:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!wine) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Cellar</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <p className="font-medium">{wine.wineName}</p>
          <p className="text-sm text-muted-foreground">{wine.producer}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vintage">Vintage</Label>
              <Input
                id="vintage"
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                value={vintage}
                onChange={(e) => setVintage(parseInt(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Purchase Price (USD per bottle)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g., 250"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Tasting notes, purchase source, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add to Cellar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
