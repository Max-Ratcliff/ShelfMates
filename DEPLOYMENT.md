# ShelfMates Deployment Guide

Complete guide for deploying ShelfMates to production.

## 🏗️ Architecture

- **Frontend**: Vercel
- **Backend**: Google Cloud Run (Docker)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Auth**: Firebase Authentication

---

## 📋 Prerequisites

### 1. Install Required Tools

```bash
# Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Docker
# Download from: https://www.docker.com/products/docker-desktop

# Firebase CLI
npm install -g firebase-tools
firebase login

# Vercel CLI (optional)
npm install -g vercel
```

### 2. Enable Google Cloud APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

---

## 🚀 Backend Deployment (Google Cloud Run)

### Step 1: Configure Environment

1. Navigate to Google Cloud Console → IAM & Admin → Service Accounts
2. Create a service account for Cloud Run with these roles:
   - Firebase Admin
   - Cloud Run Admin
   - Storage Object Admin

3. Set environment variables in Cloud Run (see below)

### Step 2: Deploy Backend

```bash
cd backend

# Make deployment script executable (if not already)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:
- Build Docker image
- Push to Google Container Registry
- Deploy to Cloud Run
- Output the backend URL

### Step 3: Set Cloud Run Environment Variables

Go to Cloud Console → Cloud Run → Select your service → Edit & Deploy New Revision → Variables & Secrets

Add these environment variables:

```bash
ENVIRONMENT=production
PORT=8000
FIREBASE_PROJECT_ID=shelfmates-de7ef
ALLOWED_ORIGINS=["https://your-app.vercel.app"]
SECRET_KEY=<generate-secure-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Generate a secure SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 4: Test Backend

```bash
curl https://your-backend-url.run.app/health
```

You should see:
```json
{
  "status": "healthy",
  "environment": "production"
}
```

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Select `frontend` as the root directory
4. Framework Preset: Vite

### Step 2: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```bash
VITE_FIREBASE_API_KEY=AIzaSyBMVVIL-z3VIVU0P0N_sRXiY8OPnEjUY0g
VITE_FIREBASE_AUTH_DOMAIN=shelfmates-de7ef.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=shelfmates-de7ef
VITE_FIREBASE_STORAGE_BUCKET=shelfmates-de7ef.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=306678180669
VITE_FIREBASE_APP_ID=1:306678180669:web:7683bdb13ad21db6413354

# IMPORTANT: Add your Cloud Run backend URL
VITE_API_URL=https://your-backend-url.run.app
```

### Step 3: Update Frontend API Calls

Make sure your frontend uses `VITE_API_URL`:

```typescript
// frontend/src/config/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export default API_URL;
```

### Step 4: Deploy

Vercel will automatically deploy on every push to main branch.

Manual deployment:
```bash
cd frontend
vercel --prod
```

---

## 🔒 Security Configuration

### 1. Firebase Security Rules

**Firestore Rules** (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isHouseholdMember(householdId) {
      return isAuthenticated() && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(householdId)).data.members;
    }
    
    // Users
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Households
    match /households/{householdId} {
      allow read, write: if isHouseholdMember(householdId);
    }
    
    // Items
    match /items/{itemId} {
      allow read, write: if isHouseholdMember(resource.data.householdId);
    }
  }
}
```

**Storage Rules** (`storage.rules`):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.resource.size < 5 * 1024 * 1024; // 5MB
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 2. Update CORS in Backend

After deploying frontend, update backend CORS:

```bash
# In Cloud Run environment variables
ALLOWED_ORIGINS=["https://your-actual-vercel-domain.vercel.app"]
```

### 3. Firebase Console Settings

1. **Authentication** → Sign-in method → Enable:
   - Email/Password
   - Google

2. **Authentication** → Settings → Authorized domains:
   - Add your Vercel domain

---

## 🧪 Testing Production Setup

### 1. Test Backend Health

```bash
curl https://your-backend.run.app/health
```

### 2. Test Backend API Docs

Visit: `https://your-backend.run.app/api/docs`

### 3. Test Frontend

1. Visit your Vercel URL
2. Try signing up/logging in
3. Create a household
4. Add an item
5. Scan a barcode

---

## 📊 Monitoring

### Backend (Cloud Run)

```bash
# View logs
gcloud run services logs read shelfmates-backend --region=us-central1

# View metrics
# Go to Cloud Console → Cloud Run → your service → Metrics
```

### Frontend (Vercel)

- Dashboard → Your Project → Analytics
- View deployment logs in Dashboard → Deployments

### Firebase

- Console → Authentication → Users
- Console → Firestore → Data
- Console → Storage → Files

---

## 🔄 CI/CD Setup (Optional)

### GitHub Actions for Backend

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Cloud Run

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: shelfmates-de7ef
      
      - name: Configure Docker
        run: gcloud auth configure-docker
      
      - name: Build and Push
        run: |
          cd backend
          docker build -t gcr.io/shelfmates-de7ef/shelfmates-backend:latest .
          docker push gcr.io/shelfmates-de7ef/shelfmates-backend:latest
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy shelfmates-backend \
            --image gcr.io/shelfmates-de7ef/shelfmates-backend:latest \
            --region us-central1 \
            --platform managed
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: CORS errors from frontend

**Solution**: 
```bash
# Check ALLOWED_ORIGINS in Cloud Run
gcloud run services describe shelfmates-backend --region=us-central1 --format=json | grep ALLOWED_ORIGINS

# Update if needed via Console or redeploy
```

**Problem**: Backend can't connect to Firebase

**Solution**: Ensure Cloud Run service account has Firebase Admin role

**Problem**: Docker build fails

**Solution**: Check requirements.txt for version conflicts
```bash
cd backend
pip install -r requirements.txt  # Test locally first
```

### Frontend Issues

**Problem**: API calls failing

**Solution**: Check VITE_API_URL is set correctly in Vercel

**Problem**: Environment variables not updating

**Solution**: Redeploy in Vercel after changing env vars

---

## 💰 Cost Estimates

### Google Cloud Run (Backend)
- **Free tier**: 2 million requests/month
- **Estimated**: $5-20/month for moderate usage

### Vercel (Frontend)
- **Hobby plan**: Free
- **Pro plan**: $20/month (for team features)

### Firebase
- **Spark plan**: Free
- **Blaze plan**: Pay as you go (estimated $5-10/month)

---

## 📝 Quick Reference

### Redeploy Backend
```bash
cd backend && ./deploy.sh
```

### View Backend Logs
```bash
gcloud run services logs read shelfmates-backend --region=us-central1 --follow
```

### Update Backend Environment
```bash
gcloud run services update shelfmates-backend \
  --region=us-central1 \
  --set-env-vars="KEY=VALUE"
```

### Redeploy Frontend
```bash
cd frontend && vercel --prod
```

---

## 🎉 Your URLs

After deployment, save these for reference:

- Frontend: `https://your-app.vercel.app`
- Backend: `https://shelfmates-backend-xxx.run.app`
- API Docs: `https://shelfmates-backend-xxx.run.app/api/docs`
- Firebase Console: `https://console.firebase.google.com/project/shelfmates-de7ef`
- Vercel Dashboard: `https://vercel.com/dashboard`
- Cloud Console: `https://console.cloud.google.com`
