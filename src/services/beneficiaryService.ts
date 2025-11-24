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
        inherit_entire_estate: beneficiaryData.inherit_entire_estate || false,
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
   * Get beneficiaries linked to a specific asset with allocation percentages
   */
  static async getBeneficiariesForAsset(assetId: string): Promise<BeneficiaryInformation[]> {
    try {
      const q = query(
        collection(db, this.assetLinksCollection),
        where('asset_id', '==', assetId)
      );
      const linkSnapshot = await getDocs(q);
      
      if (linkSnapshot.docs.length === 0) {
        return [];
      }
      
      // Fetch beneficiaries with their allocation percentages
      const beneficiaries: BeneficiaryInformation[] = [];
      for (const linkDoc of linkSnapshot.docs) {
        const linkData = linkDoc.data();
        const beneficiaryId = linkData.beneficiary_id;
        const allocationPercentage = linkData.allocation_percentage || 0;
        
        const beneficiary = await this.getBeneficiaryById(beneficiaryId);
        if (beneficiary) {
          // Add allocation percentage to beneficiary object
          beneficiaries.push({
            ...beneficiary,
            beneficiary_percentage: allocationPercentage,
          });
        }
      }
      
      return beneficiaries;
    } catch (error: any) {
      throw new Error(`Failed to get beneficiaries for asset: ${error.message}`);
    }
  }
  
  /**
   * Get asset beneficiary links with percentages (for Dashboard display)
   */
  static async getAssetBeneficiaryLinks(assetId: string): Promise<Record<string, number>> {
    try {
      const q = query(
        collection(db, this.assetLinksCollection),
        where('asset_id', '==', assetId)
      );
      const linkSnapshot = await getDocs(q);
      
      const percentages: Record<string, number> = {};
      linkSnapshot.docs.forEach(doc => {
        const linkData = doc.data();
        percentages[linkData.beneficiary_id] = linkData.allocation_percentage || 0;
      });
      
      return percentages;
    } catch (error: any) {
      throw new Error(`Failed to get asset beneficiary links: ${error.message}`);
    }
  }
  
  /**
   * Get policy beneficiary links with percentages (for Dashboard display)
   */
  static async getPolicyBeneficiaryLinks(policyId: string): Promise<Record<string, number>> {
    try {
      const q = query(
        collection(db, this.policyLinksCollection),
        where('policy_id', '==', policyId)
      );
      const linkSnapshot = await getDocs(q);
      
      const percentages: Record<string, number> = {};
      linkSnapshot.docs.forEach(doc => {
        const linkData = doc.data();
        percentages[linkData.beneficiary_id] = linkData.allocation_percentage || 0;
      });
      
      return percentages;
    } catch (error: any) {
      throw new Error(`Failed to get policy beneficiary links: ${error.message}`);
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
   * Update allocation percentage for an asset-beneficiary link
   */
  static async updateAssetBeneficiaryAllocation(
    assetId: string,
    beneficiaryId: string,
    allocationPercentage: number
  ): Promise<void> {
    try {
      const q = query(
        collection(db, this.assetLinksCollection),
        where('asset_id', '==', assetId),
        where('beneficiary_id', '==', beneficiaryId)
      );
      const linkSnapshot = await getDocs(q);
      
      if (linkSnapshot.docs.length === 0) {
        throw new Error('Link not found');
      }
      
      const updatePromises = linkSnapshot.docs.map(doc =>
        updateDoc(doc.ref, {
          allocation_percentage: allocationPercentage,
          updated_at: Timestamp.now(),
        })
      );
      await Promise.all(updatePromises);
    } catch (error: any) {
      throw new Error(`Failed to update asset beneficiary allocation: ${error.message}`);
    }
  }
  
  /**
   * Redistribute allocation percentages for all beneficiaries linked to an asset
   */
  static async redistributeAssetAllocations(
    assetId: string,
    percentages: Record<string, number>
  ): Promise<void> {
    try {
      const q = query(
        collection(db, this.assetLinksCollection),
        where('asset_id', '==', assetId)
      );
      const linkSnapshot = await getDocs(q);
      
      const updatePromises = linkSnapshot.docs.map(doc => {
        const linkData = doc.data();
        const beneficiaryId = linkData.beneficiary_id;
        const newPercentage = percentages[beneficiaryId] || 0;
        
        return updateDoc(doc.ref, {
          allocation_percentage: newPercentage,
          updated_at: Timestamp.now(),
        });
      });
      
      await Promise.all(updatePromises);
    } catch (error: any) {
      throw new Error(`Failed to redistribute asset allocations: ${error.message}`);
    }
  }

  /**
   * Delink beneficiary from asset
   */
  static async delinkAssetFromBeneficiary(assetId: string, beneficiaryId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.assetLinksCollection),
        where('asset_id', '==', assetId),
        where('beneficiary_id', '==', beneficiaryId)
      );
      const linkSnapshot = await getDocs(q);
      
      const deletePromises = linkSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error: any) {
      throw new Error(`Failed to delink asset from beneficiary: ${error.message}`);
    }
  }

  /**
   * Delink beneficiary from policy
   */
  static async delinkPolicyFromBeneficiary(policyId: string, beneficiaryId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.policyLinksCollection),
        where('policy_id', '==', policyId),
        where('beneficiary_id', '==', beneficiaryId)
      );
      const linkSnapshot = await getDocs(q);
      
      const deletePromises = linkSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error: any) {
      throw new Error(`Failed to delink policy from beneficiary: ${error.message}`);
    }
  }

  /**
   * Delink all beneficiaries from an asset (used when deleting asset)
   */
  static async delinkAllBeneficiariesFromAsset(assetId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.assetLinksCollection),
        where('asset_id', '==', assetId)
      );
      const linkSnapshot = await getDocs(q);
      
      const deletePromises = linkSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error: any) {
      throw new Error(`Failed to delink all beneficiaries from asset: ${error.message}`);
    }
  }

  /**
   * Delink all beneficiaries from a policy (used when deleting policy)
   */
  static async delinkAllBeneficiariesFromPolicy(policyId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.policyLinksCollection),
        where('policy_id', '==', policyId)
      );
      const linkSnapshot = await getDocs(q);
      
      const deletePromises = linkSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error: any) {
      throw new Error(`Failed to delink all beneficiaries from policy: ${error.message}`);
    }
  }

  /**
   * Delink all assets and policies from a beneficiary (used when deleting beneficiary)
   */
  static async delinkAllFromBeneficiary(beneficiaryId: string): Promise<void> {
    try {
      // Delink all assets
      const assetLinksQuery = query(
        collection(db, this.assetLinksCollection),
        where('beneficiary_id', '==', beneficiaryId)
      );
      const assetLinksSnapshot = await getDocs(assetLinksQuery);
      const assetDeletePromises = assetLinksSnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      // Delink all policies
      const policyLinksQuery = query(
        collection(db, this.policyLinksCollection),
        where('beneficiary_id', '==', beneficiaryId)
      );
      const policyLinksSnapshot = await getDocs(policyLinksQuery);
      const policyDeletePromises = policyLinksSnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all([...assetDeletePromises, ...policyDeletePromises]);
    } catch (error: any) {
      throw new Error(`Failed to delink all from beneficiary: ${error.message}`);
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

