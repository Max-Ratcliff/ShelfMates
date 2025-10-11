# ShelfMates — Detailed Design Document

## 1. Project Overview

ShelfMates is a web application that helps small households, college suites, or communal kitchens coordinate shared groceries to reduce food waste.  
Each user joins a household where food items can be tagged as **personal** or **communal**, tracked by **expiration date**, and shown on a shared dashboard.  
Firebase manages authentication, data persistence, and scheduled notifications to remind users when shared items are expiring.

### Primary Goals

- Reduce food waste in communal environments
- Provide transparency about shared vs. personal items
- Simplify food tracking for shared living arrangements

---

## 2. Core Features (MVP)

| #   | Feature                              | Description                                                                                                      | Tech                                               |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | **User Authentication & Households** | Users sign in through Firebase Auth (email/password or Google). Create or join a household using an invite code. | Firebase Auth + Firestore                          |
| 2   | **Item CRUD Operations**             | Add, edit, or delete items with name, quantity, and expiry date.                                                 | React + Firestore                                  |
| 3   | **Personal vs. Communal Items**      | Toggle to mark items as personal or communal. Communal items are visible to all household members.               | Firestore field `is_communal: boolean`             |
| 4   | **Expiration Tracking & Reminders**  | Automatically mark expired items; send notifications a few days before expiry.                                   | Python Cloud Functions or Firebase Scheduled Tasks |
| 5   | **Dashboard View**                   | Main dashboard displays personal, shared, and expiring items with filters and search.                            | React + Tailwind                                   |
| 6   | **Household Management**             | View household members, regenerate invite code, and leave household.                                             | Firestore subcollection + security rules           |

---

## 3. Stretch Goals

| Feature            | Description                                                        | Notes                               |
| ------------------ | ------------------------------------------------------------------ | ----------------------------------- |
| Metrics Dashboard  | Track number of items saved and waste percentage                   | Chart.js                            |
| Recipe Integration | Suggest recipes using items nearing expiration via an external API | Spoonacular, Edamam, or similar API |
| Reserve for Recipe | Users can tag items as "reserved" for an upcoming recipe           | Optional Firestore field            |
| Leaderboards       | Compare waste reduction between households                         | Firestore aggregation               |
| Comments or Notes  | Leave short notes/tips on items                                    | Firestore subcollection             |

---

## 4. System Architecture

```
Frontend (React + TypeScript + Tailwind)
    ├─ Item Dashboard
    ├─ Add/Edit Forms
    ├─ Auth + Household Views
           │
           ▼
Firebase Services
    ├─ Firebase Auth (login/registration)
    ├─ Firestore (item and household data)
    ├─ Cloud Storage (optional for images)
    └─ Cloud Functions (Python)
         • Expiration reminders
         • Household invite code generation
```

---

## 5. Data Model (Firestore)

### users

```json
{
  "uid": "string",
  "name": "string",
  "email": "string",
  "household_id": "string",
  "joined_at": "timestamp"
}
```

### households

```json
{
  "household_id": "string",
  "name": "string",
  "invite_code": "string",
  "created_at": "timestamp"
}
```

### items

```json
{
  "item_id": "string",
  "name": "string",
  "quantity": "int",
  "expiry_date": "timestamp",
  "owner_id": "string",
  "household_id": "string",
  "is_communal": true,
  "reserved_by": "string|null",
  "created_at": "timestamp"
}
```

### reminders

```json
{
  "item_id": "string",
  "sent_at": "timestamp"
}
```

---

## 6. Backend Logic (Python Cloud Functions)

| Function                    | Description                                                    | Trigger        |
| --------------------------- | -------------------------------------------------------------- | -------------- |
| `send_expiration_reminders` | Runs daily; finds items expiring soon and sends notifications. | Scheduled cron |
| `cleanup_expired_items`     | Marks expired items as inactive for filtering.                 | Scheduled      |
| `generate_invite_code`      | Creates a unique join code when a household is created.        | HTTPS callable |

---

## 7. Implementation Roadmap

| Phase            | Duration | Tasks                                                              |
| ---------------- | -------- | ------------------------------------------------------------------ |
| Setup            | 3 hrs    | Initialize React project, Tailwind, Firebase SDK, Firestore schema |
| Auth & Household | 4 hrs    | Create auth views (login/signup/join household)                    |
| Item Management  | 5 hrs    | Build CRUD forms and integrate Firestore queries                   |
| Dashboard        | 4 hrs    | Filtered item list and UI polish                                   |
| Reminders        | 3 hrs    | Deploy Cloud Function for scheduled alerts                         |
| Stretch Goals    | If time  | Charts, recipes, reserve functionality                             |

---

## 8. UI / UX Plan

### Design Goals

- Clean, minimal, and responsive for both desktop and mobile
- Clear distinction between personal and communal items
- Quick‑action workflow for adding and editing items

### Color Palette

| Role           | Color               |
| -------------- | ------------------- |
| Background     | #F8FAFC             |
| Primary Accent | #4ADE80             |
| Secondary      | #60A5FA             |
| Expired State  | #F87171             |
| Text           | #334155 or gray‑800 |

### UI Layouts

#### Login / Registration

- Simple form with Firebase Auth connection
- Option to create or join a household via invite code

#### Dashboard

- Top Navbar: logo, household name, profile avatar
- Tabs: My Shelf | Shared Shelf | Expiring Soon
- Item grid or list with:
  - Name
  - Quantity
  - Expiration status badge (Safe, Expiring Soon, Expired)
  - Ownership label
- Floating “Add Item” button (green accent)

#### Add Item Modal

- Inputs: Name, Quantity, Expiry Date (picker), “Communal?” toggle
- Save directly to Firestore

#### Household Settings

- Display member list
- Copy or regenerate invite code
- Option to leave household

#### (Optional Stretch) Recipe / Metrics View

- Modal or side panel showing charts or recipe suggestions

---

## 9. Firestore Security Rules (Draft)

```text
match /households/{hid} {
  allow read, write: if request.auth != null;
}

match /items/{iid} {
  allow read: if request.auth != null && resource.data.household_id == get(/databases/(default)/documents/users/$(request.auth.uid)).data.household_id;
  allow write: if request.auth != null && request.resource.data.owner_id == request.auth.uid;
}
```

---

## 10. Future Expansion

- Migrate to mobile (PWA or React Native)
- Add barcode scanning and OCR input
- Advanced AI recipe and meal planning system
- Push/SMS notifications through Firebase Messaging or Twilio
- Gamified “Zero Waste Score”
- Partnerships for community food donations

---

## 11. Summary

ShelfMates is a simplified yet extensible food inventory manager designed for shared living spaces. The MVP emphasizes transparency, collaboration, and usability while maintaining a clear technical architecture.  
The app provides a working prototype within hackathon scope and a clear roadmap for post‑event growth.
