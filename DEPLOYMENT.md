# Nilkanth Fashions — Deployment Guide

## Prerequisites
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project created at console.firebase.google.com

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g., `nilkanth-fashions`)
3. Enable the following services:
   - **Authentication** → Sign-in methods → Enable Email/Password and Google
   - **Firestore Database** → Create database (production mode)
   - **Storage** → Get started
   - **Functions** → Upgrade to Blaze plan (required for Functions)
   - **Hosting** → Get started

## Step 2: Get Firebase Config

1. Project Settings → Your Apps → Add Web App
2. Copy the config object
3. Create `.env.local` from `.env.local.example`:
```bash
cp .env.local.example .env.local
```
4. Fill in all `NEXT_PUBLIC_FIREBASE_*` values

## Step 3: Set Admin User

After creating your account on the site, go to Firestore Console:
1. Open `users` collection → find your user document
2. Change `role` field from `"user"` to `"admin"`

## Step 4: Deploy Firestore Rules & Indexes

```bash
firebase login
firebase use --add   # select your project
firebase deploy --only firestore
firebase deploy --only storage
```

## Step 5: Configure & Deploy Cloud Functions

```bash
# Set email credentials (use Gmail App Password)
firebase functions:config:set email.user="hello@nilkanthfashion.ca" email.pass="YOUR_APP_PASSWORD"

# Deploy functions
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
```

## Step 6: Build & Deploy Frontend

```bash
npm run build
firebase deploy --only hosting
```

## Step 7: Connect Custom Domain

1. Firebase Console → Hosting → Add custom domain
2. Enter `nilkanthfashion.ca`
3. Follow DNS verification steps (add TXT record at your registrar)
4. Add A records pointing to Firebase IPs
5. SSL certificate is provisioned automatically

## Step 8: Seed Initial Data (Optional)

Run this in Firebase Console → Firestore to create site settings:
```js
// Collection: siteSettings / Document: main
{
  heroTitle: "Crafted for Her Story",
  announcementBanner: "Free bridal consultation! Limited time offer.",
  deliveryCharges: { local: 15, provincial: 25, national: 40, international: 80 },
  productionTimelines: { western: 7, traditional: 7, bridal: 30 }
}
```

## Local Development

```bash
npm run dev          # Start Next.js dev server on :3000
firebase emulators:start  # Start Firebase emulators
```

## Project Structure

```
nilkanth-fashions/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Homepage
│   │   ├── collections/        # Collections pages
│   │   ├── designs/[id]/       # Design detail
│   │   ├── auth/               # Login / Register
│   │   ├── user/               # User dashboard, orders, etc.
│   │   ├── admin/              # Admin dashboard
│   │   ├── custom-design/      # Custom design upload
│   │   ├── order/new/          # Order flow
│   │   ├── about/              # About page
│   │   └── contact/            # Contact page
│   ├── components/
│   │   ├── layout/             # Navbar, Footer
│   │   └── ui/                 # DesignCard, Button, etc.
│   ├── context/                # AuthContext
│   ├── data/                   # designs.ts (250+ designs)
│   ├── lib/                    # Firebase config
│   ├── types/                  # TypeScript types
│   └── utils/                  # pricing, cn helpers
├── functions/                  # Cloud Functions (email notifications)
├── firestore.rules             # Firestore security rules
├── storage.rules               # Storage security rules
├── firestore.indexes.json      # Composite indexes
└── firebase.json               # Firebase hosting config
```
