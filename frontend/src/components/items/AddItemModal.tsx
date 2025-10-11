import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Item } from "./ItemCard";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { addItem, updateItem, Item as FirestoreItem } from "@/services/itemService";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (item: Omit<Item, "id">) => void;
  editItem?: FirestoreItem | null;
}

const commonEmojis = [
  "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍑", "🥭",
  "🥥", "🥝", "🍅", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕",
  "🥔", "🍠", "🧄", "🧅", "🥜", "🫘", "🍞", "🥐", "🥖", "🥨",
  "🥯", "🧀", "🥚", "🍳", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭",
  "🍔", "🍟", "🍕", "🥪", "🥙", "🌮", "🌯", "🫔", "🥗", "🍝",
  "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🍤", "🍙", "🍚", "🍘",
  "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩",
  "🥛", "🍼", "☕", "🫖", "🧃", "🥤", "🧋", "🍷", "🍺", "🧊"
];

export function AddItemModal({ isOpen, onClose, onSave, editItem }: AddItemModalProps) {
  const { currentUser } = useAuth();
  const { householdId, userData } = useHousehold();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [expiryDate, setExpiryDate] = useState("");
  const [isCommunal, setIsCommunal] = useState(true);
  const [emoji, setEmoji] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setQuantity(editItem.quantity);
      setExpiryDate(editItem.expiryDate);
      setIsCommunal(editItem.isCommunal);
      setEmoji(editItem.emoji || "");
    } else {
      setName("");
      setQuantity(1);
      setExpiryDate("");
      setIsCommunal(true);
      setEmoji("");
    }
  }, [editItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    if (!currentUser || !householdId) {
      toast.error("You must be logged in and part of a household");
      return;
    }

    setSaving(true);

    try {
      // Build item data, excluding undefined fields
      const itemData: any = {
        name: name.trim(),
        quantity,
        // only include expiryDate if user provided one
        ...(expiryDate ? { expiryDate } : {}),
        isCommunal,
        ownerId: currentUser.uid,
        householdId,
      };

      // Only add ownerName if it's a personal item
      if (!isCommunal) {
        itemData.ownerName = userData?.name || "You";
      }

      // Only add emoji if one was selected
      if (emoji) {
        itemData.emoji = emoji;
      }

      if (editItem) {
        await updateItem(editItem.id, itemData);
        toast.success("Item updated successfully");
      } else {
        await addItem(itemData);
        toast.success("Item added successfully");
      }

      // Call onSave if provided (for backwards compatibility)
      onSave?.(itemData);

      onClose();
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error(editItem ? "Failed to update item" : "Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            <DialogDescription>
              {editItem
                ? "Update the details of your food item"
                : "Add a new item to your shelf"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji (Optional)</Label>
              <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md bg-muted/30 max-h-32 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setEmoji("")}
                  className={`w-10 h-10 flex items-center justify-center rounded-md border-2 transition-all hover:scale-110 ${
                    emoji === "" ? "border-primary bg-primary/10" : "border-transparent hover:border-border"
                  }`}
                  aria-label="No emoji"
                >
                  <span className="text-muted-foreground text-xs">None</span>
                </button>
                {commonEmojis.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-10 h-10 flex items-center justify-center text-2xl rounded-md border-2 transition-all hover:scale-110 ${
                      emoji === e ? "border-primary bg-primary/10" : "border-transparent hover:border-border"
                    }`}
                    aria-label={`Select ${e} emoji`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                placeholder="e.g., Milk, Bread, Eggs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                // expiry is optional
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="communal" className="cursor-pointer">
                  Communal Item
                </Label>
                <p className="text-sm text-muted-foreground">
                  Available to all household members
                </p>
              </div>
              <Switch
                id="communal"
                checked={isCommunal}
                onCheckedChange={setIsCommunal}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editItem ? "Update Item" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
