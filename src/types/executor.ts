export interface ExecutorInformation {
  executor_id: string;
  user_id: string;
  executor_name: string;
  executor_email: string;
  executor_phone: string;
  executor_id_number: string;
  relationship_to_user: string;
  executor_address?: string;
  is_primary: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ExecutorVerification {
  executor_verification_id: string;
  executor_id: string;
  user_id: string;
  verification_type: 'email_verification' | 'document_upload' | 'home_affairs_api';
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired';
  verification_token?: string;
  verification_url?: string;
  document_upload_url?: string;
  document_type?: 'id_document' | 'affidavit' | 'legal_document';
  home_affairs_api_response?: string;
  face_recognition_score?: number;
  verification_attempts: number;
  expires_at?: Date | string;
  verified_at?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

