export type AssetType =
  | 'property'
  | 'vehicle'
  | 'policy'
  | 'bank_account'
  | 'investment'
  | 'jewelry'
  | 'artwork'
  | 'business'
  | 'other';

export type FinancingStatus = 'financed' | 'owned';
export type FinanceProviderType = 'bank' | 'other' | 'owned';

export interface AssetInformation {
  asset_id: string;
  user_id: string;
  asset_name: string;
  asset_type: AssetType;
  asset_description?: string;
  asset_value: number;
  asset_location: string;
  financing_status: FinancingStatus;
  finance_provider_type?: FinanceProviderType;
  finance_provider_name?: string;
  finance_provider_other?: string;
  date_purchased: string;
  repayment_term?: string;
  paid_up_date?: string;
  asset_document_url?: string;
  asset_document_name?: string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

