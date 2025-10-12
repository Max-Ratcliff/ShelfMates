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

  const handleContinue = async () => {
    if (!expiryDate) {
      toast.error("Please enter an expiry date");
      return;
    }
    try {
      await updateItem(item.id, { expiryDate });
      toast.success("Item moved to shelf!");
    } catch (error) {
      toast.error("Failed to move item to shelf");
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
                  <AlertDialogTitle>Move Item to Shelf</AlertDialogTitle>
                  <AlertDialogDescription>
                    To move this item to your shelf, please enter an expiry date.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <label htmlFor="expiry-date">Expiry Date</label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleContinue}>Continue</AlertDialogAction>
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

              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 bg-card/95 backdrop-blur-sm rounded-md">
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
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Users className="h-3 w-3" />
                    Communal
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <User className="h-3 w-3" />
                    {item.ownerName || "Personal"}
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
