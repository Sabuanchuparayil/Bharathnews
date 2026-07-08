/** Shared constants for jobs board and classifieds marketplace. */

export const GCC_COUNTRIES = [
  { id: 'uae', label: 'UAE', currency: 'AED' },
  { id: 'saudi', label: 'Saudi Arabia', currency: 'SAR' },
  { id: 'qatar', label: 'Qatar', currency: 'QAR' },
  { id: 'kuwait', label: 'Kuwait', currency: 'KWD' },
  { id: 'oman', label: 'Oman', currency: 'OMR' },
  { id: 'bahrain', label: 'Bahrain', currency: 'BHD' },
];

export const JOB_TYPES = [
  { id: 'full-time', label: 'Full-time' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'contract', label: 'Contract' },
  { id: 'temporary', label: 'Temporary' },
  { id: 'internship', label: 'Internship' },
];

export const GENDER_PREFERENCES = [
  { id: 'any', label: 'Any' },
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
];

export const LISTING_TYPES = [
  { id: 'sell', label: 'For Sale' },
  { id: 'buy', label: 'Wanted to Buy' },
  { id: 'rent', label: 'For Rent' },
  { id: 'service', label: 'Service' },
  { id: 'wanted', label: 'Wanted' },
];

export const CLASSIFIED_CATEGORIES = [
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'housing', label: 'Housing' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'services', label: 'Services' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'general', label: 'General' },
];

export const PRICE_TYPES = [
  { id: 'fixed', label: 'Fixed Price' },
  { id: 'negotiable', label: 'Negotiable' },
  { id: 'free', label: 'Free' },
  { id: 'contact', label: 'Contact for Price' },
];

export const CONTACT_METHODS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'call', label: 'Phone Call' },
  { id: 'email', label: 'Email' },
];

export const KYC_DOC_TYPES = [
  { id: 'trade_license', label: 'Trade License', required: true },
  { id: 'signatory_id', label: 'Authorized Signatory ID', required: true },
  { id: 'company_letter', label: 'Company Letter (optional)', required: false },
];

export const MARKETPLACE_LIMITS = {
  freeActiveJobs: 1,
  freeActiveClassifieds: 2,
  defaultExpiryDays: 30,
  maxClassifiedImages: 5,
};

export function countryLabel(id) {
  return GCC_COUNTRIES.find(c => c.id === id)?.label || id;
}

export function countryCurrency(id) {
  return GCC_COUNTRIES.find(c => c.id === id)?.currency || 'AED';
}
