export const COUNTRY_OPTIONS = [
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Bahrain',
  'Kuwait',
  'Oman',
  'India',
  'Other',
];

export const NATIONALITY_OPTIONS = [
  'Indian',
  'Pakistani',
  'Bangladeshi',
  'Sri Lankan',
  'Nepalese',
  'Filipino',
  'Other',
];

export const EMPTY_PROFILE_DETAILS = {
  country: '',
  countryOther: '',
  city: '',
  nationality: '',
  nationalityOther: '',
  phone: '',
  whatsapp: '',
  dateOfBirth: '',
  profession: '',
};

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

function choiceValue(choice, other, options, label) {
  const selected = clean(choice, 80);
  if (!options.includes(selected)) return { error: `Choose a ${label}.` };
  if (selected === 'Other') {
    const typed = clean(other, 80);
    if (typed.length < 2) return { error: `Enter your ${label}.` };
    return { value: typed };
  }
  return { value: selected };
}

function resolveChoice(selected, other, options, label) {
  const choice = clean(selected, 80);
  if (options.includes(choice)) return choiceValue(choice, other, options, label);
  if (choice.length >= 2) return { value: choice };
  return { error: `Choose a ${label}.` };
}

function optionalPhone(value, label) {
  const raw = clean(value, 20);
  if (!raw) return { value: '' };
  const digits = raw.replace(/[^\d]/g, '');
  if (!/^\+?[\d\s()-]+$/.test(raw) || digits.length < 8 || digits.length > 15) {
    return { error: `Enter a valid ${label}, or leave it blank.` };
  }
  return { value: raw };
}

export function splitChoice(value, options) {
  const current = clean(value, 80);
  if (!current) return { choice: '', other: '' };
  if (options.includes(current) && current !== 'Other') return { choice: current, other: '' };
  return { choice: 'Other', other: current };
}

/** Map a stored users row to the shape ProfileDetailsForm edits. */
export function profileToDetails(profile) {
  const country = splitChoice(profile?.country, COUNTRY_OPTIONS);
  const nationality = splitChoice(profile?.nationality, NATIONALITY_OPTIONS);
  return {
    ...EMPTY_PROFILE_DETAILS,
    country: country.choice,
    countryOther: country.other,
    city: profile?.city || '',
    nationality: nationality.choice,
    nationalityOther: nationality.other,
    phone: profile?.phone || '',
    whatsapp: profile?.whatsapp || '',
    dateOfBirth: typeof profile?.dateOfBirth === 'string' ? profile.dateOfBirth.slice(0, 10) : '',
    profession: profile?.profession || '',
  };
}

export function validateProfileDetails(input) {
  const country = resolveChoice(input?.country, input?.countryOther, COUNTRY_OPTIONS, 'country of residence');
  if (country.error) return country;
  const city = clean(input?.city, 80);
  if (city.length < 2) return { error: 'Enter the city where you live.' };
  const nationality = resolveChoice(input?.nationality, input?.nationalityOther, NATIONALITY_OPTIONS, 'nationality');
  if (nationality.error) return nationality;
  const phone = optionalPhone(input?.phone, 'phone number');
  if (phone.error) return phone;
  const whatsapp = optionalPhone(input?.whatsapp, 'WhatsApp number');
  if (whatsapp.error) return whatsapp;
  const dateOfBirth = clean(input?.dateOfBirth, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return { error: 'Enter your date of birth.' };
  const born = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(born.getTime())) return { error: 'Enter a valid date of birth.' };
  const today = new Date();
  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - born.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < born.getUTCDate())) age -= 1;
  if (born > today) return { error: 'Date of birth cannot be in the future.' };
  if (age < 13) return { error: 'You need to be at least 13 years old.' };
  if (age > 120) return { error: 'Enter a valid date of birth.' };
  const profession = clean(input?.profession, 80);
  if (profession.length < 2) return { error: 'Enter your profession or occupation.' };

  return {
    value: {
      country: country.value,
      city,
      nationality: nationality.value,
      phone: phone.value,
      whatsapp: whatsapp.value,
      dateOfBirth,
      profession,
      location: `${city}, ${country.value}`,
    },
  };
}

/** True when the account already has the residency details the sign-in gate asks for. */
export function hasCompleteProfile(profile) {
  if (!profile) return false;
  if (profile.profileComplete === true) return true;
  const city = String(profile.city || '').trim();
  const country = String(profile.country || '').trim();
  const nationality = String(profile.nationality || '').trim();
  const profession = String(profile.profession || '').trim();
  const dob = profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : '';
  return city.length >= 2
    && country.length >= 2
    && nationality.length >= 2
    && profession.length >= 2
    && /^\d{4}-\d{2}-\d{2}$/.test(dob);
}

export function isHttpUrl(value) {
  const raw = clean(value, 300);
  if (!raw) return true;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
