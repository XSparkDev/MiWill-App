## MiWill → Capital Legacy Lead Integration (Partner Specification)

### 1. Overview

This document describes the **data payload**, **trigger conditions**, and **compliance guarantees** for leads that MiWill will send to **Capital Legacy**.

MiWill is a digital will platform. When a user's **total estate value** reaches a defined threshold and the user has explicitly consented, MiWill will submit a structured lead to Capital Legacy's lead intake API.

- **Qualification Threshold**
  - **Estate value ≥ R250,000** → Lead is sent to Capital Legacy
  - **Estate value ≤ R249,999** → Client is retained and served exclusively as a MiWill client (no lead sent)

MiWill **always** remains the system of record for its own users; the Capital Legacy integration is an **additional outbound referral** layer.

---

### 2. When a Lead Is Sent

#### 2.1 Estate Calculation

MiWill calculates the user's **total estate value** **once in the background** after the user has:
- Completed registration
- Added assets and/or policies
- Added beneficiaries
- Indicated that they are done with setup (e.g. via a “Finish” / “Complete Setup” action)

**Estate value formula**:
- `total_estate_value = sum(all asset_value) + sum(all policy_value)`

This value is stored on the user record and reused for qualification; it is **not recalculated on every view**.

#### 2.2 Lead Qualification & Consent

A lead is only sent to Capital Legacy if **all** of the following are true:

1. **Estate value threshold met**  
   - `total_estate_value ≥ R250,000`
2. **POPIA consent**  
   - The user has accepted MiWill’s POPIA terms.
3. **Capital Legacy–specific lead consent**  
   - The user has explicitly agreed to be contacted by Capital Legacy for a consultation.
4. **No prior Capital Legacy lead**  
   - No active `lead_submission_id` stored for that user in MiWill.

When these conditions are met, MiWill submits a single lead record to the Capital Legacy API.

---

### 3. Data Sources in MiWill (Database Perspective)

MiWill stores data primarily in four logical collections:

- **Users** (`users` collection)  
  - Core profile, contact information, POPIA flags, derived estate value.
- **Assets** (`assets` collection)  
  - Properties, vehicles, financial assets, other valuables with `asset_value`.
- **Policies** (`policies` collection)  
  - Insurance and similar policies with `policy_value`.
- **Beneficiaries** (`beneficiaries` collection)  
  - People/entities who receive benefits from the user's estate, including minor children.

The lead payload Capital Legacy receives is an **aggregation** of these data sources; the underlying collections themselves are not exposed.

---

### 4. Lead Payload Structure

The payload sent to Capital Legacy is a single JSON object with the following structure.

#### 4.1 Top-Level JSON Schema

```json
{
  "client_age": 0,
  "employment_status": "",
  "has_minor_children": false,
  "has_property": false,
  "has_vehicle": false,
  "has_other_assets": false,
  "marital_status": "",
  "client_address": "",
  "appointment_type": ""
}
```

#### 4.2 Field-by-Field Specification

##### 4.2.1 Client Information

- **`client_age`** (number, required)  
  - Derived from date of birth at time of lead creation (in full years).

- **`client_address`** (string, required)  
  - Primary residential address, ideally full street address (as stored in MiWill).

##### 4.2.2 Qualification Data

- **`employment_status`** (string, required)  
  - One of:  
    - `"employed"`  
    - `"self_employed"`  
    - `"unemployed"`  
    - `"retired"`  
    - `"student"`  
    - `"other"`

- **`marital_status`** (string, required)  
  - One of:  
    - `"single"`  
    - `"married"`  
    - `"divorced"`  
    - `"widowed"`  
    - `"domestic_partnership"`  
    - `"other"`

##### 4.2.3 Asset Information

- **`has_property`** (boolean, required)  
  - `true` if any asset of type `property` exists; otherwise `false`.

- **`has_vehicle`** (boolean, required)  
  - `true` if any asset of type `vehicle` exists; otherwise `false`.

- **`has_other_assets`** (boolean, required)  
  - `true` if any assets exist that are **not** `property` or `vehicle`.

##### 4.2.4 Family / Dependants

- **`has_minor_children`** (boolean, required)  
  - `true` if any beneficiary has a relationship indicating they are a child and is flagged/treated as a minor.

##### 4.2.5 Appointment & Engagement

- **`appointment_type`** (string, required)  
  - Indicates the session context requested by the user.  
  - One of:
    - `"single"` – Single-client consultation  
    - `"spouse_partner"` – Joint session with spouse/partner  
    - `"family"` – Broader family consultation
  - This is selected by the user from a dropdown at the time of lead creation.

##### 4.2.6 Internal MiWill-Only Fields

The following values remain part of MiWill's internal compliance, qualification, and audit model, but are **not included in the outbound Capital Legacy request body**:

- `popia_accepted`
- `popia_accepted_at`
- `lead_submission_consent`
- `lead_submission_consent_at`
- `lead_submitted`
- `lead_submitted_at`
- `lead_submission_id`
- `total_estate_value`
- Internal timestamps and other gating flags

---

### 5. Example Lead Payload

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

#### 5.1 Postman Test Setup

Use the same request shape as the app:

- **Method:** `POST`
- **URL:** `{{EXPO_PUBLIC_LEAD_API_URL}}/leads`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer {{EXPO_PUBLIC_LEAD_API_KEY}}`
- **Body:** Raw JSON using only the fields shown in the example payload above

MiWill should continue to keep POPIA flags, lead-consent fields, estate-threshold checks,
timestamps, and submission-tracking data in Firebase only.

---

### 6. Lead Frequency & Idempotency

- MiWill will send **at most one active lead per user** for Capital Legacy, identified internally by `lead_submission_id`.
- If a lead submission fails (e.g. network error), MiWill may **retry with the same payload**, while continuing to manage deduplication and submission tracking internally through `lead_submission_id` and related Firebase state.
- MiWill does **not** send continuous updates; subsequent estate changes remain internal unless separately agreed.

---

### 7. Data Ownership & Responsibilities

- **MiWill**
  - Owns and maintains the user database (`users`, `assets`, `policies`, `beneficiaries`).
  - Performs POPIA-compliant consent capture and storage.
  - Performs estate value calculations and qualification logic.
  - Pushes a single, well-formed lead payload to Capital Legacy when criteria are met.
  - Keeps all consent, audit, threshold, and one-time submission tracking fields internal to MiWill.

- **Capital Legacy**
  - Receives and ingests the lead payload.
  - Allocates booking agents and manages contact attempts and appointments.
  - Manages lead lifecycle and any subsequent communication with the client.

No direct database access from Capital Legacy into MiWill is required or provided; integration is **API-based only**, via the JSON payload specified above.

---

### 8. Summary

- MiWill sends **qualified, consented** leads only (estate ≥ R250,000 with explicit contact permission).
- Payloads are **single JSON objects** with clearly defined fields for:
  - Client age
  - Employment status
  - Minor-children indicator
  - Asset-category indicators
  - Marital status
  - Full address
  - Preferred appointment type
- MiWill remains the **system of record** for underlying user, asset, and policy data.

This document should provide Capital Legacy with everything needed to design their intake endpoint, validation, and internal lead routing.

