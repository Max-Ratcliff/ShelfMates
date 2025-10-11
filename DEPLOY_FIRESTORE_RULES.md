# Deploy Firestore Security Rules

You're getting "Missing or insufficient permissions" because the Firestore security rules haven't been deployed yet.

## Option 1: Firebase Console (Quickest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **ShelfMates** project
3. In the left sidebar, click **Firestore Database**
4. Click the **Rules** tab at the top
5. Copy the entire contents of `firestore.rules` from your project root
6. Paste it into the rules editor
7. Click **Publish**

## Option 2: Firebase CLI

If you have Firebase CLI installed:

```bash
# Initialize Firebase (if not already done)
firebase init firestore

# Select your existing project
# Accept firestore.rules as the path

# Deploy the rules
firebase deploy --only firestore:rules
```

## Temporary Fix for Testing

If you want to test immediately without setting up authentication rules, you can use these **TEMPORARY** test rules (WARNING: These allow anyone to read/write):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 11, 1);
    }
  }
}
```

**⚠️ IMPORTANT: These are ONLY for testing! Replace with the proper rules from `firestore.rules` before going to production.**

## After Deploying Rules

Once you've deployed the security rules:
1. Refresh your browser
2. Try creating a household again
3. The "Missing or insufficient permissions" error should be gone

## Verify Rules are Active

In Firebase Console:
1. Go to Firestore Database → Rules
2. You should see the rules from `firestore.rules`
3. The publish date should be recent
