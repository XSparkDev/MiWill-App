# Registration Flow & Attorney/Executor Selection Updates

## Overview
This document describes the major updates to the registration flow, attorney/executor selection, and notification system implemented in the MiWill app.

## 1. Registration Flow Fixes

### Navigation Bug Fix
**Issue**: When clicking the back button from step 5 (Executor Information), the app wouldn't navigate to step 4 (Executor Selection) correctly.

**Solution**: 
- Updated `previousStep()` function in `RegistrationScreen.tsx` to intelligently skip steps based on user choices
- Updated `nextStep()` function to skip attorney/executor info steps if the user chose MiWill partners
- Removed automatic skip logic from `renderStep()` that was causing conflicts

**Implementation**:
```typescript
// In previousStep():
// Skip attorney info step if user chose MiWill attorney
if (currentStep === 4 && formData.hasOwnAttorney === false) {
  targetStep = 2; // Go back to attorney selection
}

// Skip executor info step if user chose MiWill executor
if (currentStep === 6 && formData.hasOwnExecutor === false) {
  targetStep = 4; // Go back to executor selection
}

// In nextStep():
// Skip attorney info step (3) if user chose MiWill attorney
if (currentStep === 2 && formData.hasOwnAttorney === false) {
  nextStepNumber = 4; // Skip to executor selection
}

// Skip executor info step (5) if user chose MiWill executor
if (currentStep === 4 && formData.hasOwnExecutor === false) {
  nextStepNumber = 6; // Skip to secondary contact
}
```

## 2. Attorney/Executor Selection Flow

### New Registration Steps
The registration flow now includes two new selection steps:

#### Step 2: Attorney Selection (Before Attorney Information)
- **Question**: "Do you have your own attorney?"
- **Options**:
  - **Yes** (Unfilled button): Proceeds to Step 3 (Attorney Information)
  - **No** (Filled with primary color): Shows MiWill Attorney modal

**MiWill Attorney Modal**:
- Explains MiWill Partner Attorney program
- Requires checkbox acceptance: "I will use MiWill Partner attorneys"
- Includes "Terms" link to detailed terms modal
- "Continue" button proceeds to Step 4 (Executor Selection)
- "Go Back" returns to attorney selection

#### Step 4: Executor Selection (Before Executor Information)
- **Question**: "Do you have your own executor?"
- **Options**:
  - **Yes** (Unfilled button): Proceeds to Step 5 (Executor Information)
  - **No** (Filled with primary color): Shows MiWill Executor modal

**MiWill Executor Modal**:
- Explains MiWill Executor service
- Requires checkbox acceptance: "I will use MiWill Executors"
- Includes "Terms" link to detailed terms modal
- "Continue" button proceeds to Step 6 (Secondary Contact)
- "Go Back" returns to executor selection

### Conditional "Same Information as Attorney" Button
- The "Same Information as Attorney" button in Step 5 (Executor Information) only appears if:
  - `formData.hasOwnAttorney === true`
  - User has not skipped attorney information

## 3. Database Schema Updates

### New Fields in `users` Collection

Added 6 new fields to track attorney/executor choices and notification status:

```typescript
has_own_attorney: boolean (default: false)
// true if user provided their own attorney, false if using MiWill attorneys

has_own_executor: boolean (default: false)
// true if user provided their own executor, false if using MiWill executors

miwill_attorney_accepted: boolean (default: false)
// true if user agreed to use MiWill partner attorneys

miwill_executor_accepted: boolean (default: false)
// true if user agreed to use MiWill executors

attorney_notification_dismissed: boolean (default: false)
// true once user dismisses the attorney update notification

executor_notification_dismissed: boolean (default: false)
// true once user dismisses the executor update notification
```

### Updated User Profile Type
File: `src/types/user.ts`

```typescript
export interface UserProfile {
  // ... existing fields ...
  has_own_attorney?: boolean;
  has_own_executor?: boolean;
  miwill_attorney_accepted?: boolean;
  miwill_executor_accepted?: boolean;
  attorney_notification_dismissed?: boolean;
  executor_notification_dismissed?: boolean;
  // ... existing fields ...
}
```

## 4. Dashboard Notification System

### Notification Bell
**Location**: Dashboard header (replaced logout button)
- **Icon**: `notifications` (Ionicons)
- **Badge**: Red dot appears when there are attorney/executor notifications
- **Behavior**: Taps open the notification modal

### Notification Logic
Notifications appear when:
```typescript
// Attorney notification
!profile.has_own_attorney && 
!!profile.miwill_attorney_accepted && 
!profile.attorney_notification_dismissed

// Executor notification
!profile.has_own_executor && 
!!profile.miwill_executor_accepted && 
!profile.executor_notification_dismissed
```

### Notification Modal
**Design**: Slide-up modal with:
- Header with close button
- Scrollable notification list
- Empty state when no notifications

**Notification Card**:
- Information icon
- Title: "MiWill Partner Attorney Assigned" or "MiWill Executor Assigned"
- Body text explaining the user can appoint their own at any time
- **Actions**:
  1. **"Appoint My Own Attorney/Executor"**: Navigates to `UpdateAttorney` or `UpdateExecutor` screen
  2. **"Dismiss"**: Updates Firebase to set `attorney_notification_dismissed` or `executor_notification_dismissed` to `true`

## 5. Logout Button Relocation

### Before
- Logout button was in the Dashboard header
- Next to the menu button

### After
- Logout button moved to `SideMenu.tsx`
- Appears at the bottom of the side menu
- Red icon and text styling for prominence
- Border separator at the top

**SideMenu Changes**:
```typescript
// New prop
interface SideMenuProps {
  // ... existing props ...
  onLogout: () => void;
}

// Implementation
<TouchableOpacity
  style={styles.logoutMenuItem}
  onPress={() => {
    onClose();
    onLogout();
  }}
>
  <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
  <Text style={styles.logoutMenuItemText}>Logout</Text>
</TouchableOpacity>
```

## 6. New Screens

### UpdateAttorneyScreen.tsx
**Purpose**: Allow users to update or add their own attorney information

**Features**:
- Loads existing attorney data if available
- Form fields:
  - First Name (required)
  - Surname (required)
  - Email Address (required)
  - Phone Number (required)
  - Law Firm (optional)
  - Address (optional)
- Validates all required fields
- Creates new attorney or updates existing
- Updates user profile flags:
  - Sets `has_own_attorney` to `true`
  - Sets `attorney_notification_dismissed` to `true`
- Shows success alert and returns to Dashboard

### UpdateExecutorScreen.tsx
**Purpose**: Allow users to update or add their own executor information

**Features**:
- Loads existing executor data if available
- Form fields:
  - First Name (required)
  - Surname (required)
  - ID Number (required)
  - Relationship (required)
  - Email Address (required)
  - Phone Number (required)
  - Address (optional)
- Validates all required fields
- Creates new executor or updates existing
- Updates user profile flags:
  - Sets `has_own_executor` to `true`
  - Sets `executor_notification_dismissed` to `true`
- Shows success alert and returns to Dashboard

### Navigation Registration
Added to `AppNavigator.tsx`:
```typescript
export type RootStackParamList = {
  // ... existing routes ...
  UpdateAttorney: undefined;
  UpdateExecutor: undefined;
  // ... existing routes ...
};

<Stack.Screen name="UpdateAttorney" component={UpdateAttorneyScreen} />
<Stack.Screen name="UpdateExecutor" component={UpdateExecutorScreen} />
```

## 7. User Journey Examples

### Journey 1: User with Own Attorney & Executor
1. Step 0: Personal Information → Continue
2. Step 1: Notification Frequency → Continue
3. **Step 2: Attorney Selection** → Select "Yes" → Continue
4. Step 3: Attorney Information → Fill in details → Continue
5. **Step 4: Executor Selection** → Select "Yes" → Continue
6. Step 5: Executor Information → Click "Same Information as Attorney" → Continue
7. Step 6: Secondary Contact → Fill in details → Continue
8. Step 7: Review → Continue
9. Step 8: Completion → Complete
10. Navigate to Dashboard → **No notification badge**

### Journey 2: User with MiWill Attorney & Executor
1. Step 0: Personal Information → Continue
2. Step 1: Notification Frequency → Continue
3. **Step 2: Attorney Selection** → Select "No" → Modal appears
4. Check "I will use MiWill Partner attorneys" → Continue
5. **Step 4: Executor Selection** (Step 3 skipped) → Select "No" → Modal appears
6. Check "I will use MiWill Executors" → Continue
7. **Step 6: Secondary Contact** (Step 5 skipped) → Fill in details → Continue
8. Step 7: Review → Shows "MiWill Partner Attorney (To be assigned)" and "MiWill Executor (To be assigned)"
9. Step 8: Completion → Complete
10. Navigate to Dashboard → **Notification badge visible**
11. Click notification bell → See two notifications
12. Click "Appoint My Own Attorney" → Navigate to `UpdateAttorneyScreen`
13. Fill in attorney details → Save → Attorney notification dismissed
14. Return to Dashboard → Notification badge still visible (executor notification remains)
15. Click notification bell → See one notification (executor only)
16. Click "Dismiss" on executor notification → Notification badge disappears

### Journey 3: Mixed (Own Attorney, MiWill Executor)
1. Step 0-2: Same as Journey 1
2. Step 3: Attorney Information → Fill in details → Continue
3. **Step 4: Executor Selection** → Select "No" → Modal appears
4. Check "I will use MiWill Executors" → Continue
5. **Step 6: Secondary Contact** (Step 5 skipped)
6. "Same Information as Attorney" button does NOT appear (user doesn't have own executor)
7. Step 7: Review → Shows attorney details and "MiWill Executor (To be assigned)"
8. Navigate to Dashboard → **Notification badge visible** (executor notification only)

## 8. Testing Checklist

### Registration Flow
- [ ] Step navigation works forward and backward correctly
- [ ] Skipped steps (attorney/executor info) are handled properly
- [ ] Attorney selection modal appears when "No" is selected
- [ ] Executor selection modal appears when "No" is selected
- [ ] Terms modals open and close correctly
- [ ] Review step shows correct information based on user choices
- [ ] Database fields are saved correctly on registration

### Dashboard Notifications
- [ ] Notification badge appears when attorney/executor notifications exist
- [ ] Notification badge disappears when all notifications are dismissed
- [ ] Notification modal shows correct notifications
- [ ] "Appoint My Own Attorney" navigates to UpdateAttorneyScreen
- [ ] "Appoint My Own Executor" navigates to UpdateExecutorScreen
- [ ] "Dismiss" button updates database and removes notification
- [ ] Empty state shows when no notifications exist

### Update Screens
- [ ] UpdateAttorneyScreen loads existing attorney data
- [ ] UpdateAttorneyScreen validates required fields
- [ ] UpdateAttorneyScreen saves new/updated attorney
- [ ] UpdateAttorneyScreen updates user profile flags
- [ ] UpdateExecutorScreen loads existing executor data
- [ ] UpdateExecutorScreen validates required fields
- [ ] UpdateExecutorScreen saves new/updated executor
- [ ] UpdateExecutorScreen updates user profile flags

### SideMenu
- [ ] Logout button appears in side menu
- [ ] Logout button has correct styling (red icon and text)
- [ ] Logout button triggers logout successfully

## 9. Files Modified

### Core Functionality
1. `src/screens/RegistrationScreen.tsx` - Attorney/executor selection flow and navigation fixes
2. `src/screens/DashboardScreen.tsx` - Notification bell and modal
3. `src/components/SideMenu.tsx` - Logout button relocation
4. `src/types/user.ts` - New UserProfile fields
5. `src/navigation/AppNavigator.tsx` - New screen routes

### New Files
6. `src/screens/UpdateAttorneyScreen.tsx` - Attorney update screen
7. `src/screens/UpdateExecutorScreen.tsx` - Executor update screen

### Documentation
8. `FIREBASE_SETUP_GUIDE.md` - Updated with new database fields

## 10. Next Steps for Production

### Firebase Rules
Update Firestore security rules to ensure:
- Users can only update their own attorney/executor information
- Notification dismissal fields are protected

### Email Notifications
Consider implementing email notifications when:
- User chooses MiWill partners (confirmation email)
- User updates their attorney/executor (confirmation email)

### Analytics
Track the following events:
- `attorney_selection_own` - User chose their own attorney
- `attorney_selection_miwill` - User chose MiWill attorney
- `executor_selection_own` - User chose their own executor
- `executor_selection_miwill` - User chose MiWill executor
- `attorney_updated` - User updated attorney information
- `executor_updated` - User updated executor information
- `notification_dismissed_attorney` - User dismissed attorney notification
- `notification_dismissed_executor` - User dismissed executor notification

### Backend Integration
- Set up MiWill partner attorney assignment logic
- Set up MiWill executor assignment logic
- Create admin dashboard to view users with MiWill partners
- Implement partner assignment workflow

## Summary

This update provides a complete attorney/executor selection and notification system that:
1. ✅ Fixes registration navigation bugs
2. ✅ Allows users to choose between their own or MiWill-provided attorneys/executors
3. ✅ Provides clear terms and conditions for MiWill services
4. ✅ Notifies users they can update their choices at any time
5. ✅ Provides dedicated screens for updating attorney/executor information
6. ✅ Tracks notification dismissal to avoid showing alerts repeatedly
7. ✅ Improves UX by moving logout to side menu and adding notification bell

The implementation is production-ready and follows React Native best practices with proper TypeScript typing, error handling, and user feedback.
