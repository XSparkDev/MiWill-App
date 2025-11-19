/**
 * Notification Type Definitions for MiWill Application
 */

export type NotificationCategory = 'in_app' | 'email' | 'sms' | 'push_notification';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationType =
  | 'attorney_assignment'
  | 'executor_assignment'
  | 'proof_of_life_reminder'
  | 'will_update'
  | 'asset_update'
  | 'policy_update'
  | 'beneficiary_update'
  | 'system_update';

export interface NotificationActionData {
  screen?: string;
  params?: Record<string, any>;
  [key: string]: any;
}

export interface NotificationInformation {
  notification_id: string;
  user_id: string;
  notification_type: NotificationType;
  notification_title: string;
  notification_message: string;
  notification_category: NotificationCategory;
  notification_action?: string;
  notification_action_data?: NotificationActionData;
  priority: NotificationPriority;
  is_read: boolean;
  is_dismissed: boolean;
  is_actionable: boolean;
  created_at: Date | string;
  read_at?: Date | string;
  dismissed_at?: Date | string;
  expires_at?: Date | string;
}

export interface CreateNotificationData {
  user_id: string;
  notification_type: NotificationType;
  notification_title: string;
  notification_message: string;
  notification_category?: NotificationCategory;
  notification_action?: string;
  notification_action_data?: NotificationActionData;
  priority?: NotificationPriority;
  is_actionable?: boolean;
  expires_at?: Date | string;
}

export interface UpdateNotificationData {
  is_read?: boolean;
  is_dismissed?: boolean;
  read_at?: Date | string;
  dismissed_at?: Date | string;
}

