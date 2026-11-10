import {
  LayoutDashboard, Send, Rss, PenSquare, Users as UsersIcon, Shield, Mail, Video,
  ShoppingBag, Settings, UserRound, BadgeCheck, ClipboardCheck, Newspaper,
} from 'lucide-react';

const SETTINGS_PATH = '/admin/settings';

export const WORKSPACES = {
  admin: { label: 'Admin', home: '/admin/dashboard' },
  desk: { label: 'Newsroom', home: '/desk' },
};

// `match` overrides the default prefix check; it receives (pathname, tab).
export const ADMIN_NAV = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/desk', icon: PenSquare, label: 'Newsroom desk' },
      { href: '/admin/sources', icon: Rss, label: 'Sources' },
      { href: '/admin/videos', icon: Video, label: 'Videos' },
      { href: '/admin/distribution', icon: Send, label: 'Distribution' },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/admin/moderation', icon: Shield, label: 'Moderation' },
      { href: '/admin/marketplace', icon: ShoppingBag, label: 'Marketplace' },
      { href: '/admin/subscribers', icon: Mail, label: 'Subscribers' },
    ],
  },
  {
    label: 'People',
    items: [
      {
        href: `${SETTINGS_PATH}?tab=users`,
        icon: UsersIcon,
        label: 'Users & access',
        match: (pathname, tab) => pathname === SETTINGS_PATH && tab === 'users',
      },
      { href: '/admin/staff', icon: BadgeCheck, label: 'Editorial staff' },
    ],
  },
  {
    label: 'System',
    items: [
      {
        href: SETTINGS_PATH,
        icon: Settings,
        label: 'Site settings',
        match: (pathname, tab) => pathname === SETTINGS_PATH && tab !== 'users',
      },
    ],
  },
];

export function getDeskNav({ isAdmin }) {
  const sections = [
    {
      label: 'Newsroom',
      items: [
        { href: '/desk', icon: Newspaper, label: 'Desk home', match: pathname => pathname === '/desk' },
        { href: '/desk/compose', icon: PenSquare, label: 'Compose' },
        { href: '/desk/review', icon: ClipboardCheck, label: 'Review queue' },
      ],
    },
  ];
  if (isAdmin) {
    sections.push({
      label: 'Administration',
      items: [
        { href: '/admin/staff', icon: BadgeCheck, label: 'Editorial staff' },
        { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin dashboard' },
      ],
    });
  }
  return sections;
}

export function isNavItemActive(item, pathname, tab) {
  if (item.match) return item.match(pathname, tab);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export const PROFILE_LINK = { href: '/admin/profile', icon: UserRound, label: 'My profile' };
