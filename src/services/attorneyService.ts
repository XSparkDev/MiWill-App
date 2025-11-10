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
import { AttorneyInformation } from '../types/attorney';

export class AttorneyService {
  private static collection = 'attorneys';

  static async getUserAttorneys(userId: string): Promise<AttorneyInformation[]> {
    const q = query(
      collection(db, this.collection),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.map(d.data()));
  }

  static async createAttorney(
    data: Omit<AttorneyInformation, 'attorney_id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    const ref = doc(collection(db, this.collection));
    
    // Filter out undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    
    const payload = {
      attorney_id: ref.id,
      ...cleanedData,
      is_primary: data.is_primary !== undefined ? data.is_primary : true,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
    await setDoc(ref, payload);
    return ref.id;
  }

  static async updateAttorney(attorneyId: string, updates: Partial<AttorneyInformation>): Promise<void> {
    // Filter out undefined values
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    const updateData: any = { ...cleanedUpdates, updated_at: Timestamp.now() };
    await updateDoc(doc(db, this.collection, attorneyId), updateData);
  }

  private static map(data: any): AttorneyInformation {
    return {
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    };
  }
}

export default AttorneyService;


