# MiWill Flow - Application Documentation

## Overview
MiWill is a digital will management application that provides automated proof-of-life verification and executor notification services. The application ensures that wills are properly executed by maintaining contact with users and their designated contacts through a systematic verification process.

## Core Concept
The application monitors users' well-being through periodic check-ins and automatically initiates will execution procedures when users become unresponsive, ensuring their final wishes are carried out appropriately.

---

## 1. Registration/Onboarding Process

### 1.1 User Registration
**Platform**: Typeform integration for data collection

**Required User Data**:
- Personal information
- Contact details
- **Notification Frequency Selection**: 
  - Checkbox option: "Check on me every ___ days"
  - This is positioned at the bottom of the form as a humorous element
  - Purpose: Determines how often the system will verify the user is still alive

### 1.2 Contact Selection
- **Attorney Selection**: Legal representative for will execution
- **Executor Selection**: 
  - Primary executor designation
  - State relationship with executor
- **Secondary Contact**: Backup contact person for verification

### 1.3 Will Data Collection
**Required Information Categories**:

#### A. Will Information
- Will document details
- Specific instructions and wishes
- Legal requirements compliance

#### B. Policy Information
- Insurance policies
- Policy numbers and beneficiaries
- Coverage details

#### C. Assets
- Property ownership
- Financial accounts
- Personal belongings
- **Beneficiary Linking**: Connect assets to specific beneficiaries

### 1.4 Notification Setup
- Email configuration for proof-of-life communications
- Contact verification for all designated parties

### 1.5 User Dashboard Overview
**Post-Onboarding Interface**: After completing registration, users access their dashboard to manage their will information.

**Dashboard Features**:
- **User Profile Display**:
  - ID Number (Current User's ID)
  - Full Names (Current User's First Name Current...)
  - Policy Number (Current User's Policy No:formatted...)
  - Profile Picture/Avatar

- **Core Action Buttons**:
  1. **Add Your Assets / Policy**: Add details about assets and insurance policies
  2. **Add Beneficiary**: Designate beneficiaries for will or policies
  3. **Upload Will**: Upload will documents
  4. **Update Profile**: Modify personal information
  5. **Logout**: Exit user session

**Dashboard Purpose**: 
- Central hub for managing all will-related information
- Allows users to add, edit, and update information post-onboarding
- Provides easy access to core functionality
- Clean, minimalist design with teal accent colors

---

## 2. Proof of Life (POL) Backend Workflow

### 2.1 Primary Verification Process
**Trigger**: Based on user-selected checkup frequency during onboarding

**Process Flow**:
1. System sends proof-of-life email to primary user
2. Email contains verification button/link
3. Secondary contact receives parallel notification
4. Secondary contact verifies primary user's status via email

### 2.2 Escalation Levels

#### Level 1: Initial Non-Response
**Condition**: User doesn't click verification button AND secondary contact doesn't confirm

**Action**: 
- Send second verification email
- Set response deadline (configurable days)

#### Level 2: Call Center Intervention
**Trigger**: Second email remains unanswered

**Process**:
- **AI Bot Integration**: Automated calling system
- **Call Recipients**: 
  - Primary contact (user)
  - Secondary contact
- **Call Process**:
  - AI bot makes verification calls
  - If secondary contact responds, double-check primary contact status
  - Maximum 3 call attempts per contact

#### Level 3: Executor Notification
**Trigger**: 3 unsuccessful call attempts to both contacts

**Executor Communication**:
- **Message Content**: "Your [stated relationship] has an account with MiWill. Your [stated relationship] has not made contact in ___ days."
- **Action Options**:
  - Confirm proof of life
  - Select Probate (with terms and conditions)
- **Process Logic**:
  - If "No" selected: Restart verification process with primary and secondary contacts
  - If executor unreachable: Escalate to beneficiaries

#### Level 4: Beneficiary Notification
**Trigger**: Executor is unreachable

**Process**: Contact designated beneficiaries for verification

---

## 3. Department of Home Affairs Integration

### 3.1 Death Certificate Process
**Trigger**: Confirmed death or extended unresponsiveness

**Process**:
1. **Death Certificate Upload**: 
   - Beneficiaries can upload death certificates
   - Multiple beneficiaries can submit documents
2. **Executor Appointment**: 
   - Notify/appoint executor
   - Executor must upload affidavit or legal documentation
   - ID verification required

### 3.2 Executor Verification
**Technology**: Home Affairs API integration

**Process**:
- **Document Upload**: Executor uploads ID via secure link
- **Face Recognition**: API scans uploaded document for verification
- **Identity Confirmation**: 
  - System verifies executor identity
  - Displays executor name and contact number
  - Prevents unauthorized access
- **Executor Notification**: "Notify Executor" button sends message to verified executor

---

## 4. Communication Methods

### 4.1 Primary Communication Channels
- **Email**: Primary method for all proof-of-life requests
- **SMS/Text**: Secondary communication method
- **Phone Calls**: AI bot integration for escalation

### 4.2 Verification Process
**All verification requests include**:
- Email with embedded URL
- URL requires ID/Client Number for access
- Secure verification process

---

## 5. Technical Requirements Summary

### 5.1 Integrations Required
- **Typeform**: Onboarding data collection
- **Home Affairs API**: Document verification and face recognition
- **AI Bot System**: Automated calling functionality
- **Email/SMS Services**: Communication delivery

### 5.2 Security Considerations
- Secure document upload and storage
- Identity verification protocols
- Encrypted communication channels
- Access control for sensitive information

### 5.3 User Experience Elements
- Humorous tone for notification frequency selection
- Clear escalation communication
- Intuitive verification processes
- Mobile-responsive design

---

## 6. Process Flow Summary

```
User Registration → Will Data Entry → Periodic POL Checks → 
Non-Response → Call Center → Executor Notification → 
Beneficiary Contact → Death Certificate Process → 
Executor Verification → Will Execution
```

---

## 7. Key Features

1. **Automated Monitoring**: Periodic user verification
2. **Escalation Management**: Multi-level contact system
3. **AI Integration**: Automated calling and verification
4. **Document Management**: Secure upload and verification
5. **Identity Verification**: Home Affairs API integration
6. **Multi-Channel Communication**: Email, SMS, phone calls
7. **Legal Compliance**: Integration with official government systems

---

*This document serves as the foundation for creating a comprehensive Product Requirements Document (PRD) for the MiWill application.*
