# Account Linking Configuration

## What This Fixes

By default, Firebase allows users to create multiple accounts with the same email using different sign-in methods (email/password and Google). This causes confusion and data fragmentation.

**Example problem:**
1. User creates account with `user@gmail.com` using email/password
2. Later tries to sign in with Google using the same email
3. Without account linking: Creates a **second, separate account**
4. With account linking: Shows clear error and guides user

## What I've Implemented

### ✅ Code Changes Made:
1. **Enhanced error handling** for account conflicts
2. **Clear error messages** when trying to use different auth methods
3. **Google account picker** - Always shows account selection for Google sign-in

### Current Behavior:

**Scenario 1: Email/Password first, then Google**
- User creates account with `user@gmail.com` + password
- User tries to sign in with Google using same email
- **Result:** Error message: "An account already exists with user@gmail.com. Please sign in with your password first, then you can link Google in settings."

**Scenario 2: Google first, then Email/Password**
- User signs in with Google
- User tries to create account with same email + password
- **Result:** Error message: "An account with this email already exists. Please sign in instead."

## Firebase Console Setup (REQUIRED)

To prevent duplicate accounts, you need to configure Firebase to allow only one account per email:

### Step 1: Go to Authentication Settings
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your ShelfMates project
3. Navigate to **Authentication** > **Settings**

### Step 2: Enable "Prevent creating multiple accounts with the same email address"
1. Scroll to **User account management** section
2. Find the option: **"Prevent creating multiple accounts with the same email address"**
3. **Toggle it ON** ✅

This setting ensures:
- Only ONE account per email address
- Clear error messages when conflicts occur
- Users must use their original sign-in method

### Step 3: Configure Sign-in Methods
1. Go to **Authentication** > **Sign-in method**
2. For **Email/Password**:
   - Make sure it's enabled
   - Consider enabling **Email link (passwordless sign-in)** for better UX
3. For **Google**:
   - Make sure it's enabled
   - Verify authorized domains include your domains

## Testing the Configuration

### Test Case 1: Email/Password → Google
```
1. Sign up with: test@gmail.com + password123
2. Sign out
3. Try to sign in with Google using test@gmail.com
4. Expected: Error message telling you to sign in with password first
```

### Test Case 2: Google → Email/Password
```
1. Sign in with Google using test2@gmail.com
2. Sign out
3. Try to sign up with: test2@gmail.com + password123
4. Expected: Error message saying account already exists
```

### Test Case 3: Same method works fine
```
1. Sign up with: test3@gmail.com + password123
2. Sign out
3. Sign in with: test3@gmail.com + password123
4. Expected: Success!
```

## Future Enhancement: Account Linking UI

Currently, the code **prevents** duplicate accounts and shows helpful errors. In the future, you could add a feature in the Settings page to:

1. **Link Google to existing email/password account**
2. **Link email/password to existing Google account**
3. **See all linked authentication methods**
4. **Unlink authentication methods**

This would require:
- UI in the Settings page
- Functions to link accounts using `linkWithCredential()`
- Listing current auth methods with `fetchSignInMethodsForEmail()`

## Current Limitations

❌ **No automatic account merging** - Users must use their original sign-in method
❌ **No manual account linking UI yet** - Coming in future update
✅ **Clear error messages** - Users know exactly what to do
✅ **No duplicate accounts** - Once Firebase Console is configured

## Recommended User Flow

When a user tries to use a different auth method:

1. **Show error:** "An account already exists with this email"
2. **Guide them:** "Please sign in with [original method] first"
3. **Future:** After signing in, they can link additional methods in Settings

## Security Notes

- Each email should have only ONE account for security and data consistency
- Users can have multiple sign-in methods linked to one account
- Firebase handles the security of credential linking
- Always verify email ownership before linking new methods
