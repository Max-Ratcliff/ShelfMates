import { useState, useEffect } from "react";
import { Scan } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Item } from "./ItemCard";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { addItem, updateItem, Item as FirestoreItem } from "@/services/itemService";
import { BarcodeScanner } from "./BarcodeScanner";
import { ProductInfo } from "@/services/barcodeService";

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
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ProductInfo | null>(null);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [expiryMessage, setExpiryMessage] = useState<string>('');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setQuantity(editItem.quantity);
      setExpiryDate(editItem.expiryDate);
      setIsCommunal(editItem.isCommunal);
      setEmoji(editItem.emoji || "");
      setExpiryMessage("");
    } else {
      setName("");
      setQuantity(1);
      setExpiryDate("");
      setIsCommunal(true);
      setEmoji("");
      setExpiryMessage("");
    }
  }, [editItem, isOpen]);

  const handleProductFound = (productData: {
    name: string;
    emoji: string;
    expiryDate: string;
    expiryMessage?: string;
    expiryConfidence?: 'high' | 'medium' | 'low' | 'none';
    productInfo: ProductInfo;
  }) => {
    setName(productData.name);
    setEmoji(productData.emoji);
    setExpiryDate(productData.expiryDate);
    setExpiryMessage(productData.expiryMessage || '');
    setScannedProduct(productData.productInfo);
    setShowScanner(false);

    // Show appropriate toast based on expiry detection confidence
    if (productData.expiryConfidence === 'none' || !productData.expiryDate) {
      toast.success(`Found: ${productData.name}`, {
        description: productData.expiryMessage || 'Please enter expiry date manually',
        duration: 7000,
      });
    } else if (productData.expiryConfidence === 'medium' || productData.expiryConfidence === 'low') {
      toast.success(`Found: ${productData.name}`, {
        description: productData.expiryMessage || 'Expiry date estimated - please verify',
        duration: 6000,
      });
    } else {
      toast.success(`Found: ${productData.name}`, {
        description: 'Review the details and click "Add Item" to save',
        duration: 5000,
      });
    }
  };

  const saveItem = async () => {
    setSaving(true);

    try {
      // Build item data, excluding undefined fields
      const itemData: any = {
        name: name.trim(),
        quantity,
        // only include expiryDate if user provided one
        ...(expiryDate ? { expiryDate } : {}),
        isCommunal,
        isGrocery: false,
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

    // Check if expiry date is blank (and not editing an existing item)
    if (!expiryDate && !editItem) {
      setShowExpiryWarning(true);
      return;
    }

    await saveItem();
  };

  const handleConfirmNoExpiry = async () => {
    setShowExpiryWarning(false);
    await saveItem();
  };

  return (
    <>
      {showScanner && (
        <BarcodeScanner
          onProductFound={handleProductFound}
          onClose={() => setShowScanner(false)}
        />
      )}

      <Dialog open={isOpen && !showScanner} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>{editItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                  <DialogDescription>
                    {editItem
                      ? "Update the details of your food item"
                      : "Add a new item to your shelf"}
                  </DialogDescription>
                </div>
                {!editItem && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScanner(true)}
                    className="gap-2"
                  >
                    <Scan className="h-4 w-4" />
                    Scan
                  </Button>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {scannedProduct && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    ✓ Product scanned successfully
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Review the details below and adjust if needed
                  </p>
                </div>
              )}

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
              <Label htmlFor="expiry">Expiry Date (Optional)</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="Check package for 'Best By' date"
              />
              {expiryMessage ? (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-2">
                  <p className="text-xs text-amber-900 dark:text-amber-100">
                    ℹ️ {expiryMessage}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Look for "Best By", "Use By", or "Expiration" date on the package
                </p>
              )}
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

    {/* Confirmation dialog for items without expiry date */}
    <AlertDialog open={showExpiryWarning} onOpenChange={setShowExpiryWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>No expiration date?</AlertDialogTitle>
          <AlertDialogDescription>
            Items without expiration dates will appear in "Expiring Soon" to help you keep track of them.
            <br /><br />
            Are you sure you want to continue without adding an expiration date?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Go Back</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmNoExpiry}>
            Continue Without Date
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
