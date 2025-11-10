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
import { AssetInformation } from '../types/asset';

export class AssetService {
  private static collection = 'assets';

  /**
   * Get asset by ID
   */
  static async getAssetById(assetId: string): Promise<AssetInformation | null> {
    try {
      const assetDoc = await getDoc(doc(db, this.collection, assetId));
      if (assetDoc.exists()) {
        return this.mapFirestoreData(assetDoc.data());
      }
      return null;
    } catch (error: any) {
      throw new Error(`Failed to get asset: ${error.message}`);
    }
  }

  /**
   * Get all assets for a user
   */
  static async getUserAssets(userId: string): Promise<AssetInformation[]> {
    try {
      // Query only by user_id to avoid composite index requirement
      const q = query(
        collection(db, this.collection),
        where('user_id', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      // Filter active assets and sort in memory
      const assets = querySnapshot.docs
        .map(doc => this.mapFirestoreData(doc.data()))
        .filter(asset => asset.is_active !== false) // Include undefined/null as active
        .sort((a, b) => {
          const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
          const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
          return dateB.getTime() - dateA.getTime(); // Descending order
        });
      
      return assets;
    } catch (error: any) {
      throw new Error(`Failed to get user assets: ${error.message}`);
    }
  }

  /**
   * Create new asset
   */
  static async createAsset(assetData: Omit<AssetInformation, 'asset_id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const assetRef = doc(collection(db, this.collection));
      
      // Filter out undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(assetData).filter(([_, value]) => value !== undefined)
      );
      
      const assetDoc = {
        asset_id: assetRef.id,
        ...cleanedData,
        is_active: true,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await setDoc(assetRef, assetDoc);
      return assetRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create asset: ${error.message}`);
    }
  }

  /**
   * Update asset
   */
  static async updateAsset(assetId: string, updates: Partial<AssetInformation>): Promise<void> {
    try {
      // Filter out undefined values
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const updateData: any = {
        ...cleanedUpdates,
        updated_at: Timestamp.now(),
      };

      await updateDoc(doc(db, this.collection, assetId), updateData);
    } catch (error: any) {
      throw new Error(`Failed to update asset: ${error.message}`);
    }
  }

  /**
   * Delete asset (soft delete by setting is_active to false)
   */
  static async deleteAsset(assetId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collection, assetId), {
        is_active: false,
        updated_at: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to delete asset: ${error.message}`);
    }
  }

  /**
   * Map Firestore data to AssetInformation
   */
  private static mapFirestoreData(data: any): AssetInformation {
    return {
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    };
  }
}

export default AssetService;

