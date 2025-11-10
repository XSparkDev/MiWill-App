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
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { PolicyInformation } from '../types/policy';

export class PolicyService {
  private static collection = 'policies';

  /**
   * Get policy by ID
   */
  static async getPolicyById(policyId: string): Promise<PolicyInformation | null> {
    try {
      const policyDoc = await getDoc(doc(db, this.collection, policyId));
      if (policyDoc.exists()) {
        return this.mapFirestoreData(policyDoc.data());
      }
      return null;
    } catch (error: any) {
      throw new Error(`Failed to get policy: ${error.message}`);
    }
  }

  /**
   * Get all policies for a user
   */
  static async getUserPolicies(userId: string): Promise<PolicyInformation[]> {
    try {
      // Query only by user_id to avoid composite index requirement
      const q = query(
        collection(db, this.collection),
        where('user_id', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      // Filter active policies and sort in memory
      const policies = querySnapshot.docs
        .map(doc => this.mapFirestoreData(doc.data()))
        .filter(policy => policy.is_active !== false) // Include undefined/null as active
        .sort((a, b) => {
          const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
          const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
          return dateB.getTime() - dateA.getTime(); // Descending order
        });
      
      return policies;
    } catch (error: any) {
      throw new Error(`Failed to get user policies: ${error.message}`);
    }
  }

  /**
   * Create new policy
   */
  static async createPolicy(policyData: Omit<PolicyInformation, 'policy_id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const policyRef = doc(collection(db, this.collection));
      
      // Filter out undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(policyData).filter(([_, value]) => value !== undefined)
      );
      
      const policyDoc = {
        policy_id: policyRef.id,
        ...cleanedData,
        is_active: true,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await setDoc(policyRef, policyDoc);
      return policyRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create policy: ${error.message}`);
    }
  }

  /**
   * Update policy
   */
  static async updatePolicy(policyId: string, updates: Partial<PolicyInformation>): Promise<void> {
    try {
      // Filter out undefined values
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const updateData: any = {
        ...cleanedUpdates,
        updated_at: Timestamp.now(),
      };

      await updateDoc(doc(db, this.collection, policyId), updateData);
    } catch (error: any) {
      throw new Error(`Failed to update policy: ${error.message}`);
    }
  }

  /**
   * Delete policy (soft delete by setting is_active to false)
   */
  static async deletePolicy(policyId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collection, policyId), {
        is_active: false,
        updated_at: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to delete policy: ${error.message}`);
    }
  }

  /**
   * Map Firestore data to PolicyInformation
   */
  private static mapFirestoreData(data: any): PolicyInformation {
    return {
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    };
  }
}

export default PolicyService;

