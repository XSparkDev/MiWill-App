import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { WillInformation } from '../types/will';

export class WillService {
  private static collection = 'wills';

  /**
   * Get will by ID
   */
  static async getWillById(willId: string): Promise<WillInformation | null> {
    try {
      const willDoc = await getDoc(doc(db, this.collection, willId));
      if (willDoc.exists()) {
        return this.mapFirestoreData(willDoc.data());
      }
      return null;
    } catch (error: any) {
      throw new Error(`Failed to get will: ${error.message}`);
    }
  }

  /**
   * Get all wills for a user
   */
  static async getUserWills(userId: string): Promise<WillInformation[]> {
    try {
      // Query without orderBy to avoid requiring a composite index
      const q = query(
        collection(db, this.collection),
        where('user_id', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      // Sort in memory instead
      const wills = querySnapshot.docs.map(doc => this.mapFirestoreData(doc.data()));
      
      return wills.sort((a, b) => {
        const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
        const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
        return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
      });
    } catch (error: any) {
      throw new Error(`Failed to get user wills: ${error.message}`);
    }
  }

  /**
   * Create new will
   */
  static async createWill(willData: Omit<WillInformation, 'will_id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const willRef = doc(collection(db, this.collection));
      const willDoc = {
        will_id: willRef.id,
        ...willData,
        last_updated: Timestamp.now(),
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await setDoc(willRef, willDoc);
      return willRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create will: ${error.message}`);
    }
  }

  /**
   * Update will
   */
  static async updateWill(willId: string, updates: Partial<WillInformation>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        last_updated: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await updateDoc(doc(db, this.collection, willId), updateData);
    } catch (error: any) {
      throw new Error(`Failed to update will: ${error.message}`);
    }
  }

  /**
   * Delete will
   */
  static async deleteWill(willId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collection, willId));
    } catch (error: any) {
      throw new Error(`Failed to delete will: ${error.message}`);
    }
  }

  /**
   * Map Firestore data to WillInformation
   */
  private static mapFirestoreData(data: any): WillInformation {
    return {
      ...data,
      last_updated: data.last_updated?.toDate() || new Date(),
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    };
  }
}

export default WillService;

