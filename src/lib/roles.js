/** Single list of account roles. Middleware, cookies, and admin APIs all import this. */

export const ALLOWED_ROLES = ['reader', 'contributor', 'vlogger', 'content_writer', 'admin', 'employer'];

export const ROLE_LABELS = {
  reader: 'Reader',
  contributor: 'Contributor',
  vlogger: 'Vlogger',
  content_writer: 'Content Writer',
  admin: 'Admin',
  employer: 'Employer',
};

export const VALID_ROLES = new Set(ALLOWED_ROLES);
export const EDITORIAL_ROLES = new Set(['admin', 'content_writer']);
export const CREATOR_ROLES = ['contributor', 'vlogger'];
export const CREATOR_ROLE_SET = new Set(CREATOR_ROLES);
export const ADMIN_ROLES = new Set(['admin']);
