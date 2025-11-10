import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { ExecutorInformation, ExecutorVerification } from '../types/executor';

export class ExecutorService {
  private static collection = 'executors';
  private static verificationCollection = 'executor_verifications';

  /**
   * Get executor by ID
   */
  static async getExecutorById(executorId: string): Promise<ExecutorInformation | null> {
    try {
      const executorDoc = await getDoc(doc(db, this.collection, executorId));
      if (executorDoc.exists()) {
        return this.mapExecutorData(executorDoc.data());
      }
      return null;
    } catch (error: any) {
      throw new Error(`Failed to get executor: ${error.message}`);
    }
  }

  /**
   * Get executors for a user
   */
  static async getUserExecutors(userId: string): Promise<ExecutorInformation[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.mapExecutorData(doc.data()));
    } catch (error: any) {
      throw new Error(`Failed to get user executors: ${error.message}`);
    }
  }

  /**
   * Create executor
   */
  static async createExecutor(executorData: Omit<ExecutorInformation, 'executor_id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const executorRef = doc(collection(db, this.collection));
      
      // Filter out undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(executorData).filter(([_, value]) => value !== undefined)
      );
      
      const executorDoc = {
        executor_id: executorRef.id,
        ...cleanedData,
        is_primary: executorData.is_primary !== undefined ? executorData.is_primary : true,
        verification_status: 'pending',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await setDoc(executorRef, executorDoc);
      return executorRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create executor: ${error.message}`);
    }
  }

  /**
   * Update executor
   */
  static async updateExecutor(executorId: string, updates: Partial<ExecutorInformation>): Promise<void> {
    try {
      // Filter out undefined values
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const updateData: any = {
        ...cleanedUpdates,
        updated_at: Timestamp.now(),
      };

      await updateDoc(doc(db, this.collection, executorId), updateData);
    } catch (error: any) {
      throw new Error(`Failed to update executor: ${error.message}`);
    }
  }

  /**
   * Create executor verification
   */
  static async createVerification(
    executorId: string,
    userId: string,
    verificationType: 'email_verification' | 'document_upload' | 'home_affairs_api'
  ): Promise<string> {
    try {
      const verificationRef = doc(collection(db, this.verificationCollection));
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const verificationDoc = {
        executor_verification_id: verificationRef.id,
        executor_id: executorId,
        user_id: userId,
        verification_type: verificationType,
        verification_status: 'pending',
        verification_token: this.generateToken(),
        verification_url: `https://miwill.app/verify-executor/${verificationRef.id}`,
        verification_attempts: 0,
        expires_at: Timestamp.fromDate(expiresAt),
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await setDoc(verificationRef, verificationDoc);
      return verificationRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create executor verification: ${error.message}`);
    }
  }

  /**
   * Generate verification token
   */
  private static generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Map Firestore data to ExecutorInformation
   */
  private static mapExecutorData(data: any): ExecutorInformation {
    return {
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    };
  }
}

export default ExecutorService;

