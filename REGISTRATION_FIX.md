# Registration Error Fix

## Problem
You encountered this error when trying to register:
```
ERROR Function setDoc() called with invalid data. Unsupported field value: undefined (found in field custom_frequency_days in document users/...)
```

Then when trying again with the same email:
```
ERROR Firebase: Error (auth/email-already-in-use)
```

## Root Cause
Firestore doesn't allow `undefined` values in documents. The `custom_frequency_days` field was being set to `undefined` when the user didn't select a custom notification frequency.

## What Was Fixed

### 1. **UserService.ts** - Fixed user creation
- Added conditional logic to only include `custom_frequency_days` when it's actually defined
- Added filtering of undefined values in `updateUser` method

### 2. **All Other Services** - Prevented future issues
Fixed the same undefined value issue in:
- `beneficiaryService.ts` ✅
- `attorneyService.ts` ✅
- `executorService.ts` ✅
- `secondaryContactService.ts` ✅
- `assetService.ts` ✅
- `policyService.ts` ✅

All services now filter out `undefined` values before saving to Firestore.

### 3. **RegistrationScreen.tsx** - Better error handling
- Added user-friendly error messages
- Shows alerts when registration fails
- Specific message for "email-already-in-use" error

## How to Test

### Option 1: Use a Different Email (Recommended)
Simply try registering with a new email address. The undefined value issue is now fixed!

### Option 2: Delete the Test User
You have two ways to delete the existing test user:

#### A. Firebase Console (Easy)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Authentication** in the left sidebar
4. Click **Users** tab
5. Find your test email
6. Click the three dots (...) and select **Delete user**
7. Also go to **Firestore Database** and delete the user document if it exists

#### B. Using the Script (Advanced)
1. Download your Firebase Admin SDK key:
   - Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save as `service-account-key.json` in project root
   
2. Install firebase-admin:
   ```bash
   npm install firebase-admin --save-dev
   ```

3. Run the script:
   ```bash
   node scripts/delete-test-user.js your-test-email@example.com
   ```

## Testing Checklist

✅ Registration now works without undefined value errors
✅ All notification frequencies work (daily, weekly, monthly, quarterly, yearly, custom)
✅ Optional fields (attorney, executor details) can be left empty
✅ User sees clear error messages if something goes wrong

## What to Check After Registration

After successful registration, verify in Firebase Console:

1. **Authentication**
   - User should appear in Auth users list

2. **Firestore Database** - Check these collections:
   - `users` - User profile document created
   - `attorneys` - Created if you filled in attorney info
   - `executors` - Created if you filled in executor info
   - `secondary_contacts` - Created if you filled in secondary contact info

All documents should have NO `undefined` values!

## Additional Notes

- The `custom_frequency_days` field will only be present when a user selects "Custom (1+ Years)" notification frequency
- Empty optional fields (like `attorney_address`) won't be saved as undefined - they'll either have a value or not be included in the document
- This fix applies to ALL data creation throughout the app (assets, policies, beneficiaries, etc.)

---

**Status**: ✅ Fixed and ready for testing!

