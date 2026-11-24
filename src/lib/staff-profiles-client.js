import { SOURCE_CATEGORY_IDS } from '@/config/category-taxonomy';

/** Content categories that can be assigned to editorial staff for routing cowork content. */
export const ASSIGNABLE_TOPICS = SOURCE_CATEGORY_IDS;

export const ACCOUNT_ROLES = {
  content_writer: 'Content Writer',
  admin: 'Admin',
};

/**
 * Job titles an admin can assign from Manage Users.
 * They all sign in with the Content Writer account, which opens the newsroom,
 * and the title is what appears on the editorial board.
 */
export const EDITORIAL_BOARD_ROLES = [
  { id: 'content_writer', title: 'Content Writer' },
  { id: 'reporter', title: 'Reporter' },
  { id: 'senior_reporter', title: 'Senior Reporter' },
  { id: 'gulf_correspondent', title: 'Gulf Correspondent' },
  { id: 'india_correspondent', title: 'India Correspondent' },
  { id: 'editor', title: 'Editor' },
  { id: 'editor_in_chief', title: 'Editor-in-Chief' },
  { id: 'columnist', title: 'Columnist' },
];

/** Titles offered on the staff form. New titles can still be typed in. */
export const ROLE_TITLES = [...new Set(['Newsroom', ...EDITORIAL_BOARD_ROLES.map(item => item.title), 'Contributor'])];
