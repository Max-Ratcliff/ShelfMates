import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ItemData {
  name: string;
  quantity: number;
  expiryDate?: string;
  isCommunal: boolean;
  isGrocery?: boolean;
  ownerName?: string;
  ownerId: string;
  householdId: string;
  emoji?: string;
  reserved_by?: string | null;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface Item extends ItemData {
  id: string;
}

/**
 * Add a new item to Firestore
 */
export const addItem = async (
  itemData: Omit<ItemData, 'created_at' | 'updated_at'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'items'), {
      ...itemData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
};

/**
 * Update an existing item
 */
export const updateItem = async (
  itemId: string,
  updates: Partial<Omit<ItemData, 'created_at'>>
): Promise<void> => {
  try {
    const itemRef = doc(db, 'items', itemId);
    await updateDoc(itemRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

/**
 * Delete an item
 */
export const deleteItem = async (itemId: string): Promise<void> => {
  try {
    const itemRef = doc(db, 'items', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

/**
 * Get all items for a household (one-time fetch)
 */
export const getItemsByHousehold = async (householdId: string): Promise<Item[]> => {
  try {
    const q = query(
      collection(db, 'items'),
      where('householdId', '==', householdId),
      orderBy('created_at', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Item[];
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for household items
 */
export const subscribeToItems = (
  householdId: string,
  callback: (items: Item[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const q = query(
      collection(db, 'items'),
      where('householdId', '==', householdId),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Item[];
        callback(items);
      },
      (error) => {
        console.error('Error subscribing to items:', error);
        onError?.(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up subscription:', error);
    throw error;
  }
};
