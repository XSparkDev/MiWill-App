export type WillType = 'document' | 'video' | 'audio';
export type WillStatus = 'active' | 'inactive' | 'archived';

export interface WillInformation {
  will_id: string;
  user_id: string;
  will_type: WillType;
  will_title?: string;
  will_description?: string;
  document_path?: string;
  video_path?: string;
  audio_path?: string;
  will_document_url?: string;
  will_document_name?: string;
  will_document_size?: number;
  will_document_type?: string;
  status: WillStatus;
  is_primary_will?: boolean;
  is_verified: boolean;
  last_updated: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

