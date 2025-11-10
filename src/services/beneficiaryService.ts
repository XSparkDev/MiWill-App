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
import { BeneficiaryInformation, AssetBeneficiaryLink, PolicyBeneficiaryLink } from '../types/beneficiary';

export class BeneficiaryService {
  private static collection = 'beneficiaries';
  private static assetLinksCollection = 'asset_beneficiary_links';
  private static policyLinksCollection = 'policy_beneficiary_links';

  /**
   * Get beneficiary by ID
   */
  static async getBeneficiaryById(beneficiaryId: string): Promise<BeneficiaryInformation | null> {
    try {
      const beneficiaryDoc = await getDoc(doc(db, this.collection, beneficiaryId));
      if (beneficiaryDoc.exists()) {
        return this.mapFirestoreData(beneficiaryDoc.data());
      }
      return null;
    } catch (error: any) {
      throw new Error(`Failed to get beneficiary: ${error.message}`);
    }
  }

  /**
   * Get all beneficiaries for a user
   */
  static async getUserBeneficiaries(userId: string): Promise<BeneficiaryInformation[]> {
    try {
      // Query only by user_id to avoid index requirement
      const q = query(
        collection(db, this.collection),
        where('user_id', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      // Sort in memory
      const beneficiaries = querySnapshot.docs
        .map(doc => this.mapFirestoreData(doc.data()))
        .sort((a, b) => {
          const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
          const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
          return dateB.getTime() - dateA.getTime(); // Descending order
        });
      
      return beneficiaries;
    } catch (error: any) {
      throw new Error(`Failed to get user beneficiaries: ${error.message}`);
    }
  }

  /**
   * Create new beneficiary
   */
  static async createBeneficiary(beneficiaryData: Omit<BeneficiaryInformation, 'beneficiary_id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const beneficiaryRef = doc(collection(db, this.collection));
      
      // Filter out undefined values to avoid Firestore errors
      const cleanedData = Object.fromEntries(
        Object.entries(beneficiaryData).filter(([_, value]) => value !== undefined)
      );
      
      const beneficiaryDoc = {
        beneficiary_id: beneficiaryRef.id,
        ...cleanedData,
        is_primary: beneficiaryData.is_primary || false,
        is_verified: false,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await setDoc(beneficiaryRef, beneficiaryDoc);
      return beneficiaryRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create beneficiary: ${error.message}`);
    }
  }

  /**
   * Update beneficiary
   */
  static async updateBeneficiary(beneficiaryId: string, updates: Partial<BeneficiaryInformation>): Promise<void> {
    try {
      // Filter out undefined values to avoid Firestore errors
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const updateData: any = {
        ...cleanedUpdates,
        updated_at: Timestamp.now(),
      };

      await updateDoc(doc(db, this.collection, beneficiaryId), updateData);
    } catch (error: any) {
      throw new Error(`Failed to update beneficiary: ${error.message}`);
    }
  }

  /**
   * Delete beneficiary
   */
  static async deleteBeneficiary(beneficiaryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collection, beneficiaryId));
    } catch (error: any) {
      throw new Error(`Failed to delete beneficiary: ${error.message}`);
    }
  }

  /**
   * Link asset to beneficiary
   */
  static async linkAssetToBeneficiary(
    assetId: string,
    beneficiaryId: string,
    allocationPercentage: number,
    allocationType: 'percentage' | 'specific_amount' | 'equal_split'
  ): Promise<string> {
    try {
      const linkRef = doc(collection(db, this.assetLinksCollection));
      const linkDoc = {
        asset_beneficiary_id: linkRef.id,
        asset_id: assetId,
        beneficiary_id: beneficiaryId,
        allocation_percentage: allocationPercentage,
        allocation_type: allocationType,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await setDoc(linkRef, linkDoc);
      return linkRef.id;
    } catch (error: any) {
      throw new Error(`Failed to link asset to beneficiary: ${error.message}`);
    }
  }

  /**
   * Link policy to beneficiary
   */
  static async linkPolicyToBeneficiary(
    policyId: string,
    beneficiaryId: string,
    allocationPercentage: number,
    allocationType: 'percentage' | 'specific_amount' | 'equal_split'
  ): Promise<string> {
    try {
      const linkRef = doc(collection(db, this.policyLinksCollection));
      const linkDoc = {
        policy_beneficiary_id: linkRef.id,
        policy_id: policyId,
        beneficiary_id: beneficiaryId,
        allocation_percentage: allocationPercentage,
        allocation_type: allocationType,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await setDoc(linkRef, linkDoc);
      return linkRef.id;
    } catch (error: any) {
      throw new Error(`Failed to link policy to beneficiary: ${error.message}`);
    }
  }

  /**
   * Get beneficiaries linked to a specific asset
   */
  static async getBeneficiariesForAsset(assetId: string): Promise<BeneficiaryInformation[]> {
    try {
      const q = query(
        collection(db, this.assetLinksCollection),
        where('asset_id', '==', assetId)
      );
      const linkSnapshot = await getDocs(q);
      
      const beneficiaryIds = linkSnapshot.docs.map(doc => doc.data().beneficiary_id);
      
      if (beneficiaryIds.length === 0) {
        return [];
      }
      
      // Fetch beneficiaries
      const beneficiaries: BeneficiaryInformation[] = [];
      for (const beneficiaryId of beneficiaryIds) {
        const beneficiary = await this.getBeneficiaryById(beneficiaryId);
        if (beneficiary) {
          beneficiaries.push(beneficiary);
        }
      }
      
      return beneficiaries;
    } catch (error: any) {
      throw new Error(`Failed to get beneficiaries for asset: ${error.message}`);
    }
  }

  /**
   * Get beneficiaries linked to a specific policy
   */
  static async getBeneficiariesForPolicy(policyId: string): Promise<BeneficiaryInformation[]> {
    try {
      const q = query(
        collection(db, this.policyLinksCollection),
        where('policy_id', '==', policyId)
      );
      const linkSnapshot = await getDocs(q);
      
      const beneficiaryIds = linkSnapshot.docs.map(doc => doc.data().beneficiary_id);
      
      if (beneficiaryIds.length === 0) {
        return [];
      }
      
      // Fetch beneficiaries
      const beneficiaries: BeneficiaryInformation[] = [];
      for (const beneficiaryId of beneficiaryIds) {
        const beneficiary = await this.getBeneficiaryById(beneficiaryId);
        if (beneficiary) {
          beneficiaries.push(beneficiary);
        }
      }
      
      return beneficiaries;
    } catch (error: any) {
      throw new Error(`Failed to get beneficiaries for policy: ${error.message}`);
    }
  }

  /**
   * Map Firestore data to BeneficiaryInformation
   */
  private static mapFirestoreData(data: any): BeneficiaryInformation {
    return {
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    };
  }
}

export default BeneficiaryService;

