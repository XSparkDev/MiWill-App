import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type NotificationType = 'proof_of_life' | 'escalation_alert' | 'executor_notification' | 'beneficiary_alert' | 'system_update';
export type NotificationMethod = 'email' | 'sms' | 'push_notification';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

export interface NotificationLog {
  notification_id: string;
  user_id: string;
  notification_type: NotificationType;
  notification_method: NotificationMethod;
  recipient_email: string;
  recipient_phone: string;
  notification_title: string;
  notification_body: string;
  notification_data: string;
  delivery_status: DeliveryStatus;
  delivery_timestamp?: Date | string;
  read_timestamp?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export class NotificationService {
  private static collection = 'notifications';

  /**
   * Create notification log
   */
  static async createNotification(notificationData: Omit<NotificationLog, 'notification_id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const notificationRef = doc(collection(db, this.collection));
      const notificationDoc = {
        notification_id: notificationRef.id,
        ...notificationData,
        delivery_status: 'pending' as DeliveryStatus,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await setDoc(notificationRef, notificationDoc);
      return notificationRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Update notification delivery status
   */
  static async updateDeliveryStatus(
    notificationId: string,
    status: DeliveryStatus,
    deliveryTimestamp?: Date
  ): Promise<void> {
    try {
      const updateData: any = {
        delivery_status: status,
        updated_at: Timestamp.now(),
      };

      if (deliveryTimestamp) {
        updateData.delivery_timestamp = Timestamp.fromDate(deliveryTimestamp);
      }

      await updateDoc(doc(db, this.collection, notificationId), updateData);
    } catch (error: any) {
      throw new Error(`Failed to update notification status: ${error.message}`);
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string): Promise<NotificationLog[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.mapNotificationData(doc.data()));
    } catch (error: any) {
      throw new Error(`Failed to get user notifications: ${error.message}`);
    }
  }

  /**
   * Map Firestore data to NotificationLog
   */
  private static mapNotificationData(data: any): NotificationLog {
    return {
      ...data,
      delivery_timestamp: data.delivery_timestamp?.toDate(),
      read_timestamp: data.read_timestamp?.toDate(),
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    };
  }
}

export default NotificationService;

