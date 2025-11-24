# Firebase Setup Guide for MiWill Application

This guide provides step-by-step instructions for setting up the Firebase backend for the MiWill application, including Firestore collections, Storage buckets, and security rules.

---

## Table of Contents

1. [Firebase Console Navigation](#firebase-console-navigation)
2. [Project Setup](#project-setup)
3. [Firestore Database Setup](#firestore-database-setup)
4. [Firebase Storage Setup](#firebase-storage-setup)
5. [Security Rules Configuration](#security-rules-configuration)
6. [Complete Collection Structure](#complete-collection-structure)

---

## Firebase Console Navigation

### **Accessing Firebase Console**

1. **Open Firebase Console**:
   - Go to [https://console.firebase.google.com](https://console.firebase.google.com)
   - Sign in with your Google account

2. **Main Dashboard Navigation**:
   - **Project Overview**: Shows project summary, usage statistics, and quick links
   - **Left Sidebar Menu**: Contains all Firebase services:
     - **Build** section: Cloud Functions, Hosting, App Check
     - **Release & Monitor**: Performance, Crashlytics, Test Lab
     - **Engage**: Analytics, A/B Testing, Predictions
     - **Grow**: Remote Config, Dynamic Links, In-App Messaging
     - **Develop** section: Authentication, Firestore Database, Realtime Database, Storage, Hosting
     - **Settings** (gear icon): Project settings, users, permissions

3. **Navigating to Specific Services**:
   - **Firestore Database**: Click "Firestore Database" in the left sidebar under "Build"
   - **Storage**: Click "Storage" in the left sidebar under "Build"
   - **Authentication**: Click "Authentication" in the left sidebar under "Build"
   - **Functions**: Click "Functions" in the left sidebar under "Build"

---

## Project Setup

### **Step 1: Create Firebase Project**

1. **Create New Project**:
   - Click "Add project" or "+" button
   - Enter project name: `miwill-app` (or your preferred name)
   - Click "Continue"

2. **Configure Google Analytics** (Optional but recommended):
   - Toggle "Enable Google Analytics for this project" to ON
   - Select or create an Analytics account
   - Click "Create project"

3. **Wait for Project Creation**:
   - Firebase will provision your project (takes 30-60 seconds)
   - Click "Continue" when ready

### **Step 2: Enable Required Services**

1. **Enable Authentication**:
   - Click "Authentication" in left sidebar
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Click "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

2. **Create Firestore Database**:
   - Click "Firestore Database" in left sidebar
   - Click "Create database"
   - Select "Start in production mode" (we'll add security rules later)
   - Choose location: Select closest region to your users (e.g., `us-central` for US users)
   - Click "Enable"

3. **Enable Storage**:
   - Click "Storage" in left sidebar
   - Click "Get started"
   - Select "Start in production mode" (we'll add security rules later)
   - Choose same location as Firestore
   - Click "Done"

---

## Firestore Database Setup

### **Understanding Firestore Structure**

Firestore uses a **collection → document → fields** structure:
- **Collection**: Like a table in SQL (e.g., "users")
- **Document**: Like a row in SQL (e.g., a specific user)
- **Fields**: Like columns in SQL (e.g., "full_name", "email")

### **Step 3: Create Collections and Documents**

We'll create each collection one by one. In Firestore, you can create collections manually or they'll be created automatically when you add the first document.

#### **Collection 1: `users`**

**Purpose**: Store user profile information

1. **Navigate to Firestore**:
   - Click "Firestore Database" in left sidebar
   - You'll see an empty database

2. **Create Collection**:
   - Click "Start collection" button
   - Collection ID: `users`
   - Click "Next"

3. **Create First Document** (Template):
   - Document ID: Click "Auto-ID" (Firebase will generate UUID)
   - Add fields one by one:
     
     **Field 1**: `user_id`
     - Field: `user_id`
     - Type: `string`
     - Value: `test-user-001` (this will be replaced with actual Firebase Auth UID)
     - Click "Add field"

     **Field 2**: `email`
     - Field: `email`
     - Type: `string`
     - Value: `test@example.com`

     **Field 3**: `phone`
     - Field: `phone`
     - Type: `string`
     - Value: `+27825816642` (South African format with +27 prefix)
     - Note: Phone numbers are automatically formatted to +27 format

     **Field 4**: `first_name`
     - Field: `first_name`
     - Type: `string`
     - Value: `John`

     **Field 5**: `surname`
     - Field: `surname`
     - Type: `string`
     - Value: `Doe`

     **Field 6**: `full_name`
     - Field: `full_name`
     - Type: `string`
     - Value: `John Doe`
     - Note: Auto-generated from first_name + surname, kept for backward compatibility

     **Field 7**: `id_number`
     - Field: `id_number`
     - Type: `string`
     - Value: `1234567890123`

     **Field 8**: `policy_number`
     - Field: `policy_number`
     - Type: `string`
     - Value: `POL-001-2024`

     **Field 9**: `address`
     - Field: `address`
     - Type: `string`
     - Value: `123 Main Street, Johannesburg, Gauteng, 2000`
     - Note: User's full residential address

    **Field 10**: `profile_picture_path`
    - Field: `profile_picture_path`
    - Type: `string`
    - Value: `/Users/[your-username]/Desktop/MiWill-App/storage/profile_pictures/[user_id]/profile.jpg` (local file path)
    - Note: We are using local storage for now. Keep profile images under `MiWill-App/storage/profile_pictures/[user_id]/`. When migrating to Firebase Storage, you can add a separate `profile_picture_url` field to store the HTTPS URL.

     **Field 11**: `notification_frequency`
     - Field: `notification_frequency`
     - Type: `string`
     - Value: `weekly` (Options: daily, weekly, monthly, quarterly, custom_days)

     **Field 12**: `custom_frequency_days`
     - Field: `custom_frequency_days`
     - Type: `number`
     - Value: `7` (only if notification_frequency is "custom_days")

     **Field 13**: `popia_accepted`
     - Field: `popia_accepted`
     - Type: `boolean`
     - Value: `true` or `false`
     - Note: Indicates whether user accepted POPIA Act terms

     **Field 14**: `popia_accepted_at`
     - Field: `popia_accepted_at`
     - Type: `timestamp`
     - Value: Timestamp when POPIA was accepted (null if not accepted)

     **Field 15**: `account_created`
     - Field: `account_created`
     - Type: `timestamp`
     - Value: Click timestamp icon, select current date/time

     **Field 16**: `last_seen`
     - Field: `last_seen`
     - Type: `timestamp`
     - Value: Current date/time

     **Field 17**: `email_verified`
     - Field: `email_verified`
     - Type: `boolean`
     - Value: `false`

     **Field 18**: `phone_verified`
     - Field: `phone_verified`
     - Type: `boolean`
     - Value: `false`

     **Field 19**: `is_active`
     - Field: `is_active`
     - Type: `boolean`
     - Value: `true`

     **Field 20**: `onboarding_completed`
     - Field: `onboarding_completed`
     - Type: `boolean`
     - Value: `false`

     **Field 21**: `created_at`
     - Field: `created_at`
     - Type: `timestamp`
     - Value: Current date/time

     **Field 22**: `updated_at`
     - Field: `updated_at`
     - Type: `timestamp`
     - Value: Current date/time

     **Field 23**: `has_own_attorney`
     - Field: `has_own_attorney`
     - Type: `boolean`
     - Value: `false` (true if user provided their own attorney, false if using MiWill attorneys)
     - Note: Tracks whether user has assigned their own attorney or is using MiWill partner attorneys

     **Field 24**: `has_own_executor`
     - Field: `has_own_executor`
     - Type: `boolean`
     - Value: `false` (true if user provided their own executor, false if using MiWill executors)
     - Note: Tracks whether user has assigned their own executor or is using MiWill executors

     **Field 24**: `miwill_attorney_accepted`
     - Field: `miwill_attorney_accepted`
     - Type: `boolean`
     - Value: `false` (true if user agreed to use MiWill partner attorneys)
     - Note: Indicates user consent to MiWill attorney assignment

     **Field 25**: `miwill_executor_accepted`
     - Field: `miwill_executor_accepted`
     - Type: `boolean`
     - Value: `false` (true if user agreed to use MiWill executors)
     - Note: Indicates user consent to MiWill executor assignment

     **Field 26**: `attorney_notification_dismissed`
     - Field: `attorney_notification_dismissed`
     - Type: `boolean`
     - Value: `false` (true once user dismisses the attorney update notification)
     - Note: Prevents showing attorney notification after user has seen it

     **Field 27**: `executor_notification_dismissed`
     - Field: `executor_notification_dismissed`
     - Type: `boolean`
     - Value: `false` (true once user dismisses the executor update notification)
     - Note: Prevents showing executor notification after user has seen it

**Total Fields: 27** (19 original fields + 2 POPIA fields + 6 attorney/executor tracking fields)

4. **Save Document**:
   - Click "Save"
   - Collection `users` is now created with your template document

---

#### **Collection 2: `attorneys`**

**Purpose**: Store attorney information linked to users

1. **Create Collection**:
   - Click "Start collection"
   - Collection ID: `attorneys`
   - Click "Next"

2. **Create Document Template**:
   - Document ID: Auto-ID
   - Add fields:
     
     - `attorney_id`: string (Auto-generated UUID)
     - `user_id`: string (Reference to user)
    - `attorney_first_name`: string
    - `attorney_surname`: string
    - `attorney_name`: string (auto-generated full name)
     - `attorney_email`: string
     - `attorney_phone`: string
     - `attorney_firm`: string (optional)
     - `attorney_address`: string (optional)
     - `relationship_type`: string (Options: family_lawyer, estate_lawyer, general_practice, other)
     - `is_primary`: boolean (default: true)
     - `created_at`: timestamp
     - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 3: `executors`**

**Purpose**: Store executor information for will execution

1. **Create Collection**: `executors`
2. **Document Template Fields**:
   - `executor_id`: string (Auto-ID)
   - `user_id`: string
   - `executor_first_name`: string
   - `executor_surname`: string
   - `executor_name`: string
   - `executor_email`: string
   - `executor_phone`: string
   - `executor_id_number`: string
   - `relationship_to_user`: string
   - `executor_address`: string (optional)
   - `is_primary`: boolean (default: true)
   - `verification_status`: string (Options: pending, verified, rejected)
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 4: `secondary_contacts`**

**Purpose**: Store secondary contact information for proof-of-life verification

1. **Create Collection**: `secondary_contacts`
2. **Document Template Fields**:
   - `secondary_contact_id`: string (Auto-ID)
   - `user_id`: string
    - `contact_first_name`: string
    - `contact_surname`: string
    - `contact_name`: string (auto-generated full name)
   - `contact_email`: string
   - `contact_phone`: string
   - `relationship_to_user`: string
   - `contact_address`: string (optional)
   - `is_verified`: boolean (default: false)
   - `verification_token`: string (auto-generated)
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 5: `wills`**

**Purpose**: Store digital versions of a user's will (documents, video statements, or audio wills)  
**Note**: The application supports uploading **PDF/DOC documents, recorded videos, and recorded audio wills**.

1. **Create Collection**: `wills`
2. **Document Template Fields**:
   - `will_id`: string (Auto-ID)
   - `user_id`: string
   - `will_type`: string (Options: `document`, `video`, `audio`)
   - `will_title`: string (optional)
   - `will_description`: string (optional)
   - `document_path`: string (local path or Firebase Storage URL for PDF/DOC files)
   - `video_path`: string (local path or storage URL for uploaded/recorded videos)
   - `audio_path`: string (local path or storage URL for uploaded/recorded audio wills)
   - `will_document_url`: string (optional - legacy field for Storage URL)
   - `will_document_name`: string (optional)
   - `will_document_size`: number (bytes, optional)
   - `will_document_type`: string (MIME type: `application/pdf`, `video/mp4`, `audio/m4a`, etc.)
   - `status`: string (Options: `active`, `inactive`, `archived`)
   - `is_verified`: boolean (default: `false`)
   - `is_primary_will`: boolean (default: `true`)
   - `last_updated`: timestamp
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 6: `assets`**

**Purpose**: Store asset information

1. **Create Collection**: `assets`
2. **Document Template Fields**:
   - `asset_id`: string (Auto-ID)
   - `user_id`: string
   - `asset_name`: string
   - `asset_type`: string (Options: property, vehicle, policy, bank_account, investment, jewelry, artwork, business, other)
   - `asset_description`: string (optional)
   - `asset_value`: number (required)
   - `asset_location`: string (required)
   - `financing_status`: string (Options: financed, owned) – indicates whether the asset is financed or owned outright
   - `finance_provider_type`: string (Options when financed: bank, other; value `owned` when the asset is not financed)
   - `finance_provider_name`: string (required when `finance_provider_type` is `bank`; stores bank/fintech name)
   - `finance_provider_other`: string (required when `finance_provider_type` is `other`; captures the custom provider name)
   - `date_purchased`: string (YYYY-MM-DD)
   - `repayment_term`: string (required when financed; e.g., "60 months")
   - `paid_up_date`: string (YYYY-MM-DD, required when financed; indicates target paid-up date)
   - `asset_document_url`: string (optional, Firebase Storage URL)
   - `asset_document_name`: string (optional)
   - `is_active`: boolean (default: true)
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 7: `policies`**

**Purpose**: Store insurance policy information

1. **Create Collection**: `policies`
2. **Document Template Fields**:
   - `policy_id`: string (Auto-ID)
   - `user_id`: string
   - `policy_number`: string
   - `policy_type`: string (Options: life_insurance, health_insurance, property_insurance, vehicle_insurance, other)
   - `insurance_company`: string
   - `policy_value`: number (optional)
   - `policy_description`: string (optional)
   - `policy_document_url`: string (optional, Firebase Storage URL)
   - `policy_document_name`: string (optional)
   - `is_active`: boolean (default: true)
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 8: `beneficiaries`**

**Purpose**: Store beneficiary information (now tracking first name and surname separately)

1. **Create Collection**: `beneficiaries`
2. **Document Template Fields**:
   - `beneficiary_id`: string (Auto-ID)
   - `user_id`: string
   - `beneficiary_first_name`: string
   - `beneficiary_surname`: string
   - `beneficiary_name`: string (auto-generated full name for backward compatibility)
- `beneficiary_id_number`: string (South African ID number, 13 digits)
   - `beneficiary_email`: string (optional)
   - `beneficiary_phone`: string (optional)
   - `beneficiary_address`: string (optional)
   - `relationship_to_user`: string
   - `beneficiary_percentage`: number (optional)
   - `is_primary`: boolean (default: false)
   - `is_verified`: boolean (default: false)
   - `verification_token`: string (auto-generated)
           - `inherit_entire_estate`: boolean (default: false) — set to true for beneficiaries who should inherit the entire estate when no specific assets or policies are captured.
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 9: `asset_beneficiary_links`**

**Purpose**: Link assets to beneficiaries with allocation percentages

1. **Create Collection**: `asset_beneficiary_links`
2. **Document Template Fields**:
   - `asset_beneficiary_id`: string (Auto-ID)
   - `asset_id`: string (Reference to asset)
   - `beneficiary_id`: string (Reference to beneficiary)
   - `allocation_percentage`: number
   - `allocation_type`: string (Options: percentage, specific_amount, equal_split)
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 10: `policy_beneficiary_links`**

**Purpose**: Link policies to beneficiaries with allocation percentages

1. **Create Collection**: `policy_beneficiary_links`
2. **Document Template Fields**:
   - `policy_beneficiary_id`: string (Auto-ID)
   - `policy_id`: string (Reference to policy)
   - `beneficiary_id`: string (Reference to beneficiary)
   - `allocation_percentage`: number
   - `allocation_type`: string (Options: percentage, specific_amount, equal_split)
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 11: `proof_of_life_verifications`**

**Purpose**: Track proof-of-life verification requests and responses

1. **Create Collection**: `proof_of_life_verifications`
2. **Document Template Fields**:
   - `pol_id`: string (Auto-ID)
   - `user_id`: string
   - `verification_type`: string (Options: email, sms, phone_call, executor_verification)
   - `verification_status`: string (Options: pending, completed, failed, expired)
   - `verification_token`: string (auto-generated)
   - `verification_url`: string (auto-generated)
   - `sent_to_email`: string
   - `sent_to_phone`: string
   - `verification_attempts`: number (default: 0)
   - `max_attempts`: number (default: 3)
   - `expires_at`: timestamp
   - `completed_at`: timestamp (optional)
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 12: `escalation_workflows`**

**Purpose**: Track escalation process when verification fails

1. **Create Collection**: `escalation_workflows`
2. **Document Template Fields**:
   - `escalation_id`: string (Auto-ID)
   - `user_id`: string
   - `pol_id`: string (Reference to proof_of_life_verifications)
   - `escalation_level`: string (Options: level_1_email, level_2_call, level_3_executor, level_4_beneficiary)
   - `escalation_status`: string (Options: pending, in_progress, completed, failed)
   - `escalation_recipient`: string (email or phone)
   - `escalation_attempts`: number (default: 0)
   - `max_attempts`: number (default: 3)
   - `escalation_notes`: string (system generated)
   - `created_at`: timestamp
   - `completed_at`: timestamp (optional)
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 13: `ai_bot_call_logs`**

**Purpose**: Log AI bot calling attempts and outcomes

1. **Create Collection**: `ai_bot_call_logs`
2. **Document Template Fields**:
   - `call_log_id`: string (Auto-ID)
   - `escalation_id`: string (Reference to escalation_workflows)
   - `user_id`: string
   - `call_type`: string (Options: primary_user, secondary_contact, executor, beneficiary)
   - `call_recipient`: string (phone number)
   - `call_status`: string (Options: initiated, answered, no_answer, busy, failed)
   - `call_duration`: number (seconds)
   - `call_transcript`: string (AI generated)
   - `call_outcome`: string (Options: verified_alive, not_verified, no_response, escalation_needed)
   - `ai_confidence_score`: number (0-1 range)
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 14: `executor_verifications`**

**Purpose**: Track executor verification process

1. **Create Collection**: `executor_verifications`
2. **Document Template Fields**:
   - `executor_verification_id`: string (Auto-ID)
   - `executor_id`: string (Reference to executors)
   - `user_id`: string
   - `verification_type`: string (Options: email_verification, document_upload, home_affairs_api)
   - `verification_status`: string (Options: pending, verified, rejected, expired)
   - `verification_token`: string (auto-generated)
   - `verification_url`: string (auto-generated)
   - `document_upload_url`: string (optional, Firebase Storage URL)
   - `document_type`: string (Options: id_document, affidavit, legal_document)
   - `home_affairs_api_response`: string (JSON response)
   - `face_recognition_score`: number (0-1 range)
   - `verification_attempts`: number (default: 0)
   - `expires_at`: timestamp
   - `verified_at`: timestamp (optional)
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 15: `death_certificates`**

**Purpose**: Store death certificate uploads and verification

1. **Create Collection**: `death_certificates`
2. **Document Template Fields**:
   - `death_certificate_id`: string (Auto-ID)
   - `user_id`: string
   - `executor_id`: string (Reference to executors)
   - `certificate_status`: string (Options: pending_upload, uploaded, verified, rejected)
   - `certificate_document_url`: string (Firebase Storage URL)
   - `certificate_document_name`: string
   - `uploaded_by_beneficiary_id`: string (Reference to beneficiaries)
   - `verification_status`: string (Options: pending, verified, rejected)
   - `home_affairs_verification`: string (JSON response)
   - `verification_notes`: string (system generated)
   - `created_at`: timestamp
   - `verified_at`: timestamp (optional)
   - `updated_at`: timestamp

3. **Click "Save"**

---

#### **Collection 16: `home_affairs_integrations`**

**Purpose**: Log Department of Home Affairs API calls

1. **Create Collection**: `home_affairs_integrations`
2. **Document Template Fields**:
   - `home_affairs_log_id`: string (Auto-ID)
   - `user_id`: string
   - `integration_type`: string (Options: id_verification, face_recognition, death_certificate_verification)
   - `api_endpoint`: string
   - `request_payload`: string (JSON)
   - `response_payload`: string (JSON)
   - `response_status`: string (Options: success, error, timeout)
   - `response_code`: number
   - `processing_time`: number (milliseconds)
   - `created_at`: timestamp

3. **Click "Save"**

---

#### **Collection 17: `notifications`**

**Purpose**: Track all notification deliveries and in-app notifications

1. **Create Collection**: `notifications`
2. **Document Template Fields**:
   - `notification_id`: string (Auto-ID)
   - `user_id`: string
   - `notification_type`: string (Options: proof_of_life, escalation_alert, executor_notification, attorney_notification, beneficiary_alert, system_update, will_update, asset_update, policy_update, proof_of_life_reminder)
   - `notification_category`: string (Options: in_app, email, sms, push_notification) - used to determine where notification appears
   - `notification_method`: string (Options: email, sms, push_notification) - for external notifications
   - `recipient_email`: string (optional)
   - `recipient_phone`: string (optional)
   - `notification_title`: string
   - `notification_body`: string
   - `notification_data`: string (JSON payload)
   - `notification_action`: string (optional, e.g., "navigate_to_executor_screen", "dismiss") - defines what happens when user clicks
   - `notification_action_data`: string (optional, JSON with navigation params)
   - `priority`: string (Options: low, normal, high, urgent) - determines sort order
   - `is_read`: boolean (default: false) - tracks if user has read the notification
   - `is_dismissed`: boolean (default: false) - tracks if user dismissed the notification
   - `is_actionable`: boolean (default: false) - whether notification requires user action
   - `delivery_status`: string (Options: pending, sent, delivered, failed, bounced)
   - `delivery_timestamp`: timestamp (optional)
   - `read_timestamp`: timestamp (optional)
   - `dismissed_timestamp`: timestamp (optional)
   - `created_at`: timestamp
   - `updated_at`: timestamp

**Important Notes for Notification System:**
- **In-App Notifications**: Set `notification_category` to `in_app` for notifications that appear in the Dashboard notification bell
- **Grouping**: Notifications are grouped as "New" (created within last 7 days and unread) and "Older" (older than 7 days or already read)
- **Badge Count**: Only unread notifications (`is_read: false`) contribute to the notification badge count
- **Auto-dismiss**: Some notifications (like attorney/executor assignments) can be dismissed, while others (like proof-of-life reminders) cannot be dismissed until acted upon
- **Attorney/Executor Tracking**: When user chooses MiWill attorneys or executors during registration, create an in-app notification reminding them they can appoint their own at any time

**Example Notification Documents:**

**Attorney Assignment Notification:**
```json
{
  "notification_id": "auto-generated-id",
  "user_id": "user-123",
  "notification_type": "attorney_notification",
  "notification_category": "in_app",
  "notification_title": "MiWill Attorney Assigned",
  "notification_body": "You have chosen to use MiWill Partner Attorneys. You can appoint your own attorney at any time from the Dashboard.",
  "notification_action": "navigate_to_update_attorney",
  "notification_action_data": "{}",
  "priority": "normal",
  "is_read": false,
  "is_dismissed": false,
  "is_actionable": true,
  "delivery_status": "delivered",
  "created_at": "2025-01-01T10:00:00Z"
}
```

**Executor Assignment Notification:**
```json
{
  "notification_id": "auto-generated-id",
  "user_id": "user-123",
  "notification_type": "executor_notification",
  "notification_category": "in_app",
  "notification_title": "MiWill Executor Assigned",
  "notification_body": "You have chosen to use MiWill Executors. You can appoint your own executor at any time from the Dashboard.",
  "notification_action": "navigate_to_update_executor",
  "notification_action_data": "{}",
  "priority": "normal",
  "is_read": false,
  "is_dismissed": false,
  "is_actionable": true,
  "delivery_status": "delivered",
  "created_at": "2025-01-01T10:00:00Z"
}
```

**Proof-of-Life Reminder:**
```json
{
  "notification_id": "auto-generated-id",
  "user_id": "user-123",
  "notification_type": "proof_of_life_reminder",
  "notification_category": "in_app",
  "notification_title": "Time for Your Check-In",
  "notification_body": "It's time for your scheduled proof-of-life verification. Please complete your check-in to confirm your well-being.",
  "notification_action": "navigate_to_proof_of_life",
  "notification_action_data": "{}",
  "priority": "high",
  "is_read": false,
  "is_dismissed": false,
  "is_actionable": true,
  "delivery_status": "delivered",
  "created_at": "2025-01-15T09:00:00Z"
}
```

3. **Click "Save"**

---

#### **Collection 18: `audit_logs`**

**Purpose**: Comprehensive audit trail for all actions

1. **Create Collection**: `audit_logs`
2. **Document Template Fields**:
   - `audit_log_id`: string (Auto-ID)
   - `user_id`: string (optional, null for system events)
   - `event_type`: string (Options: user_registration, will_upload, asset_added, beneficiary_added, pol_verification, escalation_triggered, executor_verification, death_certificate_upload, system_event)
   - `action`: string (Options: created, updated, deleted, accessed, failed, verified)
   - `severity`: string (Options: low, medium, high, critical)
   - `description`: string (auto-generated description)
   - `metadata`: string (JSON: IP address, device info, etc.)
   - `ip_address`: string
   - `device_info`: string (platform, OS, app version)
   - `created_at`: timestamp

3. **Click "Save"**

---

#### **Collection 19: `system_settings`**

**Purpose**: Store system-wide configuration settings

1. **Create Collection**: `system_settings`
2. **Document Template Fields**:
   - `setting_id`: string (Auto-ID)
   - `setting_key`: string (e.g., max_file_size, pol_frequency_limits, escalation_timeouts)
   - `setting_value`: string
   - `description`: string
   - `is_system`: boolean (default: true, cannot be modified by users)
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **Click "Save"**

4. **Add Initial System Settings Documents**:
   - Create document with setting_key: `max_file_size_mb`, setting_value: `50`
   - Create document with setting_key: `pol_verification_timeout_days`, setting_value: `7`
   - Create document with setting_key: `escalation_retry_max_attempts`, setting_value: `3`

---

## File Storage Setup

### **Current Setup: Local File Storage (Mac)**

For now, we'll use local file storage on your Mac. When you upgrade to Firebase Blaze plan, you can migrate to Firebase Storage. This approach allows you to develop and test without incurring storage costs.

### **Step 4: Create Local Storage Folders**

1. **Choose a Storage Location**:
   - Create a folder in your project directory or a dedicated location
   - Recommended location: `/Users/[your-username]/Desktop/MiWill-App/storage/`
   - Or: `/Users/[your-username]/Documents/MiWill-Storage/`

2. **Create the Folder Structure**:

   Open Terminal and run these commands (or create folders manually in Finder):

   ```bash
   # Navigate to your project directory
   cd ~/Desktop/MiWill-App
   
   # Create storage directory
   mkdir -p storage
   cd storage
   
   # Create all required folders
   mkdir -p wills
   mkdir -p assets
   mkdir -p policies
   mkdir -p executor_documents
   mkdir -p death_certificates
   mkdir -p profile_pictures
   
   # Verify folders were created
   ls -la
   ```

   **Or create manually in Finder**:
   - Navigate to your project folder: `~/Desktop/MiWill-App/`
   - Create a new folder called `storage`
   - Inside `storage`, create these 6 folders:
     - `wills`
     - `assets`
     - `policies`
     - `executor_documents`
     - `death_certificates`
     - `profile_pictures`

3. **Local Storage Folder Structure**:
   ```
   MiWill-App/
   ├── storage/
   │   ├── wills/
   │   │   └── [user_id]/[will_id].pdf
   │   ├── assets/
   │   │   └── [user_id]/[asset_id].pdf
   │   ├── policies/
   │   │   └── [user_id]/[policy_id].pdf
   │   ├── executor_documents/
   │   │   └── [user_id]/[executor_id]/[document_type].pdf
   │   ├── death_certificates/
   │   │   └── [user_id]/[death_certificate_id].pdf
   │   └── profile_pictures/
   │       └── [user_id]/profile.jpg
   ├── src/
   ├── firebase/
   └── ...
   ```

4. **Add to .gitignore**:
   - Add `storage/` to your `.gitignore` file to prevent uploading user documents to git:
   ```bash
   echo "storage/" >> .gitignore
   ```

### **Future Setup: Firebase Storage (When Upgrading to Blaze Plan)**

When you're ready to upgrade to Firebase Blaze plan and use Firebase Storage, follow these steps:

1. **Upgrade to Blaze Plan**:
   - Go to Firebase Console → Project Settings → Usage and billing
   - Click "Modify billing" or "Upgrade project"
   - Link a Google Cloud billing account
   - Enable Blaze plan (pay-as-you-go)

2. **Create Firebase Storage Bucket**:
   - Go to Firebase Console → Storage
   - Click "Get started"
   - Select "Start in production mode"
   - Choose location: `us-central1` (or your preferred region)
   - Click "Done"

3. **Create Folder Structure in Firebase Storage**:
   - Folders will be created automatically when your app uploads files
   - Or create them manually by uploading dummy files to these paths:
     - `wills/[user_id]/`
     - `assets/[user_id]/`
     - `policies/[user_id]/`
     - `executor_documents/[user_id]/[executor_id]/`
     - `death_certificates/[user_id]/`
     - `profile_pictures/[user_id]/`

4. **Migration Path**:
   - When ready to migrate, you can:
     - Upload existing files from local storage to Firebase Storage
     - Update your app code to use Firebase Storage instead of local storage
     - Update file URLs in Firestore documents to point to Firebase Storage URLs

### **Storage Folder Structure (Firebase Storage - Future)**:
```
your-project.appspot.com/
├── wills/
│   └── [user_id]/[will_id].pdf
├── assets/
│   └── [user_id]/[asset_id].pdf
├── policies/
│   └── [user_id]/[policy_id].pdf
├── executor_documents/
│   └── [user_id]/[executor_id]/[document_type].pdf
├── death_certificates/
│   └── [user_id]/[death_certificate_id].pdf
└── profile_pictures/
    └── [user_id]/profile.jpg
```

---

## Security Rules Configuration

### **Step 5: Configure Firestore Security Rules**

1. **Navigate to Firestore Rules**:
   - Click "Firestore Database" in left sidebar
   - Click "Rules" tab at the top

2. **Replace Default Rules**:
   - Delete the default rules
   - Copy and paste the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Attorneys collection - users can only access their own attorneys
    match /attorneys/{attorneyId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Executors collection - users can only access their own executors
    match /executors/{executorId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Secondary contacts - users can only access their own contacts
    match /secondary_contacts/{contactId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Wills - users can only access their own wills
    match /wills/{willId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Assets - users can only access their own assets
    match /assets/{assetId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Policies - users can only access their own policies
    match /policies/{policyId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Beneficiaries - users can only access their own beneficiaries
    match /beneficiaries/{beneficiaryId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Asset-Beneficiary links - users can only access their own links
    match /asset_beneficiary_links/{linkId} {
      allow read, write: if isAuthenticated();
      // Additional validation: ensure linked assets and beneficiaries belong to user
    }
    
    // Policy-Beneficiary links - users can only access their own links
    match /policy_beneficiary_links/{linkId} {
      allow read, write: if isAuthenticated();
      // Additional validation: ensure linked policies and beneficiaries belong to user
    }
    
    // Proof of Life Verifications - users can only access their own verifications
    match /proof_of_life_verifications/{polId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Escalation Workflows - users can only access their own escalations
    match /escalation_workflows/{escalationId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // AI Bot Call Logs - users can only access their own call logs
    match /ai_bot_call_logs/{callLogId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Executor Verifications - users and executors can access
    match /executor_verifications/{verificationId} {
      allow read: if isAuthenticated() && (
        resource.data.user_id == request.auth.uid ||
        resource.data.executor_id in get(/databases/$(database)/documents/executors/$(resource.data.executor_id)).data.user_id == request.auth.uid
      );
      allow write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated();
    }
    
    // Death Certificates - beneficiaries and executors can access
    match /death_certificates/{certificateId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
      allow create: if isAuthenticated();
    }
    
    // Home Affairs Integrations - system/admin only (read for users)
    match /home_affairs_integrations/{logId} {
      allow read: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow write: if false; // Only system can write
    }
    
    // Notifications - users can only access their own notifications
    match /notifications/{notificationId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated();
    }
    
    // Notifications Meta - for system initialization (allow read for all authenticated users)
    match /notifications_meta/{metaId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Allow initialization by any authenticated user
    }
    
    // Audit Logs - users can read their own logs, system can write
    match /audit_logs/{logId} {
      allow read: if isAuthenticated() && 
        (resource.data.user_id == request.auth.uid || resource.data.user_id == null);
      allow write: if false; // Only system/Cloud Functions can write
    }
    
    // System Settings - read-only for all authenticated users
    match /system_settings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only admin/system can write
    }
  }
}
```

3. **Publish Rules**:
   - Click "Publish" button
   - Rules are now active

> **⚠️ IMPORTANT**: Make sure you include the `notifications_meta` collection rules shown above. This collection is used by the NotificationService to auto-initialize the notifications system. Without these rules, you'll get a "Missing or insufficient permissions" error when the app loads.

### **Step 6: Configure Storage Security Rules (Future: When Using Firebase Storage)**

**Note**: This step is for future use when you upgrade to Firebase Storage. For now, with local storage, you don't need to configure these rules. Keep this section for reference when you migrate to Firebase Storage.

1. **Navigate to Storage Rules**:
   - Click "Storage" in left sidebar
   - Click "Rules" tab at the top

2. **Replace Default Rules**:
   - Delete the default rules
   - Copy and paste the following rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper function to check authentication
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if file belongs to user
    function isOwner(userId) {
      return isAuthenticated() && userId == request.auth.uid;
    }
    
    // Wills folder - users can only upload/access their own wills
    match /wills/{userId}/{allPaths=**} {
      allow read, write: if isOwner(userId);
    }
    
    // Assets folder - users can only upload/access their own assets
    match /assets/{userId}/{allPaths=**} {
      allow read, write: if isOwner(userId);
    }
    
    // Policies folder - users can only upload/access their own policies
    match /policies/{userId}/{allPaths=**} {
      allow read, write: if isOwner(userId);
    }
    
    // Executor documents - executors and users can access
    match /executor_documents/{userId}/{allPaths=**} {
      allow read, write: if isOwner(userId);
    }
    
    // Death certificates - beneficiaries and executors can access
    match /death_certificates/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // Profile pictures - users can only upload/access their own
    match /profile_pictures/{userId}/{allPaths=**} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

3. **Publish Rules**:
   - Click "Publish" button
   - Rules are now active

---

## Complete Collection Structure

### **Summary of All Collections**

1. ✅ `users` - User profiles
2. ✅ `attorneys` - Attorney information
3. ✅ `executors` - Executor information
4. ✅ `secondary_contacts` - Secondary contact information
5. ✅ `wills` - Will documents
6. ✅ `assets` - Asset information
7. ✅ `policies` - Insurance policies
8. ✅ `beneficiaries` - Beneficiary information
9. ✅ `asset_beneficiary_links` - Asset to beneficiary linking
10. ✅ `policy_beneficiary_links` - Policy to beneficiary linking
11. ✅ `proof_of_life_verifications` - POL verification tracking
12. ✅ `escalation_workflows` - Escalation process tracking
13. ✅ `ai_bot_call_logs` - AI bot call logs
14. ✅ `executor_verifications` - Executor verification tracking
15. ✅ `death_certificates` - Death certificate uploads
16. ✅ `home_affairs_integrations` - Home Affairs API logs
17. ✅ `notifications` - Notification delivery tracking
18. ✅ `audit_logs` - Comprehensive audit trail
19. ✅ `system_settings` - System configuration

### **Storage Folders Created (Local Storage - Current)**

1. ✅ `storage/wills/` - Will documents (local)
2. ✅ `storage/assets/` - Asset documents (local)
3. ✅ `storage/policies/` - Policy documents (local)
4. ✅ `storage/executor_documents/` - Executor verification documents (local)
5. ✅ `storage/death_certificates/` - Death certificates (local)
6. ✅ `storage/profile_pictures/` - User profile pictures (local)

**Note**: These are local folders on your Mac. When you upgrade to Firebase Blaze plan, you can migrate to Firebase Storage using the instructions in the "Future Setup" section above.

---

## Next Steps

1. **Test Your Setup**:
   - Create a test user document in `users` collection
   - Upload a test file to local storage (`storage/` folder)
   - Verify Firestore security rules are working
   - Test file upload/download functionality with local storage

2. **Initialize Firebase in Your App**:
   - Add Firebase SDK to your React Native app
   - Configure Firebase with your project credentials
   - Test reading/writing data

3. **Set Up Cloud Functions** (Next Phase):
   - Create Cloud Functions for proof-of-life verification
   - Set up scheduled triggers
   - Configure AI bot integration

4. **Configure Environment Variables**:
   - Add Firebase credentials to your `.env` file
   - Set up API keys for integrations (SendGrid, Twilio, etc.)

---

## Tips for Navigating Firebase Console

1. **Quick Access**:
   - Use the search bar at the top to quickly find collections
   - Use browser bookmarks for frequently accessed pages

2. **Data Management**:
   - Export data: Use Firestore Export feature in Settings
   - Import data: Use Firestore Import feature or Firebase CLI

3. **Monitoring**:
   - Check "Usage" tab to monitor database reads/writes
   - Set up alerts for quota limits

4. **Testing**:
   - Use Firestore Emulator for local development
   - Use Firebase Console's "Rules Playground" to test security rules

5. **Performance**:
   - Create indexes for queries that filter or sort on multiple fields
   - Monitor query performance in the "Indexes" tab

---

**Congratulations!** Your Firebase backend is now set up and ready for development. 🎉

