export type VerificationType = 'email' | 'sms' | 'phone_call' | 'executor_verification';
export type VerificationStatus = 'pending' | 'completed' | 'failed' | 'expired';
export type EscalationLevel = 'level_1_email' | 'level_2_call' | 'level_3_executor' | 'level_4_beneficiary';
export type EscalationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ProofOfLifeVerification {
  pol_id: string;
  user_id: string;
  verification_type: VerificationType;
  verification_status: VerificationStatus;
  verification_token: string;
  verification_url: string;
  sent_to_email: string;
  sent_to_phone: string;
  verification_attempts: number;
  max_attempts: number;
  expires_at: Date | string;
  completed_at?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface EscalationWorkflow {
  escalation_id: string;
  user_id: string;
  pol_id: string;
  escalation_level: EscalationLevel;
  escalation_status: EscalationStatus;
  escalation_recipient: string;
  escalation_attempts: number;
  max_attempts: number;
  escalation_notes?: string;
  created_at: Date | string;
  completed_at?: Date | string;
  updated_at: Date | string;
}

export interface AIBotCallLog {
  call_log_id: string;
  escalation_id: string;
  user_id: string;
  call_type: 'primary_user' | 'secondary_contact' | 'executor' | 'beneficiary';
  call_recipient: string;
  call_status: 'initiated' | 'answered' | 'no_answer' | 'busy' | 'failed';
  call_duration?: number;
  call_transcript?: string;
  call_outcome?: 'verified_alive' | 'not_verified' | 'no_response' | 'escalation_needed';
  ai_confidence_score?: number;
  created_at: Date | string;
  updated_at: Date | string;
}

