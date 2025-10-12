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
  expiryDate?: string;
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
  const getExpiryStatus = (date?: string) => {
    if (!date) return { label: "No expiry date", color: "orange" };
    const expiry = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Expired", color: "gray" };
    if (diffDays <= 2) return { label: "Urgent", color: "red" };
    if (diffDays <= 5) return { label: "Use soon", color: "orange" };
    if (diffDays <= 7) return { label: "Good to Go", color: "yellow" };
    return { label: "Fresh", color: "green" };
  };

  const status = getExpiryStatus(item.expiryDate);

  const displayDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : "No expiry";

  return (
    <Card className="group transition-all hover:shadow-md">
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-2 pr-2">
              {item.emoji && (
                <span className="text-2xl shrink-0 mt-[2px]" aria-label="Item emoji">
                  {item.emoji}
                </span>
              )}
              <h3 className="font-semibold text-foreground line-clamp-2 break-words leading-snug flex-1 min-w-0">{item.name}</h3>
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
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {displayDate}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs font-medium",
                  status.color === "gray" && "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30",
                  status.color === "red" && "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
                  status.color === "orange" && "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
                  status.color === "yellow" && "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
                  status.color === "green" && "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
                  status.color === "orange" && "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30"
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
