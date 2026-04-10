# Capital Legacy Lead Integration - Implementation Documentation

## Overview

This document describes the complete implementation of the Capital Legacy lead submission integration within the MiWill application. The integration allows qualified users (estate value ≥ R250,000) to opt-in for a complimentary Capital Legacy consultation during the will approval process.

**Key Principles:**
- **Explicit Opt-In**: Users must explicitly consent via checkbox in the approval flow
- **Non-Blocking**: Capital Legacy is optional and never blocks core MiWill functionality
- **One-Time Submission**: Leads are submitted once per user to prevent duplicates
- **Background Calculation**: Estate value is calculated automatically when viewing the electronic will

---

## Architecture Overview

### Integration Points

```
Registration → View Will → Approve Will → Capital Legacy Lead Submission
     ↓              ↓              ↓                    ↓
  Collect      Calculate      Show CL         Submit to API
  Profile      Estate Value   Opt-In          (if qualified)
  Data         & Cache        Section         & consented
```

### Key Components

1. **Data Collection** (`RegistrationScreen.tsx`, `UpdateProfileScreen.tsx`)
   - Collects Capital Legacy-related profile fields
   - Stores POPIA consent and lead submission consent

2. **Estate Calculation** (`ViewWillScreen.tsx`)
   - Automatically calculates total estate value when will is generated
   - Caches value in user profile for qualification checks

3. **Qualification & Consent** (`ViewWillScreen.tsx` - Approve Modal)
   - Shows Capital Legacy section only if user qualifies
   - Requires explicit checkbox consent before submission

4. **Lead Submission** (`LeadService.ts`, `leadDataBuilder.ts`)
   - Builds complete lead payload from user data
   - Submits to Capital Legacy API endpoint
   - Tracks submission status to prevent duplicates

---

## User Flow

### 1. Registration & Profile Setup

**Location**: `RegistrationScreen.tsx` (Step 0 - Personal Information)

**Fields Collected:**
- Date of Birth (YYYY-MM-DD format)
- Employment Status (employed, self_employed, unemployed, retired, student, other)
- Monthly Income (optional, in ZAR)
- Marital Status (single, married, divorced, widowed, domestic_partnership, other)
- Lead Submission Consent (checkbox: "I consent to being contacted by Capital Legacy")

**Also Required:**
- POPIA acceptance (existing field)

**Data Storage:**
- All fields saved to `users` collection in Firebase
- `lead_submission_consent` and `lead_submission_consent_at` stored when consent is given

### 2. Estate Value Calculation

**Location**: `ViewWillScreen.tsx` → `loadWillData()` and `regenerateWill()`

**When It Happens:**
- Automatically when user views their electronic will
- Recalculates when will is regenerated (after asset/policy/beneficiary changes)

**Calculation Logic:**
```typescript
const assetsTotal = userAssets.reduce((sum, asset) => sum + (asset.asset_value || 0), 0);
const policiesTotal = userPolicies.reduce((sum, policy) => sum + (policy.policy_value || 0), 0);
const totalEstateValue = assetsTotal + policiesTotal;
```

**Storage:**
- Value stored in `userProfile.total_estate_value`
- Persisted to Firebase via `UserService.updateUser()`
- Cached to avoid recalculation on every view

### 3. Will Approval Flow

**Location**: `ViewWillScreen.tsx` → Approve Will Modal

**User Journey:**
1. User scrolls to bottom of electronic will
2. Clicks "Approve & Continue" button
3. Approve Will modal opens with two options:
   - "Save & Prepare for Print"
   - "Request Will Collection"

**Capital Legacy Section (Conditional):**

The Capital Legacy section **only appears if**:
- `userProfile.total_estate_value >= 250000`
- `userProfile.popia_accepted === true`
- `userProfile.lead_submitted !== true` (hasn't already submitted)

**Section Content:**
- **Title**: "Optional: Capital Legacy Consultation"
- **Brief Explanation**: 
  - "You qualify for a complimentary consultation..."
  - Bullet points: Estate value above R250k, Independent specialists, Free consultation
- **Appointment Type Selector** (optional):
  - Single / Spouse/Partner / Family
  - Defaults to 'single'
- **Consent Checkbox**:
  - "I consent to MiWill sharing my details and estate summary with Capital Legacy so they can contact me about a consultation."

**Visual Design:**
- Capital Legacy section styled as secondary/optional (subtle background)
- Main approval options remain visually primary
- Clear separation to indicate CL is an add-on, not required

### 4. Lead Submission

**Trigger**: User selects either "Save & Prepare for Print" OR "Request Will Collection"

**Submission Conditions (ALL must be true):**
1. `userProfile.total_estate_value >= 250000`
2. `userProfile.popia_accepted === true`
3. `capitalLegacyOptIn === true` (checkbox checked)
4. `userProfile.lead_submitted !== true` (not already submitted)

**Process:**
1. User's approval action proceeds normally (print/collection modal opens)
2. In parallel, `submitCapitalLegacyLead()` is called
3. Function fetches latest assets, policies, beneficiaries
4. Builds `LeadSubmissionData` payload via `buildLeadSubmissionData()`
5. Submits to Capital Legacy API via `LeadService.submitLead()`
6. On success:
   - Updates user profile with submission status
   - Shows success message: "Your request for a Capital Legacy consultation has been submitted. We won't ask you again unless your estate or contact details change."
7. On failure:
   - Shows error alert
   - **MiWill approval flow continues normally** (non-blocking)

**One-Time Behavior:**
- After successful submission, `lead_submitted = true` is set
- Capital Legacy section is hidden on future approvals
- User will not be asked again unless their estate value changes significantly

---

## Technical Implementation

### 1. Data Models

#### User Profile Extensions (`src/types/user.ts`)

```typescript
// Capital Legacy lead integration fields
date_of_birth?: string; // YYYY-MM-DD
employment_status?: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student' | 'other';
monthly_income?: number; // ZAR per month (optional)
marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'domestic_partnership' | 'other';
total_estate_value?: number; // cached sum of assets + policies
lead_submission_consent?: boolean;
lead_submission_consent_at?: Date | string;
lead_submitted?: boolean;
lead_submitted_at?: Date | string;
lead_submission_id?: string; // Capital Legacy lead reference
```

#### Lead Submission Data (`src/types/lead.ts`)

```typescript
export type AppointmentType = 'single' | 'spouse_partner' | 'family';

export interface LeadSubmissionData {
  client_age: number;
  employment_status: string;
  has_minor_children: boolean;
  has_property: boolean;
  has_vehicle: boolean;
  has_other_assets: boolean;
  marital_status: string;
  client_address: string;
  appointment_type: AppointmentType;
}
```

### 2. Services

#### LeadService (`src/services/leadService.ts`)

**Key Methods:**

- `calculateTotalEstateValue(assets, policies)`: Calculates sum of asset and policy values
- `calculateAndStoreEstateValue(userId)`: Fetches assets/policies, calculates, stores in user profile
- `qualifiesForLeadSubmission(totalEstateValue, popiaAccepted)`: Checks if user meets R250k threshold
- `submitLead(leadData)`: HTTP POST to Capital Legacy API
- `updateLeadSubmissionStatus(userId, leadId)`: Marks user as submitted

**API Configuration:**
- Uses environment variables:
  - `EXPO_PUBLIC_LEAD_API_URL`: Capital Legacy API base URL
  - `EXPO_PUBLIC_LEAD_API_KEY`: Bearer token for authentication
- Endpoint: `POST ${apiBaseUrl}/leads`
- Headers: `Content-Type: application/json`, `Authorization: Bearer ${apiKey}`

#### Lead Data Builder (`src/utils/leadDataBuilder.ts`)

**Function:** `buildLeadSubmissionData(userProfile, appointmentType, assets, policies, beneficiaries)`

**Responsibilities:**
- Calculates client age from date of birth
- Aggregates asset categories for partner-required booleans
- Identifies minor children from beneficiaries
- Builds the outbound `LeadSubmissionData` payload with only the partner-required fields
- Leaves POPIA, estate-threshold, and submission-tracking fields in MiWill only

**Data Mapping:**
- User profile → Age, employment status, marital status, full address
- Assets/Policies → Property/vehicle/other-asset booleans
- Beneficiaries → Minor-children boolean
- User selections → Appointment type

### 3. UI Components

#### ViewWillScreen (`src/screens/ViewWillScreen.tsx`)

**State Management:**
- `capitalLegacyOptIn`: Boolean for consent checkbox
- `appointmentType`: Selected appointment type ('single' | 'spouse_partner' | 'family')
- `capitalLegacySubmitting`: Loading state during submission

**Key Functions:**
- `loadWillData()`: Fetches will data and calculates estate value
- `regenerateWill()`: Regenerates will and recalculates estate value
- `submitCapitalLegacyLead()`: Handles lead submission with error handling

**Modal Structure:**
```
Approve Will Modal
├── Save & Prepare for Print (primary action)
├── Request Will Collection (primary action)
└── Capital Legacy Section (conditional, secondary)
    ├── Brief explanation
    ├── Appointment type selector
    └── Consent checkbox
```

### 4. User Service Extensions

**New Method:** `updateLeadSubmissionStatus(userId, leadId)`

Updates user profile with:
- `lead_submitted = true`
- `lead_submitted_at = Timestamp.now()`
- `lead_submission_id = leadId`

---

## Qualification Logic

### Threshold

**Minimum Estate Value**: R250,000 (250,000 ZAR)

**Calculation:**
```
Total Estate Value = Sum of all asset values + Sum of all policy values
```

### Qualification Requirements

User qualifies for Capital Legacy offer if **ALL** of the following are true:

1. **Estate Value**: `total_estate_value >= 250000`
2. **POPIA Consent**: `popia_accepted === true`
3. **Not Already Submitted**: `lead_submitted !== true`

### Submission Requirements

Lead is actually submitted if **ALL** of the following are true:

1. User qualifies (above requirements)
2. User explicitly opts in via checkbox (`capitalLegacyOptIn === true`)
3. User proceeds with approval action (Print or Collection)

---

## Consent Management

### Two-Tier Consent Model

1. **Registration Consent** (`lead_submission_consent`)
   - General consent to be contacted by Capital Legacy
   - Collected during registration/profile update
   - Stored with timestamp: `lead_submission_consent_at`

2. **Contextual Consent** (Checkbox in Approve Modal)
   - Explicit opt-in at the moment of will approval
   - User must actively check the box
   - Only valid if registration consent also exists

### POPIA Compliance

- All consent is explicit and documented
- Users can see exactly what data is shared (disclaimers in modal)
- Consent timestamps stored for audit trail
- One-time submission prevents repeated requests

---

## API Integration

### Endpoint Configuration

**Environment Variables Required:**
```bash
EXPO_PUBLIC_LEAD_API_URL=https://api.capitallegacy.co.za/v1
EXPO_PUBLIC_LEAD_API_KEY=your_api_key_here
```

**API Endpoint:**
```
POST ${EXPO_PUBLIC_LEAD_API_URL}/leads
```

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer ${EXPO_PUBLIC_LEAD_API_KEY}
```

**Request Body:**
Only the partner-required `LeadSubmissionData` fields as JSON:

```json
{
  "client_age": 42,
  "employment_status": "employed",
  "has_minor_children": true,
  "has_property": true,
  "has_vehicle": true,
  "has_other_assets": true,
  "marital_status": "married",
  "client_address": "25 Protea Street, Johannesburg, Gauteng, 2191",
  "appointment_type": "spouse_partner"
}
```

MiWill continues to store `popia_accepted`, `lead_submission_consent`, `lead_submitted`,
`lead_submission_id`, `total_estate_value`, and related timestamps internally in Firebase.

**Response Handling:**
- Success: Returns `{ lead_id: string }` or `{ id: string }`
- Error: Returns error message, logged and shown to user (non-blocking)

### Error Handling

- **Missing Configuration**: Throws error if API URL/key not set
- **Network Errors**: Caught and logged, user sees friendly error message
- **API Errors**: Response status/error message captured and displayed
- **Non-Blocking**: All errors allow MiWill approval flow to continue

---

## Data Flow Diagram

```
┌─────────────────┐
│  Registration   │
│  Screen         │
└────────┬────────┘
         │
         │ Collects: DOB, Employment, Income, Marital Status, Consent
         ▼
┌─────────────────┐
│  User Profile   │
│  (Firebase)     │
└────────┬────────┘
         │
         │ User adds Assets & Policies
         ▼
┌─────────────────┐
│  View Will      │
│  Screen         │
└────────┬────────┘
         │
         │ Auto-calculates: total_estate_value
         │ Stores in: userProfile.total_estate_value
         ▼
┌─────────────────┐
│  Approve Will   │
│  Modal          │
└────────┬────────┘
         │
         │ IF (estate >= R250k && POPIA && !submitted)
         │   Show Capital Legacy section
         │
         │ User checks consent checkbox
         │ User selects Print or Collection
         ▼
┌─────────────────┐
│  Lead Service   │
└────────┬────────┘
         │
         │ IF (all conditions met)
         │   buildLeadSubmissionData()
         │   submitLead() → Capital Legacy API
         │   updateLeadSubmissionStatus()
         ▼
┌─────────────────┐
│  Capital Legacy │
│  API            │
└─────────────────┘
```

---

## Testing Checklist

### Test Scenarios

1. **Below Threshold (< R250k)**
   - [ ] User with estate < R250k does not see Capital Legacy section
   - [ ] Approval flow works normally without CL mention

2. **Above Threshold (≥ R250k)**
   - [ ] User with estate ≥ R250k sees Capital Legacy section
   - [ ] Section only appears if POPIA accepted
   - [ ] Section hidden if already submitted

3. **Opt-In Flow**
   - [ ] User can check/uncheck consent checkbox
   - [ ] Appointment type selector works (Single/Spouse/Family)
   - [ ] Lead only submitted if checkbox is checked

4. **Submission**
   - [ ] Lead submitted when user approves with checkbox checked
   - [ ] Success message shown after submission
   - [ ] User profile updated with submission status
   - [ ] Capital Legacy section hidden on subsequent approvals

5. **Error Handling**
   - [ ] Missing API config shows appropriate error
   - [ ] Network errors don't block approval flow
   - [ ] API errors are logged and user-friendly message shown

6. **One-Time Behavior**
   - [ ] User cannot submit multiple leads
   - [ ] Section doesn't reappear after successful submission
   - [ ] Success message mentions "won't ask again"

### Test Data Requirements

- User with estate < R250k
- User with estate ≥ R250k
- User with POPIA accepted/not accepted
- User with/without lead submission consent
- User who has already submitted a lead

---

## Configuration

### Environment Variables

Add to your `.env` or Expo config:

```bash
EXPO_PUBLIC_LEAD_API_URL=https://api.capitallegacy.co.za/v1
EXPO_PUBLIC_LEAD_API_KEY=your_capital_legacy_api_key
```

### Firebase Collections

**No new collections required.** All data stored in existing `users` collection with extended fields.

---

## Future Enhancements (Optional)

1. **Learn More Modal**: Expand disclaimers into a separate modal for cleaner main UI
2. **Dashboard Reminder**: Optional gentle reminder if user qualifies but hasn't reached View Will
3. **Lead Status Tracking**: Show user when Capital Legacy has contacted them
4. **Resubmission Logic**: Allow resubmission if estate value changes significantly

---

## Summary

The Capital Legacy integration is **fully implemented** and ready for production use once API credentials are configured. The implementation follows best practices for:

- ✅ **Explicit Consent**: Users must actively opt-in
- ✅ **Non-Blocking UX**: Never interferes with core MiWill functionality
- ✅ **Data Privacy**: POPIA compliant with clear disclaimers
- ✅ **One-Time Submission**: Prevents duplicate leads
- ✅ **Error Resilience**: Graceful failure handling
- ✅ **Background Processing**: Estate calculation happens automatically

**Next Steps:**
1. Obtain Capital Legacy API credentials
2. Configure environment variables
3. Test with real API endpoint
4. Monitor lead submissions and user feedback

---

**Document Version**: 1.0  
**Last Updated**: Implementation Complete  
**Status**: Ready for API Configuration & Testing
