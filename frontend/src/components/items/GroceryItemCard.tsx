import { useState } from "react";
import { User, Users, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { updateItem } from "@/services/itemService";
import { toast } from "sonner";
import { formatNameWithInitial } from "@/lib/nameUtils";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useAuth } from "@/contexts/AuthContext";
import { createExpense } from "@/services/expenseService";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Item {
  id: string;
  name: string;
  quantity: number;
  isCommunal: boolean;
  ownerName?: string;
  emoji?: string;
}

interface GroceryItemCardProps {
  item: Item;
  onEdit?: (item: Item) => void;
  onDelete?: (id: string) => void;
}

export function GroceryItemCard({ item, onEdit, onDelete }: GroceryItemCardProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [price, setPrice] = useState("");
  const { householdId } = useHousehold();
  const { currentUser } = useAuth();

  const handleContinue = async () => {
    if (!expiryDate) {
      toast.error("Please enter an expiry date");
      return;
    }
    if (!price) {
      toast.error("Please enter the price");
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (!householdId || !currentUser) {
      toast.error("Missing household or user information");
      return;
    }

    try {
      // Fetch household members
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("household_id", "==", householdId));
      const querySnapshot = await getDocs(q);

      const memberIds = querySnapshot.docs.map(doc => doc.id);

      if (memberIds.length === 0) {
        toast.error("No household members found");
        return;
      }

      // Create expense with equal split
      const totalCents = Math.round(priceNumber * 100);
      const sharePerPerson = Math.floor(totalCents / memberIds.length);
      const remainder = totalCents - (sharePerPerson * memberIds.length);

      const entries = memberIds.map((memberId, index) => ({
        userId: memberId,
        amountCents: sharePerPerson + (index === 0 ? remainder : 0),
        settledCents: 0
      }));

      // Current user is the payer (they bought it)
      await createExpense({
        householdId,
        createdBy: currentUser.uid,
        payerId: currentUser.uid,
        totalCents,
        note: item.name,
        entries,
        participants: memberIds
      });

      // Update the item to move it to shelf
      await updateItem(item.id, {
        expiryDate,
        isGrocery: false
      });

      toast.success("Item moved to shelf and expense created!");
      setPrice(""); // Reset price
      setExpiryDate(""); // Reset expiry date
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to complete action");
    }
  };

  return (
    <Card className={cn("group transition-all hover:shadow-md", isChecked && "bg-muted/50")}>
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Checkbox checked={isChecked} onCheckedChange={() => setIsChecked(!isChecked)} className="mt-1" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Did you buy this item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Great! Let's add the details so we can track it and split the cost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="price" className="text-sm font-medium">Price ($)</label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      💰 The cost will be split equally among all household members
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="expiry-date" className="text-sm font-medium">Expiry Date</label>
                    <Input
                      id="expiry-date"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="Check package for expiry date"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Look for "Best By", "Use By", or "Expiration" date on the package
                    </p>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setPrice("");
                    setExpiryDate("");
                    setIsChecked(false);
                  }}>Not Yet</AlertDialogCancel>
                  <AlertDialogAction onClick={handleContinue}>Add to Shelf</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className={cn("flex-1 space-y-2", isChecked && "line-through text-muted-foreground")}>
              <div className="flex items-start gap-2 pr-2">
                {item.emoji && (
                  <span className="text-2xl shrink-0" aria-label="Item emoji">
                    {item.emoji}
                  </span>
                )}
                <h3 className="font-semibold text-foreground line-clamp-2 break-words">{item.name}</h3>
              </div>

              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 bg-card/95 backdrop-blur-sm rounded-md p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary touch-manipulation"
                  onClick={() => onEdit?.(item)}
                  aria-label="Edit item"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive touch-manipulation"
                  onClick={() => onDelete?.(item.id)}
                  aria-label="Delete item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Qty: {item.quantity}</span>
              </div>

              <div className="flex items-center gap-2">
                {item.isCommunal ? (
                  <Badge variant="outline" className="gap-1 text-xs whitespace-nowrap">
                    <Users className="h-3 w-3 shrink-0" />
                    Communal
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs whitespace-nowrap">
                    <User className="h-3 w-3 shrink-0" />
                    {item.ownerName ? formatNameWithInitial(item.ownerName) : "Personal"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
