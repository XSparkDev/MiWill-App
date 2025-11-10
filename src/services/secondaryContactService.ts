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
import { SecondaryContactInformation } from '../types/secondaryContact';

export class SecondaryContactService {
  private static collection = 'secondary_contacts';

  static async getUserSecondaryContacts(userId: string): Promise<SecondaryContactInformation[]> {
    const q = query(
      collection(db, this.collection),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.map(d.data()));
  }

  static async createSecondaryContact(
    data: Omit<SecondaryContactInformation, 'secondary_contact_id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    const ref = doc(collection(db, this.collection));
    
    // Filter out undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    
    const payload = {
      secondary_contact_id: ref.id,
      ...cleanedData,
      is_verified: data.is_verified !== undefined ? data.is_verified : false,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
    await setDoc(ref, payload);
    return ref.id;
  }

  static async updateSecondaryContact(id: string, updates: Partial<SecondaryContactInformation>): Promise<void> {
    // Filter out undefined values
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    const updateData: any = { ...cleanedUpdates, updated_at: Timestamp.now() };
    await updateDoc(doc(db, this.collection, id), updateData);
  }

  private static map(data: any): SecondaryContactInformation {
    return {
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    };
  }
}

export default SecondaryContactService;


