import { UserProfile } from '../types/user';
import { AssetInformation } from '../types/asset';
import { PolicyInformation } from '../types/policy';
import { BeneficiaryInformation } from '../types/beneficiary';
import { LeadSubmissionData, AppointmentType } from '../types/lead';

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

  // Minor children
  const hasMinorChildren = beneficiaries.some((ben) =>
    (ben.relationship_to_user || '')
      .toLowerCase()
      .includes('child')
  );

  const leadData: LeadSubmissionData = {
    client_age: age,
    employment_status: userProfile.employment_status || 'other',
    has_minor_children: hasMinorChildren,
    has_property: hasProperty,
    has_vehicle: hasVehicle,
    has_other_assets: hasOtherAssets,
    marital_status: userProfile.marital_status || 'single',
    client_address: userProfile.address || '',
    appointment_type: appointmentType,
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

