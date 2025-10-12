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
import { createExpense, getExpensesByItem, updateExpense, deleteExpense } from "@/services/expenseService";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  // isCommunal is derived from participants: if more than one participant, item is communal
  const [isCommunal, setIsCommunal] = useState(true);
  const [emoji, setEmoji] = useState("");
  const [price, setPrice] = useState(""); // in dollars as string
  const [participants, setParticipants] = useState<string[]>([]);
  const [householdMembers, setHouseholdMembers] = useState<Array<{id:string; name:string}>>([]);
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
      setPrice("");
      setParticipants([]);
    }
  }, [editItem, isOpen]);

  // Fetch household members for participant picker. Initialize participants only when empty
  useEffect(() => {
    const fetchMembers = async () => {
      if (!householdId) return;
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("household_id", "==", householdId));
        const querySnapshot = await getDocs(q);
        const members = querySnapshot.docs.map((d) => ({ id: d.id, name: (d.data() as any).name || 'User' }));
        setHouseholdMembers(members);
        // Only initialize participants if the user hasn't made a selection yet
        setParticipants((prev) => (prev.length === 0 ? members.map((m) => m.id) : prev));
      } catch (error) {
        console.error('Error loading household members', error);
      }
    };

    fetchMembers();
  }, [householdId]);

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

      // helper to compute integer-cent split entries and ensure sums match
      const computeEntries = (totalCents: number, participantsList: string[]) => {
        if (!participantsList || participantsList.length === 0) return [];
        const share = Math.floor(totalCents / participantsList.length);
        const remainder = totalCents - share * participantsList.length;
        return participantsList.map((uid, idx) => ({ userId: uid, amountCents: share + (idx === 0 ? remainder : 0), settledCents: 0 }));
      };

      if (editItem) {
        await updateItem(editItem.id, itemData);
        toast.success("Item updated successfully");

        // Find any existing expense linked to this item
        try {
          const existing = await getExpensesByItem(householdId, editItem.id);
          const totalCents = price && parseFloat(price) > 0 ? Math.round(parseFloat(price) * 100) : 0;
          const participantsList = participants.length ? participants : [currentUser.uid];

          if (totalCents > 0) {
            if (participantsList.length === 0) {
              toast.error('No participants selected for expense');
            } else {
              const entries = computeEntries(totalCents, participantsList);

              if (existing.length > 0) {
                // update the first existing expense (assume one-to-one)
                try {
                  await updateExpense(householdId, existing[0].id, {
                    totalCents,
                    participants: participantsList,
                    entries,
                    method: 'equal',
                    payerId: currentUser.uid,
                    createdBy: existing[0].createdBy || currentUser.uid,
                    itemId: editItem.id,
                  } as any);
                  toast.success('Expense updated');
                } catch (err: any) {
                  console.error('Failed to update expense', err);
                  toast.error(`Failed to update expense: ${err?.message || err}`);
                }
              } else {
                try {
                  await createExpense({
                    householdId,
                    createdBy: currentUser.uid,
                    payerId: currentUser.uid,
                    totalCents,
                    participants: participantsList,
                    method: 'equal',
                    entries,
                    itemId: editItem.id,
                  });
                  toast.success('Expense created');
                } catch (err: any) {
                  console.error('Failed to create expense for updated item', err);
                  toast.error(`Failed to create expense: ${err?.message || err}`);
                }
              }
            }
          } else {
            // price removed or zero: delete any existing expense for this item
            for (const ex of existing) {
              try {
                await deleteExpense(householdId, ex.id);
              } catch (err: any) {
                console.error('Failed to delete expense', err);
                toast.error(`Failed to delete expense: ${err?.message || err}`);
              }
            }
          }
        } catch (err) {
          console.error('Error updating/creating linked expense', err);
        }
      } else {
        // Create the item and capture its id so we can link any expense to it
        const newItemId = await addItem(itemData);
        toast.success("Item added successfully");

        // Create expense if a price was entered
        if (price && parseFloat(price) > 0) {
          const totalCents = Math.round(parseFloat(price) * 100);
          const participantsList = participants.length ? participants : [currentUser.uid];
          if (participantsList.length === 0) {
            toast.error('No participants selected for expense');
          } else {
            const entries = computeEntries(totalCents, participantsList);
            try {
              const expenseId = await createExpense({
                householdId,
                createdBy: currentUser.uid,
                payerId: currentUser.uid,
                totalCents,
                participants: participantsList,
                method: 'equal',
                entries,
                note: name.trim(), // Use the item name as the expense note
                itemId: newItemId,
              });
              toast.success("Expense created");
            } catch (e: any) {
              console.error('Failed to create expense for item', e);
              toast.error(`Failed to create expense: ${e?.message || e}`);
            }
          }
        }
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

  // derive communal flag from participants selection
  useEffect(() => {
    setIsCommunal(participants.length > 1);
  }, [participants]);

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

            {/* Communal toggle removed — communal is derived from participants selection */}

            {/* Price input */}
            <div className="space-y-2">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="e.g., 4.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Enter a price to automatically create an expense split when saving.</p>
            </div>

            {/* Participant picker */}
            <div className="space-y-2">
              <Label>Split With</Label>
              <p className="text-sm text-muted-foreground">Choose which household members share the cost of this item.</p>

              <div className="mt-2 flex flex-col gap-2 max-h-40 overflow-y-auto p-2 rounded-md border border-border">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={participants.length > 0 && participants.length === householdMembers.length}
                    onChange={(e) => {
                      const checked = (e.target as HTMLInputElement).checked;
                      if (!checked) {
                        // explicitly clear all participants
                        setParticipants([]);
                      } else {
                        setParticipants(householdMembers.map(m => m.id));
                      }
                    }}
                  />
                  <span className="select-none">All household members</span>
                </label>

                {householdMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No household members found</p>
                ) : (
                  householdMembers.map((m) => (
                    <label key={m.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={participants.includes(m.id)}
                        onChange={() => {
                          if (participants.includes(m.id)) {
                            setParticipants(participants.filter((id) => id !== m.id));
                          } else {
                            setParticipants([...participants, m.id]);
                          }
                        }}
                      />
                      <span className="select-none">{m.name}{m.id === currentUser?.uid ? ' (You)' : ''}</span>
                    </label>
                  ))
                )}
              </div>
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
