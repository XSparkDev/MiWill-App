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
  total_estate_value: number; // Sum of assets + policies (ZAR)
  monthly_income?: number; // Optional, ZAR
  employment_status: string;
  marital_status: string;

  // Asset Information
  has_property: boolean;
  has_vehicle: boolean;
  has_other_assets: boolean;
  asset_details?: string; // Human-readable summary of asset categories
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
  consent_timestamp: string; // ISO 8601

  // Metadata
  source: 'miwill_app';
  user_id: string; // Internal MiWill user reference
}

