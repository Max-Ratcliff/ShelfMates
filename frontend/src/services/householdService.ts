import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateUserHousehold } from './userService';

export interface HouseholdData {
  household_id: string;
  name: string;
  invite_code: string;
  created_at?: Timestamp;
  created_by?: string;
}

/**
 * Generate a random 6-character invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if invite code already exists
 */
async function inviteCodeExists(code: string): Promise<boolean> {
  const q = query(collection(db, 'households'), where('invite_code', '==', code));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

/**
 * Generate a unique invite code
 */
async function generateUniqueInviteCode(): Promise<string> {
  let code = generateInviteCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (await inviteCodeExists(code) && attempts < maxAttempts) {
    code = generateInviteCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique invite code');
  }

  return code;
}

/**
 * Create a new household
 */
export const createHousehold = async (
  name: string,
  userId: string
): Promise<{ householdId: string; inviteCode: string }> => {
  try {
    const inviteCode = await generateUniqueInviteCode();

    const docRef = await addDoc(collection(db, 'households'), {
      name: name.trim(),
      invite_code: inviteCode,
      created_at: serverTimestamp(),
      created_by: userId,
    });

    // Update user's household_id
    await updateUserHousehold(userId, docRef.id);

    return {
      householdId: docRef.id,
      inviteCode,
    };
  } catch (error) {
    console.error('Error creating household:', error);
    throw error;
  }
};

/**
 * Get household by ID
 */
export const getHousehold = async (
  householdId: string
): Promise<HouseholdData | null> => {
  try {
    const householdRef = doc(db, 'households', householdId);
    const householdDoc = await getDoc(householdRef);

    if (householdDoc.exists()) {
      return {
        household_id: householdDoc.id,
        ...householdDoc.data(),
      } as HouseholdData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching household:', error);
    throw error;
  }
};

/**
 * Find household by invite code
 */
export const getHouseholdByInviteCode = async (
  inviteCode: string
): Promise<HouseholdData | null> => {
  try {
    const q = query(
      collection(db, 'households'),
      where('invite_code', '==', inviteCode.toUpperCase())
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const householdDoc = querySnapshot.docs[0];
    return {
      household_id: householdDoc.id,
      ...householdDoc.data(),
    } as HouseholdData;
  } catch (error) {
    console.error('Error finding household by invite code:', error);
    throw error;
  }
};

/**
 * Join a household using invite code
 */
export const joinHousehold = async (
  inviteCode: string,
  userId: string
): Promise<HouseholdData> => {
  try {
    const household = await getHouseholdByInviteCode(inviteCode);

    if (!household) {
      throw new Error('Invalid invite code');
    }

    // Update user's household_id
    await updateUserHousehold(userId, household.household_id);

    return household;
  } catch (error) {
    console.error('Error joining household:', error);
    throw error;
  }
};
