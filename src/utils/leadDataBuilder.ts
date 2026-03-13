import { UserProfile } from '../types/user';
import { AssetInformation } from '../types/asset';
import { PolicyInformation } from '../types/policy';
import { BeneficiaryInformation } from '../types/beneficiary';
import { LeadSubmissionData, AppointmentType } from '../types/lead';
import LeadService from '../services/leadService';

export async function buildLeadSubmissionData(
  userProfile: UserProfile,
  appointmentType: AppointmentType,
  assets: AssetInformation[],
  policies: PolicyInformation[],
  beneficiaries: BeneficiaryInformation[]
): Promise<LeadSubmissionData> {
  // Derive age from date_of_birth
  const age = userProfile.date_of_birth
    ? calculateAgeFromDate(userProfile.date_of_birth)
    : 0;

  // Use stored estate value if available, otherwise calculate as fallback
  const totalEstateValue =
    userProfile.total_estate_value ??
    LeadService.calculateTotalEstateValue(assets, policies);

  // Calculate breakdown
  const totalAssets = assets.reduce(
    (sum, asset) => sum + (asset.asset_value || 0),
    0
  );
  const totalPolicies = policies.reduce(
    (sum, policy) => sum + (policy.policy_value || 0),
    0
  );

  // Asset categories
  const hasProperty = assets.some(
    (asset) => asset.asset_type === 'property'
  );
  const hasVehicle = assets.some(
    (asset) => asset.asset_type === 'vehicle'
  );
  const otherAssets = assets.filter(
    (asset) =>
      asset.asset_type !== 'property' && asset.asset_type !== 'vehicle'
  );
  const hasOtherAssets = otherAssets.length > 0;

  const assetDetails = [
    hasProperty && 'Property',
    hasVehicle && 'Vehicle',
    hasOtherAssets && `${otherAssets.length} other asset(s)`,
  ]
    .filter(Boolean)
    .join(', ');

  // Minor children
  const minorChildren = beneficiaries.filter((ben) =>
    (ben.relationship_to_user || '')
      .toLowerCase()
      .includes('child')
  );
  const hasMinorChildren = minorChildren.length > 0;

  const leadData: LeadSubmissionData = {
    // Client Information
    client_age: age,
    client_email: userProfile.email,
    client_phone: userProfile.phone,
    client_full_name: `${userProfile.first_name} ${userProfile.surname}`.trim(),
    client_id_number: userProfile.id_number,
    client_address: userProfile.address || '',

    // Qualification Data
    total_estate_value: totalEstateValue,
    monthly_income: userProfile.monthly_income,
    employment_status: userProfile.employment_status || 'other',
    marital_status: userProfile.marital_status || 'single',

    // Asset Information
    has_property: hasProperty,
    has_vehicle: hasVehicle,
    has_other_assets: hasOtherAssets,
    asset_details: assetDetails || undefined,
    asset_values: {
      total_assets: totalAssets,
      total_policies: totalPolicies,
      estate_total: totalEstateValue,
    },

    // Family Information
    has_minor_children: hasMinorChildren,
    minor_children_count: hasMinorChildren ? minorChildren.length : undefined,

    // Appointment Details
    appointment_type: appointmentType,

    // Consent & Compliance
    popia_consent: !!userProfile.popia_accepted,
    consent_timestamp: new Date(
      userProfile.popia_accepted_at || new Date()
    ).toISOString(),

    // Metadata
    source: 'miwill_app',
    user_id: userProfile.user_id,
  };

  return leadData;
}

function calculateAgeFromDate(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

