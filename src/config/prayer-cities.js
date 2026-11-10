/** Gulf cities shown in the utility bar and accepted by the prayer-times API. */

export const PRAYER_CITIES = [
  { id: 'dubai', label: 'Dubai', city: 'Dubai', country: 'United Arab Emirates' },
  { id: 'abudhabi', label: 'Abu Dhabi', city: 'Abu Dhabi', country: 'United Arab Emirates' },
  { id: 'sharjah', label: 'Sharjah', city: 'Sharjah', country: 'United Arab Emirates' },
  { id: 'riyadh', label: 'Riyadh', city: 'Riyadh', country: 'Saudi Arabia' },
  { id: 'jeddah', label: 'Jeddah', city: 'Jeddah', country: 'Saudi Arabia' },
  { id: 'doha', label: 'Doha', city: 'Doha', country: 'Qatar' },
  { id: 'kuwait', label: 'Kuwait', city: 'Kuwait City', country: 'Kuwait' },
  { id: 'manama', label: 'Manama', city: 'Manama', country: 'Bahrain' },
  { id: 'muscat', label: 'Muscat', city: 'Muscat', country: 'Oman' },
];

export const DEFAULT_PRAYER_CITY = 'dubai';

export function getPrayerCity(id) {
  return PRAYER_CITIES.find(city => city.id === id) || null;
}
