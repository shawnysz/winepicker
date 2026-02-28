"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CellarItem {
  id: number;
  vintage: number;
  purchasePrice: number | null;
  quantity: number;
  notes: string | null;
  rating: number | null;
  tastingNotes: string | null;
  wine: { wineName: string; producer: string };
}

interface EditCellarItemDialogProps {
  item: CellarItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function EditCellarItemDialog({
  item,
  open,
  onOpenChange,
  onSave,
}: EditCellarItemDialogProps) {
  const [rating, setRating] = useState<string>("");
  const [tastingNotes, setTastingNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [saving, setSaving] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && item) {
      setRating(item.rating?.toString() || "");
      setTastingNotes(item.tastingNotes || "");
      setQuantity(item.quantity);
      setPurchasePrice(item.purchasePrice?.toString() || "");
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    try {
      const ratingNum = rating ? parseInt(rating) : null;
      await fetch("/api/cellar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          rating: ratingNum,
          tastingNotes: tastingNotes || null,
          quantity,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        }),
      });
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Wine</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {item.wine.producer} — {item.wine.wineName} ({item.vintage})
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Purchase Price</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="$"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-rating">Rating (1-100)</Label>
            <Input
              id="edit-rating"
              type="number"
              min={1}
              max={100}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="e.g. 92"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-tasting-notes">Tasting Notes</Label>
            <Textarea
              id="edit-tasting-notes"
              value={tastingNotes}
              onChange={(e) => setTastingNotes(e.target.value)}
              placeholder="Aromas, flavors, structure..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
