export type NotificationFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom_days';

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
}

