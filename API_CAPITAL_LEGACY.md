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
  "client_email": "",
  "client_phone": "",
  "client_full_name": "",
  "client_id_number": "",
  "client_address": "",

  "total_estate_value": 0,
  "monthly_income": null,
  "employment_status": "",
  "marital_status": "",

  "has_property": false,
  "has_vehicle": false,
  "has_other_assets": false,
  "asset_details": "",
  "asset_values": {
    "total_assets": 0,
    "total_policies": 0,
    "estate_total": 0
  },

  "has_minor_children": false,
  "minor_children_count": 0,

  "appointment_type": "",

  "popia_consent": true,
  "consent_timestamp": "",

  "source": "miwill_app",
  "user_id": ""
}
```

#### 4.2 Field-by-Field Specification

##### 4.2.1 Client Information

- **`client_age`** (number, required)  
  - Derived from date of birth at time of lead creation (in full years).

- **`client_email`** (string, required)  
  - Primary email address for the MiWill user.

- **`client_phone`** (string, required)  
  - Normalized South African phone number (e.g. `+27 82 123 4567`).

- **`client_full_name`** (string, required)  
  - Concatenation of first name and surname, e.g. `"Thando Mokoena"`.

- **`client_id_number`** (string, required)  
  - South African ID number as stored and validated in MiWill.

- **`client_address`** (string, required)  
  - Primary residential address, ideally full street address (as stored in MiWill).

##### 4.2.2 Qualification Data

- **`total_estate_value`** (number, required)  
  - Total estate value in **ZAR** at the point of calculation:  
    `sum(asset_value for all assets) + sum(policy_value for all policies)`.  
  - **Threshold:** Only leads with `total_estate_value ≥ 250000` are sent.

- **`monthly_income`** (number, optional)  
  - Self-reported gross monthly income in **ZAR** (if supplied by the user).
  - May be `null` or omitted if not collected.

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

- **`asset_details`** (string, optional)  
  - Human-readable summary of high-level asset categories, for example:  
    - `"Property, Vehicle"`  
    - `"Property, 3 other asset(s)"`  
    - `"5 other asset(s)"`.

- **`asset_values`** (object, required)
  - **`total_assets`** (number, required)  
    - Sum of `asset_value` across all assets (ZAR).
  - **`total_policies`** (number, required)  
    - Sum of `policy_value` across all policies (ZAR).
  - **`estate_total`** (number, required)  
    - Same as `total_estate_value` above (redundant but convenient for reporting).

##### 4.2.4 Family / Dependants

- **`has_minor_children`** (boolean, required)  
  - `true` if any beneficiary has a relationship indicating they are a child and is flagged/treated as a minor.

- **`minor_children_count`** (number, optional)  
  - Count of such minor beneficiaries (e.g. `2` for two minor children).

##### 4.2.5 Appointment & Engagement

- **`appointment_type`** (string, required)  
  - Indicates the session context requested by the user.  
  - One of:
    - `"single"` – Single-client consultation  
    - `"spouse_partner"` – Joint session with spouse/partner  
    - `"family"` – Broader family consultation
  - This is selected by the user from a dropdown at the time of lead creation.

##### 4.2.6 Consent & Compliance

- **`popia_consent`** (boolean, required)  
  - `true` if the user has accepted MiWill’s POPIA terms and explicitly consented to being contacted by Capital Legacy for a consultation.
  - Leads are **never** sent with this value set to `false`.

- **`consent_timestamp`** (string, required, ISO 8601)  
  - Timestamp (UTC) when Capital Legacy–specific consent was captured, e.g. `"2026-02-26T09:15:23.000Z"`.

##### 4.2.7 Metadata

- **`source`** (string, required)  
  - Fixed value: `"miwill_app"`.

- **`user_id`** (string, required)  
  - MiWill’s internal user identifier (Firebase UID / primary key).  
  - Useful for reconciliation and troubleshooting between systems.

---

### 5. Example Lead Payload

```json
{
  "client_age": 42,
  "client_email": "thando.mokoena@example.com",
  "client_phone": "+27 82 123 4567",
  "client_full_name": "Thando Mokoena",
  "client_id_number": "8001015009087",
  "client_address": "25 Protea Street, Johannesburg, Gauteng, 2191",

  "total_estate_value": 950000,
  "monthly_income": 45000,
  "employment_status": "employed",
  "marital_status": "married",

  "has_property": true,
  "has_vehicle": true,
  "has_other_assets": true,
  "asset_details": "Property, Vehicle, 3 other asset(s)",
  "asset_values": {
    "total_assets": 750000,
    "total_policies": 200000,
    "estate_total": 950000
  },

  "has_minor_children": true,
  "minor_children_count": 2,

  "appointment_type": "spouse_partner",

  "popia_consent": true,
  "consent_timestamp": "2026-02-26T09:15:23.000Z",

  "source": "miwill_app",
  "user_id": "firebase-uid-123"
}
```

---

### 6. Lead Frequency & Idempotency

- MiWill will send **at most one active lead per user** for Capital Legacy, identified internally by `lead_submission_id`.
- If a lead submission fails (e.g. network error), MiWill may **retry with the same payload**, ensuring Capital Legacy can treat it as an idempotent operation if desired (e.g. by deduplicating on `client_id_number` + `consent_timestamp`).
- MiWill does **not** send continuous updates; subsequent estate changes remain internal unless separately agreed.

---

### 7. Data Ownership & Responsibilities

- **MiWill**
  - Owns and maintains the user database (`users`, `assets`, `policies`, `beneficiaries`).
  - Performs POPIA-compliant consent capture and storage.
  - Performs estate value calculations and qualification logic.
  - Pushes a single, well-formed lead payload to Capital Legacy when criteria are met.

- **Capital Legacy**
  - Receives and ingests the lead payload.
  - Allocates booking agents and manages contact attempts and appointments.
  - Manages lead lifecycle and any subsequent communication with the client.

No direct database access from Capital Legacy into MiWill is required or provided; integration is **API-based only**, via the JSON payload specified above.

---

### 8. Summary

- MiWill sends **qualified, consented** leads only (estate ≥ R250,000 with explicit contact permission).
- Payloads are **single JSON objects** with clearly defined fields for:
  - Client profile
  - Estate value and asset mix
  - Family/minor children context
  - Preferred appointment type
  - POPIA consent & timestamp
- MiWill remains the **system of record** for underlying user, asset, and policy data.

This document should provide Capital Legacy with everything needed to design their intake endpoint, validation, and internal lead routing.

