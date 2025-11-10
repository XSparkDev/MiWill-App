export interface SecondaryContactInformation {
  secondary_contact_id: string;
  user_id: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  relationship_to_user: string;
  contact_address?: string;
  is_verified: boolean;
  verification_token?: string;
  created_at: Date | string;
  updated_at: Date | string;
}


