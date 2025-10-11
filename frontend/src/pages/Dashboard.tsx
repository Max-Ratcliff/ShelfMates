import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [items, setItems] = useState<Item[]>(mockItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const personalItems = items.filter((item) => !item.isCommunal);
  const communalItems = items.filter((item) => item.isCommunal);
  
  const expiringItems = items.filter((item) => {
    const expiry = new Date(item.expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  });

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
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Track and manage your household's food inventory
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="personal">My Shelf</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
          <TabsTrigger value="expiring">Expiring</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          {personalItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {personalItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No personal items yet. Add your first item!" />
          )}
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          {communalItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {communalItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No shared items yet. Add communal items for your household!" />
          )}
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          {expiringItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {expiringItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No items expiring soon. Great job keeping things fresh!" />
          )}
        </TabsContent>
      </Tabs>

      {/* Floating Add Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
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
