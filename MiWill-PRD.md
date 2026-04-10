# MiWill Application - Product Requirements Document (Current Source-of-Truth)

## Document Purpose

This PRD reflects the MiWill application as it exists in the current source code, not earlier product assumptions or roadmap-only ideas.

It is intended to:
- describe the current product behavior implemented in the Expo / React Native app
- document user-facing screens, flows, integrations, and data dependencies
- capture features that exist in code but were previously undocumented
- call out important implementation gaps where the app does not yet match older product claims

## Product Snapshot

MiWill is a mobile estate-planning application focused on helping a user:
- register and maintain a personal estate-planning profile
- capture attorney, executor, beneficiary, and secondary contact information
- manage assets and policies
- upload or draft a will
- review a generated will summary
- calculate total estate value and cost-of-dying estimates
- optionally submit a qualified lead to the Capital Legacy integration

The current application is primarily creator-facing. It does not currently ship separate executor, beneficiary, secondary contact, or administrator portals inside the app.

## Current Product Goals

### Primary Goals
- Enable a user to create and maintain a structured estate profile on mobile.
- Centralize will-related information, assets, policies, and beneficiaries in one app experience.
- Support multiple will intake paths: document upload, video will, audio will, and guided drafting.
- Help the user review a generated will summary before finalizing estate information.
- Support downstream lead submission for qualified users who consent to Capital Legacy follow-up.

### Secondary Goals
- Provide a settings and support surface for account, privacy, legal, and help content.
- Give the user visibility into reminders, notifications, and estate updates.
- Provide estate-planning utility features such as the COD calculator.

## Product Boundaries

The current app does **not** fully implement all historically described MiWill concepts. In particular:
- no end-to-end automated proof-of-life workflow is exposed in the current UI
- no live executor or beneficiary portal is present
- no live 2FA flow is implemented
- no push notification system is implemented
- will files are not yet uploaded to Firebase Storage in the current upload flow
- the verification history screen is currently mock-driven

## Target Users

### Primary User
The primary user is the person creating and maintaining their estate information.

Primary user tasks:
- create an account with email and password
- accept POPIA / consent requirements
- provide personal identity and contact information
- set reminder cadence
- add or update attorney, executor, and secondary contact details
- add assets, policies, and beneficiaries
- upload or draft a will
- review a generated will summary
- manage profile and support settings

### Attorney
Attorney details can be collected, stored, updated, and referenced in estate data. The app currently supports attorney information as part of the user's record and notifications, not as a separate signed-in role.

### Executor
Executor details can be collected, stored, updated, and used during will review and notification flows. The app does not currently provide a dedicated executor login area.

### Secondary Contact
Secondary contact details can be captured during registration. These records are stored for future workflow use, but no standalone secondary-contact experience is implemented in-app.

### Beneficiary
Beneficiaries can be created, edited, linked to assets and policies, and included in generated will review content. They are data entities, not authenticated app users.

## Supported Platforms and Technical Stack

### Platforms
- iOS
- Android
- Limited web start support exists through Expo tooling, but the primary product experience is mobile-first

### Current Core Stack
- Expo SDK `~54.0.0`
- React Native `0.81.5`
- React `19.1.0`
- TypeScript `~5.9.2`
- Firebase Authentication
- Firebase Firestore
- Firebase Storage initialized in config but not fully used by the current upload flow
- React Navigation native stack

### Key Libraries in Use
- `expo-image-picker`
- `expo-av`
- `expo-file-system`
- `expo-sharing`
- `expo-splash-screen`
- `react-native-webview`
- `@react-native-async-storage/async-storage`
- `@expo/vector-icons`

## Application Architecture Overview

### App Shell
The app bootstraps through:
- `GestureHandlerRootView`
- `SafeAreaProvider`
- `AuthProvider`
- `UserProvider`
- `NavigationContainer`
- a controlled splash delay using `expo-splash-screen`

### Navigation Model
The app uses a single native stack navigator. The initial route is `Login`.

Important implementation note:
- there is no global auth gate in the navigator today
- some screens, especially the dashboard, redirect back to login when `currentUser` is unavailable

### Data Model Approach
The app persists most domain data in Firestore collections via service classes:
- users
- assets
- policies
- beneficiaries
- wills
- attorneys
- executors
- secondary contacts
- notifications
- verifications

## Current Screen Inventory

### Authentication and Account
- `Login`
- `Registration`
- `ResetPassword`
- `UpdateProfile`

### Core Estate Management
- `Dashboard`
- `AddAsset`
- `AddPolicy`
- `AddBeneficiary`
- `UploadWill`
- `ViewWill`
- `CODCalculator`

### Contact and Legal Support
- `UpdateAttorney`
- `UpdateExecutor`
- `DocumentsContacts`
- `ExecutorContacts`

### Settings and Informational Screens
- `Settings`
- `AccountSettings`
- `SecurityPrivacy`
- `PrivacySettings`
- `TwoFactorSettings`
- `NotificationPreferences`
- `VerificationHistory`
- `Support`
- `About`
- `TermsConditions`
- `PrivacyPolicy`

### Placeholder / Partial Screen
- `Onboarding` exists in navigation but is currently a placeholder screen and is not the main onboarding flow used by registration

## End-to-End User Journeys

### 1. Registration and Initial Setup
The registration flow is a multi-step form that captures:
- personal details
- email and phone number
- password and POPIA acceptance
- profile picture
- South African ID number
- address
- reminder cadence
- optional income, employment, marital status, and Capital Legacy consent fields
- attorney selection or MiWill attorney acceptance
- executor selection, including "same as attorney"
- secondary contact details

On successful completion the app:
- creates a Firebase Auth user
- creates the Firestore user profile
- creates attorney, executor, and secondary contact records when provided
- may create related notifications
- routes the user into `UploadWill` for the first-time guided flow

### 2. Login and Session Entry
The login flow supports:
- email/password authentication
- password validation before submit
- POPIA acceptance
- local POPIA cache per email using AsyncStorage
- Firestore POPIA sync on successful login

Successful login routes to `Dashboard`.

### 3. Dashboard Estate Management
The dashboard is the main operational screen. It provides:
- profile-driven estate overview
- counts for assets, policies, beneficiaries, and whether a will exists
- estate value display
- side menu access
- add entry points for asset, policy, beneficiary, and will flows
- COD calculator entry
- expandable asset and policy sections
- beneficiary summaries
- in-app notification center

Additional implemented dashboard functionality that should be treated as first-class product behavior:
- inline beneficiary creation from the dashboard
- beneficiary linking to assets and policies
- beneficiary allocation tracking for assets and policies
- actionable notifications that can route users to other screens based on notification payload data

### 4. Asset and Policy Capture
Users can create and persist:
- assets
- policies

Supported behavior includes:
- storing values and descriptive metadata
- linking beneficiaries to assets and policies
- storing allocation percentages
- navigating onward to related flows such as `AddBeneficiary`, `AddPolicy`, or `ViewWill`

### 5. Beneficiary Management
Users can:
- add beneficiaries
- store name, relationship, ID number, address, email, and phone
- link beneficiaries to assets and policies
- mark beneficiaries as estate-wide inheritors
- manage beneficiaries during both dashboard and will-review flows

### 6. Will Intake and Drafting
The `UploadWill` screen supports multiple will intake modes:
- document upload
- video will capture / selection
- audio will recording / playback
- guided draft assistance using prebuilt will sections

Implemented behaviors include:
- loading existing wills for the signed-in user
- detecting that a prior will exists
- presenting a supersede confirmation flow
- previewing uploaded PDFs in-app using a WebView and PDF.js
- previewing media before save
- storing will records in Firestore

The screen also includes:
- "don't show again" modal preferences
- basic AI-assistant style draft scaffolding using predefined sections
- sharing support imports for future or adjacent document sharing use cases

### 7. Will Review and Approval
The `ViewWill` screen is a major implemented product flow and should be considered core.

It currently supports:
- loading user profile, executor, beneficiaries, assets, and policies
- generating HTML from structured data
- rendering the generated will in a WebView
- recalculating and persisting total estate value to the user profile
- editing executor and beneficiary information during review
- approval-related modal flows
- collection request capture
- print request capture
- signature guidance UI

The review screen also drives Capital Legacy lead submission when the user qualifies and opts in.

### 8. Capital Legacy Lead Submission
The app includes a live external API integration for Capital Legacy.

Implemented rules:
- total estate value is derived from assets plus policies
- qualification threshold is `R250,000`
- POPIA acceptance is required
- lead data is built from user and estate information
- submission is sent to `EXPO_PUBLIC_LEAD_API_URL` with bearer auth using `EXPO_PUBLIC_LEAD_API_KEY`
- successful submission updates the user's lead submission status

This integration is triggered from the will review journey rather than from registration alone.

### 9. COD Calculator
The app includes a dedicated `CODCalculator` screen.

Implemented behaviors include:
- cost-of-dying estimate inputs
- estate-duty calculation
- executor fee calculation
- VAT inclusion
- South African estate-planning context

This is an implemented feature and must be considered part of the current product scope.

### 10. Settings, Legal, and Support
The settings cluster is implemented as a set of dedicated screens.

Implemented settings surfaces:
- account overview
- profile update entry
- notification preferences content
- documents and contacts guidance
- executor and contacts guidance
- security and privacy guidance
- privacy settings content
- two-factor placeholder content
- support contact screen
- terms and conditions
- privacy policy
- about screen

Implemented support interactions:
- email support launch via `mailto:`
- phone support launch via `tel:`

## Feature Requirements by Area

### Authentication and Identity
- Firebase Authentication must support registration, login, logout, and password reset.
- User records must be mirrored into Firestore for profile-driven product behavior.
- POPIA acceptance must be captured and stored.
- South African ID handling and phone-number formatting must be supported in user-facing forms.

### Profile Management
- Users must be able to update key personal data after registration.
- Profile fields include personal identifiers, contact data, income, marital status, and Capital Legacy-related fields.
- Profile photo selection is supported via image picker.

### Estate Inventory
- Users must be able to create and manage assets and policies separately.
- Estate totals must roll up from stored asset and policy values.
- Beneficiary allocations must be linkable to individual assets and policies.

### Contact Network
- Users must be able to store and update attorney details.
- Users must be able to store and update executor details.
- Users must be able to create a secondary contact during registration.
- Users must be able to store multiple beneficiaries and link them to estate items.

### Will Management
- The product must allow the user to save will metadata and source file references.
- The product must support file, video, and audio-based will capture.
- The product must support a guided drafting path.
- The product must generate a structured will-review HTML artifact from stored estate data.

### Notifications and Reminders
- The dashboard must surface new and older in-app notifications.
- Notifications may route users to a destination screen using stored action payloads.
- Users must be able to select reminder cadence during registration.

### Support and Trust
- The app must provide legal and support information screens.
- The app must provide contact shortcuts to MiWill support.
- The app must expose privacy and consent surfaces in a user-readable form.

## Current Integrations

### Firebase
- Authentication
- Firestore
- Storage initialization

### Device and Expo Capabilities
- image picker
- audio recording and playback
- video selection and playback
- file system access
- safe area and gesture handling
- splash screen control
- sharing APIs

### Web Content
- PDF preview is rendered inside a WebView using PDF.js loaded from CDN
- generated will HTML is displayed in a WebView

### External API
- Capital Legacy lead submission API

## Data Persistence Summary

### Firestore-Persisted Data
- user profile
- will metadata
- assets
- policies
- beneficiaries
- attorney and executor records
- secondary contacts
- notifications
- verification entities

### Local / Client-Side Persistence
- POPIA acceptance cache in AsyncStorage
- modal preference flags in AsyncStorage
- local file URIs for selected documents, videos, audio, and profile images

## Important Implemented Features Previously Underdocumented

The following features exist in the current application and should be treated as documented product scope:
- COD calculator
- in-app notification center with screen-based navigation actions
- dashboard inline beneficiary creation and linking
- estate value rollup from assets and policies
- collection and print request capture during will review
- Capital Legacy lead qualification and submission flow
- support contact via email and phone
- guided will draft scaffolding inside the upload flow
- PDF preview inside the app
- audio will recording and playback
- video will intake
- side-menu driven navigation from the dashboard

## Known Gaps and Implementation Caveats

This section is intentionally explicit so product, design, and engineering are aligned on what is real versus planned.

### Authentication and Access
- There is no global auth guard in the navigator today.
- The navigator starts on `Login`, but the stack itself is not conditionally rendered based on auth state.

### File Storage
- Firebase Storage is configured in app setup but is not the current persistence path for will uploads.
- The upload flow still contains explicit TODOs for file, video, and audio upload to Firebase Storage.
- Current will records store local file URIs in Firestore metadata.

### Verification
- The verification history screen is powered by mock timeline data.
- Export verification log is marked as coming soon.
- The broader proof-of-life automation described in older docs is not represented as a complete user-facing workflow in the current app.

### Two-Factor Authentication
- The 2FA screen is informational only.
- No working second-factor enrollment or verification flow exists in current code.

### Push / Notification Preferences
- Notification preferences are currently local UI state on the settings screen.
- There is no implemented push-notification transport such as Expo Notifications in the current app.

### Onboarding
- The dedicated `Onboarding` screen is a placeholder and includes a TODO for Typeform integration.
- The real onboarding today is the multi-step registration flow.

### Support and Knowledge Base
- Help centre or knowledge base launch is labeled coming soon.

### Security Positioning
- Older claims such as end-to-end encrypted will vault, live executor portals, or advanced automated verification should not be presented as shipped features unless the code is expanded to support them.

### Local Storage Root
- Environment config includes a default local storage root path intended more for development assumptions than a production mobile device path.

## Current Non-Goals

The following should be treated as out of current scope unless new implementation lands:
- separate beneficiary login
- separate executor login
- administrator dashboard in-app
- automated AI phone-call verification
- fully operational government verification integration
- real-time push notification infrastructure
- fully completed Firebase Storage-backed document vault

## Product Success Indicators for the Current App

For the current shipped behavior, the most relevant product indicators are:
- user registration completion rate
- percentage of users who reach `UploadWill` after registration
- number of assets, policies, and beneficiaries created per active user
- percentage of users with a stored will record
- percentage of users who complete will review
- qualified Capital Legacy lead submissions
- profile completeness across attorney, executor, and beneficiary data

## Source-of-Truth References

This PRD aligns with the current application implementation across:
- `src/App.tsx`
- `src/navigation/AppNavigator.tsx`
- `src/screens/*`
- `src/services/*`
- `src/config/*`
- `src/utils/*`
- `package.json`

When this document conflicts with older planning notes, the current source code should be treated as authoritative for shipped behavior.
