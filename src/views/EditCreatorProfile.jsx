'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import ProfileCoverPicker from '../components/ProfileCoverPicker';
import ProfileDetailsForm from '../components/ProfileDetailsForm';
import { useAuth } from '../context/AuthContext';
import {
  COUNTRY_OPTIONS,
  EMPTY_PROFILE_DETAILS,
  NATIONALITY_OPTIONS,
  isHttpUrl,
  splitChoice,
  validateProfileDetails,
} from '@/lib/profile-fields';
import { getCreatorProfileByUserId, saveAccountProfile, updateCreatorProfile } from '../services/creator';

const SOCIALS = [
  ['youtube', 'YouTube'],
  ['instagram', 'Instagram'],
  ['x', 'X'],
  ['linkedin', 'LinkedIn'],
  ['facebook', 'Facebook'],
];

const fieldClass = 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm';

export default function EditCreatorProfile() {
  const { user, userProfile, loading, isCreator, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [details, setDetails] = useState(EMPTY_PROFILE_DETAILS);
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  const [website, setWebsite] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [socials, setSocials] = useState({});
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    if (loading || !user || !isCreator || !userProfile || seeded.current) return;
    const userId = user.id || user.uid;
    seeded.current = true;
    getCreatorProfileByUserId(userId).then(profile => {
      if (!profile) {
        setReady(true);
        return;
      }
      const country = splitChoice(userProfile?.country || profile.country, COUNTRY_OPTIONS);
      const nationality = splitChoice(userProfile?.nationality, NATIONALITY_OPTIONS);
      setSlug(profile.slug);
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setTagline(profile.tagline || '');
      setWebsite(profile.website || '');
      setCoverImage(profile.coverImage || '');
      setSocials(profile.socialLinks || {});
      setDetails({
        ...EMPTY_PROFILE_DETAILS,
        country: country.choice,
        countryOther: country.other,
        city: userProfile?.city || profile.city || '',
        nationality: nationality.choice,
        nationalityOther: nationality.other,
        phone: userProfile?.phone || '',
        whatsapp: userProfile?.whatsapp || '',
        dateOfBirth: typeof userProfile?.dateOfBirth === 'string' ? userProfile.dateOfBirth.slice(0, 10) : '',
        profession: userProfile?.profession || profile.profession || '',
      });
      setReady(true);
    }).catch(() => setReady(true));
  }, [loading, user, isCreator, userProfile]);

  const save = async (event) => {
    event.preventDefault();
    if (!slug) {
      toast.error('Your creator profile is not ready yet.');
      return;
    }
    if (bio.trim().length > 280) {
      toast.error('Keep the bio within 280 characters.');
      return;
    }
    if (tagline.trim().length > 80) {
      toast.error('Keep the tagline within 80 characters.');
      return;
    }
    if (!isHttpUrl(website)) {
      toast.error('Website must start with http:// or https://.');
      return;
    }
    const badSocial = SOCIALS.find(([key]) => socials[key] && !isHttpUrl(socials[key]));
    if (badSocial) {
      toast.error(`${badSocial[1]} link must start with http:// or https://.`);
      return;
    }
    const parsed = validateProfileDetails(details);
    if (parsed.error) {
      toast.error(parsed.error);
      return;
    }
    setSaving(true);
    try {
      const userId = user.id || user.uid;
      await saveAccountProfile(userId, parsed.value);
      await updateCreatorProfile(slug, {
        bio: bio.trim(),
        tagline: tagline.trim(),
        website: website.trim(),
        coverImage: coverImage.trim(),
        socialLinks: socials,
        country: parsed.value.country,
        city: parsed.value.city,
        profession: parsed.value.profession,
        location: parsed.value.location,
      });
      await refreshUserProfile();
      toast.success('Profile updated.');
      router.push(`/@${slug}`);
    } catch (err) {
      toast.error(err.message || 'Could not update your profile.');
    }
    setSaving(false);
  };

  if (loading || (isCreator && !ready)) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user || !isCreator) {
    return (
      <Layout mainClassName="max-w-xl mx-auto px-4 py-12 text-center">
        <h1 className="font-display font-bold text-2xl mb-3">Creator profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Apply to the creator program before editing a public profile.</p>
        <Link href="/creator/apply" className="btn-primary px-6 py-2.5 rounded-xl">Apply</Link>
      </Layout>
    );
  }

  if (!slug) {
    return (
      <Layout mainClassName="max-w-xl mx-auto px-4 py-12 text-center">
        <h1 className="font-display font-bold text-2xl mb-3">Profile not ready</h1>
        <p className="text-gray-600 dark:text-gray-400">Your creator profile has not been created yet.</p>
      </Layout>
    );
  }

  return (
    <Layout mainClassName="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Edit profile</h1>
      <p className="text-gray-500 mb-8">
        Public page: <Link href={`/@${slug}`} className="text-brand-600 hover:underline">@{slug}</Link>
      </p>
      <form onSubmit={save} className="space-y-6">
        <div className="glass-card-solid rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-bold text-lg">Public profile</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Display name</label>
            <input value={displayName} readOnly className={`${fieldClass} opacity-70`} />
          </div>
          <div>
            <label htmlFor="tagline" className="block text-sm font-medium mb-1.5">Tagline</label>
            <input id="tagline" value={tagline} maxLength={80} onChange={e => setTagline(e.target.value)} className={fieldClass} placeholder="Stories from the Gulf" />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea id="bio" value={bio} maxLength={280} rows={4} onChange={e => setBio(e.target.value)} className={fieldClass} />
            <p className="text-xs text-gray-500 mt-1">{bio.length}/280</p>
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium mb-1.5">Website</label>
            <input id="website" type="url" value={website} onChange={e => setWebsite(e.target.value)} className={fieldClass} placeholder="https://" />
          </div>
          <ProfileCoverPicker imageUrl={coverImage} onChange={setCoverImage} />
          <div className="space-y-3">
            <p className="text-sm font-medium">Social links</p>
            {SOCIALS.map(([key, label]) => (
              <input
                key={key}
                type="url"
                value={socials[key] || ''}
                onChange={e => setSocials(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={label}
                className={fieldClass}
              />
            ))}
          </div>
        </div>
        <div className="glass-card-solid rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-4">Where you live</h2>
          <ProfileDetailsForm values={details} onChange={setDetails} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary px-8 py-3 rounded-xl disabled:opacity-50">
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </Layout>
  );
}
