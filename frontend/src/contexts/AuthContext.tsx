import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  UserCredential,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { toast } from 'sonner';
import { createOrUpdateUser } from '@/services/userService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to get user-friendly error messages
  const getAuthErrorMessage = (errorCode: string, email?: string): string => {
    switch (errorCode) {
      case 'auth/invalid-credential':
        return email
          ? `This account (${email}) uses a different sign-in method. Try signing in with Google or reset your password.`
          : 'Invalid email or password. This account may use a different sign-in method (like Google).';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
        return 'Incorrect password. This account may have been converted to Google sign-in. Try "Sign in with Google" instead.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email address. Please enter a valid email.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed. Please try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using a different sign-in method. Try signing in with Google.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Create user document in Firestore
      await createOrUpdateUser(result.user.uid, {
        name: result.user.displayName || email.split('@')[0],
        email: result.user.email || email,
        household_id: null,
      });

      toast.success('Account created successfully!', {
        duration: 3000,
      });
      return result;
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage, {
        duration: 5000,
      });
      throw error;
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!', {
        duration: 3000,
      });
      return result;
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code, email);
      toast.error(errorMessage, {
        duration: 7000,
      });
      throw error;
    }
  };

  // Sign in with Google (with automatic account linking)
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // Create or update user document in Firestore
      await createOrUpdateUser(result.user.uid, {
        name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
        email: result.user.email || '',
        photoURL: result.user.photoURL || '',
      });

      toast.success('Logged in with Google successfully!', {
        duration: 3000,
      });
      return result;
    } catch (error: any) {
      // Handle account exists with different credential - automatic linking
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        const pendingCred = GoogleAuthProvider.credentialFromError(error);

        if (email && pendingCred) {
          try {
            // Fetch the sign-in methods for this email
            const methods = await fetchSignInMethodsForEmail(auth, email);

            if (methods.includes('password')) {
              // User needs to sign in with password first, then we can link
              toast.error(
                `An account exists with ${email}. Please sign in with your password first to link Google.`,
                { duration: 7000 }
              );
            } else {
              // Other method - show generic message
              toast.error(
                `An account exists with ${email}. Please sign in with your existing method first.`,
                { duration: 7000 }
              );
            }
          } catch (fetchError) {
            console.error('Error fetching sign-in methods:', fetchError);
            toast.error(
              'An account already exists with this email. Please sign in with your existing method.',
              { duration: 7000 }
            );
          }
        } else {
          toast.error(
            'An account already exists with this email. Please sign in with your existing method.',
            { duration: 7000 }
          );
        }
        throw error;
      }

      const errorMessage = getAuthErrorMessage(error.code);
      toast.error(errorMessage, {
        duration: 5000,
      });
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out');
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
