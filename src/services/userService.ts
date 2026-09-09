import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, NotificationFrequency, SOUTH_AFRICAN_ID_LENGTH } from '../types/user';
import { formatSAPhoneNumber } from '../utils/phoneFormatter';

export const sanitizeSouthAfricanIdNumber = (value: string): string => {
  if (!value) {
    return '';
  }
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.slice(0, SOUTH_AFRICAN_ID_LENGTH);
};

export const isValidSouthAfricanIdNumber = (value: string): boolean => {
  const cleaned = sanitizeSouthAfricanIdNumber(value);
  return cleaned.length === SOUTH_AFRICAN_ID_LENGTH;
};

export class UserService {
  private static collection = 'users';

  /**
   * Get user profile by ID
   */
  static async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, this.collection, userId));
      if (userDoc.exists()) {
        return this.mapFirestoreData(userDoc.data());
      }
      return null;
    } catch (error: any) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Create user profile
   */
  static async createUser(userId: string, userData: Partial<UserProfile>): Promise<void> {
    try {
      // Format phone number to +27 format
      const formattedPhone = userData.phone ? formatSAPhoneNumber(userData.phone) : '';

      const userDoc: any = {
        user_id: userId,
        email: userData.email || '',
        phone: formattedPhone,
        first_name: userData.first_name || '',
        surname: userData.surname || '',
        full_name: userData.full_name || `${userData.first_name || ''} ${userData.surname || ''}`.trim(),
        id_number: userData.id_number || '',
        policy_number: userData.policy_number || '',
        profile_picture_path: (userData as any).profile_picture_path || '',
        address: userData.address?.trim() || '',
        notification_frequency: userData.notification_frequency || 'weekly',
        popia_accepted: userData.popia_accepted || false,
        popia_accepted_at: userData.popia_accepted ? Timestamp.now() : null,
        account_created: Timestamp.now(),
        last_seen: Timestamp.now(),
        email_verified: false,
        phone_verified: false,
        is_active: true,
        onboarding_completed: false,
        has_own_attorney: userData.has_own_attorney ?? false,
        has_own_executor: userData.has_own_executor ?? false,
        miwill_attorney_accepted: userData.miwill_attorney_accepted ?? false,
        miwill_executor_accepted: userData.miwill_executor_accepted ?? false,
        attorney_notification_dismissed: userData.attorney_notification_dismissed ?? false,
        executor_notification_dismissed: userData.executor_notification_dismissed ?? false,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      // Only add custom_frequency_days if it's defined
      if (userData.custom_frequency_days !== undefined) {
        userDoc.custom_frequency_days = userData.custom_frequency_days;
      }

      await setDoc(doc(db, this.collection, userId), userDoc);
    } catch (error: any) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      // Filter out undefined values to avoid Firestore errors
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const updateData: any = {
        ...cleanedUpdates,
        updated_at: Timestamp.now(),
      };

      // Format phone number if being updated
      if (updateData.phone) {
        updateData.phone = formatSAPhoneNumber(updateData.phone);
      }

      // Auto-generate full_name if first_name or surname is being updated
      if (updateData.first_name || updateData.surname) {
        // Get existing user data to fill in missing parts
        const existingUser = await this.getUserById(userId);
        const firstName = updateData.first_name || existingUser?.first_name || '';
        const surname = updateData.surname || existingUser?.surname || '';
        updateData.full_name = `${firstName} ${surname}`.trim();
      }

      // Convert Date objects to Timestamps
      if (updateData.last_seen && updateData.last_seen instanceof Date) {
        updateData.last_seen = Timestamp.fromDate(updateData.last_seen);
      }

      await updateDoc(doc(db, this.collection, userId), updateData);
    } catch (error: any) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Update notification frequency
   */
  static async updateNotificationFrequency(
    userId: string,
    frequency: NotificationFrequency,
    customDays?: number
  ): Promise<void> {
    try {
      const updateData: any = {
        notification_frequency: frequency,
        updated_at: Timestamp.now(),
      };

      if (frequency === 'custom_days' && customDays) {
        updateData.custom_frequency_days = customDays;
      }

      await updateDoc(doc(db, this.collection, userId), updateData);
    } catch (error: any) {
      throw new Error(`Failed to update notification frequency: ${error.message}`);
    }
  }

  /**
   * Mark onboarding as completed
   */
  static async completeOnboarding(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collection, userId), {
        onboarding_completed: true,
        updated_at: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to complete onboarding: ${error.message}`);
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const q = query(collection(db, this.collection), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return this.mapFirestoreData(doc.data());
      }
      return null;
    } catch (error: any) {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
  }

  /**
   * Map Firestore data to UserProfile
   */
  private static mapFirestoreData(data: any): UserProfile {
    return {
      ...data,
      account_created: data.account_created?.toDate() || new Date(),
      last_seen: data.last_seen?.toDate() || new Date(),
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    };
  }
}

export default UserService;

