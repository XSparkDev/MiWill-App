export type AppointmentType = 'single' | 'spouse_partner' | 'family';

export interface LeadSubmissionData {
  client_age: number;
  employment_status: string;
  has_minor_children: boolean;
  has_property: boolean;
  has_vehicle: boolean;
  has_other_assets: boolean;
  marital_status: string;
  client_address: string;
  appointment_type: AppointmentType;
}
