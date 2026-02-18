# API Integration Implementation Guide

## Overview

This document outlines how to integrate the Lead Management API into the current MiWill application flow. The integration will allow qualified users (based on total asset value) to be automatically submitted as leads to **Capital Legacy's** booking system for Testamentary Consultant (TC) consultations.

### Qualification Threshold

- **Asset Value ≥ R250,000**: User qualifies for Capital Legacy lead submission
- **Asset Value ≤ R249,999**: User remains as a standard MiWill client (existing behavior)

### Data Persistence Policy

**CRITICAL**: All user data is **ALWAYS** saved in the MiWill application regardless of:
- Qualification status (above or below threshold)
- Capital Legacy consent status
- API submission success or failure
- User's lead submission status

The Capital Legacy API integration is an **additional service layer** that sends qualified leads to Capital Legacy. It does **NOT** replace or interfere with MiWill's core data storage functionality. Users continue to use MiWill normally, and their data remains accessible in the MiWill system at all times.

When the threshold is met (R250,000+) and the user consents, additional data is sent to Capital Legacy API **in addition to** being saved in MiWill.

---

## Table of Contents

1. [Current App Data Structure](#current-app-data-structure)
2. [Data Mapping: App → API Requirements](#data-mapping-app--api-requirements)
3. [Missing Data Fields](#missing-data-fields)
4. [Implementation Architecture](#implementation-architecture)
5. [Integration Points](#integration-points)
6. [Implementation Steps](#implementation-steps)
7. [API Service Implementation](#api-service-implementation)
8. [User Flow Integration](#user-flow-integration)
9. [Testing & Validation](#testing--validation)

---

## Current App Data Structure

### User Profile (`UserProfile` interface)
**Location:** `src/types/user.ts`

```typescript
{
  user_id: string;
  email: string;
  phone: string;
  first_name: string;
  surname: string;
  id_number: string;
  address?: string;
  policy_number?: string;
  popia_accepted: boolean;
  popia_accepted_at?: Date | string;
  // ... other fields
}
```

### Assets (`AssetInformation` interface)
**Location:** `src/types/asset.ts`

- Property ownership (via `asset_type: 'property'`)
- Vehicle ownership (via `asset_type: 'vehicle'`)
- Other assets (investments, collectibles, etc.)

### Policies (`PolicyInformation` interface)
**Location:** `src/types/policy.ts`

- Insurance policies and coverage details

### Beneficiaries (`BeneficiaryInformation` interface)
**Location:** `src/types/beneficiary.ts`

- Relationship information (can infer marital status)
- Minor children (via `relationship_to_user` field)

---

## Data Mapping: App → API Requirements

### ✅ Already Available in App

| API Requirement | App Data Source | Status |
|----------------|----------------|--------|
| **Client age** | ❌ Not collected | **MISSING** |
| **Employment status** | ❌ Not collected | **MISSING** |
| **Minor children** | ✅ `beneficiaries` collection (filter by relationship) | **AVAILABLE** |
| **Property ownership** | ✅ `assets` collection (filter `asset_type: 'property'`) | **AVAILABLE** |
| **Vehicle ownership** | ✅ `assets` collection (filter `asset_type: 'vehicle'`) | **AVAILABLE** |
| **Other assets** | ✅ `assets` collection (other types) | **AVAILABLE** |
| **Marital/relationship status** | ⚠️ Can infer from beneficiaries | **PARTIAL** |
| **Client location** | ✅ `userProfile.address` | **AVAILABLE** |
| **Appointment type** | ❌ Not collected | **MISSING** |
| **Email** | ✅ `userProfile.email` | **AVAILABLE** |
| **Phone** | ✅ `userProfile.phone` | **AVAILABLE** |
| **Full name** | ✅ `userProfile.first_name + surname` | **AVAILABLE** |
| **ID Number** | ✅ `userProfile.id_number` | **AVAILABLE** |
| **Total asset value** | ✅ Calculated from `assets` collection (sum of `asset_value`) | **AVAILABLE** |
| **Monthly income** | ❌ Not collected (optional field) | **OPTIONAL** |
| **Explicit opt-in** | ✅ `userProfile.popia_accepted` | **AVAILABLE** |

---

## Missing Data Fields

### Required New Fields

#### 1. User Profile Extensions
**File:** `src/types/user.ts`

```typescript
export interface UserProfile {
  // ... existing fields ...
  
  // NEW FIELDS FOR API INTEGRATION
  date_of_birth?: string; // YYYY-MM-DD format (to calculate age)
  employment_status?: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student' | 'other';
  monthly_income?: number; // Rands per month (optional, for Capital Legacy data)
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'domestic_partnership' | 'other';
  total_estate_value?: number; // Calculated total of assets + policies (for qualification check)
  lead_submission_consent?: boolean; // Explicit consent for lead submission to Capital Legacy
  lead_submission_consent_at?: Date | string; // Timestamp of consent
  lead_submitted?: boolean; // Track if lead has been submitted to Capital Legacy
  lead_submitted_at?: Date | string; // Timestamp of submission
  lead_submission_id?: string; // Reference ID from Capital Legacy API
}
```

#### 2. Appointment Type Selection
**New Component:** `src/components/LeadSubmissionModal.tsx`

Users should be able to select (drop-down):
- Single consultation
- Spouse/partner consultation
- Family consultation

---

## Implementation Architecture

### Service Layer Structure

```
src/services/
├── leadService.ts          [NEW] - Handles API communication
├── userService.ts          [MODIFY] - Add new user fields
└── ...existing services
```

### Component Structure

```
src/components/
├── LeadSubmissionModal.tsx [NEW] - Consent & appointment type selection
└── ...existing components

src/screens/
├── RegistrationScreen.tsx   [MODIFY] - Collect new fields
├── UpdateProfileScreen.tsx  [MODIFY] - Allow editing new fields
└── DashboardScreen.tsx      [MODIFY] - Add lead submission trigger
```

---

## Integration Points

### 1. Registration Flow
**File:** `src/screens/RegistrationScreen.tsx`

**When:** During user registration

**Action:**
- Add step to collect:
  - Date of birth
  - Employment status
  - Monthly income (optional, for Capital Legacy data)
  - Marital status
- **Note:** Estate value calculation happens later, after user completes adding all assets and beneficiaries
- **Always save all data to MiWill regardless of qualification status**

### 2. Profile Update Flow
**File:** `src/screens/UpdateProfileScreen.tsx`

**When:** User updates their profile

**Action:**
- Allow editing of new fields (date of birth, employment status, income, marital status)
- **Note:** Estate value is calculated separately after all assets/beneficiaries are added
- **Always save updated data to MiWill**

### 3. Dashboard Flow (Post-Asset/Beneficiary Addition)
**File:** `src/screens/DashboardScreen.tsx`

**When:** User has completed adding all assets and beneficiaries

**Action:**
- **Background calculation:** System automatically calculates total estate value once after user finishes adding assets and beneficiaries
- Store calculated value in `userProfile.total_estate_value` (one-time calculation)
- If estate value ≥ R250,000 and user hasn't submitted lead:
  - Show banner/button: "You qualify for a free consultation with Capital Legacy"
  - Opens `LeadSubmissionModal` for consent and appointment type selection
  - Submits lead to Capital Legacy API
- **All data remains saved in MiWill regardless of submission**
- **No need to recalculate** - value is stored and reused

### 4. Post-Asset/Beneficiary Addition (Estate Calculation Trigger)
**Files:** `src/screens/AddAssetScreen.tsx`, `src/screens/AddPolicyScreen.tsx`, `src/screens/AddBeneficiaryScreen.tsx`, `src/screens/DashboardScreen.tsx`

**When:** User completes adding all assets and beneficiaries (onboarding finished)

**Trigger Point Options:**
- Option A: "Complete Setup" or "Finish" button on Dashboard after user has added assets/beneficiaries
- Option B: Automatic trigger when user navigates away from asset/beneficiary screens after adding items
- Option C: Dedicated "Calculate Estate Value" button (if you want explicit user action)

**Action:**
- **Background calculation (one-time):** System calculates total estate value:
  - Fetch all assets from `assets` collection
  - Fetch all policies from `policies` collection
  - Sum all `asset_value` from assets
  - Sum all `policy_value` from policies
  - Total = assets + policies
  - Store in `userProfile.total_estate_value` (persisted to Firebase)
- If estate value ≥ R250,000 and hasn't submitted lead:
  - Show banner: "Your estate qualifies for a free Capital Legacy consultation"
  - Link to lead submission flow
- **All assets, policies, and beneficiaries are always saved to MiWill**
- **Calculation happens once** - stored value is reused for all future qualification checks
- **No recalculation needed** unless user explicitly adds more assets later (then recalculate once again)

---

## Implementation Steps

### Phase 1: Data Model Updates

#### Step 1.1: Update User Type Definition
**File:** `src/types/user.ts`

```typescript
// Add new fields to UserProfile interface
export interface UserProfile {
  // ... existing fields ...
  date_of_birth?: string;
  employment_status?: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student' | 'other';
  monthly_income?: number;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'domestic_partnership' | 'other';
  lead_submission_consent?: boolean;
  lead_submission_consent_at?: Date | string;
  lead_submitted?: boolean;
  lead_submitted_at?: Date | string;
  lead_submission_id?: string;
}
```

#### Step 1.2: Create Lead Submission Type
**File:** `src/types/lead.ts` [NEW]

```typescript
export type AppointmentType = 'single' | 'spouse_partner' | 'family';

export interface LeadSubmissionData {
  // Client Information
  client_age: number;
  client_email: string;
  client_phone: string;
  client_full_name: string;
  client_id_number: string;
  client_address: string;
  
  // Qualification Data
  total_estate_value: number; // Sum of assets + policies
  monthly_income?: number; // Optional
  employment_status: string;
  marital_status: string;
  
  // Asset Information
  has_property: boolean;
  has_vehicle: boolean;
  has_other_assets: boolean;
  asset_details?: string; // Summary of assets
  asset_values?: {
    total_assets: number;
    total_policies: number;
    estate_total: number;
  };
  
  // Family Information
  has_minor_children: boolean;
  minor_children_count?: number;
  
  // Appointment Details
  appointment_type: AppointmentType;
  
  // Consent & Compliance
  popia_consent: boolean;
  consent_timestamp: string;
  
  // Metadata
  source: 'miwill_app';
  user_id: string; // Internal reference
}
```

### Phase 2: Service Implementation

#### Step 2.1: Create Lead Service
**File:** `src/services/leadService.ts` [NEW]

```typescript
import { LeadSubmissionData } from '../types/lead';

export class LeadService {
  private static apiBaseUrl = process.env.EXPO_PUBLIC_LEAD_API_URL || '';
  private static apiKey = process.env.EXPO_PUBLIC_LEAD_API_KEY || '';

  /**
   * Submit a qualified lead to the partner API
   */
  static async submitLead(leadData: LeadSubmissionData): Promise<{ success: boolean; leadId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        leadId: result.lead_id || result.id,
      };
    } catch (error: any) {
      console.error('[LeadService] Error submitting lead:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit lead',
      };
    }
  }

  /**
   * Calculate total estate value from assets and policies
   * This is called ONCE after user completes adding all assets and beneficiaries
   */
  static calculateTotalEstateValue(
    assets: Array<{ asset_value?: number }>,
    policies: Array<{ policy_value?: number }>
  ): number {
    const totalAssets = assets.reduce((sum, asset) => sum + (asset.asset_value || 0), 0);
    const totalPolicies = policies.reduce((sum, policy) => sum + (policy.policy_value || 0), 0);
    return totalAssets + totalPolicies;
  }

  /**
   * Calculate and store estate value in user profile
   * Called once after user finishes adding all assets/beneficiaries
   */
  static async calculateAndStoreEstateValue(
    userId: string,
    assets: Array<{ asset_value?: number }>,
    policies: Array<{ policy_value?: number }>
  ): Promise<number> {
    const totalEstateValue = this.calculateTotalEstateValue(assets, policies);
    
    // Store in user profile (one-time calculation)
    await UserService.updateUser(userId, {
      total_estate_value: totalEstateValue,
    });
    
    return totalEstateValue;
  }

  /**
   * Check if user qualifies for Capital Legacy lead submission
   * Qualification: Total estate value (assets + policies) ≥ R250,000
   */
  static qualifiesForLeadSubmission(
    totalEstateValue: number,
    popiaAccepted: boolean
  ): boolean {
    const MIN_ESTATE_VALUE = 250000; // R250,000 threshold
    return (
      popiaAccepted &&
      totalEstateValue >= MIN_ESTATE_VALUE
    );
  }

  /**
   * Calculate age from date of birth
   */
  static calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}
```

#### Step 2.2: Update User Service
**File:** `src/services/userService.ts`

Add method to update lead submission status:

```typescript
static async updateLeadSubmissionStatus(
  userId: string,
  leadId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, this.collection, userId), {
      lead_submitted: true,
      lead_submitted_at: Timestamp.now(),
      lead_submission_id: leadId,
      updated_at: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(`Failed to update lead submission status: ${error.message}`);
  }
}
```

### Phase 3: Component Implementation

#### Step 3.1: Create Lead Submission Modal
**File:** `src/components/LeadSubmissionModal.tsx` [NEW]

```typescript
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { AppointmentType } from '../types/lead';

interface LeadSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (appointmentType: AppointmentType) => Promise<void>;
}

export const LeadSubmissionModal: React.FC<LeadSubmissionModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [selectedType, setSelectedType] = useState<AppointmentType>('single');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(selectedType);
      Alert.alert(
        'Success',
        'Your consultation request has been submitted. A booking agent will contact you within 24 hours.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Free Will Consultation</Text>
          <Text style={styles.description}>
            You qualify for a free consultation with one of our Testamentary Consultants.
            Select your preferred appointment type:
          </Text>
          
          {/* Appointment type selection */}
          <TouchableOpacity
            style={[styles.option, selectedType === 'single' && styles.optionSelected]}
            onPress={() => setSelectedType('single')}
          >
            <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.optionText}>Single Consultation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.option, selectedType === 'spouse_partner' && styles.optionSelected]}
            onPress={() => setSelectedType('spouse_partner')}
          >
            <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.optionText}>Spouse/Partner Consultation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.option, selectedType === 'family' && styles.optionSelected]}
            onPress={() => setSelectedType('family')}
          >
            <Ionicons name="people" size={24} color={theme.colors.primary} />
            <Text style={styles.optionText}>Family Consultation</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
```

#### Step 3.2: Update Registration Screen
**File:** `src/screens/RegistrationScreen.tsx`

Add new form fields in registration steps:

```typescript
// Add to StepData type
type StepData = {
  // ... existing fields ...
  dateOfBirth: string;
  employmentStatus: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student' | 'other' | '';
  monthlyIncome: string; // Optional field for Capital Legacy data
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'domestic_partnership' | 'other' | '';
  leadSubmissionConsent: boolean; // Consent for Capital Legacy lead submission
};

// Add new step or integrate into existing steps
// Collect date of birth, employment status, income (optional), marital status
// NOTE: Estate value calculation happens later, after user completes adding all assets/beneficiaries
// IMPORTANT: All data is saved to MiWill regardless of consent or qualification
```

#### Step 3.3: Update Dashboard Screen
**File:** `src/screens/DashboardScreen.tsx`

Add lead submission trigger:

```typescript
import { LeadService } from '../services/leadService';
import { LeadSubmissionModal } from '../components/LeadSubmissionModal';

// In component:
const [showLeadModal, setShowLeadModal] = useState(false);

// Check if user qualifies (using stored estate value)
useEffect(() => {
  const checkQualification = async () => {
    if (userProfile && !userProfile.lead_submitted) {
      // Use stored estate value (calculated once after assets/beneficiaries added)
      const totalEstateValue = userProfile.total_estate_value || 0;
      
      const qualifies = LeadService.qualifiesForLeadSubmission(
        totalEstateValue,
        userProfile.popia_accepted
      );
      
      if (qualifies && userProfile.lead_submission_consent) {
        // Show banner or button to submit lead to Capital Legacy
      }
    }
  };
  checkQualification();
}, [userProfile]);

// Trigger estate calculation after user completes adding assets/beneficiaries
const handleCompleteAssetSetup = async () => {
  // Fetch all assets and policies
  const [assets, policies] = await Promise.all([
    AssetService.getUserAssets(userProfile.user_id),
    PolicyService.getUserPolicies(userProfile.user_id),
  ]);
  
  // Calculate and store estate value (one-time calculation)
  const totalEstateValue = await LeadService.calculateAndStoreEstateValue(
    userProfile.user_id,
    assets,
    policies
  );
  
  // Check if user qualifies for Capital Legacy
  if (LeadService.qualifiesForLeadSubmission(totalEstateValue, userProfile.popia_accepted)) {
    // Show Capital Legacy qualification banner
    setShowCapitalLegacyBanner(true);
  }
};

const handleLeadSubmission = async (appointmentType: AppointmentType) => {
  // Fetch latest data (estate value already calculated and stored)
  const [assets, policies, beneficiaries] = await Promise.all([
    AssetService.getUserAssets(userProfile.user_id),
    PolicyService.getUserPolicies(userProfile.user_id),
    BeneficiaryService.getUserBeneficiaries(userProfile.user_id),
  ]);
  
  // Build lead data from user profile, assets, policies, beneficiaries
  // Uses stored total_estate_value from userProfile
  const leadData = await buildLeadSubmissionData(
    userProfile, 
    appointmentType, 
    assets, 
    policies, 
    beneficiaries
  );
  
  // IMPORTANT: Always save data to MiWill first (existing behavior)
  // Data is already saved through normal app flow
  
  // Submit to Capital Legacy API
  const result = await LeadService.submitLead(leadData);
  
  if (result.success && result.leadId) {
    // Update user profile with Capital Legacy submission status
    await UserService.updateLeadSubmissionStatus(userProfile.user_id, result.leadId);
  }
};
```

### Phase 4: Data Aggregation Logic

#### Step 4.1: Build Lead Data Function
**File:** `src/utils/leadDataBuilder.ts` [NEW]

```typescript
import { UserProfile } from '../types/user';
import { AssetInformation } from '../types/asset';
import { PolicyInformation } from '../types/policy';
import { BeneficiaryInformation } from '../types/beneficiary';
import { LeadSubmissionData, AppointmentType } from '../types/lead';
import { LeadService } from '../services/leadService';

export async function buildLeadSubmissionData(
  userProfile: UserProfile,
  appointmentType: AppointmentType,
  assets: AssetInformation[],
  policies: PolicyInformation[],
  beneficiaries: BeneficiaryInformation[]
): Promise<LeadSubmissionData> {
  // Calculate age
  const age = userProfile.date_of_birth
    ? LeadService.calculateAge(userProfile.date_of_birth)
    : 0;

  // Use stored estate value (calculated once after assets/beneficiaries added)
  // If not stored, calculate as fallback (shouldn't happen in normal flow)
  const totalEstateValue = userProfile.total_estate_value || 
    LeadService.calculateTotalEstateValue(assets, policies);
  
  // Calculate breakdown for API (using current assets/policies)
  const totalAssets = assets.reduce((sum, asset) => sum + (asset.asset_value || 0), 0);
  const totalPolicies = policies.reduce((sum, policy) => sum + (policy.policy_value || 0), 0);

  // Check for property ownership
  const hasProperty = assets.some(asset => asset.asset_type === 'property');

  // Check for vehicle ownership
  const hasVehicle = assets.some(asset => asset.asset_type === 'vehicle');

  // Check for other assets
  const otherAssets = assets.filter(
    asset => asset.asset_type !== 'property' && asset.asset_type !== 'vehicle'
  );
  const hasOtherAssets = otherAssets.length > 0;

  // Build asset summary
  const assetDetails = [
    hasProperty && 'Property',
    hasVehicle && 'Vehicle',
    otherAssets.length > 0 && `${otherAssets.length} other asset(s)`,
  ]
    .filter(Boolean)
    .join(', ');

  // Check for minor children
  const minorChildren = beneficiaries.filter(
    ben => ben.relationship_to_user?.toLowerCase().includes('child')
  );
  const hasMinorChildren = minorChildren.length > 0;

  return {
    // Client Information
    client_age: age,
    client_email: userProfile.email,
    client_phone: userProfile.phone,
    client_full_name: `${userProfile.first_name} ${userProfile.surname}`.trim(),
    client_id_number: userProfile.id_number,
    client_address: userProfile.address || '',

    // Qualification Data
    total_estate_value: totalEstateValue,
    monthly_income: userProfile.monthly_income,
    employment_status: userProfile.employment_status || 'other',
    marital_status: userProfile.marital_status || 'single',

    // Asset Information
    has_property: hasProperty,
    has_vehicle: hasVehicle,
    has_other_assets: hasOtherAssets,
    asset_details: assetDetails,
    asset_values: {
      total_assets: totalAssets,
      total_policies: totalPolicies,
      estate_total: totalEstateValue,
    },

    // Family Information
    has_minor_children: hasMinorChildren,
    minor_children_count: minorChildren.length,

    // Appointment Details
    appointment_type: appointmentType,

    // Consent & Compliance
    popia_consent: userProfile.popia_accepted,
    consent_timestamp: userProfile.popia_accepted_at
      ? new Date(userProfile.popia_accepted_at).toISOString()
      : new Date().toISOString(),

    // Metadata
    source: 'miwill_app',
    user_id: userProfile.user_id,
  };
}
```

---

## User Flow Integration

### Flow 1: Registration → Asset Addition → Estate Calculation → Lead Submission

```
1. User completes registration
   ↓
2. Collects: DOB, employment, income (optional), marital status
   ↓
3. User adds assets and/or policies (can add multiple)
   ↓
4. User adds beneficiaries
   ↓
5. User indicates completion (e.g., clicks "Finish" or "Complete Setup")
   ↓
6. BACKGROUND: System automatically calculates total estate value ONCE
   - Sums all asset values
   - Sums all policy values
   - Stores in userProfile.total_estate_value
   ↓
7. If estate value ≥ R250,000:
   ↓
8. Shows Capital Legacy lead submission consent checkbox
   ↓
9. If consented:
   ↓
10. Show "Would you like to schedule a free consultation with Capital Legacy?" prompt
   ↓
11. User selects appointment type (dropdown)
   ↓
12. Lead submitted to Capital Legacy API
   ↓
13. All data saved to MiWill (regardless of submission)
   ↓
14. User sees confirmation message
```

### Flow 2: Dashboard → Lead Submission (Using Stored Estate Value)

```
1. User on dashboard
   ↓
2. System checks stored estate value (userProfile.total_estate_value)
   - This was calculated once after user finished adding assets/beneficiaries
   - No recalculation needed
   ↓
3. System checks:
   - Estate value ≥ R250,000?
   - POPIA accepted?
   - Lead not yet submitted to Capital Legacy?
   ↓
4. If all true:
   ↓
5. Show banner: "Your estate qualifies for a free Capital Legacy consultation"
   ↓
6. User clicks banner
   ↓
7. Opens LeadSubmissionModal
   ↓
8. User selects appointment type (dropdown)
   ↓
9. Lead submitted to Capital Legacy API
   ↓
10. All data remains saved in MiWill
   ↓
11. Banner disappears, confirmation shown
```

### Flow 3: Asset/Beneficiary Addition → Estate Calculation Trigger

```
1. User adds assets and/or policies (can add multiple)
   ↓
2. User adds beneficiaries
   ↓
3. User clicks "Finish" or "Complete Setup" button
   ↓
4. BACKGROUND CALCULATION (one-time):
   - System fetches all assets
   - System fetches all policies
   - Calculates: total_estate_value = sum(assets) + sum(policies)
   - Stores in userProfile.total_estate_value
   ↓
5. If estate value ≥ R250,000 and lead not submitted:
   ↓
6. Show prompt: "Your estate qualifies for a Capital Legacy consultation"
   ↓
7. User can proceed to lead submission
   ↓
8. All assets/policies/beneficiaries saved to MiWill (existing behavior)
   ↓
9. Estate value stored - no need to recalculate unless user adds more assets later
```

### Flow 4: Data Persistence (Always)

```
1. User enters any data (profile, assets, policies, beneficiaries)
   ↓
2. Data is ALWAYS saved to MiWill Firebase
   ↓
3. If estate value ≥ R250,000 AND user consents:
   ↓
4. Additional data sent to Capital Legacy API
   ↓
5. MiWill data remains unchanged and accessible
```

---

## Testing & Validation

### Test Cases

#### 1. Qualification Check
- ✅ User with estate value R250,000+ qualifies for Capital Legacy
- ✅ User with estate value < R250,000 remains as MiWill client
- ✅ User without POPIA consent doesn't qualify
- ✅ User who already submitted doesn't see prompt
- ✅ Estate value calculated once after all assets/beneficiaries added
- ✅ Stored estate value used for qualification checks (no recalculation)
- ✅ Data always saved to MiWill regardless of qualification

#### 2. Data Collection & Estate Calculation
- ✅ All required fields collected during registration
- ✅ Optional fields handled gracefully
- ✅ Age calculated correctly from DOB
- ✅ Asset detection works (property, vehicle, other)
- ✅ Estate value calculated once in background after user completes asset/beneficiary setup
- ✅ Estate value stored and reused (no unnecessary recalculations)
- ✅ All data persisted to MiWill regardless of Capital Legacy submission

#### 3. API Submission
- ✅ Lead data formatted correctly for Capital Legacy
- ✅ API authentication works
- ✅ Error handling for API failures
- ✅ Success updates user profile with Capital Legacy submission status
- ✅ MiWill data remains intact even if API submission fails
- ✅ Total estate value stored in user profile for future reference

#### 4. User Experience
- ✅ Consent checkbox clearly visible
- ✅ Appointment type selection intuitive
- ✅ Confirmation messages clear
- ✅ No duplicate submissions

---

## Environment Variables

Add to `.env` or `app.config.js`:

```javascript
EXPO_PUBLIC_LEAD_API_URL=https://api.capitallegacy.com/v1
EXPO_PUBLIC_LEAD_API_KEY=your_capital_legacy_api_key_here
```

---

## Security Considerations

1. **API Key Storage**: Store Capital Legacy API keys in environment variables, never in code
2. **Data Validation**: Validate all user input before API submission
3. **Consent Tracking**: Always verify `popia_accepted` before submission to Capital Legacy
4. **Error Handling**: Don't expose API errors to users, log internally
5. **Rate Limiting**: Implement client-side rate limiting to prevent abuse
6. **Data Persistence**: Ensure MiWill data is saved independently of Capital Legacy API calls
7. **Estate Value Calculation**: Always recalculate estate value from current assets/policies before qualification check

---

## Important Notes

### Data Persistence
- **All user data is ALWAYS saved to MiWill** regardless of Capital Legacy qualification or submission status
- The Capital Legacy API integration is an additional service layer that does not replace MiWill's core functionality
- Users with estate values below R250,000 continue to use MiWill as normal

### Estate Value Calculation
- **Total estate value = Sum of all `asset_value` fields + Sum of all `policy_value` fields**
- **Calculation happens ONCE in the background** after user completes adding all assets and beneficiaries
- **Trigger:** When user indicates they're done (e.g., clicks "Finish" or "Complete Setup")
- **Storage:** Value is stored in `userProfile.total_estate_value` for future reference
- **No recalculation needed** - value is stored and reused unless user explicitly adds more assets later
- **Background process** - calculation happens automatically, not a visible step in the UI

### Capital Legacy Integration
- Only users with estate value ≥ R250,000 are eligible
- Requires explicit consent (`lead_submission_consent`)
- Requires POPIA acceptance (`popia_accepted`)
- Submission is one-way: data sent to Capital Legacy, but MiWill remains the source of truth

## Future Enhancements

1. **Lead Status Tracking**: Poll Capital Legacy API to check lead status (contacted, booked, completed)
2. **Appointment Reminders**: Integrate with calendar for Capital Legacy appointment reminders
3. **Feedback Loop**: Allow users to provide feedback after Capital Legacy consultation
4. **Analytics**: Track conversion rates from lead submission to consultation booking
5. **Estate Value Dashboard**: Show estate value breakdown and qualification status on dashboard

---

## Summary Checklist

### Data Model
- [ ] Add new fields to `UserProfile` interface (including `total_estate_value`)
- [ ] Create `LeadSubmissionData` type (with `total_estate_value` and `asset_values`)
- [ ] Create `AppointmentType` type

### Services
- [ ] Create `LeadService` with Capital Legacy API integration
- [ ] Add `calculateTotalEstateValue` method to `LeadService`
- [ ] Update `qualifiesForLeadSubmission` to use asset value threshold (R250,000)
- [ ] Add lead submission status update to `UserService`
- [ ] Create `leadDataBuilder` utility with estate value calculation

### Components
- [ ] Create `LeadSubmissionModal` component
- [ ] Update `RegistrationScreen` with new fields
- [ ] Update `UpdateProfileScreen` with new fields
- [ ] Add lead submission trigger to `DashboardScreen`

### Integration
- [ ] Add environment variables for Capital Legacy API
- [ ] Implement estate value calculation trigger (after user completes asset/beneficiary setup)
- [ ] Add background calculation function (runs once, stores result)
- [ ] Add qualification checks based on R250,000 threshold (uses stored value)
- [ ] Ensure data persistence to MiWill regardless of API submission
- [ ] Implement error handling (MiWill data saved even if API fails)
- [ ] Add "Complete Setup" or "Finish" button to trigger estate calculation

### Testing
- [ ] Test qualification logic
- [ ] Test API submission
- [ ] Test user flows
- [ ] Test error scenarios

---

*Last Updated: [Date]*
