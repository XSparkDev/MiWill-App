export interface BeneficiaryInformation {
  beneficiary_id: string;
  user_id: string;
  beneficiary_first_name?: string;
  beneficiary_surname?: string;
  beneficiary_name: string;
  beneficiary_id_number?: string;
  beneficiary_email?: string;
  beneficiary_phone?: string;
  beneficiary_address?: string;
  relationship_to_user: string;
  beneficiary_percentage?: number;
  is_primary: boolean;
  is_verified: boolean;
  verification_token?: string;
  inherit_entire_estate?: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AssetBeneficiaryLink {
  asset_beneficiary_id: string;
  asset_id: string;
  beneficiary_id: string;
  allocation_percentage: number;
  allocation_type: 'percentage' | 'specific_amount' | 'equal_split';
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PolicyBeneficiaryLink {
  policy_beneficiary_id: string;
  policy_id: string;
  beneficiary_id: string;
  allocation_percentage: number;
  allocation_type: 'percentage' | 'specific_amount' | 'equal_split';
  created_at: Date | string;
  updated_at: Date | string;
}

