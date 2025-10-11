import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { getUser, createOrUpdateUser, UserData } from '@/services/userService';

interface HouseholdData {
  household_id: string;
  name: string;
  invite_code: string;
  created_at: any;
}

interface HouseholdContextType {
  userData: UserData | null;
  householdData: HouseholdData | null;
  householdId: string | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
}

interface HouseholdProviderProps {
  children: ReactNode;
}

export function HouseholdProvider({ children }: HouseholdProviderProps) {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [householdData, setHouseholdData] = useState<HouseholdData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch and subscribe to user data
  useEffect(() => {
    if (!currentUser) {
      setUserData(null);
      setHouseholdData(null);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const user = await getUser(currentUser.uid);

        if (!user) {
          // Create user document if it doesn't exist
          await createOrUpdateUser(currentUser.uid, {
            name: currentUser.displayName || 'User',
            email: currentUser.email || '',
            household_id: null,
          });

          const newUser = await getUser(currentUser.uid);
          setUserData(newUser);
        } else {
          setUserData(user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Subscribe to real-time user updates
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as UserData);
      }
    });

    return () => {
      unsubscribeUser();
    };
  }, [currentUser]);

  // Subscribe to household data when user has a household_id
  useEffect(() => {
    if (!userData?.household_id) {
      setHouseholdData(null);
      return;
    }

    const householdRef = doc(db, 'households', userData.household_id);
    const unsubscribeHousehold = onSnapshot(
      householdRef,
      (doc) => {
        if (doc.exists()) {
          setHouseholdData(doc.data() as HouseholdData);
        } else {
          setHouseholdData(null);
        }
      },
      (error) => {
        console.error('Error subscribing to household:', error);
        setHouseholdData(null);
      }
    );

    return () => {
      unsubscribeHousehold();
    };
  }, [userData?.household_id]);

  const refreshUserData = async () => {
    if (!currentUser) return;

    try {
      const user = await getUser(currentUser.uid);
      setUserData(user);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value: HouseholdContextType = {
    userData,
    householdData,
    householdId: userData?.household_id || null,
    loading,
    refreshUserData,
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}
