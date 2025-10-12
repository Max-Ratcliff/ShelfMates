# ShelfMates - Shared Food Inventory Tracker

Track and share food inventory with your household. Never let food go to waste again.

## Features

- 📱 Barcode scanning with UPC database integration
- 📅 Smart expiry date estimation using USDA FoodKeeper data
- 🔥 Firebase authentication with Google Sign-In
- 👥 Shared household inventory management
- 📊 Dashboard with expiring items alerts
- 🎯 Real-time synchronization across devices

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Hosting**: Vercel (frontend) + Google Cloud Run (backend)

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker (for backend deployment)
- Firebase project
- Google Cloud account (for backend deployment)

### Frontend Setup

```sh
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:8080`

### Backend Setup

```sh
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
uvicorn src.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

## Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

**Frontend (Vercel):**
- Push to GitHub
- Connect repository to Vercel
- Add environment variables
- Deploy

**Backend (Cloud Run):**
```sh
cd backend
./deploy.sh
```

## Environment Variables

### Frontend (.env)
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:8000
```

### Backend (.env)
```
ENVIRONMENT=development
FIREBASE_PROJECT_ID=your-project-id
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
```

## License

MIT
