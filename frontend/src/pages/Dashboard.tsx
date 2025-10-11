import { useState } from "react";
import { Plus } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ItemCard, Item } from "@/components/items/ItemCard";
import { AddItemModal } from "@/components/items/AddItemModal";
import { toast } from "sonner";

// Mock data - replace with Firebase
const mockItems: Item[] = [
  {
    id: "1",
    name: "Milk",
    quantity: 2,
    expiryDate: "2025-10-15",
    isCommunal: true,
  },
  {
    id: "2",
    name: "Bread",
    quantity: 1,
    expiryDate: "2025-10-13",
    isCommunal: false,
    ownerName: "You",
  },
  {
    id: "3",
    name: "Yogurt",
    quantity: 4,
    expiryDate: "2025-10-12",
    isCommunal: true,
  },
];

export default function Dashboard() {
  const location = useLocation();
  const [items, setItems] = useState<Item[]>(mockItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Determine which view to show based on route
  const currentView = location.pathname.split('/')[1] || 'dashboard';

  const personalItems = items.filter((item) => !item.isCommunal);
  const communalItems = items.filter((item) => item.isCommunal);

  const expiringItems = items.filter((item) => {
    const expiry = new Date(item.expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Show items expiring within a week
  });

  // Determine which items to display and page title
  let displayItems: Item[] = [];
  let pageTitle = "";
  let pageDescription = "";
  let emptyMessage = "";

  switch (currentView) {
    case 'dashboard':
      displayItems = personalItems;
      pageTitle = "My Shelf";
      pageDescription = "Your personal food inventory";
      emptyMessage = "No personal items yet. Add your first item!";
      break;
    case 'shared':
      displayItems = communalItems;
      pageTitle = "Shared Shelf";
      pageDescription = "Items shared with your household";
      emptyMessage = "No shared items yet. Add communal items for your household!";
      break;
    case 'expiring':
      displayItems = expiringItems;
      pageTitle = "Expiring Soon";
      pageDescription = "Items that need attention";
      emptyMessage = "No items expiring soon. Great job keeping things fresh!";
      break;
    default:
      displayItems = personalItems;
      pageTitle = "My Shelf";
      pageDescription = "Your personal food inventory";
      emptyMessage = "No personal items yet. Add your first item!";
  }

  const handleSaveItem = (itemData: Omit<Item, "id">) => {
    if (editingItem) {
      setItems(items.map((item) =>
        item.id === editingItem.id ? { ...itemData, id: item.id } : item
      ));
    } else {
      const newItem: Item = {
        ...itemData,
        id: Date.now().toString(),
      };
      setItems([...items, newItem]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    toast.success("Item deleted successfully");
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Plus className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{pageTitle}</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
          {pageDescription}
        </p>
      </div>

      <div className="space-y-4">
        {displayItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>

      {/* Floating Add Button */}
      <Button
        size="lg"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 rounded-full shadow-lg touch-manipulation"
        onClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        aria-label="Add new item"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editItem={editingItem}
      />
    </div>
  );
}
