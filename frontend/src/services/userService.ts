import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserData {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  household_id?: string | null;
  joined_at?: Timestamp;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

/**
 * Create or update user document in Firestore
 */
export const createOrUpdateUser = async (
  uid: string,
  userData: Partial<Omit<UserData, 'uid' | 'created_at'>>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        ...userData,
        updated_at: serverTimestamp(),
      });
    } else {
      // Create new user
      await setDoc(userRef, {
        uid,
        ...userData,
        household_id: userData.household_id || null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

/**
 * Get user data from Firestore
 */
export const getUser = async (uid: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Update user's household ID
 */
export const updateUserHousehold = async (
  uid: string,
  householdId: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      household_id: householdId,
      joined_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user household:', error);
    throw error;
  }
};
