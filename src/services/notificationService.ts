/**
 * Notification Service
 * Handles all notification-related operations including auto-table creation
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  NotificationInformation,
  CreateNotificationData,
  UpdateNotificationData,
  NotificationCategory,
  NotificationPriority,
} from '../types/notification';

const NOTIFICATIONS_COLLECTION = 'notifications';
const NOTIFICATIONS_META_COLLECTION = 'notifications_meta';

// Track if we've initialized
let isInitialized = false;

/**
 * Initialize notifications collection (creates if doesn't exist)
 * This is called when the first notification operation is performed by an authenticated user
 */
const initializeNotificationsCollection = async (): Promise<void> => {
  // Skip if already initialized
  if (isInitialized) {
    return;
  }

  try {
    const metaDocRef = doc(db, NOTIFICATIONS_META_COLLECTION, 'collection_info');
    const metaDoc = await getDoc(metaDocRef);

    if (!metaDoc.exists()) {
      // Create meta document to ensure collection exists
      await setDoc(metaDocRef, {
        collection_name: NOTIFICATIONS_COLLECTION,
        created_at: Timestamp.now(),
        version: '1.0.0',
        description: 'MiWill In-App Notifications System',
        last_updated: Timestamp.now(),
      });
      console.log('[NotificationService] Notifications collection initialized successfully');
    }
    isInitialized = true;
  } catch (error) {
    console.error('[NotificationService] Error initializing notifications collection:', error);
    // Don't throw - allow the app to continue even if initialization fails
  }
};

/**
 * Generate a unique notification ID
 */
const generateNotificationId = (): string => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert Firestore Timestamp to Date
 */
const convertTimestamp = (timestamp: any): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'string') return new Date(timestamp);
  return undefined;
};

/**
 * Create a new notification
 */
const createNotification = async (data: CreateNotificationData): Promise<string> => {
  try {
    const notificationId = generateNotificationId();
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);

    const notificationData = {
      notification_id: notificationId,
      user_id: data.user_id,
      notification_type: data.notification_type,
      notification_title: data.notification_title,
      notification_message: data.notification_message,
      notification_category: data.notification_category || 'in_app' as NotificationCategory,
      notification_action: data.notification_action || null,
      notification_action_data: data.notification_action_data || null,
      priority: data.priority || 'normal' as NotificationPriority,
      is_read: false,
      is_dismissed: false,
      is_actionable: data.is_actionable !== undefined ? data.is_actionable : true,
      created_at: Timestamp.now(),
      read_at: null,
      dismissed_at: null,
      expires_at: data.expires_at ? Timestamp.fromDate(new Date(data.expires_at)) : null,
    };

    await setDoc(notificationRef, notificationData);
    console.log('[NotificationService] Notification created:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    throw error;
  }
};

/**
 * Get a notification by ID
 */
const getNotificationById = async (notificationId: string): Promise<NotificationInformation | null> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    const notificationDoc = await getDoc(notificationRef);

    if (!notificationDoc.exists()) {
      return null;
    }

    const data = notificationDoc.data();
    return {
      ...data,
      created_at: convertTimestamp(data.created_at) || new Date(),
      read_at: convertTimestamp(data.read_at),
      dismissed_at: convertTimestamp(data.dismissed_at),
      expires_at: convertTimestamp(data.expires_at),
    } as NotificationInformation;
  } catch (error) {
    console.error('[NotificationService] Error getting notification:', error);
    throw error;
  }
};

/**
 * Get all notifications for a user
 */
const getUserNotifications = async (userId: string): Promise<NotificationInformation[]> => {
  try {
    // Initialize on first use (when user is authenticated)
    await initializeNotificationsCollection();
    
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
      const q = query(
      notificationsRef,
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
    const notifications: NotificationInformation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        ...data,
        created_at: convertTimestamp(data.created_at) || new Date(),
        read_at: convertTimestamp(data.read_at),
        dismissed_at: convertTimestamp(data.dismissed_at),
        expires_at: convertTimestamp(data.expires_at),
      } as NotificationInformation);
    });

    return notifications;
  } catch (error) {
    console.error('[NotificationService] Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Get unread notifications for a user
 */
const getUnreadNotifications = async (userId: string): Promise<NotificationInformation[]> => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('user_id', '==', userId),
      where('is_read', '==', false),
      where('is_dismissed', '==', false),
      orderBy('created_at', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notifications: NotificationInformation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        ...data,
        created_at: convertTimestamp(data.created_at) || new Date(),
        read_at: convertTimestamp(data.read_at),
        dismissed_at: convertTimestamp(data.dismissed_at),
        expires_at: convertTimestamp(data.expires_at),
      } as NotificationInformation);
    });

    return notifications;
  } catch (error) {
    console.error('[NotificationService] Error getting unread notifications:', error);
    throw error;
  }
};

/**
 * Get "new" notifications (< 7 days old and unread)
 */
const getNewNotifications = async (userId: string): Promise<NotificationInformation[]> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('user_id', '==', userId),
      where('is_read', '==', false),
      where('is_dismissed', '==', false),
      where('created_at', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('created_at', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notifications: NotificationInformation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
      ...data,
        created_at: convertTimestamp(data.created_at) || new Date(),
        read_at: convertTimestamp(data.read_at),
        dismissed_at: convertTimestamp(data.dismissed_at),
        expires_at: convertTimestamp(data.expires_at),
      } as NotificationInformation);
    });

    return notifications;
  } catch (error) {
    console.error('[NotificationService] Error getting new notifications:', error);
    throw error;
  }
};

/**
 * Get "older" notifications (>= 7 days old or read)
 */
const getOlderNotifications = async (userId: string): Promise<NotificationInformation[]> => {
  try {
    const allNotifications = await getUserNotifications(userId);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return allNotifications.filter((notification) => {
      const createdAt = new Date(notification.created_at);
      return notification.is_read || notification.is_dismissed || createdAt < sevenDaysAgo;
    });
  } catch (error) {
    console.error('[NotificationService] Error getting older notifications:', error);
    throw error;
  }
};

/**
 * Update a notification
 */
const updateNotification = async (
  notificationId: string,
  updates: UpdateNotificationData
): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    const updateData: any = { ...updates };

    // Add timestamps if marking as read/dismissed
    if (updates.is_read && !updates.read_at) {
      updateData.read_at = Timestamp.now();
    }
    if (updates.is_dismissed && !updates.dismissed_at) {
      updateData.dismissed_at = Timestamp.now();
    }

    await updateDoc(notificationRef, updateData);
    console.log('[NotificationService] Notification updated:', notificationId);
  } catch (error) {
    console.error('[NotificationService] Error updating notification:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId: string): Promise<void> => {
  return updateNotification(notificationId, {
    is_read: true,
    read_at: new Date(),
  });
};

/**
 * Mark notification as dismissed
 */
const markAsDismissed = async (notificationId: string): Promise<void> => {
  return updateNotification(notificationId, {
    is_dismissed: true,
    dismissed_at: new Date(),
  });
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    const unreadNotifications = await getUnreadNotifications(userId);
    const batch = writeBatch(db);

    unreadNotifications.forEach((notification) => {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notification.notification_id);
      batch.update(notificationRef, {
        is_read: true,
        read_at: Timestamp.now(),
      });
    });

    await batch.commit();
    console.log('[NotificationService] All notifications marked as read for user:', userId);
  } catch (error) {
    console.error('[NotificationService] Error marking all as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationRef);
    console.log('[NotificationService] Notification deleted:', notificationId);
  } catch (error) {
    console.error('[NotificationService] Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete all notifications for a user
 */
const deleteAllUserNotifications = async (userId: string): Promise<void> => {
  try {
    const notifications = await getUserNotifications(userId);
    const batch = writeBatch(db);

    notifications.forEach((notification) => {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notification.notification_id);
      batch.delete(notificationRef);
    });

    await batch.commit();
    console.log('[NotificationService] All notifications deleted for user:', userId);
  } catch (error) {
    console.error('[NotificationService] Error deleting all notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const unreadNotifications = await getUnreadNotifications(userId);
    return unreadNotifications.length;
  } catch (error) {
    console.error('[NotificationService] Error getting unread count:', error);
    return 0;
  }
};

/**
 * Create attorney assignment notification
 */
const createAttorneyNotification = async (userId: string): Promise<string> => {
  return createNotification({
    user_id: userId,
    notification_type: 'attorney_assignment',
    notification_title: 'MiWill Partner Attorney Assigned',
    notification_message:
      'You have chosen to use MiWill Partner Attorneys. If you would like to appoint your own attorney, you can do so at any time.',
    notification_category: 'in_app',
    notification_action: 'navigate_to_update_attorney',
    notification_action_data: {
      screen: 'UpdateAttorney',
    },
    priority: 'normal',
    is_actionable: true,
  });
};

/**
 * Create executor assignment notification
 */
const createExecutorNotification = async (userId: string): Promise<string> => {
  return createNotification({
    user_id: userId,
    notification_type: 'executor_assignment',
    notification_title: 'MiWill Executor Assigned',
    notification_message:
      'You have chosen to use MiWill Executors. If you would like to appoint your own executor, you can do so at any time.',
    notification_category: 'in_app',
    notification_action: 'navigate_to_update_executor',
    notification_action_data: {
      screen: 'UpdateExecutor',
    },
    priority: 'normal',
    is_actionable: true,
  });
};

/**
 * Create attorney update success notification
 */
const createAttorneyUpdateNotification = async (userId: string, attorneyName: string): Promise<string> => {
  return createNotification({
    user_id: userId,
    notification_type: 'attorney_assignment',
    notification_title: 'Attorney Successfully Appointed',
    notification_message:
      `You have successfully appointed ${attorneyName} as your attorney. You can update this information at any time.`,
    notification_category: 'in_app',
    notification_action: 'navigate_to_update_attorney',
    notification_action_data: {
      screen: 'UpdateAttorney',
    },
    priority: 'normal',
    is_actionable: true,
  });
};

/**
 * Create executor update success notification
 */
const createExecutorUpdateNotification = async (userId: string, executorName: string): Promise<string> => {
  return createNotification({
    user_id: userId,
    notification_type: 'executor_assignment',
    notification_title: 'Executor Successfully Appointed',
    notification_message:
      `You have successfully appointed ${executorName} as your executor. You can update this information at any time.`,
    notification_category: 'in_app',
    notification_action: 'navigate_to_update_executor',
    notification_action_data: {
      screen: 'UpdateExecutor',
    },
    priority: 'normal',
    is_actionable: true,
  });
};

const NotificationService = {
  initializeNotificationsCollection,
  createNotification,
  getNotificationById,
  getUserNotifications,
  getUnreadNotifications,
  getNewNotifications,
  getOlderNotifications,
  updateNotification,
  markAsRead,
  markAsDismissed,
  markAllAsRead,
  deleteNotification,
  deleteAllUserNotifications,
  getUnreadCount,
  createAttorneyNotification,
  createExecutorNotification,
  createAttorneyUpdateNotification,
  createExecutorUpdateNotification,
};

export default NotificationService;
