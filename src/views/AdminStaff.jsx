'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  Users, UserPlus, Link2, Unlink, Copy, Check,
  ChevronDown, ChevronUp, Shield, PenSquare, Eye, EyeOff,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { adminFetch } from '../services/admin';
import { deskAuthHeaders } from '@/lib/desk-client';
import { ROLE_TITLES, ASSIGNABLE_TOPICS, ACCOUNT_ROLES } from '@/lib/staff-profiles-client';

const inputClass = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm';

const EMPTY_FORM = {
  displayName: '',
  slug: '',
  title: 'Reporter',
  photoURL: '',
  bio: '',
  email: '',
  sortOrder: 100,
  isActive: true,
  assignedTopics: [],
};

const EMPTY_INVITE = {
  displayName: '',
  email: '',
  password: '',
  role: 'content_writer',
  title: 'Reporter',
  assignedTopics: [],
};

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

function RoleTitleField({ value, onChange }) {
  const known = ROLE_TITLES.includes(value);
  const [creating, setCreating] = useState(Boolean(value) && !known);
  const showCustom = creating || (Boolean(value) && !known);

  useEffect(() => {
    if (known) setCreating(false);
  }, [known]);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Editorial role</label>
      <select
        value={showCustom ? '__new__' : (value || 'Reporter')}
        onChange={e => {
          if (e.target.value === '__new__') {
            setCreating(true);
            onChange('');
            return;
          }
          setCreating(false);
          onChange(e.target.value);
        }}
        className={inputClass}
      >
        {ROLE_TITLES.map(title => <option key={title} value={title}>{title}</option>)}
        <option value="__new__">Create new role…</option>
      </select>
      {showCustom && (
        <input
          required
          maxLength={80}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type the new role, e.g. Deputy Editor"
          className={`${inputClass} mt-2`}
        />
      )}
    </div>
  );
}

function TopicChips({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ASSIGNABLE_TOPICS.map(topic => {
        const active = selected.includes(topic);
        return (
          <button
            key={topic}
            type="button"
            onClick={() => {
              onChange(active ? selected.filter(t => t !== topic) : [...selected, topic]);
            }}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              active
                ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-medium'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'
            }`}
          >
            {topic}
          </button>
        );
      })}
    </div>
  );
}

function CopyableField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-mono truncate">{value}</p>
      </div>
      <button type="button" onClick={copy} className="text-gray-400 hover:text-brand-600 flex-shrink-0" title="Copy">
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    active: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300',
    suspended: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    deactivated: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${colors[status] || colors.active}`}>
      {status || 'active'}
    </span>
  );
}

const AdminStaff = () => {
  const { isAdmin } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE);
  const [inviting, setInviting] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Link modal state
  const [linkTarget, setLinkTarget] = useState(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkResults, setLinkResults] = useState([]);
  const [linkLoading, setLinkLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/api/admin/staff?all=1');
      setStaff(data.staff || []);
    } catch (err) {
      toast.error(err.message || 'Could not load editorial team.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setInv = (field, value) => setInviteForm(prev => ({ ...prev, [field]: value }));

  const startEdit = (person) => {
    setEditId(person.id);
    setForm({
      displayName: person.displayName || '',
      slug: person.slug || '',
      title: person.title || 'Reporter',
      photoURL: person.photoURL || '',
      bio: person.bio || '',
      email: person.email || '',
      sortOrder: person.sortOrder ?? 100,
      isActive: person.isActive !== false,
      assignedTopics: person.assignedTopics || [],
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const headers = await deskAuthHeaders();
      const signed = await fetch('/api/profile/upload-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileType: file.type }),
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Upload failed.');
        return data;
      });
      await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      }).then(r => { if (!r.ok) throw new Error('Could not upload the photo.'); });
      set('photoURL', signed.publicUrl);
      toast.success('Photo uploaded.');
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    }
    setUploading(false);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await adminFetch(`/api/desk/staff/${editId}`, {
          method: 'PATCH',
          body: form,
        });
        toast.success('Profile updated.');
      } else {
        await adminFetch('/api/admin/staff', {
          method: 'POST',
          body: form,
        });
        toast.success('Profile created.');
      }
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not save.');
    }
    setSaving(false);
  };

  // ── Invite flow ──
  const openInvite = () => {
    setInviteForm({ ...EMPTY_INVITE, password: generatePassword() });
    setCredentials(null);
    setShowPassword(false);
    setShowInvite(true);
  };

  const submitInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const data = await adminFetch('/api/admin/staff', {
        method: 'POST',
        body: { action: 'invite', ...inviteForm },
      });
      setCredentials(data.credentials);
      toast.success(`${data.credentials.email} added to the editorial team.`);
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not create editorial member.');
    }
    setInviting(false);
  };

  const closeInvite = () => {
    setShowInvite(false);
    setCredentials(null);
  };

  // ── Link flow ──
  const openLink = (person) => {
    setLinkTarget(person);
    setLinkSearch('');
    setLinkResults([]);
  };

  const searchUsers = async () => {
    if (!linkSearch.trim()) return;
    setLinkLoading(true);
    try {
      const data = await adminFetch(`/api/admin/users?search=${encodeURIComponent(linkSearch)}&pageSize=10`);
      setLinkResults(data.users || []);
    } catch (err) {
      toast.error(err.message || 'Could not search users.');
    }
    setLinkLoading(false);
  };

  const confirmLink = async (userId) => {
    try {
      await adminFetch('/api/admin/staff', {
        method: 'POST',
        body: { action: 'link', staffId: linkTarget.id, userId },
      });
      toast.success('Account linked.');
      setLinkTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not link account.');
    }
  };

  const unlinkAccount = async (staffId) => {
    try {
      await adminFetch('/api/admin/staff', {
        method: 'POST',
        body: { action: 'link', staffId, userId: null },
      });
      toast.success('Account unlinked.');
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not unlink account.');
    }
  };

  const linked = staff.filter(p => p.userId);
  const unlinked = staff.filter(p => !p.userId);

  return (
    <AdminLayout
      title="Editorial Team"
      description="Manage reporters, editors and their accounts. Assign content topics for cowork routing."
      actions={
        <button type="button" onClick={openInvite} className="btn-primary px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add member
        </button>
      }
    >
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="space-y-8">
          {/* ── Team members with accounts ── */}
          <section>
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-600" /> Team members
              <span className="text-sm font-normal text-gray-500">({linked.length})</span>
            </h2>
            {linked.length === 0 && (
              <p className="text-sm text-gray-500">No editorial staff with linked accounts yet. Use "Add member" to invite someone.</p>
            )}
            <div className="grid gap-3">
              {linked.map(person => (
                <PersonCard
                  key={person.id}
                  person={person}
                  isEdit={editId === person.id}
                  onEdit={() => startEdit(person)}
                  onUnlink={() => unlinkAccount(person.id)}
                />
              ))}
            </div>
          </section>

          {/* ── Byline-only profiles ── */}
          {unlinked.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <PenSquare className="w-5 h-5 text-gray-400" /> Byline-only profiles
                <span className="text-sm font-normal text-gray-500">({unlinked.length})</span>
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                These profiles appear on article bylines but have no user account. Link them to give the person access to the newsroom.
              </p>
              <div className="grid gap-3">
                {unlinked.map(person => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    isEdit={editId === person.id}
                    onEdit={() => startEdit(person)}
                    onLink={() => openLink(person)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Edit form (inline) ── */}
          {editId && (
            <section className="rounded-2xl border border-brand-200 dark:border-brand-800 p-5">
              <h2 className="font-display font-bold text-lg mb-4">Edit profile</h2>
              <ProfileForm
                form={form}
                set={set}
                onSubmit={saveProfile}
                saving={saving}
                uploading={uploading}
                onUpload={uploadPhoto}
                onCancel={cancelEdit}
                submitLabel="Save changes"
              />
            </section>
          )}

          {/* ── Create profile (no account) ── */}
          {!editId && (
            <section className="rounded-2xl border border-stone-200 dark:border-white/10 p-5">
              <h2 className="font-display font-bold text-lg mb-2">Add byline profile</h2>
              <p className="text-xs text-gray-500 mb-4">
                Create a profile for article bylines without a user account. You can link an account later.
              </p>
              <ProfileForm
                form={form}
                set={set}
                onSubmit={saveProfile}
                saving={saving}
                uploading={uploading}
                onUpload={uploadPhoto}
                submitLabel="Create profile"
              />
            </section>
          )}
        </div>
      )}

      {/* ── Invite modal ── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="glass-card-solid rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {!credentials ? (
              <>
                <h3 className="font-display font-bold text-lg mb-1">Add editorial member</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Creates a user account and a staff profile in one step. Share the credentials with the person.
                </p>
                <form onSubmit={submitInvite} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Display name</label>
                      <input required value={inviteForm.displayName} onChange={e => setInv('displayName', e.target.value)} className={inputClass} placeholder="e.g. Rajan Menon" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input type="email" required value={inviteForm.email} onChange={e => setInv('email', e.target.value)} className={inputClass} placeholder="user@example.com" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={inviteForm.password}
                          onChange={e => setInv('password', e.target.value)}
                          className={`${inputClass} pr-10`}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button type="button" onClick={() => setInv('password', generatePassword())} className="text-xs text-brand-600 mt-1">
                        Generate new
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Account role</label>
                      <select value={inviteForm.role} onChange={e => setInv('role', e.target.value)} className={inputClass}>
                        {Object.entries(ACCOUNT_ROLES).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <RoleTitleField value={inviteForm.title} onChange={value => setInv('title', value)} />
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Assigned topics</label>
                    <p className="text-xs text-gray-500 mb-2">Cowork content in these categories will be routed to this person for review.</p>
                    <TopicChips selected={inviteForm.assignedTopics} onChange={v => setInv('assignedTopics', v)} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={inviting} className="btn-primary px-5 py-2 rounded-xl text-sm disabled:opacity-60">
                      {inviting ? 'Creating…' : 'Create member'}
                    </button>
                    <button type="button" onClick={closeInvite} className="btn-secondary px-5 py-2 rounded-xl text-sm">
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" /> Member created
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Share these credentials securely. The user can change their password after signing in.
                </p>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-1 mb-5">
                  <CopyableField label="Name" value={credentials.displayName} />
                  <CopyableField label="Email" value={credentials.email} />
                  <CopyableField label="Password" value={credentials.password} />
                  <CopyableField label="Role" value={ACCOUNT_ROLES[credentials.role] || credentials.role} />
                  <CopyableField label="Login URL" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/login`} />
                </div>
                <button type="button" onClick={closeInvite} className="btn-primary px-5 py-2 rounded-xl text-sm">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Link account modal ── */}
      {linkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="glass-card-solid rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display font-bold text-lg mb-1">Link account</h3>
            <p className="text-sm text-gray-500 mb-4">
              Link <strong>{linkTarget.displayName}</strong>'s byline to an existing user account.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={linkSearch}
                onChange={e => setLinkSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchUsers()}
                placeholder="Search by email or name…"
                className={inputClass}
              />
              <button type="button" onClick={searchUsers} disabled={linkLoading} className="btn-secondary px-3 py-2 rounded-xl text-sm flex-shrink-0">
                Search
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
              {linkLoading && <p className="text-xs text-gray-500 py-2">Searching…</p>}
              {!linkLoading && linkResults.length === 0 && linkSearch && <p className="text-xs text-gray-500 py-2">No users found.</p>}
              {linkResults.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => confirmLink(u.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm hover:bg-brand-50 dark:hover:bg-brand-950/20 text-left"
                >
                  <span className="truncate">{u.displayName || u.email} <span className="text-xs text-gray-500">{u.email}</span></span>
                  <span className="text-[10px] uppercase text-gray-400">{u.role}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setLinkTarget(null)} className="btn-secondary px-4 py-2 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

// ── Person card ──
function PersonCard({ person, isEdit, onEdit, onLink, onUnlink }) {
  const [expanded, setExpanded] = useState(false);
  const hasAccount = Boolean(person.account);
  const topics = person.assignedTopics || [];

  return (
    <div className={`rounded-xl border ${isEdit ? 'border-brand-400' : 'border-stone-200 dark:border-white/10'} bg-white dark:bg-dark-surface-1 overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {person.photoURL ? (
          <img src={person.photoURL} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
        ) : (
          <span className="w-11 h-11 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center font-semibold flex-shrink-0 text-sm">
            {(person.displayName || '?').slice(0, 1)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{person.displayName}</span>
            {!person.isActive && <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">inactive</span>}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {person.title}
            {hasAccount && <> · <span className="text-brand-600">{ACCOUNT_ROLES[person.account.role] || person.account.role}</span></>}
            {hasAccount && <> · <StatusBadge status={person.account.status} /></>}
          </p>
          {hasAccount && (
            <p className="text-xs text-gray-400 truncate">{person.account.email}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!hasAccount && onLink && (
            <button type="button" onClick={onLink} className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/20 text-brand-600" title="Link to user account">
              <Link2 className="w-4 h-4" />
            </button>
          )}
          {hasAccount && onUnlink && (
            <button type="button" onClick={onUnlink} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500" title="Unlink account">
              <Unlink className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="Edit profile">
            <PenSquare className="w-4 h-4 text-gray-500" />
          </button>
          <button type="button" onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-50 dark:border-gray-800/60 space-y-2">
          {person.bio && <p className="text-xs text-gray-600 dark:text-gray-400">{person.bio}</p>}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>@{person.slug}</span>
            <span>·</span>
            <span>Sort: {person.sortOrder}</span>
            {person.email && <><span>·</span><span>{person.email}</span></>}
          </div>
          {topics.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-400 mb-1">Assigned topics</p>
              <div className="flex flex-wrap gap-1">
                {topics.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300">{t}</span>
                ))}
              </div>
            </div>
          )}
          {!hasAccount && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Users className="w-3 h-3" /> No linked account — this person cannot sign in to the newsroom.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reusable profile form ──
function ProfileForm({ form, set, onSubmit, saving, uploading, onUpload, onCancel, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Display name</label>
        <input required value={form.displayName} onChange={e => set('displayName', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Slug</label>
        <input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto from name" className={inputClass} />
      </div>
      <RoleTitleField value={form.title} onChange={value => set('title', value)} />
      <div>
        <label className="block text-sm font-medium mb-1">Email (for contact)</label>
        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Photo URL</label>
        <input value={form.photoURL} onChange={e => set('photoURL', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Upload photo</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => onUpload?.(e.target.files?.[0])} className="block w-full text-sm mt-1" />
      </div>
      {form.photoURL && <img src={form.photoURL} alt="" className="w-16 h-16 rounded-full object-cover" />}
      <div>
        <label className="block text-sm font-medium mb-1">Sort order</label>
        <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} className={`${inputClass} w-24`} />
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm pb-2">
          <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
          Active on team page
        </label>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium mb-1.5">Assigned topics</label>
        <TopicChips selected={form.assignedTopics} onChange={v => set('assignedTopics', v)} />
      </div>
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary px-5 py-2 rounded-xl text-sm disabled:opacity-50">
          {saving ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary px-5 py-2 rounded-xl text-sm">Cancel</button>
        )}
      </div>
    </form>
  );
}

export default AdminStaff;
