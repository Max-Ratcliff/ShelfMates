import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Utility function to sync all users' photoURLs from Firebase Auth to Firestore
 * This is a one-time migration utility for existing users
 *
 * Note: This only updates the Firestore documents. The actual photoURL
 * comes from Firebase Auth when users sign in with Google.
 *
 * To use: Import this in a component and call syncAllUserPhotos()
 * Or run from browser console: window.syncAllUserPhotos()
 */
export async function syncAllUserPhotos() {
  try {
    console.log('Starting photo sync for all users...');

    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    let updated = 0;
    let skipped = 0;

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();

      // Skip if user already has photoURL
      if (userData.photoURL) {
        console.log(`Skipping ${userData.name} - already has photoURL`);
        skipped++;
        continue;
      }

      console.log(`User ${userData.name} (${userData.email}) is missing photoURL`);
      console.log('This user needs to log in again to sync their photo from Firebase Auth');
      skipped++;
    }

    console.log(`Sync complete: ${updated} updated, ${skipped} skipped`);
    return { updated, skipped };
  } catch (error) {
    console.error('Error syncing user photos:', error);
    throw error;
  }
}

// Make it available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).syncAllUserPhotos = syncAllUserPhotos;
}
