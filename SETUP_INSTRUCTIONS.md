# MiWill App Setup Instructions

## Step 1: Create .env File

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Firebase credentials:
   - Go to Firebase Console → Project Settings → General
   - Scroll to "Your apps" section
   - If you don't have a web app, click "Add app" → Web (</> icon)
   - Copy the Firebase configuration values

3. Fill in your `.env` file with these values:
   ```bash
   FIREBASE_API_KEY="your-api-key-here"
   FIREBASE_AUTH_DOMAIN="miwillapp.firebaseapp.com"
   FIREBASE_PROJECT_ID="miwillapp"
   FIREBASE_STORAGE_BUCKET="miwillapp.appspot.com"
   FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   FIREBASE_APP_ID="your-app-id"
   FIREBASE_MEASUREMENT_ID="your-measurement-id"
   ```

4. Update LOCAL_STORAGE_ROOT with your actual username:
   ```bash
   LOCAL_STORAGE_ROOT=/Users/YOUR_USERNAME/Desktop/MiWill-App/storage
   ```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Run Seed Data Script

```bash
npm run seed:data
```

This will populate your Firestore database with initial system settings.

## Step 4: Start Development Server

```bash
npm start
```

Or for specific platforms:
```bash
npm run ios
npm run android
```

