import { useState } from "react";
import { Plus, Scan } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ItemCard, Item as ItemCardType } from "@/components/items/ItemCard";
import { GroceryItemCard } from "@/components/items/GroceryItemCard";
import { AddItemModal } from "@/components/items/AddItemModal";
import { AddGroceryItemModal } from "@/components/items/AddGroceryItemModal";
import { BarcodeScanner } from "@/components/items/BarcodeScanner";
import { ProductInfo } from "@/services/barcodeService";
import { toast } from "sonner";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useAuth } from "@/contexts/AuthContext";
import { useItems, useFilteredItems } from "@/hooks/useItems";
import { deleteItem as deleteItemService, Item } from "@/services/itemService";

export default function Dashboard() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { householdId } = useHousehold();
  const { items, loading } = useItems(householdId);
  const { personalItems, communalItems, expiringItems, expiredItems, groceryItems } = useFilteredItems(
    items,
    currentUser?.uid || ''
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);

  // Determine which view to show based on route
  const currentView = location.pathname.split('/')[1] || 'dashboard';

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
    case 'groceries':
      displayItems = groceryItems;
      pageTitle = "Grocery List";
      pageDescription = "Items that need to be bought for your household";
      emptyMessage = "No grocery items yet. Shelf is fully stocked!";
      break; 
    default:
      displayItems = personalItems;
      pageTitle = "My Shelf";
      pageDescription = "Your personal food inventory";
      emptyMessage = "No personal items yet. Add your first item!";
  }

  const handleSaveItem = () => {
    // This will be handled by AddItemModal now
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleEditItem = (item: ItemCardType) => {
    setEditingItem(item as Item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItemService(id);
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleProductFound = (productData: any) => {
    setScannedData(productData);
    setShowScanner(false);
    setIsModalOpen(true);
  };

  const EmptyState = ({ message }: { message: string }) => (
    <button
      onClick={() => {
        setEditingItem(null);
        setIsModalOpen(true);
      }}
      className="w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-12 text-center hover:bg-muted/30 hover:border-primary/50 transition-colors cursor-pointer"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Plus className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </button>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading items...</p>
        </div>
      </div>
    );
  }

  // Show message if no household
  if (!householdId) {
    return (
      <div className="container mx-auto p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">You need to join a household first.</p>
          <Button onClick={() => window.location.href = '/join'}>Join Household</Button>
        </div>
      </div>
    );
  }

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
              currentView === 'groceries' ? (
                <GroceryItemCard
                  key={item.id}
                  item={item as ItemCardType}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              ) : (
                <ItemCard
                  key={item.id}
                  item={item as ItemCardType}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              )
            ))}
          </div>
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>

              {/* Expired Items Section - Hide on grocery list */}
        {currentView !== 'groceries' && expiredItems && expiredItems.length > 0 && (
          <div className="mt-10 space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Items to Toss</h2>
            <p className="text-sm text-muted-foreground mb-4">
              These items have already expired.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {expiredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item as ItemCardType}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          </div>
        )}


      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col items-center gap-3">
        {/* Scan Button */}
        {currentView !== 'groceries' && (
          <Button
            size="lg"
            variant="secondary"
            className="h-14 w-14 rounded-full shadow-lg touch-manipulation p-0"
            onClick={() => setShowScanner(true)}
            aria-label="Scan barcode"
          >
            <Scan className="h-6 w-6" />
          </Button>
        )}

        {/* Add Button */}
        <Button
          size="lg"
          className="h-16 w-16 rounded-full shadow-lg touch-manipulation p-0"
          onClick={() => {
            setEditingItem(null);
            setScannedData(null);
            setIsModalOpen(true);
          }}
          aria-label="Add new item"
        >
          <Plus className="h-7 w-7" />
        </Button>
      </div>

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onProductFound={handleProductFound}
          onClose={() => setShowScanner(false)}
        />
      )}

      {currentView === 'groceries' ? (
        <AddGroceryItemModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
            setScannedData(null);
          }}
          onSave={handleSaveItem}
          editItem={editingItem}
        />
      ) : (
        <AddItemModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
            setScannedData(null);
          }}
          onSave={handleSaveItem}
          editItem={editingItem}
          initialData={scannedData}
        />
      )}
    </div>
  );
}
