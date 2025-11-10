export type PolicyType = 'life_insurance' | 'health_insurance' | 'property_insurance' | 'vehicle_insurance' | 'other';

export interface PolicyInformation {
  policy_id: string;
  user_id: string;
  policy_number: string;
  policy_type: PolicyType;
  insurance_company: string;
  policy_value?: number;
  policy_description?: string;
  policy_document_url?: string;
  policy_document_name?: string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

