import { useState } from "react";
import { Calendar, User, Users, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Item {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string;
  isCommunal: boolean;
  ownerName?: string;
  emoji?: string;
}

interface ItemCardProps {
  item: Item;
  onEdit?: (item: Item) => void;
  onDelete?: (id: string) => void;
}

export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const getExpiryStatus = (date: string) => {
    const expiry = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Expired", color: "red" };
    if (diffDays <= 2) return { label: "Urgent", color: "red" };
    if (diffDays <= 5) return { label: "Expires soon", color: "yellow" };
    if (diffDays <= 7) return { label: "This week", color: "yellow" };
    return { label: "Fresh", color: "green" };
  };

  const status = getExpiryStatus(item.expiryDate);

  return (
    <Card className="group transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {item.emoji && (
                  <span className="text-2xl shrink-0" aria-label="Item emoji">
                    {item.emoji}
                  </span>
                )}
                <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
              </div>

              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 shrink-0">
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
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Qty: {item.quantity}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(item.expiryDate).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs font-medium",
                  status.color === "red" && "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
                  status.color === "yellow" && "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
                  status.color === "green" && "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30"
                )}
              >
                {status.label}
              </Badge>

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
      </CardContent>
    </Card>
  );
}
