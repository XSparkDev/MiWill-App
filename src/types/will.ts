export interface WillInformation {
  will_id: string;
  user_id: string;
  will_title: string;
  will_description?: string;
  will_document_url: string;
  will_document_name: string;
  will_document_size: number;
  will_document_type: string;
  is_primary_will: boolean;
  last_updated: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

