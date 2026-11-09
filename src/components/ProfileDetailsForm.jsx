'use client';

import React from 'react';
import { COUNTRY_OPTIONS, NATIONALITY_OPTIONS } from '@/lib/profile-fields';

const fieldClass = 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm';

function ChoiceField({ id, label, value, other, options, onChoice, onOther }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">{label}</label>
      <select id={id} value={value} onChange={e => onChoice(e.target.value)} required className={fieldClass}>
        <option value="">Select</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      {value === 'Other' && (
        <input
          type="text"
          value={other}
          onChange={e => onOther(e.target.value)}
          required
          placeholder={`Enter ${label.toLowerCase()}`}
          className={`${fieldClass} mt-2`}
        />
      )}
    </div>
  );
}

export default function ProfileDetailsForm({ values, onChange }) {
  const set = (key, next) => onChange({ ...values, [key]: next });

  return (
    <div className="space-y-4">
      <ChoiceField
        id="profile-country"
        label="Country of residence"
        value={values.country}
        other={values.countryOther}
        options={COUNTRY_OPTIONS}
        onChoice={next => set('country', next)}
        onOther={next => set('countryOther', next)}
      />
      <div>
        <label htmlFor="profile-city" className="block text-sm font-medium mb-1.5">City</label>
        <input id="profile-city" value={values.city} onChange={e => set('city', e.target.value)} required className={fieldClass} placeholder="Dubai" />
      </div>
      <ChoiceField
        id="profile-nationality"
        label="Nationality"
        value={values.nationality}
        other={values.nationalityOther}
        options={NATIONALITY_OPTIONS}
        onChoice={next => set('nationality', next)}
        onOther={next => set('nationalityOther', next)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="profile-phone" className="block text-sm font-medium mb-1.5">Phone (optional)</label>
          <input id="profile-phone" value={values.phone} onChange={e => set('phone', e.target.value)} className={fieldClass} placeholder="+971 50 000 0000" />
        </div>
        <div>
          <label htmlFor="profile-whatsapp" className="block text-sm font-medium mb-1.5">WhatsApp (optional)</label>
          <input id="profile-whatsapp" value={values.whatsapp} onChange={e => set('whatsapp', e.target.value)} className={fieldClass} placeholder="+971 50 000 0000" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="profile-dob" className="block text-sm font-medium mb-1.5">Date of birth</label>
          <input id="profile-dob" type="date" value={values.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="profile-profession" className="block text-sm font-medium mb-1.5">Profession</label>
          <input id="profile-profession" value={values.profession} onChange={e => set('profession', e.target.value)} required className={fieldClass} placeholder="Journalist, nurse, engineer" />
        </div>
      </div>
      <p className="text-xs text-gray-500">Phone, WhatsApp, date of birth, and nationality stay private. Your public creator page shows country, city, and profession only.</p>
    </div>
  );
}
