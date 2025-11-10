export type AssetType = 'property' | 'vehicle' | 'bank_account' | 'investment' | 'jewelry' | 'artwork' | 'business' | 'other';

export interface AssetInformation {
  asset_id: string;
  user_id: string;
  asset_name: string;
  asset_type: AssetType;
  asset_description?: string;
  asset_value?: number;
  asset_location?: string;
  asset_document_url?: string;
  asset_document_name?: string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

