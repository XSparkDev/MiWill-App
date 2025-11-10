# MiWill Application - Product Requirements Document (PRD)

## Project Overview

**Project Name**: MiWill  
**Purpose**: MiWill is a comprehensive digital will management platform designed to provide automated proof-of-life verification and secure will execution services. The application aims to revolutionize estate planning by offering a systematic approach to monitoring user well-being and ensuring proper will execution when needed. Through MiWill, users can maintain complete control over their estate planning while providing peace of mind through automated monitoring systems. This platform serves as a foundational tool for secure will management, asset tracking, beneficiary coordination, and automated executor notification processes.

---

## User Personas & Access Levels

### **Primary User (Will Creator)**
**Description**: Individual who creates and manages their will, assets, and beneficiary information through the MiWill platform.

**Responsibilities**:
- Complete comprehensive onboarding process including personal data, attorney selection, executor designation, and secondary contact setup
- Upload and manage will documents, insurance policies, and asset information
- Designate beneficiaries and link assets to specific beneficiaries
- Set notification frequency preferences for proof-of-life checkups
- Manage personal profile information (ID number, full names, policy numbers, contact details)
- Add, edit, and update assets, policies, and beneficiary information post-onboarding
- Respond to periodic proof-of-life verification requests via email/SMS
- Maintain current contact information for all designated parties

**Access**:
- Full access to personal dashboard with all will-related information
- Can view and manage all personal assets, policies, and beneficiaries
- Can upload, edit, and delete personal will documents
- Can update profile and notification preferences
- Cannot access other users' information or system administration features
- Cannot bypass security protocols or access executor/beneficiary verification processes

### **Secondary Contact**
**Description**: Trusted individual designated by the primary user to assist with proof-of-life verification and emergency contact procedures.

**Responsibilities**:
- Receive parallel notifications when primary user is contacted for proof-of-life verification
- Verify primary user's status via email verification system
- Respond to escalation calls from AI bot system when primary user is unresponsive
- Provide confirmation of primary user's well-being when requested
- Maintain current contact information for verification purposes

**Access**:
- Can receive verification requests via email/SMS
- Can access verification URLs requiring ID/Client Number for authentication
- Cannot access primary user's will documents, assets, or beneficiary information
- Cannot modify primary user's account settings or preferences
- Cannot access system administration or other users' information

### **Executor**
**Description**: Legal representative designated by the primary user to execute their will and manage estate affairs.

**Responsibilities**:
- Receive notifications when primary user becomes unresponsive for extended periods
- Confirm or deny proof-of-life status of primary user
- Initiate probate process when primary user's death is confirmed
- Upload required legal documentation (affidavit, ID) for verification
- Coordinate with beneficiaries and legal authorities during will execution
- Respond to Department of Home Affairs verification requests

**Access**:
- Can receive executor notification emails with verification options
- Can access secure document upload links for legal verification
- Can view executor-specific information and relationship details
- Cannot access primary user's will content, assets, or beneficiary details without proper authorization
- Cannot modify primary user's account or system settings
- Cannot access other users' information or system administration features

### **Beneficiary**
**Description**: Individual designated to receive assets or benefits from the primary user's will.

**Responsibilities**:
- Receive notifications when executor is unreachable or unresponsive
- Upload death certificates when primary user's death is confirmed
- Coordinate with other beneficiaries and legal authorities
- Provide necessary documentation for will execution process
- Respond to verification requests from Department of Home Affairs

**Access**:
- Can receive beneficiary notification emails
- Can access document upload systems for death certificates
- Cannot access primary user's will content or other beneficiaries' information
- Cannot modify primary user's account or system settings
- Cannot access executor verification processes or system administration

### **System Administrator**
**Description**: Technical administrator responsible for system maintenance, integration management, and operational oversight.

**Responsibilities**:
- Monitor and maintain proof-of-life verification workflows
- Manage AI bot calling system and escalation procedures
- Oversee Department of Home Affairs API integration
- Monitor system performance and security protocols
- Manage user account issues and technical support
- Ensure compliance with legal and regulatory requirements
- Monitor communication systems (email, SMS, phone calls)

**Access**:
- Can access system logs and operational metrics
- Can monitor proof-of-life verification processes and escalation workflows
- Cannot access encrypted will documents or personal user data
- Can view system metadata (timestamps, delivery status, process completion)
- Can manage technical integrations and system configurations
- Cannot bypass security protocols or access user personal information

### **Legal Administrator**
**Description**: Legal professional responsible for overseeing will execution processes and ensuring legal compliance.

**Responsibilities**:
- Review and approve will execution procedures
- Oversee executor verification and legal documentation processes
- Coordinate with Department of Home Affairs for official verification
- Ensure compliance with legal requirements and regulations
- Manage legal documentation and verification workflows
- Provide legal guidance for complex estate situations

**Access**:
- Can access legal verification processes and documentation systems
- Can review executor verification and legal compliance procedures
- Cannot access personal will content or beneficiary information without proper authorization
- Can view legal process metadata and compliance status
- Can manage legal documentation workflows
- Cannot modify user accounts or system settings

---

## Technical Architecture Overview

### **Frontend Technologies**
- **Framework**: React Native 0.76.9 with Expo SDK 52.0.47
- **Language**: TypeScript 5.3.3
- **Platform**: Cross-platform (iOS & Android)
- **UI Components**: Custom design system with teal accent colors
- **Navigation**: React Navigation v7 for seamless user experience

### **Backend Technologies**
- **Server**: Node.js with Express.js framework
- **Database**: Firebase Firestore for user data and will information
- **Authentication**: Firebase Authentication with JWT tokens
- **File Storage**: Firebase Storage for document management
- **Real-time Features**: Socket.io for live notifications

### **Third-Party Integrations**
- **Onboarding**: Typeform integration for comprehensive data collection
- **Communication**: SendGrid for email services, Twilio for SMS
- **AI Calling**: Custom AI bot system for automated verification calls
- **Government Integration**: Department of Home Affairs API for document verification
- **Document Processing**: Advanced document upload and verification systems

### **Security Features**
- **Data Encryption**: End-to-end encryption for sensitive will documents
- **Identity Verification**: Multi-factor authentication and document verification
- **Secure Communication**: Encrypted email and SMS verification systems
- **Access Control**: Role-based permissions and secure API endpoints
- **Compliance**: Legal compliance with estate planning regulations

---

## Core Features & Functionality

### **User Onboarding & Registration**
- Comprehensive Typeform integration for data collection
- Attorney and executor selection with relationship documentation
- Secondary contact designation and verification
- Asset and policy information collection with beneficiary linking
- Notification frequency preferences with humorous UI elements

### **Dashboard Management**
- Centralized user dashboard with profile information display
- Asset and policy management interface
- Beneficiary designation and management
- Will document upload and management
- Profile update and account management

### **Proof-of-Life Verification System**
- Automated periodic verification based on user preferences
- Multi-level escalation system (email → calls → executor → beneficiaries)
- AI bot integration for automated calling and verification
- Secure verification URLs with ID/Client Number authentication
- Comprehensive escalation workflow management

### **Will Execution Process**
- Automated executor notification and verification
- Department of Home Affairs integration for official verification
- Death certificate upload and processing
- Legal documentation verification and processing
- Beneficiary notification and coordination

### **Communication Systems**
- Multi-channel communication (email, SMS, phone calls)
- Secure verification processes with encrypted communications
- Automated notification systems for all stakeholders
- Real-time status updates and process tracking

---

## Tech Stack Assumptions

### **Framework & Core Technologies**
- **Framework**: React Native 0.76.9 with Expo SDK 52.0.47
- **Language**: TypeScript 5.3.3
- **Platform**: Cross-platform (iOS & Android)
- **Architecture**: Legacy React Native architecture (New Architecture disabled)
- **State Management**: React Context API for local state
- **Form Handling**: Custom form validation with Typeform integration
- **Navigation**: React Navigation v7 (Stack, Tab, Native Stack)

### **Styling & UI Components**
- **Design System**: Custom theme system with teal accent colors
- **Icons**: `@expo/vector-icons` (~14.0.4)
- **Fonts**: `@expo-google-fonts/montserrat` (^0.2.3)
- **Styling**: React Native StyleSheet with custom components
- **Color Management**: Custom color picker (`react-native-wheel-color-picker`)
- **Gradients**: `expo-linear-gradient` (~14.0.2)
- **Blur Effects**: `expo-blur` (~14.0.3)
- **UI Components**: Custom components with minimalist design
- **Theming**: Light mode with teal accent colors

### **Backend & Database - Firebase**

#### **Authentication (Firebase Auth)**:
- Email/password authentication
- Custom token management
- User session management with JWT
- Profile management with onboarding flow
- Token blacklisting and validation

#### **Database (Firestore)**:
- User profiles and will information
- Asset and policy data
- Beneficiary information and relationships
- Executor and attorney contact details
- Proof-of-life verification logs
- Escalation workflow tracking
- Document metadata and references
- Push notification tokens (FCM)

#### **Storage (Firebase Storage)**:
- Will documents and legal files
- User profile pictures and avatars
- Asset documentation and images
- Policy documents and certificates
- Death certificates and legal affidavits
- Executor verification documents

#### **Real-time Features**:
- Live proof-of-life status updates
- Real-time escalation notifications
- Instant executor and beneficiary alerts
- Live verification process tracking
- Real-time document upload status

#### **Cloud Functions**:
- Proof-of-life verification workflows
- AI bot calling system integration
- Email and SMS notification delivery
- Document processing and validation
- Department of Home Affairs API integration
- Background tasks (verification cleanup, etc.)

#### **APIs**:
- RESTful APIs via Firebase client
- Real-time subscriptions for live updates
- File upload/download APIs
- Third-party integration APIs (Typeform, Home Affairs)

### **Mobile Applications - React Native/Expo**
- **Framework**: React Native 0.76.9 with Expo SDK 52.0.47
- **Platforms**: 
  - iOS (13.0+) via EAS Build
  - Android (API 24+) via EAS Build
- **Bundle Identifiers**:
  - iOS: `com.miwill.app`
  - Android: `com.miwill.app`
- **Build System**: 
  - iOS: EAS Build + Xcode
  - Android: EAS Build + Gradle
- **Current Version**: 1.0.0 (Build 1)

### **Third-Party Integrations**

#### **Onboarding & Data Collection**:
- **Typeform Integration**: Comprehensive user data collection
- **Custom Forms**: Asset, policy, and beneficiary information
- **Document Upload**: Secure file handling and validation

#### **Communication Services**:
- **Email**: SendGrid (^8.1.4) with Nodemailer fallback
- **SMS**: Twilio (^5.8.0) for verification codes
- **AI Calling**: Custom AI bot system for automated verification
- **SMTP Server**: `srv144.hostserv.co.za:465`

#### **Government Integration**:
- **Department of Home Affairs API**: Document verification and face recognition
- **Identity Verification**: ID scanning and validation
- **Legal Compliance**: Official document processing

### **Push Notifications**
- **Service**: Firebase Cloud Messaging (FCM)
- **Integration**: Firebase Cloud Functions + FCM API
- **Storage**: FCM tokens stored in Firestore profiles table
- **Triggers**: Database triggers on verification workflows
- **Features**: Proof-of-life reminders, escalation alerts, executor notifications

### **Document & Media Handling**
- **Will Documents**: Secure PDF upload and storage
- **Image Processing**: Client-side compression before upload
- **Document Types**: PDF (wills), JPEG/PNG (images), MP4 (videos)
- **Security**: Encrypted document storage and transmission
- **Verification**: Document authenticity and integrity checks

### **Development & Build Tools**
- **Package Manager**: npm
- **Build Tool**: EAS Build (Expo Application Services)
- **Bundling**: 
  - Mobile: React Native bundle format
  - Cross-platform: Single codebase deployment
- **Development Server**: Expo development server
- **Project ID**: `miwill-app-production`

### **Deployment**
#### **Mobile Applications**:
- **iOS**: App Store via EAS Build
- **Android**: Google Play Store via EAS Build
- **Build Scripts**: Automated EAS Build configurations
- **OTA Updates**: Expo Updates for non-native changes

#### **Backend Services**:
- **Server**: Node.js production server
- **Database**: Firebase Firestore (production)
- **Storage**: Firebase Storage (production)
- **Functions**: Firebase Cloud Functions (production)

#### **CI/CD**:
- **Version Control**: GitHub
- **Automated Builds**: EAS Build with GitHub integration
- **Environment**: Production, Staging, Development
- **Version Management**: Automated with version-adjuster.js

### **Environment Management**
- **Environment Variables**: Stored in `.env` files
- **Firebase Configuration**: Project-specific config files
- **API Keys**: SendGrid, Twilio, Home Affairs API
- **Security**: `.env` files in `.gitignore` to prevent exposure
- **Configuration**: Firebase project configuration files

### **Security**
- **Data Encryption**: End-to-end encryption for will documents
- **HTTPS Only**: All network requests encrypted
- **Firebase Security Rules**: Row Level Security on all collections
- **JWT Authentication**: Secure token-based authentication
- **Identity Verification**: Multi-factor authentication for sensitive operations
- **Document Security**: Encrypted storage and secure transmission
- **API Security**: Rate limiting and input validation
- **Access Control**: Role-based permissions for different user types

### **Testing (Recommended)**
- **Unit Tests**: Jest (via Expo)
- **E2E Tests**: Detox or Appium
- **API Tests**: Firebase API testing
- **Mobile Tests**: Expo development build testing
- **Real Device Tests**: Physical iOS/Android devices
- **Integration Tests**: Third-party API testing (Typeform, Home Affairs)

### **Performance Optimization**
- **Code Splitting**: React Native lazy loading
- **Image Optimization**: Lazy loading, responsive images
- **Caching**: Firebase cache, local storage optimization
- **Bundle Size**: Tree shaking, minification via EAS Build
- **Offline Support**: Local data caching for critical information
- **Memory Management**: Optimized for large document handling

### **Developer Experience**
- **Linting**: ESLint with TypeScript rules
- **Code Formatting**: Prettier configuration
- **Git Hooks**: Husky for pre-commit checks (optional)
- **Documentation**: Markdown guides in repository
- **TypeScript**: Strict mode enabled for type safety
- **Metro Bundler**: Custom configuration for optimization

### **Monitoring & Analytics**
- **Error Tracking**: Firebase Crashlytics
- **Analytics**: Firebase Analytics
- **Performance**: React Native performance monitoring
- **Usage Metrics**: Firebase dashboard and custom analytics
- **Verification Tracking**: Proof-of-life process monitoring
- **Document Analytics**: Upload and access tracking

### **Project Structure**
```
MiWill-App/
├── src/                       # React Native source code
│   ├── components/            # Reusable UI components
│   ├── screens/              # App screens
│   ├── navigation/           # Navigation configuration
│   ├── services/             # API and integration services
│   ├── utils/                # Utility functions
│   └── types/                # TypeScript type definitions
├── assets/                   # Images, fonts, and static assets
├── firebase/                 # Firebase configuration
│   ├── functions/            # Cloud Functions
│   ├── rules/                # Firestore security rules
│   └── config/               # Firebase configuration files
├── docs/                     # Documentation
│   ├── MiWill-Flow-Documentation.md
│   ├── TECH_STACK_DOCUMENTATION.md
│   └── MiWill-PRD.md
├── eas.json                  # EAS Build configuration
├── app.json                  # Expo app configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

### **Key Dependencies**
```json
{
  "react": "*",
  "react-native": "0.76.9",
  "@expo/vector-icons": "~14.0.4",
  "@react-navigation/native": "^7.0.14",
  "@react-navigation/native-stack": "^7.2.0",
  "@react-navigation/bottom-tabs": "*",
  "@react-native-async-storage/async-storage": "1.23.1",
  "expo": "~52.0.47",
  "expo-camera": "~16.0.18",
  "expo-image-picker": "~16.0.6",
  "expo-linear-gradient": "~14.0.2",
  "expo-blur": "~14.0.3",
  "react-native-wheel-color-picker": "latest",
  "react-native-modal": "^14.0.0-rc.1",
  "react-native-keyboard-aware-scroll-view": "^0.9.5",
  "react-native-gesture-handler": "~2.20.2",
  "react-native-safe-area-context": "4.12.0",
  "react-native-screens": "~4.4.0"
}
```

### **Backend Dependencies**
```json
{
  "express": "^4.21.2",
  "firebase-admin": "^13.0.2",
  "socket.io": "^4.8.1",
  "multer": "^1.4.5-lts.1",
  "axios": "^1.7.9",
  "nodemailer": "^7.0.9",
  "@sendgrid/mail": "^8.1.4",
  "twilio": "^5.8.0",
  "express-rate-limit": "^8.1.0",
  "dotenv": "^16.4.7"
}
```

---

## Key Objectives

### **Core Functionality**
**References**
- String - text of any length
- Object - reference to another Datatype - (represented by '[ ]')
- Object value - reference to another value access through another datatype or a field - (represented by '{ }')
- Option - list of selectable values
- User input - data typed in by the user

### **Definitions**

#### **Registration generates the following record**

**User Profile (UP)**:
- user_id: string (UUID, auto-generated by Firebase Auth)
- email: string (PRIVATE, from Firebase Auth)
- phone: string {user input}
- full_name: string {user input}
- id_number: string {user input, unique}
- policy_number: string {user input, optional}
- profile_picture: url to Firebase Storage {user input}
- notification_frequency: option {daily, weekly, monthly, quarterly, custom_days}
- custom_frequency_days: int {user input, if custom_frequency selected}
- account_created: timestamp
- last_seen: timestamp
- email_verified: boolean default false
- phone_verified: boolean default false
- is_active: boolean default true
- onboarding_completed: boolean default false
- created_at: timestamp
- updated_at: timestamp

**Attorney Information**:
- attorney_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- attorney_name: string {user input}
- attorney_email: string {user input}
- attorney_phone: string {user input}
- attorney_firm: string {user input, optional}
- attorney_address: string {user input, optional}
- relationship_type: option {family_lawyer, estate_lawyer, general_practice, other}
- is_primary: boolean default true
- created_at: timestamp
- updated_at: timestamp

**Executor Information**:
- executor_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- executor_name: string {user input}
- executor_email: string {user input}
- executor_phone: string {user input}
- executor_id_number: string {user input}
- relationship_to_user: string {user input}
- executor_address: string {user input, optional}
- is_primary: boolean default true
- verification_status: option {pending, verified, rejected}
- created_at: timestamp
- updated_at: timestamp

**Secondary Contact**:
- secondary_contact_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- contact_name: string {user input}
- contact_email: string {user input}
- contact_phone: string {user input}
- relationship_to_user: string {user input}
- contact_address: string {user input, optional}
- is_verified: boolean default false
- verification_token: string (auto-generated)
- created_at: timestamp
- updated_at: timestamp

**Will Information**:
- will_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- will_title: string {user input}
- will_description: string {user input, optional}
- will_document_url: url to Firebase Storage {user input}
- will_document_name: string {user input}
- will_document_size: int (bytes)
- will_document_type: string (MIME type)
- is_primary_will: boolean default true
- last_updated: timestamp
- created_at: timestamp
- updated_at: timestamp

**Asset Information**:
- asset_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- asset_name: string {user input}
- asset_type: option {property, vehicle, bank_account, investment, jewelry, artwork, business, other}
- asset_description: string {user input, optional}
- asset_value: double {user input, optional}
- asset_location: string {user input, optional}
- asset_document_url: url to Firebase Storage {user input, optional}
- asset_document_name: string {user input, optional}
- is_active: boolean default true
- created_at: timestamp
- updated_at: timestamp

**Policy Information**:
- policy_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- policy_number: string {user input}
- policy_type: option {life_insurance, health_insurance, property_insurance, vehicle_insurance, other}
- insurance_company: string {user input}
- policy_value: double {user input, optional}
- policy_description: string {user input, optional}
- policy_document_url: url to Firebase Storage {user input, optional}
- policy_document_name: string {user input, optional}
- is_active: boolean default true
- created_at: timestamp
- updated_at: timestamp

**Beneficiary Information**:
- beneficiary_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- beneficiary_name: string {user input}
- beneficiary_email: string {user input, optional}
- beneficiary_phone: string {user input, optional}
- beneficiary_address: string {user input, optional}
- relationship_to_user: string {user input}
- beneficiary_percentage: double {user input, optional}
- is_primary: boolean default false
- is_verified: boolean default false
- verification_token: string (auto-generated)
- created_at: timestamp
- updated_at: timestamp

**Asset-Beneficiary Linking**:
- asset_beneficiary_id: string (UUID, auto-generated)
- asset_id: [Asset Information] {asset_id}
- beneficiary_id: [Beneficiary Information] {beneficiary_id}
- allocation_percentage: double {user input}
- allocation_type: option {percentage, specific_amount, equal_split}
- created_at: timestamp
- updated_at: timestamp

**Policy-Beneficiary Linking**:
- policy_beneficiary_id: string (UUID, auto-generated)
- policy_id: [Policy Information] {policy_id}
- beneficiary_id: [Beneficiary Information] {beneficiary_id}
- allocation_percentage: double {user input}
- allocation_type: option {percentage, specific_amount, equal_split}
- created_at: timestamp
- updated_at: timestamp

**Proof of Life Verification**:
- pol_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- verification_type: option {email, sms, phone_call, executor_verification}
- verification_status: option {pending, completed, failed, expired}
- verification_token: string (auto-generated)
- verification_url: string (auto-generated)
- sent_to_email: string
- sent_to_phone: string
- verification_attempts: int default 0
- max_attempts: int default 3
- expires_at: timestamp
- completed_at: timestamp
- created_at: timestamp
- updated_at: timestamp

**Escalation Workflow**:
- escalation_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- pol_id: [Proof of Life Verification] {pol_id}
- escalation_level: option {level_1_email, level_2_call, level_3_executor, level_4_beneficiary}
- escalation_status: option {pending, in_progress, completed, failed}
- escalation_recipient: string (email or phone)
- escalation_attempts: int default 0
- max_attempts: int default 3
- escalation_notes: string {system generated}
- created_at: timestamp
- completed_at: timestamp
- updated_at: timestamp

**AI Bot Call Log**:
- call_log_id: string (UUID, auto-generated)
- escalation_id: [Escalation Workflow] {escalation_id}
- user_id: [UP] {user_id}
- call_type: option {primary_user, secondary_contact, executor, beneficiary}
- call_recipient: string (phone number)
- call_status: option {initiated, answered, no_answer, busy, failed}
- call_duration: int (seconds)
- call_transcript: string (AI generated)
- call_outcome: option {verified_alive, not_verified, no_response, escalation_needed}
- ai_confidence_score: double (0-1 range)
- created_at: timestamp
- updated_at: timestamp

**Executor Verification**:
- executor_verification_id: string (UUID, auto-generated)
- executor_id: [Executor Information] {executor_id}
- user_id: [UP] {user_id}
- verification_type: option {email_verification, document_upload, home_affairs_api}
- verification_status: option {pending, verified, rejected, expired}
- verification_token: string (auto-generated)
- verification_url: string (auto-generated)
- document_upload_url: url to Firebase Storage {optional}
- document_type: option {id_document, affidavit, legal_document}
- home_affairs_api_response: string (JSON response)
- face_recognition_score: double (0-1 range)
- verification_attempts: int default 0
- expires_at: timestamp
- verified_at: timestamp
- created_at: timestamp
- updated_at: timestamp

**Death Certificate Process**:
- death_certificate_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- executor_id: [Executor Information] {executor_id}
- certificate_status: option {pending_upload, uploaded, verified, rejected}
- certificate_document_url: url to Firebase Storage {user input}
- certificate_document_name: string {user input}
- uploaded_by_beneficiary_id: [Beneficiary Information] {beneficiary_id}
- verification_status: option {pending, verified, rejected}
- home_affairs_verification: string (JSON response)
- verification_notes: string {system generated}
- created_at: timestamp
- verified_at: timestamp
- updated_at: timestamp

**Department of Home Affairs Integration**:
- home_affairs_log_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- integration_type: option {id_verification, face_recognition, death_certificate_verification}
- api_endpoint: string
- request_payload: string (JSON)
- response_payload: string (JSON)
- response_status: option {success, error, timeout}
- response_code: int
- processing_time: int (milliseconds)
- created_at: timestamp

**Notification Log**:
- notification_id: string (UUID, auto-generated)
- user_id: [UP] {user_id}
- notification_type: option {proof_of_life, escalation_alert, executor_notification, beneficiary_alert, system_update}
- notification_method: option {email, sms, push_notification}
- recipient_email: string
- recipient_phone: string
- notification_title: string
- notification_body: string
- notification_data: string (JSON payload)
- delivery_status: option {pending, sent, delivered, failed, bounced}
- delivery_timestamp: timestamp
- read_timestamp: timestamp
- created_at: timestamp
- updated_at: timestamp

**Audit Log**:
- audit_log_id: string (UUID, auto-generated)
- user_id: [UP] {user_id} / null (for system events)
- event_type: option {user_registration, will_upload, asset_added, beneficiary_added, pol_verification, escalation_triggered, executor_verification, death_certificate_upload, system_event}
- action: option {created, updated, deleted, accessed, failed, verified}
- severity: option {low, medium, high, critical}
- description: string (auto-generated description)
- metadata: string (JSON: IP address, device info, etc.)
- ip_address: string
- device_info: string (platform, OS, app version)
- created_at: timestamp

**System Settings**:
- setting_id: string (UUID, auto-generated)
- setting_key: string (e.g., max_file_size, pol_frequency_limits, escalation_timeouts)
- setting_value: string
- description: string
- is_system: boolean default true (cannot be modified by users)
- created_at: timestamp
- updated_at: timestamp

### **Real-time Features**

- **Live Proof-of-Life Status**: Real-time verification status updates using Firebase Realtime
- **Escalation Notifications**: Instant alerts when verification fails
- **Executor Alerts**: Real-time notifications to executors
- **Beneficiary Updates**: Live status updates for beneficiaries
- **Document Upload Status**: Real-time file upload progress
- **Verification Progress**: Live tracking of verification workflows

### **Security & Privacy**

- **Document Encryption**: Will documents encrypted in transit and at rest
- **Row Level Security**: Firebase Security Rules protect user data
- **Identity Verification**: Multi-factor authentication for sensitive operations
- **Access Control**: Role-based permissions for different user types
- **Secure Storage**: Encrypted Firebase Storage for sensitive documents
- **Audit Trail**: Comprehensive logging of all user actions
- **Data Protection**: Compliance with legal and regulatory requirements

### **Cross-Platform Support**

- **Mobile Application**: React Native/Expo app for iOS and Android
- **Web Dashboard**: Future web interface for administrators
- **Consistent UX**: Unified experience across all platforms
- **Offline Support**: Local data caching for critical information

### **AI Integration**

**AI Bot Calling System**:
- **Description**: Intelligent automated calling system for proof-of-life verification
- **Integration**: Custom AI bot with natural language processing
- **Features**: Automated verification calls, transcript generation, escalation detection

**AI Bot Call Data Model**:
- **Call Management**: Automated call scheduling and retry logic
- **Transcript Analysis**: AI-powered call outcome analysis
- **Escalation Detection**: Intelligent escalation trigger detection
- **Confidence Scoring**: AI confidence in verification results

### **Functions**

#### **User Dashboard**

**Description**: Primary users have access to this page for managing their will information.

**Acceptance Criteria**:
- View own profile: [UP] {full_name, id_number, policy_number}
- View own assets: [Asset Information] with beneficiary linking
- View own policies: [Policy Information] with beneficiary linking
- View beneficiaries: [Beneficiary Information] with allocation details
- View will documents: [Will Information] with upload status
- Add new assets: [Asset Information] with document upload
- Add new policies: [Policy Information] with document upload
- Add new beneficiaries: [Beneficiary Information] with verification
- Upload will documents: [Will Information] with secure storage
- Update profile information: [UP] with validation
- Manage notification preferences: [UP] {notification_frequency}

#### **Proof-of-Life Verification**

**Description**: The system must automatically verify user well-being based on selected frequency.

**Acceptance Criteria**:
- Users receive verification emails: [Proof of Life Verification] {verification_type = email}
- Users receive verification SMS: [Proof of Life Verification] {verification_type = sms}
- Secondary contacts receive parallel notifications: [Notification Log] {notification_type = proof_of_life}
- Verification URLs require ID/Client Number: [Proof of Life Verification] {verification_token}
- Failed verifications trigger escalation: [Escalation Workflow] {escalation_level}
- AI bot makes verification calls: [AI Bot Call Log] {call_type}
- Maximum 3 call attempts per contact: [AI Bot Call Log] {max_attempts}
- Escalation to executor when calls fail: [Escalation Workflow] {escalation_level = level_3_executor}
- Executor verification with legal documents: [Executor Verification] {verification_type}
- Beneficiary notification when executor unreachable: [Escalation Workflow] {escalation_level = level_4_beneficiary}

#### **Will Execution Process**

**Description**: The system must handle will execution when user death is confirmed.

**Acceptance Criteria**:
- Death certificate upload by beneficiaries: [Death Certificate Process] {certificate_status = uploaded}
- Executor notification and verification: [Executor Verification] {verification_status}
- Department of Home Affairs API integration: [Department of Home Affairs Integration]
- Face recognition verification: [Executor Verification] {face_recognition_score}
- Legal document processing: [Executor Verification] {document_type}
- Beneficiary coordination: [Beneficiary Information] {is_verified}
- Will document access control: [Will Information] with executor permissions
- Asset distribution coordination: [Asset-Beneficiary Linking] with executor oversight

#### **Document Management**

**Description**: The system must securely handle all legal documents and verification materials.

**Accepted File Types**: PDF (wills, legal documents), JPEG/PNG (ID documents, certificates), MP4 (verification videos), and other supported formats.

**Acceptance Criteria**:
- Users can upload will documents: [Will Information] with secure storage
- Users can upload asset documents: [Asset Information] with document linking
- Users can upload policy documents: [Policy Information] with document linking
- Executors can upload verification documents: [Executor Verification] with document upload
- Beneficiaries can upload death certificates: [Death Certificate Process] with secure storage
- All documents must be encrypted in Firebase Storage
- Access must be controlled by user permissions and verification status
- Documents must support preview in-app (PDFs, images)
- File size limits must be enforced per document type
- Document integrity must be verified
- Audit trail must track all document access and modifications

#### **Notification System**

**Description**: The system must deliver real-time notifications for all verification and execution processes.

**Acceptance Criteria**:
- Proof-of-life verification notifications: [Notification Log] {notification_type = proof_of_life}
- Escalation alert notifications: [Notification Log] {notification_type = escalation_alert}
- Executor notification alerts: [Notification Log] {notification_type = executor_notification}
- Beneficiary alert notifications: [Notification Log] {notification_type = beneficiary_alert}
- System update notifications: [Notification Log] {notification_type = system_update}
- Notifications must respect user preferences: [UP] {notification_frequency}
- Notifications must include verification URLs and action buttons
- Notifications must support deep linking to relevant app sections
- Notification delivery status must be tracked: [Notification Log] {delivery_status}
- Multi-channel delivery: email, SMS, and push notifications
- Notification history must be maintained for audit purposes

#### **Advanced Search & Filter**

**Description**: The system must allow users to quickly find assets, policies, beneficiaries, and verification records.

**Acceptance Criteria**:
- Search must work by asset name: [Asset Information] {asset_name}
- Search must work by policy number: [Policy Information] {policy_number}
- Search must work by beneficiary name: [Beneficiary Information] {beneficiary_name}
- Search must work by verification status: [Proof of Life Verification] {verification_status}
- Filters must include asset type, policy type, verification status, date range
- Search results must show relevant information with context
- Users must be able to search within specific categories
- Search must work across all platforms consistently
- Advanced filters must include verification attempts, escalation levels
- Search history must be saved for quick access

### **Scalability, Maintainability & Reliability**

#### **Scalability**

The MiWill system must be able to grow with user adoption and handle increasing verification workflows.

**Acceptance Criteria**:
- System must support thousands of concurrent users without slowdowns
- Must handle millions of verification requests without performance degradation
- Adding new features must not affect existing functionality
- The architecture must allow horizontal scaling
- Real-time verification features must scale with user growth
- Document storage must scale automatically with usage
- Database queries must remain fast with large datasets

#### **Maintainability**

The system must be easy to maintain, update, and enhance for will management processes.

**Acceptance Criteria**:
- Codebase must follow standardized coding practices
- Code must be modular with clear separation between verification, document, and user management
- System must include clear documentation for developers
- Maintenance tasks must be possible without disrupting active users
- Logging and error handling must provide enough detail for troubleshooting
- Automated testing must cover critical verification functionality
- CI/CD pipeline must enable rapid deployment of updates

#### **Reliability**

The system must run consistently and accurately for critical will management processes.

**Acceptance Criteria**:
- Target uptime of 99.9% during peak usage hours
- Automatic retries for failed verification deliveries
- Database backups must run daily with recovery options
- Failures must be logged and visible to administrators
- System must handle sudden spikes in verification requests
- Verification delivery must be guaranteed
- Document files must be redundantly stored
- Real-time features must have fallback mechanisms

#### **Security**

The system must protect sensitive will and personal information.

**Acceptance Criteria**:
- Will documents must be encrypted in transit and at rest
- All access must be role-based and permission-controlled
- Multi-factor authentication available for sensitive operations
- All actions must be stored in Audit Logs
- The system must comply with legal and regulatory requirements
- Document files must be access-controlled
- API endpoints must be rate-limited
- User sessions must be securely managed

#### **Performance**

The system must remain fast and responsive for critical verification processes.

**Acceptance Criteria**:
- Verification requests must complete within 30 seconds
- Document upload must complete within 60 seconds for typical file sizes
- Search results must return within 5 seconds for large datasets
- Notifications must be delivered within 60 seconds of trigger events
- Real-time updates must have latency under 2 seconds
- App startup must complete within 10 seconds
- Document preview must load within 5 seconds

### **User Interface (UI)**

The system must provide a clean and intuitive interface for will management and verification processes.

**Acceptance Criteria**:
- The system must include:
  - User dashboard with profile and will information overview
  - Asset and policy management interface with beneficiary linking
  - Beneficiary management with allocation controls
  - Will document upload and management interface
  - Proof-of-life verification status tracking
  - Executor and attorney contact management
  - Notification preferences and frequency settings
- Buttons and labels must use clear, simple wording (e.g., "Upload Will", "Add Beneficiary", "Verify Life")
- Success and error messages must be shown in plain language
- Verification processes must be easy to understand and follow
- Document management must be intuitive with preview capabilities
- UI must be consistent across iOS and Android platforms
- Teal accent colors must be used consistently
- Accessibility features must be supported
- Responsive design must work on all screen sizes
- Humorous elements must be included for notification frequency selection

---

## Scope

### **In-Scope Features**

#### **User Onboarding & Registration**

MiWill provides a comprehensive onboarding process using Typeform integration for collecting user data, attorney selection, executor designation, and will information setup.

**Acceptance Criteria**:
- Users must complete Typeform-based registration with all required fields
- Users must select notification frequency for proof-of-life checkups (with humorous UI elements)
- Users must designate a primary attorney with contact information
- Users must designate a primary executor with relationship details
- Users must designate a secondary contact for verification purposes
- Users must upload initial will documents during onboarding
- Users must add initial assets, policies, and beneficiaries
- Onboarding must include ID/Client Number verification
- All onboarding data must be securely stored in Firebase

#### **User Dashboard Management**

The user dashboard serves as the central hub for managing will information, assets, policies, and beneficiaries.

**Acceptance Criteria**:
- Users must be able to view their profile information (ID Number, Full Names, Policy Number)
- Users must be able to add, edit, and delete assets with beneficiary linking
- Users must be able to add, edit, and delete policies with beneficiary linking
- Users must be able to add, edit, and delete beneficiaries with allocation percentages
- Users must be able to upload, view, and delete will documents
- Users must be able to update profile information
- Users must be able to manage notification frequency preferences
- Dashboard must display all information in a clean, teal-themed interface
- All data must be synchronized across platforms in real-time

#### **Proof-of-Life Verification System**

The system automatically verifies user well-being based on selected notification frequency through email, SMS, and phone call escalations.

**Acceptance Criteria**:
- Verification emails must be sent to users based on selected frequency
- Secondary contacts must receive parallel verification requests
- Verification URLs must require ID/Client Number for access
- Maximum 3 verification attempts per verification cycle
- Failed verifications must trigger escalation to call center
- AI bot must make automated verification calls to primary and secondary contacts
- Call transcripts must be generated and analyzed
- Escalation workflow must progress through 4 levels (Email → Call → Executor → Beneficiary)
- All verification attempts must be logged for audit purposes
- Verification status must be visible to users on dashboard

#### **AI Bot Calling System**

The system includes an AI-powered automated calling system for proof-of-life verification with intelligent escalation detection.

**Acceptance Criteria**:
- AI bot must make automated calls to primary users, secondary contacts, executors, and beneficiaries
- Calls must support multiple languages with natural language processing
- Call transcripts must be generated and stored
- AI must analyze call outcomes with confidence scoring
- Maximum 3 call attempts per contact before escalation
- Failed calls must trigger next escalation level
- Call logs must include duration, transcript, and outcome
- AI confidence scores must inform escalation decisions
- Calls must support voice verification and status confirmation

#### **Will Execution Process**

The system manages will execution workflows when user death is confirmed, including executor verification and beneficiary coordination.

**Acceptance Criteria**:
- Death certificates must be uploaded by authorized beneficiaries
- Executor must receive notification with verification requirements
- Executor must upload ID and legal documents for verification
- Department of Home Affairs API must verify executor identity
- Face recognition must verify uploaded documents match executor
- Executor must be able to access will documents after verification
- Asset and policy information must be accessible to verified executor
- Beneficiary notifications must be sent after executor verification
- All legal documents must be securely processed and stored
- Will execution must follow legal compliance requirements

#### **Document Management**

The system provides secure document storage and management for wills, legal documents, assets, policies, and verification materials.

**Acceptance Criteria**:
- Will documents must be uploaded in PDF format with secure storage
- Asset documents must support linking to specific assets
- Policy documents must support linking to insurance policies
- Executor verification documents must be securely uploaded
- Death certificates must be uploaded and verified by system
- All documents must be encrypted in Firebase Storage
- Documents must support preview in-app (PDFs, images)
- File size limits must be enforced (10MB for images, 50MB for documents)
- Documents must be access-controlled by user permissions
- Document integrity must be verified and maintained
- Audit trail must track all document access and modifications

#### **Notification System**

The system delivers real-time notifications for proof-of-life verification, escalation alerts, executor notifications, and beneficiary updates.

**Acceptance Criteria**:
- Proof-of-life verification notifications must be sent via email and SMS
- Escalation alert notifications must notify relevant parties
- Executor notification emails must include action buttons
- Beneficiary alert notifications must coordinate asset distribution
- All notifications must include verification URLs with ID requirements
- Notification delivery status must be tracked (sent, delivered, failed)
- Multi-channel delivery must support email, SMS, and push notifications
- Notification history must be maintained for audit purposes
- Notifications must respect user frequency preferences
- Deep linking must support navigation to relevant app sections

#### **Department of Home Affairs Integration**

The system integrates with Department of Home Affairs API for official identity and document verification.

**Acceptance Criteria**:
- System must verify executor ID documents via Home Affairs API
- Face recognition must verify uploaded documents match official records
- Death certificate verification must integrate with government systems
- API requests must be logged with request/response payloads
- Integration must handle API errors and timeouts gracefully
- Verification status must be stored and tracked
- Failed verifications must trigger appropriate error handling
- API responses must be securely logged for audit purposes

#### **User Profiles & Settings**

The system allows users to manage their profiles, notification preferences, and verification settings.

**Acceptance Criteria**:
- User profiles must include: ID Number, Full Names, Policy Number, contact information
- Users must be able to edit their profile information
- Notification frequency must be customizable (daily, weekly, monthly, quarterly, custom days)
- Users must be able to update secondary contact information
- Users must be able to update executor and attorney information
- Profile pictures must be uploadable and viewable
- Users must be able to manage beneficiary information
- Privacy settings must control document access and sharing
- All profile changes must be logged in audit trail

#### **Asset & Beneficiary Management**

The system allows users to manage assets, policies, beneficiaries, and create linking relationships between them.

**Acceptance Criteria**:
- Users must be able to add, edit, and delete assets (property, vehicle, bank account, investment, etc.)
- Users must be able to add, edit, and delete policies (life, health, property, vehicle insurance, etc.)
- Users must be able to add, edit, and delete beneficiaries with contact information
- Asset-beneficiary linking must support percentage or specific amount allocation
- Policy-beneficiary linking must support percentage or specific amount allocation
- Allocation types must support: percentage, specific amount, equal split
- Beneficiary information must include: name, email, phone, address, relationship
- All linking must be editable and removable
- Allocation totals must be validated (cannot exceed 100% for percentages)
- Beneficiary verification tokens must be generated for notification purposes

#### **Cross-Platform Support**

The system provides consistent functionality across iOS and Android mobile platforms with React Native/Expo.

**Acceptance Criteria**:
- iOS native app must be available through App Store
- Android native app must be available through Google Play Store
- All platforms must support the same core features
- UI must be consistent across iOS and Android platforms
- Data must be synchronized across platforms in real-time
- Teal accent colors must be used consistently
- Mobile-responsive design must work on all screen sizes
- Offline support must cache critical information locally

#### **Security & Compliance**

The system implements comprehensive security measures to protect sensitive will and personal information.

**Acceptance Criteria**:
- Will documents must be encrypted in transit and at rest
- All access must be role-based and permission-controlled
- Identity verification must use multi-factor authentication for sensitive operations
- All actions must be stored in audit logs
- System must comply with legal and regulatory requirements for estate planning
- Document files must be access-controlled
- API endpoints must be rate-limited
- User sessions must be securely managed
- Row Level Security must protect all Firebase data
- Data encryption must meet industry standards

---

### **Out-of-Scope Features**

The following features are not included in this version of MiWill:

#### **Advanced Legal Services**
Legal document creation, legal advice, or estate planning consultation services.

#### **Investment Management**
Portfolio management, investment tracking, or financial planning beyond asset listing.

#### **Advanced AI Features**
Natural language will generation, automated beneficiary suggestions, or predictive asset distribution.

#### **Social Features**
Social media integration, family sharing features, or collaborative will editing.

#### **Video Calling**
Real-time video communication or video verification for proof-of-life.

#### **Advanced Analytics**
Detailed estate analytics, user behavior tracking, or business intelligence features.

#### **Enterprise Features**
Corporate will management, organization-wide settings, or bulk user management.

#### **Monetization Features**
Premium subscriptions, in-app purchases, or advertising integration.

#### **Cryptocurrency Integration**
Digital currency tracking, cryptocurrency asset management, or blockchain-based will storage.

#### **Multi-Language Support**
Full internationalization beyond English, multi-currency support, or localized legal compliance.

#### **Advanced Document Collaboration**
Real-time collaborative will editing, version control for documents, or document merging features.

#### **Mobile Web Version**
Responsive web application or browser-based interface.

---

## File Structure

```
MiWill-App/
├── src/                             # React Native source code
│   ├── components/                  # Reusable React Native components
│   │   ├── ui/                      # Generic UI components
│   │   │   ├── Button.tsx           # Custom button component
│   │   │   ├── Input.tsx            # Text input component
│   │   │   ├── Modal.tsx            # Modal component
│   │   │   ├── Card.tsx             # Card component
│   │   │   └── Avatar.tsx           # Profile picture component
│   │   ├── dashboard/               # Dashboard-specific components
│   │   │   ├── DashboardHeader.tsx  # Dashboard header with user info
│   │   │   ├── AssetCard.tsx       # Asset display card
│   │   │   ├── PolicyCard.tsx      # Policy display card
│   │   │   ├── BeneficiaryCard.tsx  # Beneficiary display card
│   │   │   └── WillDocumentCard.tsx # Will document card
│   │   ├── forms/                   # Form components
│   │   │   ├── OnboardingForm.tsx   # Typeform integration
│   │   │   ├── AssetForm.tsx       # Add/edit asset form
│   │   │   ├── PolicyForm.tsx      # Add/edit policy form
│   │   │   ├── BeneficiaryForm.tsx  # Add/edit beneficiary form
│   │   │   └── ProfileForm.tsx      # Profile update form
│   │   ├── verification/            # Proof-of-life components
│   │   │   ├── VerificationModal.tsx # Verification prompt
│   │   │   ├── VerificationStatus.tsx # Status display
│   │   │   └── EscalationStatus.tsx  # Escalation tracking
│   │   └── executor/                # Executor-related components
│   │       ├── ExecutorVerification.tsx # Document upload
│   │       ├── ExecutorDashboard.tsx    # Executor interface
│   │       └── WillAccess.tsx           # Will document access
│   ├── screens/                      # Application screens
│   │   ├── Onboarding.tsx           # User onboarding screen
│   │   ├── Dashboard.tsx            # Main dashboard screen
│   │   ├── Profile.tsx              # User profile screen
│   │   ├── Assets.tsx               # Asset management screen
│   │   ├── Policies.tsx             # Policy management screen
│   │   ├── Beneficiaries.tsx        # Beneficiary management screen
│   │   ├── Wills.tsx                # Will document management
│   │   ├── Settings.tsx             # App settings screen
│   │   ├── Verification.tsx         # Verification status screen
│   │   └── NotFound.tsx             # 404/error screen
│   ├── navigation/                   # Navigation configuration
│   │   ├── AppNavigator.tsx         # Main navigation setup
│   │   ├── TabNavigator.tsx         # Bottom tab navigation
│   │   └── types.ts                 # Navigation type definitions
│   ├── services/                     # Business logic and API integrations
│   │   ├── firebase.ts              # Firebase client configuration
│   │   ├── authService.ts           # Authentication service
│   │   ├── userService.ts           # User management service
│   │   ├── willService.ts           # Will document service
│   │   ├── assetService.ts          # Asset management service
│   │   ├── policyService.ts         # Policy management service
│   │   ├── beneficiaryService.ts    # Beneficiary service
│   │   ├── verificationService.ts   # Proof-of-life verification
│   │   ├── escalationService.ts     # Escalation workflow
│   │   ├── executorService.ts       # Executor verification
│   │   ├── homeAffairsService.ts     # Home Affairs API integration
│   │   ├── aiBotService.ts          # AI bot calling system
│   │   ├── notificationService.ts   # Notification delivery
│   │   └── documentService.ts       # Document upload/download
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts               # Authentication hook
│   │   ├── useUser.ts               # User data hook
│   │   ├── useVerification.ts       # Verification status hook
│   │   ├── useAssets.ts             # Assets management hook
│   │   ├── usePolicies.ts           # Policies management hook
│   │   └── useBeneficiaries.ts      # Beneficiaries management hook
│   ├── contexts/                     # React contexts
│   │   ├── AuthContext.tsx           # Authentication context
│   │   ├── UserContext.tsx          # User data context
│   │   └── ThemeContext.tsx         # Theme context (future)
│   ├── lib/                         # Shared utilities and configurations
│   │   ├── types.ts                 # TypeScript type definitions
│   │   ├── utils.ts                 # Utility functions
│   │   ├── constants.ts             # App constants
│   │   ├── validators.ts            # Form validation
│   │   └── helpers.ts               # Helper functions
│   ├── types/                        # TypeScript interfaces
│   │   ├── user.ts                  # User types
│   │   ├── will.ts                  # Will types
│   │   ├── asset.ts                 # Asset types
│   │   ├── policy.ts                # Policy types
│   │   ├── beneficiary.ts          # Beneficiary types
│   │   ├── verification.ts          # Verification types
│   │   └── executor.ts              # Executor types
│   ├── config/                      # Configuration files
│   │   ├── firebase.config.ts       # Firebase configuration
│   │   ├── api.config.ts            # API endpoints
│   │   ├── env.config.ts            # Environment variables
│   │   └── theme.config.ts          # Theme configuration
│   └── App.tsx                       # Main application component
├── assets/                           # Static assets
│   ├── images/                       # Image assets
│   │   ├── logo.png                 # MiWill logo
│   │   └── icons/                    # App icons
│   ├── fonts/                        # Custom fonts
│   │   └── montserrat/               # Montserrat font family
│   └── colors/                        # Color definitions
├── firebase/                         # Firebase backend configuration
│   ├── functions/                    # Cloud Functions
│   │   ├── proofOfLifeVerification/  # POL verification trigger
│   │   ├── escalationWorkflow/      # Escalation automation
│   │   ├── aiBotCalling/            # AI bot integration
│   │   ├── executorVerification/    # Executor verification
│   │   ├── deathCertificate/        # Death certificate processing
│   │   ├── homeAffairsIntegration/   # Home Affairs API
│   │   ├── notificationDelivery/    # Notification system
│   │   └── auditLogging/            # Audit log creation
│   ├── rules/                        # Firestore security rules
│   │   ├── users.rules.ts            # User collection rules
│   │   ├── wills.rules.ts            # Will document rules
│   │   ├── assets.rules.ts           # Asset rules
│   │   ├── policies.rules.ts        # Policy rules
│   │   ├── beneficiaries.rules.ts   # Beneficiary rules
│   │   └── verification.rules.ts     # Verification rules
│   └── config/                       # Firebase configuration
│       ├── firestore.config.ts       # Database configuration
│       ├── storage.config.ts         # Storage configuration
│       └── auth.config.ts            # Auth configuration
├── backend/                          # Node.js backend (if needed)
│   ├── server.js                     # Express server
│   ├── routes/                       # API routes
│   │   ├── auth.routes.js           # Authentication routes
│   │   ├── user.routes.js           # User routes
│   │   ├── will.routes.js            # Will routes
│   │   ├── verification.routes.js    # Verification routes
│   │   └── notification.routes.js    # Notification routes
│   ├── middleware/                   # Express middleware
│   │   ├── auth.middleware.js       # Auth middleware
│   │   ├── validation.middleware.js # Request validation
│   │   └── error.middleware.js      # Error handling
│   ├── services/                     # Backend services
│   │   ├── email.service.js         # SendGrid/Nodemailer
│   │   ├── sms.service.js            # Twilio SMS
│   │   ├── aiBot.service.js         # AI bot calling
│   │   └── homeAffairs.service.js   # Home Affairs integration
│   └── package.json                 # Backend dependencies
├── docs/                            # Documentation
│   ├── MiWill-Flow-Documentation.md # Application flow
│   ├── TECH_STACK_DOCUMENTATION.md  # Technology stack
│   ├── MiWill-PRD.md               # Product requirements
│   └── API_DOCUMENTATION.md         # API documentation
├── .expo/                            # Expo configuration
├── .eas/                             # EAS Build configuration
├── eas.json                          # EAS Build settings
├── app.json                          # Expo app configuration
├── package.json                      # Frontend dependencies
├── tsconfig.json                     # TypeScript configuration
├── babel.config.js                   # Babel configuration
├── metro.config.js                   # Metro bundler config
└── .env                              # Environment variables
```

### **Key Directory Descriptions**

#### **src/components/**
- **ui/**: Reusable UI components (buttons, inputs, modals)
- **dashboard/**: Dashboard-specific components for displaying user information
- **forms/**: Form components for data entry (assets, policies, beneficiaries)
- **verification/**: Proof-of-life verification UI components
- **executor/**: Executor-specific components for will execution

#### **src/screens/**
- **Onboarding.tsx**: Typeform-integrated onboarding flow
- **Dashboard.tsx**: Main user dashboard with profile and action buttons
- **Assets/Policies/Beneficiaries.tsx**: Management screens for each data type
- **Wills.tsx**: Will document upload and management
- **Settings.tsx**: User preferences and notification settings
- **Verification.tsx**: Proof-of-life verification status and history

#### **src/services/**
- **firebase.ts**: Firebase client initialization
- **authService.ts**: Authentication and user session management
- **verificationService.ts**: Proof-of-life verification workflows
- **escalationService.ts**: Multi-level escalation automation
- **aiBotService.ts**: AI bot calling system integration
- **homeAffairsService.ts**: Department of Home Affairs API integration
- **executorService.ts**: Executor verification and will access
- **notificationService.ts**: Multi-channel notification delivery

#### **firebase/functions/**
- **proofOfLifeVerification/**: Automated POL verification triggers
- **escalationWorkflow/**: Escalation level management
- **aiBotCalling/**: AI bot call scheduling and processing
- **executorVerification/**: Executor verification workflows
- **deathCertificate/**: Death certificate processing and verification
- **homeAffairsIntegration/**: Government API integration
- **notificationDelivery/**: Email, SMS, and push notification delivery
- **auditLogging/**: Comprehensive audit trail creation

#### **firebase/rules/**
- **users.rules.ts**: User profile security and access control
- **wills.rules.ts**: Will document encryption and access rules
- **assets.rules.ts**: Asset information security rules
- **policies.rules.ts**: Policy information security rules
- **beneficiaries.rules.ts**: Beneficiary data access rules
- **verification.rules.ts**: Verification workflow security rules

---

## Non-Functional Requirements

### **Speed**

The MiWill system must respond quickly to user interactions and perform efficiently during critical verification processes.

**Performance Targets**:
- Will document uploads (≤50MB) complete within 60 seconds
- Asset and policy data loads within 3 seconds
- Search results return within 5 seconds for large datasets
- App startup completes within 10 seconds on mobile devices
- Proof-of-life verification requests deliver within 30 seconds
- Dashboard data loads within 5 seconds
- Executor verification API calls complete within 10 seconds
- Notification delivery (email, SMS) within 60 seconds of trigger events

### **Reliability**

The system must operate consistently and accurately for critical will management processes.

**Reliability Requirements**:
- Availability: 99.9% uptime during peak usage hours (excluding scheduled maintenance)
- Automatic monitoring for critical verification workflows
- Proof-of-life verification delivery guarantee (at-least-once delivery)
- Real-time escalation features must have fallback mechanisms
- AI bot calling system must automatically retry failed calls
- Document upload integrity verification after upload completion
- Multi-level escalation workflow redundancy
- System health monitoring and alerting for critical processes

### **Backups & Recovery**

The system must maintain comprehensive backup and recovery capabilities for sensitive will and legal data.

**Backup & Recovery Requirements**:
- Daily Firebase database snapshots (Firestore)
- Database backup retention: 30 days minimum
- Will document backup retention: 90 days (legal compliance)
- Recovery time objective (RTO): within 1 hour for critical data
- Recovery point objective (RPO): maximum 4 hours of data loss
- Document files redundantly stored in Firebase Storage
- Audit logs retained for 7 years (legal compliance)
- Disaster recovery procedures tested quarterly
- Cross-region backup redundancy for critical documents
- Automated backup verification and integrity checks

### **Security**

The system must implement comprehensive security measures to protect sensitive will and personal information.

**Security Requirements**:
- Will documents encrypted in transit (TLS/SSL) and at rest (AES-256)
- Row Level Security (RLS) enforced on all Firestore collections
- Role-based access control (RBAC) for different user types
- Document files private; access via expiring signed URLs (Firebase Storage)
- HTTPS enforced for all network requests
- API keys stored securely in environment variables (not in code)
- User sessions securely managed with Firebase Auth
- Multi-factor authentication available for sensitive operations
- Identity verification using Department of Home Affairs API
- Document access control based on verification status
- API endpoints rate-limited to prevent abuse
- Comprehensive audit logging for all sensitive operations
- Legal compliance with data protection regulations
- Zero-trust architecture for will document access

### **Usability**

The system must be intuitive and accessible for users managing their estate planning.

**Usability Requirements**:
- Users can complete onboarding in less than 20 minutes
- Dashboard interface requires no training
- All core features accessible within 2 taps/clicks
- Asset and beneficiary linking process intuitive and guided
- Upload will documents in 3 simple steps
- Proof-of-life verification process clear and easy to follow
- Consistent UI across iOS and Android platforms
- Accessible UI with screen reader support (iOS VoiceOver, Android TalkBack)
- Clear error messages in plain language
- Loading states and progress indicators for all async operations
- Helpful tooltips and onboarding guides for new users
- Humorous elements in notification frequency selection to improve engagement

### **Scalability**

The system must grow with user adoption and handle increasing verification workloads.

**Scalability Requirements**:
- Supports 10,000 concurrent users on mobile platforms
- Handles millions of verification requests without performance degradation
- Proof-of-life workflows scale with user growth
- Document storage scales automatically with Firebase Storage
- AI bot calling system handles thousands of concurrent calls
- Database queries remain fast with large datasets
- Escalation workflows handle peak demand
- Real-time features scale horizontally
- Cloud Functions auto-scale with workload
- Mobile app performance remains consistent with increasing data volume

### **Performance Metrics**

**Acceptance Criteria**:
- App launch time: < 10 seconds on average mobile device
- Will document upload: < 60 seconds for 50MB files
- Dashboard load time: < 5 seconds for first load
- Verification request delivery: < 30 seconds end-to-end
- AI bot call initiation: < 5 seconds from trigger
- Executor verification API: < 10 seconds response time
- Notification delivery: < 60 seconds from trigger
- Search results: < 5 seconds for complex queries
- Data synchronization: < 2 seconds for real-time updates

### **Monitoring & Analytics**

**Requirements**:
- Real-time error tracking with Firebase Crashlytics
- Performance monitoring for all critical workflows
- Verification success rate tracking
- Document upload success rate monitoring
- API response time tracking
- User engagement analytics (dashboard usage, feature adoption)
- Escalation workflow performance metrics
- AI bot calling success rates and transcript analysis
- Notification delivery rates by channel (email, SMS, push)
- System resource utilization monitoring

### **Compliance & Legal**

**Requirements**:
- Compliance with local estate planning and will regulations
- Data protection compliance (GDPR, CCPA where applicable)
- Secure handling of sensitive legal documents
- Audit trail maintenance for legal compliance (7-year retention)
- User consent and data retention policies
- Privacy policy and terms of service compliance
- Executor verification legal compliance
- Death certificate verification legal requirements
- Department of Home Affairs integration compliance
- Secure document storage meeting legal standards

### **Accessibility**

**Requirements**:
- iOS VoiceOver support for all interactive elements
- Android TalkBack support for navigation
- High contrast mode support for visual accessibility
- Scalable text sizes (minimum 16px, support up to 200%)
- Touch target sizes minimum 44x44 pixels
- Color contrast ratios meet WCAG 2.1 AA standards
- Keyboard navigation support for all features
- Focus indicators for all interactive elements
- Alternative text for all images and icons
- Screen reader announcements for verification status

### **Maintainability**

**Requirements**:
- Modular codebase with clear separation of concerns
- Comprehensive code documentation and comments
- Automated testing for critical verification workflows
- CI/CD pipeline for automated deployments
- Version control using Git with clear commit messages
- Error logging with detailed context for troubleshooting
- Performance profiling and optimization procedures
- Database query optimization for scalability
- Regular security audits and vulnerability assessments
- Update rollback procedures for production issues

---

## Additional Requirements

### **Environment Variables - .env**

#### **Firebase Authentication**
```
FIREBASE_API_KEY="your-firebase-api-key"
FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
FIREBASE_APP_ID="your-app-id"
FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

#### **Firebase Admin (Backend)**
```
FIREBASE_ADMIN_PRIVATE_KEY="your-private-key"
FIREBASE_ADMIN_CLIENT_EMAIL="your-client-email"
FIREBASE_ADMIN_PROJECT_ID="your-project-id"
```

#### **Communication Services**
```
# SendGrid Email Service
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@miwill.app"

# Twilio SMS Service
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+your-twilio-number"

# SMTP Fallback
SMTP_HOST="srv144.hostserv.co.za"
SMTP_PORT="465"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
```

#### **AI Bot Calling System**
```
AI_BOT_API_KEY="your-ai-bot-api-key"
AI_BOT_ENDPOINT="your-ai-bot-endpoint"
AI_BOT_API_SECRET="your-ai-bot-secret"
AI_CONFIDENCE_THRESHOLD="0.8"
```

#### **Department of Home Affairs Integration**
```
HOME_AFFAIRS_API_KEY="your-home-affairs-api-key"
HOME_AFFAIRS_API_URL="https://api.homeaffairs.gov.za"
HOME_AFFAIRS_API_SECRET="your-home-affairs-secret"
HOME_AFFAIRS_FACE_RECOGNITION_ENABLED="true"
```

#### **Typeform Integration**
```
TYPEFORM_API_KEY="your-typeform-api-key"
TYPEFORM_WORKSPACE_ID="your-typeform-workspace-id"
TYPEFORM_FORM_ID="your-typeform-form-id"
```

#### **Push Notifications**
```
FCM_SERVER_KEY="your-firebase-server-key"
FCM_SENDER_ID="your-firebase-sender-id"
FCM_PROJECT_ID="your-firebase-project-id"
```

#### **App Configuration**
```
APP_NAME="MiWill"
APP_VERSION="1.0.0"
APP_ENVIRONMENT="production"
APP_BUNDLE_ID_IOS="com.miwill.app"
APP_BUNDLE_ID_ANDROID="com.miwill.app"
```

#### **Notification Preferences**
```
NOTIFICATION_EMAIL_ENABLED="true"
NOTIFICATION_SMS_ENABLED="true"
NOTIFICATION_PUSH_ENABLED="true"
POL_VERIFICATION_TIMEOUT_DAYS="7"
ESCALATION_RETRY_MAX_ATTEMPTS="3"
```

#### **File Upload Configuration**
```
MAX_FILE_SIZE_MB="50"
ALLOWED_DOCUMENT_TYPES="pdf,doc,docx"
ALLOWED_IMAGE_TYPES="jpg,jpeg,png"
ALLOWED_VIDEO_TYPES="mp4,mov"
ENABLE_FILE_COMPRESSION="true"
```

#### **Security & Compliance**
```
ENCRYPTION_KEY="your-encryption-key"
AUDIT_LOG_RETENTION_DAYS="2555"
WILL_DOCUMENT_BACKUP_RETENTION_DAYS="90"
DATABASE_BACKUP_RETENTION_DAYS="30"
ALLOWED_API_ORIGINS="app.miwill.app"
```

#### **Development**
```
NODE_ENV="development"
EXPO_DEV_SERVER_PORT="8081"
ENABLE_DEBUG_LOGGING="true"
MOCK_AI_BOT_CALLS="false"
MOCK_HOME_AFFAIRS_API="false"
```

### **API Configuration**

#### **Firebase Functions Endpoints**
```
FUNCTIONS_BASE_URL="https://your-region-your-project-id.cloudfunctions.net"
FUNCTIONS_PROOF_OF_LIFE="/proofOfLifeVerification"
FUNCTIONS_ESCALATION="/escalationWorkflow"
FUNCTIONS_AI_BOT="/aiBotCalling"
FUNCTIONS_EXECUTOR="/executorVerification"
FUNCTIONS_HOME_AFFAIRS="/homeAffairsIntegration"
FUNCTIONS_NOTIFICATION="/notificationDelivery"
```

#### **Third-Party API Endpoints**
```
SENDGRID_API_URL="https://api.sendgrid.com/v3"
TWILIO_API_URL="https://api.twilio.com/2010-04-01"
HOME_AFFAIRS_API_URL="https://api.homeaffairs.gov.za/v1"
TYPEFORM_API_URL="https://api.typeform.com/v1"
```

### **Database Configuration**

#### **Firestore Collections**
```
COLLECTION_USERS="users"
COLLECTION_WILLS="wills"
COLLECTION_ASSETS="assets"
COLLECTION_POLICIES="policies"
COLLECTION_BENEFICIARIES="beneficiaries"
COLLECTION_EXECUTORS="executors"
COLLECTION_SECONDARY_CONTACTS="secondary_contacts"
COLLECTION_VERIFICATIONS="proof_of_life_verifications"
COLLECTION_ESCALATIONS="escalation_workflows"
COLLECTION_CALL_LOGS="ai_bot_call_logs"
COLLECTION_NOTIFICATIONS="notifications"
COLLECTION_AUDIT_LOGS="audit_logs"
```

#### **Firebase Storage Buckets**
```
STORAGE_BUCKET_WILLS="wills"
STORAGE_BUCKET_ASSETS="assets"
STORAGE_BUCKET_POLICIES="policies"
STORAGE_BUCKET_EXECUTOR_DOCS="executor_documents"
STORAGE_BUCKET_DEATH_CERTS="death_certificates"
STORAGE_BUCKET_PROFILE_PICS="profile_pictures"
```

### **Build Configuration**

#### **EAS Build Settings**
```
EAS_PROJECT_ID="miwill-app-production"
EAS_IOS_BUILD_NUMBER="1"
EAS_ANDROID_BUILD_NUMBER="1"
EAS_BUILD_IOS_PROFILE="production"
EAS_BUILD_ANDROID_PROFILE="production"
```

#### **App Icons and Assets**
```
APP_ICON_IOS_PATH="assets/ios/icon.png"
APP_ICON_ANDROID_PATH="assets/android/icon.png"
APP_SPLASH_IOS_PATH="assets/ios/splash.png"
APP_SPLASH_ANDROID_PATH="assets/android/splash.png"
```

### **Feature Flags**

#### **Development Features**
```
FEATURE_TYPEFORM_ONBOARDING="true"
FEATURE_AI_BOT_CALLING="true"
FEATURE_HOME_AFFAIRS_INTEGRATION="true"
FEATURE_EXECUTOR_VERIFICATION="true"
FEATURE_DEATH_CERTIFICATE_UPLOAD="true"
FEATURE_PUSH_NOTIFICATIONS="true"
FEATURE_EMAIL_NOTIFICATIONS="true"
FEATURE_SMS_NOTIFICATIONS="true"
```

#### **Beta Features**
```
BETA_ADVANCED_SEARCH="true"
BETA_DOCUMENT_PREVIEW="true"
BETA_BENEFICIARY_LINKING="true"
```

### **Monitoring & Analytics**

#### **Firebase Analytics**
```
ANALYTICS_ENABLED="true"
ANALYTICS_COLLECTION_ENABLED="true"
CRASHLYTICS_ENABLED="true"
PERFORMANCE_MONITORING="true"
```

#### **Error Tracking**
```
SENTRY_DSN="your-sentry-dsn"
SENTRY_ENABLED="true"
ERROR_REPORTING_ENABLED="true"
```

### **Legal & Compliance**

#### **Data Retention**
```
AUDIT_LOG_RETENTION_DAYS="2555"
WILL_DOCUMENT_RETENTION_DAYS="90"
USER_DATA_RETENTION_DAYS="365"
VERIFICATION_LOG_RETENTION_DAYS="730"
```

#### **Privacy & Consent**
```
GDPR_COMPLIANCE_ENABLED="true"
DATA_EXPORT_ENABLED="true"
ACCOUNT_DELETION_ENABLED="true"
CONSENT_TRACKING="true"
```

### **Development Tools**

#### **TypeScript Configuration**
```
TYPESCRIPT_STRICT_MODE="true"
TYPESCRIPT_NO_UNUSED_LOCALS="true"
TYPESCRIPT_NO_UNUSED_PARAMETERS="true"
```

#### **Code Quality**
```
ESLINT_ENABLED="true"
PRETTIER_ENABLED="true"
HUSKY_ENABLED="true"
COMMITLINT_ENABLED="true"
```

### **Secrets Management**

**Important Security Notes**:
- All environment variables must be stored securely
- Never commit `.env` files to version control
- Use secrets management services (e.g., GitHub Secrets, AWS Secrets Manager)
- Rotate API keys regularly
- Different values for development, staging, and production environments
- Document all required environment variables in deployment guides

---

## Development & Deployment Setup

### **GitHub Setup**

Create a GitHub repository and push your code:
```bash
git init
git add .
git commit -m "Initial MiWill commit"
git branch -M main
git remote add origin https://github.com/your-username/miwill-app.git
git push -u origin main
```

### **Local Development Setup**

#### **Prerequisites**
- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- iOS: Xcode 14+ (for iOS development)
- Android: Android Studio (for Android development)
- Firebase account and project setup

#### **Initial Setup**
```bash
# Clone the repository
git clone https://github.com/your-username/miwill-app.git
cd miwill-app

# Install dependencies
npm install

# Install Firebase CLI (if using backend)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Setup environment variables
cp .env.example .env
# Edit .env with your Firebase credentials and API keys

# Start development server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android
```

### **Firebase Configuration**

#### **Firebase Project Setup**
1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Create Firebase Storage buckets
5. Set up Firebase Cloud Functions
6. Configure Firebase Security Rules

#### **Firestore Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Will documents - users can only access their own wills
    match /wills/{willId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Assets - users can only access their own assets
    match /assets/{assetId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Policies - users can only access their own policies
    match /policies/{policyId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Beneficiaries - users can only access their own beneficiaries
    match /beneficiaries/{beneficiaryId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
  }
}
```

### **Mobile Deployment (EAS Build)**

#### **iOS Deployment (App Store)**

**Prerequisites**:
- Apple Developer Account ($99/year)
- Xcode installed
- EAS Build account setup

**Build Configuration**:
```bash
# Login to EAS
npx eas login

# Configure iOS build
npx eas build:configure

# Build iOS app
npx eas build --platform ios --profile production

# Submit to App Store
npx eas submit --platform ios
```

**Environment Variables**:
- Set in EAS secrets: `FIREBASE_API_KEY`, `SENDGRID_API_KEY`, `TWILIO_ACCOUNT_SID`, etc.
- Configure in `eas.json` for production builds

**TestFlight Beta Testing**:
```bash
# Build for TestFlight
npx eas build --platform ios --profile production

# Submit to TestFlight
npx eas submit --platform ios
```

#### **Android Deployment (Google Play)**

**Prerequisites**:
- Google Play Developer Account ($25 one-time)
- Android Studio installed
- Keystore for signing

**Build Configuration**:
```bash
# Configure Android build
npx eas build:configure

# Build Android app
npx eas build --platform android --profile production

# Submit to Google Play
npx eas submit --platform android
```

**Environment Variables**:
- Set in EAS secrets: `FIREBASE_API_KEY`, `SENDGRID_API_KEY`, `TWILIO_ACCOUNT_SID`, etc.
- Configure in `eas.json` for production builds

### **Firebase Cloud Functions Deployment**

#### **Deploy Cloud Functions**
```bash
# Navigate to firebase directory
cd firebase

# Install dependencies
npm install

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:proofOfLifeVerification

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy storage rules
firebase deploy --only storage:rules
```

### **Backend Server Deployment (Optional)**

If using Express backend with Firebase, deploy to hosting service:

**Environment Variables**:
```
FIREBASE_ADMIN_PRIVATE_KEY
SENDGRID_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
AI_BOT_API_KEY
HOME_AFFAIRS_API_KEY
```

**Deploy Options**:
- Google Cloud Run
- Heroku
- AWS Elastic Beanstalk
- Railway

### **Environment Variables Management**

#### **Development (.env)**
Store in `.env` file (not committed to git):
```bash
FIREBASE_API_KEY="your-dev-api-key"
FIREBASE_PROJECT_ID="your-dev-project-id"
SENDGRID_API_KEY="your-dev-sendgrid-key"
TWILIO_ACCOUNT_SID="your-dev-twilio-sid"
```

#### **Production (EAS Secrets)**
Store securely in EAS Build:
```bash
# Add secrets to EAS
npx eas secret:create --name FIREBASE_API_KEY --value "your-prod-api-key"
npx eas secret:create --name SENDGRID_API_KEY --value "your-prod-sendgrid-key"
npx eas secret:create --name TWILIO_ACCOUNT_SID --value "your-prod-twilio-sid"
```

#### **Firebase Functions**
Store in Firebase config:
```bash
# Set environment variables
firebase functions:config:set sendgrid.key="your-api-key"
firebase functions:config:set twilio.account_sid="your-account-sid"
```

### **Continuous Deployment & Monitoring**

#### **CI/CD Pipeline**
- **GitHub Actions**: Automated builds on push
- **EAS Build**: Automatic builds for iOS/Android on main branch
- **Firebase**: Automatic function deployment on merge

**GitHub Actions Workflow Example**:
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: firebase deploy --only functions
```

#### **Monitoring & Analytics**
- **Firebase Analytics**: User behavior tracking
- **Firebase Crashlytics**: Error tracking and crash reporting
- **Firebase Performance**: Performance monitoring
- **Sentry (Optional)**: Advanced error tracking

```bash
# Enable Crashlytics
# Automatically enabled with Firebase SDK

# Enable Performance Monitoring
# Add firebase.analytics().logEvent() calls in code
```

### **Versioning & Updates**

#### **Mobile App Versioning**
```bash
# iOS: Update in app.json or eas.json
"ios": {
  "buildNumber": "2",
  "version": "1.0.1"
}

# Android: Update in app.json or eas.json
"android": {
  "versionCode": 2,
  "version": "1.0.1"
}

# Build and submit
npx eas build --platform all --profile production
npx eas submit --platform all
```

#### **Firebase Functions Versioning**
```bash
# Update in package.json
"version": "1.0.1"

# Deploy
firebase deploy --only functions
```

### **Production Build Checks**

#### **Pre-Deployment Checklist**
```bash
# 1. Test locally
npm run test
npm run lint

# 2. Check Firebase rules
firebase emulators:exec --only firestore

# 3. Build for production
npx eas build --platform all --profile production

# 4. Test on physical devices
# Use TestFlight (iOS) and internal testing (Android)

# 5. Deploy
npx eas submit --platform all
```

#### **Post-Deployment Verification**
- ✅ All environment variables configured
- ✅ Firebase Cloud Functions deployed
- ✅ Security rules active
- ✅ Push notifications working
- ✅ Typeform integration functional
- ✅ AI bot calling operational
- ✅ Home Affairs API integration tested
- ✅ Executor verification working
- ✅ Notification delivery verified

### **Environment-Specific Configuration**

#### **Development Environment**
- Use Firebase development project
- Mock AI bot calls (set `MOCK_AI_BOT_CALLS=true`)
- Mock Home Affairs API (set `MOCK_HOME_AFFAIRS_API=true`)
- Enable debug logging

#### **Staging Environment**
- Use Firebase staging project
- Real AI bot calls for testing
- Real Home Affairs API integration
- Production-like data

#### **Production Environment**
- Use Firebase production project
- All integrations live
- Monitoring and analytics enabled
- SSL certificates configured

### **Database Migration Strategy**

```bash
# Create migration
firebase firestore:migrations:create add_verification_fields

# Test migration locally
firebase emulators:exec "npm run test"

# Apply migration to staging
firebase firestore:migrations:apply --project staging-project-id

# Apply migration to production
firebase firestore:migrations:apply --project production-project-id
```

### **Rollback Procedures**

#### **App Rollback**
```bash
# iOS: Revert to previous version in App Store Connect
# Android: Disable current version in Google Play Console

# Or submit previous build
npx eas submit --platform all
```

#### **Firebase Functions Rollback**
```bash
# Revert to previous deployment
firebase deploy --only functions --version <previous-version>
```

### **Security Best Practices**

- ✅ Never commit `.env` files to git
- ✅ Use environment variables for all secrets
- ✅ Rotate API keys regularly
- ✅ Enable Firebase App Check for API protection
- ✅ Use Firebase Security Rules for data access
- ✅ Implement rate limiting on API endpoints
- ✅ Enable audit logging for compliance
- ✅ Use HTTPS for all communications
- ✅ Regular security audits
- ✅ Keep dependencies updated

---

*This PRD section provides a comprehensive overview of the MiWill application, incorporating technical specifications, user personas, and core functionality based on the detailed documentation provided.*
