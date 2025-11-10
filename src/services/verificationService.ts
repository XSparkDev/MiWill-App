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
import { ProofOfLifeVerification, EscalationWorkflow } from '../types/verification';

export class VerificationService {
  private static polCollection = 'proof_of_life_verifications';
  private static escalationCollection = 'escalation_workflows';

  /**
   * Get proof-of-life verification by ID
   */
  static async getVerificationById(polId: string): Promise<ProofOfLifeVerification | null> {
    try {
      const polDoc = await getDoc(doc(db, this.polCollection, polId));
      if (polDoc.exists()) {
        return this.mapPOLData(polDoc.data());
      }
      return null;
    } catch (error: any) {
      throw new Error(`Failed to get verification: ${error.message}`);
    }
  }

  /**
   * Get all verifications for a user
   */
  static async getUserVerifications(userId: string): Promise<ProofOfLifeVerification[]> {
    try {
      const q = query(
        collection(db, this.polCollection),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.mapPOLData(doc.data()));
    } catch (error: any) {
      throw new Error(`Failed to get user verifications: ${error.message}`);
    }
  }

  /**
   * Create proof-of-life verification request
   */
  static async createVerificationRequest(
    userId: string,
    verificationType: 'email' | 'sms' | 'phone_call',
    email: string,
    phone: string,
    expiresInDays: number = 7
  ): Promise<string> {
    try {
      const polRef = doc(collection(db, this.polCollection));
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const polDoc = {
        pol_id: polRef.id,
        user_id: userId,
        verification_type: verificationType,
        verification_status: 'pending',
        verification_token: this.generateToken(),
        verification_url: `https://miwill.app/verify/${polRef.id}`,
        sent_to_email: email,
        sent_to_phone: phone,
        verification_attempts: 0,
        max_attempts: 3,
        expires_at: Timestamp.fromDate(expiresAt),
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await setDoc(polRef, polDoc);
      return polRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create verification request: ${error.message}`);
    }
  }

  /**
   * Complete verification
   */
  static async completeVerification(polId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.polCollection, polId), {
        verification_status: 'completed',
        completed_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(`Failed to complete verification: ${error.message}`);
    }
  }

  /**
   * Create escalation workflow
   */
  static async createEscalation(
    userId: string,
    polId: string,
    escalationLevel: 'level_1_email' | 'level_2_call' | 'level_3_executor' | 'level_4_beneficiary',
    recipient: string
  ): Promise<string> {
    try {
      const escalationRef = doc(collection(db, this.escalationCollection));
      const escalationDoc = {
        escalation_id: escalationRef.id,
        user_id: userId,
        pol_id: polId,
        escalation_level: escalationLevel,
        escalation_status: 'pending',
        escalation_recipient: recipient,
        escalation_attempts: 0,
        max_attempts: 3,
        escalation_notes: `Escalation to ${escalationLevel} initiated`,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await setDoc(escalationRef, escalationDoc);
      return escalationRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create escalation: ${error.message}`);
    }
  }

  /**
   * Generate verification token
   */
  private static generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Map Firestore data to ProofOfLifeVerification
   */
  private static mapPOLData(data: any): ProofOfLifeVerification {
    return {
      ...data,
      expires_at: data.expires_at?.toDate() || new Date(),
      completed_at: data.completed_at?.toDate(),
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    };
  }
}

export default VerificationService;

