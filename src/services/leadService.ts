import { LeadSubmissionData } from '../types/lead';
import { UserService } from './userService';
import AssetService from './assetService';
import PolicyService from './policyService';

export class LeadService {
  private static apiBaseUrl = process.env.EXPO_PUBLIC_LEAD_API_URL || '';
  private static apiKey = process.env.EXPO_PUBLIC_LEAD_API_KEY || '';

  /**
   * Submit a qualified lead to the Capital Legacy API
   */
  static async submitLead(
    leadData: LeadSubmissionData
  ): Promise<{ success: boolean; leadId?: string; error?: string }> {
    try {
      if (!this.apiBaseUrl || !this.apiKey) {
        throw new Error('Capital Legacy API configuration is missing');
      }

      const response = await fetch(`${this.apiBaseUrl}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Capital Legacy API Error: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        leadId: result.lead_id || result.id,
      };
    } catch (error: any) {
      console.error('[LeadService] Error submitting Capital Legacy lead:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit Capital Legacy lead',
      };
    }
  }

  /**
   * Calculate total estate value from assets and policies
   * This is called ONCE after user completes adding all assets and beneficiaries
   */
  static calculateTotalEstateValue(
    assets: Array<{ asset_value?: number }>,
    policies: Array<{ policy_value?: number }>
  ): number {
    const totalAssets = assets.reduce((sum, asset) => sum + (asset.asset_value || 0), 0);
    const totalPolicies = policies.reduce((sum, policy) => sum + (policy.policy_value || 0), 0);
    return totalAssets + totalPolicies;
  }

  /**
   * Calculate and store estate value in user profile
   * Called once after user finishes adding all assets/beneficiaries
   */
  static async calculateAndStoreEstateValue(userId: string): Promise<number> {
    const [assets, policies] = await Promise.all([
      AssetService.getUserAssets(userId),
      PolicyService.getUserPolicies(userId),
    ]);

    const totalEstateValue = this.calculateTotalEstateValue(assets, policies);

    await UserService.updateUser(userId, {
      total_estate_value: totalEstateValue,
    } as any);

    return totalEstateValue;
  }

  /**
   * Check if user qualifies for Capital Legacy lead submission
   * Qualification: Total estate value (assets + policies) ≥ R250,000
   */
  static qualifiesForLeadSubmission(
    totalEstateValue: number,
    popiaAccepted: boolean
  ): boolean {
    const MIN_ESTATE_VALUE = 250000; // R250,000 threshold
    return popiaAccepted && totalEstateValue >= MIN_ESTATE_VALUE;
  }

  /**
   * Update user lead submission status after successful Capital Legacy submission
   */
  static async updateLeadSubmissionStatus(userId: string, leadId: string): Promise<void> {
    await UserService.updateLeadSubmissionStatus(userId, leadId);
  }
}

export default LeadService;

