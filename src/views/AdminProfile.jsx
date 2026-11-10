'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  ArrowLeft, ShieldCheck, BadgeCheck, Mail, CalendarDays, Clock, KeyRound, LogOut,
  Camera, UserRound, MapPin, Lock, Eye, EyeOff, Users, Settings,
} from 'lucide-react';
import Layout from '../components/Layout';
import LoginPrompt from '../components/LoginPrompt';
import ProfileDetailsForm from '../components/ProfileDetailsForm';
import { useAuth } from '../context/AuthContext';
import { EMPTY_PROFILE_DETAILS, profileToDetails, validateProfileDetails } from '@/lib/profile-fields';
import { saveAccountProfile } from '../services/creator';
import { sendPasswordResetEmail } from '../services/admin';
import {
  updateOwnProfile, uploadProfileImage, changeOwnPassword,
  DISPLAY_NAME_MAX, PASSWORD_MIN,
} from '../services/account';

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="glass-card-solid rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-brand-600" />
        <h2 className="font-display font-bold text-lg">{title}</h2>
      </div>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </section>
  );
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="text-sm text-gray-900 dark:text-white break-words">{children}</div>
      </div>
    </div>
  );
}

const AdminProfile = () => {
  const { user, userProfile, loading, isAdmin, refreshUserProfile, logout } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [details, setDetails] = useState(EMPTY_PROFILE_DETAILS);
  const [savingDetails, setSavingDetails] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  const seeded = useRef(false);

  useEffect(() => {
    if (!userProfile || seeded.current) return;
    setDisplayName(userProfile.displayName || '');
    setPhotoURL(userProfile.photoURL || '');
    setDetails(profileToDetails(userProfile));
    seeded.current = true;
  }, [userProfile]);

  if (loading) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <LoginPrompt nextPath="/admin/profile" showAdminHint />
        </div>
      </Layout>
    );
  }

  if (!userProfile) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4 text-center text-sm text-gray-500">
          <div>
            <p className="mb-3">Could not load your profile.</p>
            <button type="button" onClick={() => refreshUserProfile()} className="btn-secondary px-4 py-2 rounded-xl text-sm">
              Try again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const email = user.email || userProfile.email || '';
  const shownName = userProfile.displayName || email.split('@')[0] || 'Admin';
  const avatar = userProfile.photoURL
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(shownName)}&background=4338ca&color=fff&size=128`;
  const identities = Array.isArray(user.identities) ? user.identities : null;
  const hasPassword = identities?.some(identity => identity?.provider === 'email') === true;
  const signInMethods = identities?.length
    ? identities.map(identity => identity?.provider).filter(Boolean).join(', ')
    : 'an external provider';
  const memberSince = userProfile._createdAtIso || user.created_at;
  const profileDirty = displayName.trim() !== (userProfile.displayName || '')
    || photoURL.trim() !== (userProfile.photoURL || '');

  const handlePhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProfileImage(file);
      setPhotoURL(url);
      toast.success('Photo uploaded. Save profile to apply it.');
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateOwnProfile(user.id, { displayName, photoURL });
      await refreshUserProfile();
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.message || 'Could not save your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveDetails = async (event) => {
    event.preventDefault();
    const parsed = validateProfileDetails(details);
    if (parsed.error) {
      toast.error(parsed.error);
      return;
    }
    setSavingDetails(true);
    try {
      await saveAccountProfile(user.id, parsed.value);
      await refreshUserProfile();
      toast.success('Contact details saved.');
    } catch (err) {
      toast.error(err.message || 'Could not save your details.');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await changeOwnPassword({ email, currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed.');
    } catch (err) {
      setPasswordError(err.message || 'Could not change your password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!email) return;
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email.');
    } finally {
      setSendingReset(false);
    }
  };

  const passwordType = showPasswords ? 'text' : 'password';

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-500 mb-6 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="glass-card-solid rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <img src={avatar} alt="" className="w-24 h-24 rounded-2xl object-cover shadow-md flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white truncate">{shownName}</h1>
            <p className="text-sm text-gray-500 truncate">{email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                <ShieldCheck className="w-3.5 h-3.5" /> Administrator
              </span>
              {userProfile.emailVerified === true && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300">
                  <BadgeCheck className="w-3.5 h-3.5" /> Email verified
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2 self-start sm:self-center text-red-600"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Section icon={ShieldCheck} title="Account">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <InfoRow icon={Mail} label="Email">{email || '—'}</InfoRow>
                <InfoRow icon={ShieldCheck} label="Role">Administrator (full access)</InfoRow>
                <InfoRow icon={CalendarDays} label="Member since">{formatDate(memberSince)}</InfoRow>
                <InfoRow icon={Clock} label="Last sign-in">{formatDateTime(user.last_sign_in_at)}</InfoRow>
                <InfoRow icon={KeyRound} label="Sign-in method"><span className="capitalize">{signInMethods}</span></InfoRow>
              </div>
            </Section>

            <Section icon={Settings} title="Quick links">
              <div className="flex flex-col gap-2">
                <Link href="/admin/settings?tab=users" className="btn-secondary text-sm px-4 py-2 rounded-xl flex items-center gap-2">
                  <Users className="w-4 h-4" /> Manage users &amp; roles
                </Link>
                <Link href="/admin/settings" className="btn-secondary text-sm px-4 py-2 rounded-xl flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Site settings
                </Link>
                <Link href="/admin/dashboard" className="btn-secondary text-sm px-4 py-2 rounded-xl flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Dashboard
                </Link>
              </div>
            </Section>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Section icon={UserRound} title="Profile" description="Your name and photo appear on the site header and admin screens.">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={photoURL || avatar}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <label className="btn-secondary text-sm px-4 py-2 rounded-xl inline-flex items-center gap-2 cursor-pointer">
                    <Camera className="w-4 h-4" />
                    {uploading ? 'Uploading…' : 'Change photo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploading}
                      onChange={e => { handlePhoto(e.target.files?.[0]); e.target.value = ''; }}
                      className="sr-only"
                    />
                  </label>
                  {photoURL && (
                    <button type="button" onClick={() => setPhotoURL('')} className="text-xs text-gray-500 hover:text-red-600">
                      Remove
                    </button>
                  )}
                </div>
                <div>
                  <label htmlFor="admin-display-name" className="block text-sm font-medium mb-1">Display name</label>
                  <input
                    id="admin-display-name"
                    type="text"
                    required
                    maxLength={DISPLAY_NAME_MAX}
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium mb-1">Email</label>
                  <input id="admin-email" type="email" value={email} readOnly className={`${inputClass} bg-gray-50 dark:bg-gray-900 text-gray-500`} />
                  <p className="text-xs text-gray-500 mt-1">Your email is your sign-in identity and can&apos;t be changed here.</p>
                </div>
                <button
                  type="submit"
                  disabled={savingProfile || uploading || !profileDirty}
                  className="btn-primary px-5 py-2 rounded-xl text-sm disabled:opacity-50"
                >
                  {savingProfile ? 'Saving…' : 'Save profile'}
                </button>
              </form>
            </Section>

            <Section icon={MapPin} title="Contact &amp; location" description="Private details. Only country, city, and profession are ever shown publicly.">
              <form onSubmit={handleSaveDetails} className="space-y-4">
                <ProfileDetailsForm values={details} onChange={setDetails} />
                <button type="submit" disabled={savingDetails} className="btn-primary px-5 py-2 rounded-xl text-sm disabled:opacity-50">
                  {savingDetails ? 'Saving…' : 'Save details'}
                </button>
              </form>
            </Section>

            <Section icon={Lock} title="Security" description="Keep your admin account protected with a strong, unique password.">
              {hasPassword ? (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  {passwordError && (
                    <p role="alert" className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl p-3">{passwordError}</p>
                  )}
                  <div>
                    <label htmlFor="admin-current-password" className="block text-sm font-medium mb-1">Current password</label>
                    <input
                      id="admin-current-password"
                      type={passwordType}
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="admin-new-password" className="block text-sm font-medium mb-1">New password</label>
                      <input
                        id="admin-new-password"
                        type={passwordType}
                        autoComplete="new-password"
                        required
                        minLength={PASSWORD_MIN}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className={inputClass}
                        placeholder={`Minimum ${PASSWORD_MIN} characters`}
                      />
                    </div>
                    <div>
                      <label htmlFor="admin-confirm-password" className="block text-sm font-medium mb-1">Confirm new password</label>
                      <input
                        id="admin-confirm-password"
                        type={passwordType}
                        autoComplete="new-password"
                        required
                        minLength={PASSWORD_MIN}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="submit" disabled={changingPassword} className="btn-primary px-5 py-2 rounded-xl text-sm disabled:opacity-60">
                      {changingPassword ? 'Updating…' : 'Change password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => !prev)}
                      className="text-sm text-gray-500 hover:text-brand-600 inline-flex items-center gap-1"
                    >
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPasswords ? 'Hide' : 'Show'} passwords
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {identities
                    ? `You sign in with ${signInMethods}, so there is no password on this account yet. Send yourself a link to set one.`
                    : 'We could not confirm an email password on this account. Send yourself a link to set one.'}
                </p>
              )}

              <div className="border-t border-gray-100 dark:border-gray-800 mt-5 pt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">Forgot your current password?</p>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={sendingReset || !email}
                  className="btn-secondary text-sm px-4 py-2 rounded-xl inline-flex items-center gap-2 disabled:opacity-60"
                >
                  <Mail className="w-4 h-4" /> {sendingReset ? 'Sending…' : 'Email me a reset link'}
                </button>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminProfile;
