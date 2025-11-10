export interface AttorneyInformation {
  attorney_id: string;
  user_id: string;
  attorney_name: string;
  attorney_email: string;
  attorney_phone: string;
  attorney_firm?: string;
  attorney_address?: string;
  relationship_type?: 'family_lawyer' | 'estate_lawyer' | 'general_practice' | 'other';
  is_primary: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}


