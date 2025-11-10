export type NotificationFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom_days';

export interface UserProfile {
  user_id: string;
  email: string;
  phone: string;
  full_name: string;
  id_number: string;
  policy_number?: string;
  profile_picture_path?: string;
  notification_frequency: NotificationFrequency;
  custom_frequency_days?: number;
  account_created: Date | string;
  last_seen: Date | string;
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

