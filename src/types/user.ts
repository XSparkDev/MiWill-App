export type NotificationFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom_days';

export const SOUTH_AFRICAN_ID_LENGTH = 13;

export interface UserProfile {
  user_id: string;
  email: string;
  phone: string;
  first_name: string;
  surname: string;
  full_name?: string; // Deprecated: kept for backward compatibility
  id_number: string;
  policy_number?: string;
  profile_picture_path?: string;
  address?: string;
  notification_frequency: NotificationFrequency;
  custom_frequency_days?: number;
  popia_accepted: boolean;
  popia_accepted_at?: Date | string;
  account_created: Date | string;
  last_seen: Date | string;
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  onboarding_completed: boolean;
  has_own_attorney?: boolean;
  has_own_executor?: boolean;
  miwill_attorney_accepted?: boolean;
  miwill_executor_accepted?: boolean;
  attorney_notification_dismissed?: boolean;
  executor_notification_dismissed?: boolean;
  created_at: Date | string;
  updated_at: Date | string;

  // Capital Legacy lead integration fields
  date_of_birth?: string; // YYYY-MM-DD
  employment_status?: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student' | 'other';
  monthly_income?: number; // ZAR per month (optional)
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'domestic_partnership' | 'other';
  total_estate_value?: number; // cached sum of assets + policies for qualification
  lead_submission_consent?: boolean; // consent to be contacted by Capital Legacy
  lead_submission_consent_at?: Date | string;
  lead_submitted?: boolean; // has a Capital Legacy lead been created
  lead_submitted_at?: Date | string;
  lead_submission_id?: string; // Capital Legacy lead reference/id
}

