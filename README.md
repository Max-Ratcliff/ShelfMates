# ShelfMates 🏠🥗

> A collaborative food inventory management app for shared living spaces

ShelfMates helps roommates, college suites, and communal households coordinate shared groceries, track expiration dates, and split grocery expenses — all in one place.

## ✨ Features

### Core Functionality
- **User Authentication** - Sign in with email/password or Google
- **Household Management** - Create or join households with unique invite codes
- **Food Inventory Tracking** - Add items with expiry dates, quantities, and emoji labels
- **Personal & Communal Items** - Tag items as personal or shared with your household
- **Expiration Alerts** - Automatic sorting and highlighting of expiring items
- **Grocery List** - Shared shopping list with checkbox functionality
- **Expense Splitting** - Automatically split grocery costs when checking off items
- **Balance Tracking** - See who owes what with real-time balance updates
- **Barcode Scanning** - Quick item entry via barcode scanner

### Technical Features
- **Real-time Sync** - All data syncs instantly across household members
- **Mobile Responsive** - Works seamlessly on desktop, tablet, and mobile
- **Secure** - Firebase authentication and Firestore security rules
- **Fast** - Optimized for performance with efficient queries

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md))
- Google Cloud account (for backend deployment)

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080)

### Backend Setup

See [backend/QUICKSTART.md](backend/QUICKSTART.md) for deployment instructions.

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## 📱 Usage

### Getting Started
1. **Sign up** with email/password or Google
2. **Create a household** or join with an invite code
3. **Add items** to your shelf with expiry dates
4. **Mark items as communal** to share with your household
5. **Create a grocery list** of items to buy
6. **Check off items** when purchased and enter the price to split costs
7. **View balances** to see who owes what

### Managing Your Shelf
- **Filter items** by personal/communal
- **Sort items** by expiration date, recently added, or alphabetically
- **Scan barcodes** for quick item entry
- **Set expiry dates** to track freshness
- **Add emoji labels** for visual organization

### Tracking Expenses
- When you check off a grocery item, enter the price
- The cost is automatically split among all household members
- View detailed balances in the Balances tab
- Mark payments as complete with one click

## 🏗️ Architecture

### Frontend
- **React** + **TypeScript** - UI framework
- **Vite** - Build tool
- **TailwindCSS** + **shadcn/ui** - Styling
- **Firebase SDK** - Authentication and Firestore
- **React Router** - Navigation

### Backend
- **Firebase Authentication** - User management
- **Cloud Firestore** - NoSQL database
- **Firebase Cloud Functions** - Serverless backend
- **Cloud Run** - Container deployment (optional)

### Data Model
```
users/
  {userId}/
    - name, email, household_id, photoURL

households/
  {householdId}/
    - name, invite_code, created_by, created_at

    expenses/
      {expenseId}/
        - payerId, totalCents, entries[], note, participants[]

    payments/
      {paymentId}/
        - fromUser, toUser, totalCents, appliesTo[]

items/
  {itemId}/
    - name, quantity, expiryDate, ownerId, householdId
    - isCommunal, isGrocery, emoji
```

## 🔒 Security

- **Firebase Authentication** - Secure user identity
- **Firestore Security Rules** - Row-level access control
- **Environment Variables** - No hardcoded secrets
- **HTTPS Only** - Encrypted communications

## 📚 Documentation

- [Design Document](design.md) - Full project specification
- [Firebase Setup](FIREBASE_SETUP.md) - Firebase configuration guide
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Backend Quickstart](backend/QUICKSTART.md) - Backend deployment

## 🛠️ Development

### Available Scripts

**Frontend**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend**
```bash
./deploy.sh          # Deploy to Cloud Run
./get-backend-url.sh # Get deployed backend URL
```

### Project Structure
```
ShelfMates/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── contexts/   # React contexts
│   │   ├── hooks/      # Custom hooks
│   │   ├── services/   # API services
│   │   └── lib/        # Utilities
│   └── public/         # Static assets
├── backend/            # Cloud Functions (optional)
├── firestore.rules     # Firestore security rules
└── firebase.json       # Firebase configuration
```

## 🤝 Contributing

This project was created for a hackathon. Contributions are welcome!

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Backend powered by [Firebase](https://firebase.google.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Made with ❤️ for hackathon submission**
