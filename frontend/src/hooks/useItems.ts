import { useState, useEffect } from 'react';
import { subscribeToItems, Item } from '@/services/itemService';
import { toast } from 'sonner';

/**
 * Hook to subscribe to real-time item updates for a household
 */
export const useItems = (householdId: string | null | undefined) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!householdId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToItems(
      householdId,
      (updatedItems) => {
        setItems(updatedItems);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        toast.error('Failed to load items. Please refresh the page.');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [householdId]);

  return { items, loading, error };
};

/**
 * Hook to filter items by various criteria
 */
export const useFilteredItems = (items: Item[], userId: string) => {
  const personalItems = items.filter(
    (item) => !item.isCommunal && item.ownerId === userId && !item.isGrocery
  );

  const communalItems = items.filter((item) => item.isCommunal && !item.isGrocery);

  const expiringItems = items.filter((item) => {
    // Exclude grocery items
    if (item.isGrocery) return false;

    // Include items without expiry date to keep users aware
    if (!item.expiryDate) return true;

    // Parse date as local time to avoid timezone issues
    const [year, month, day] = item.expiryDate.split('-').map(Number);
    const expiry = new Date(year, month - 1, day); // month is 0-indexed
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight
    const diffDays = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 7 && diffDays >= 0; // Items expiring within a week
  });

  const expiredItems = items.filter((item) => {
    // Exclude grocery items
    if (item.isGrocery) return false;

    if (!item.expiryDate) return false;

    // Parse date as local time to avoid timezone issues
    const [year, month, day] = item.expiryDate.split('-').map(Number);
    const expiry = new Date(year, month - 1, day); // month is 0-indexed
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    return expiry < today;
  });

  const groceryItems = items.filter((item) => item.isGrocery);

  return {
    personalItems,
    communalItems,
    expiringItems,
    expiredItems,
    groceryItems,
  };
};
