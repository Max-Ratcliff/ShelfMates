# Firebase Authentication Setup Guide

## What's Been Implemented

Firebase Authentication has been successfully integrated into ShelfMates! Here's what's working:

### ✅ Features Implemented
- Email/password authentication
- Google OAuth sign-in
- Protected routes (dashboard, settings, etc.)
- Automatic redirect to login for unauthenticated users
- Sign out functionality
- User state management with React Context
- Loading states and error handling

### 📁 Files Created/Modified

**New Files:**
- `frontend/src/lib/firebase.ts` - Firebase configuration
- `frontend/src/contexts/AuthContext.tsx` - Authentication context and hooks
- `frontend/src/components/auth/ProtectedRoute.tsx` - Route protection component
- `frontend/.env.example` - Environment variables template

**Modified Files:**
- `frontend/src/App.tsx` - Added AuthProvider and ProtectedRoute
- `frontend/src/pages/Login.tsx` - Integrated Firebase sign-in
- `frontend/src/pages/SignUp.tsx` - Integrated Firebase sign-up
- `frontend/src/components/layout/NavBar.tsx` - Added sign-out functionality

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Once created, click on "Web" (</> icon) to add a web app
4. Register your app with a nickname (e.g., "ShelfMates Web")

### 2. Enable Authentication Methods

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Enable **Google** authentication (optional but recommended)
   - You may need to set up OAuth consent screen
   - Add authorized domains (localhost will be there by default)

### 3. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Copy the `firebaseConfig` object values

### 4. Create Environment File

1. Copy the example file:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. Fill in your Firebase configuration in `.env.local`:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### 5. Set Up Firestore (Optional for now, needed later)

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a Cloud Firestore location

### 6. Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/login`

3. Try creating an account with email/password

4. Try signing in with Google

5. Test sign out from the profile menu

## Usage

### Using the Auth Hook

In any component, you can access auth state:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { currentUser, loading, signIn, signUp, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {currentUser ? (
        <p>Welcome {currentUser.email}</p>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  );
}
```

### Protected Routes

Routes wrapped in `<ProtectedRoute>` will automatically redirect unauthenticated users to login.

## Next Steps

### TODO Items (marked in code):
1. **User Profile in Firestore**: Save additional user data (name, household info) to Firestore after signup
2. **Household Management**: Create Firestore collections for households and members
3. **Join Household Flow**: Implement the join household functionality
4. **Error Handling**: Add more specific error messages for different Firebase auth errors
5. **Password Reset**: Add forgot password functionality
6. **Email Verification**: Optionally require email verification after signup

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to authorized domains in Firebase Console > Authentication > Settings > Authorized domains

### "Firebase: Error (auth/operation-not-allowed)"
- Make sure the authentication method is enabled in Firebase Console

### Environment variables not loading
- Make sure the file is named `.env.local` (not `.env`)
- Restart the dev server after changing environment variables
- Vite requires the `VITE_` prefix for environment variables

### Google Sign-in not working locally
- Make sure `http://localhost` is in authorized domains
- Clear browser cache and cookies
- Check browser console for specific errors

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git (it's already in .gitignore)
- Keep your Firebase API keys secure
- Use Firebase Security Rules to protect your data
- Enable App Check in production for additional security
