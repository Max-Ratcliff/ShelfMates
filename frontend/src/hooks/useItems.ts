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
    (item) => !item.isCommunal && item.ownerId === userId
  );

  const communalItems = items.filter((item) => item.isCommunal);

  const expiringItems = items.filter((item) => {
    // Include items without expiry date to keep users aware
    if (!item.expiryDate) return true;

    const expiry = new Date(item.expiryDate);
    const today = new Date();
    const diffDays = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 7 && diffDays >= 0; // Items expiring within a week
  });

  const expiredItems = items.filter((item) => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    const today = new Date();
    return expiry < today;
  });

  return {
    personalItems,
    communalItems,
    expiringItems,
    expiredItems,
  };
};
