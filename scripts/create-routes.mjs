import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const APP = join(import.meta.dirname, '..', 'src', 'app');

const routes = [
  { path: 'page.jsx', content: `import Home from '@/views/Home';\nexport default function Page() { return <Home />; }\n` },
  { path: 'india/page.jsx', content: `import India from '@/views/India';\nexport default function Page() { return <India />; }\n` },
  { path: 'gcc/page.jsx', content: `import GCC from '@/views/GCC';\nexport default function Page() { return <GCC />; }\n` },
  { path: 'business/page.jsx', content: `import Business from '@/views/Business';\nexport default function Page() { return <Business />; }\n` },
  { path: 'technology/page.jsx', content: `import Technology from '@/views/Technology';\nexport default function Page() { return <Technology />; }\n` },
  { path: 'sports/page.jsx', content: `import Sports from '@/views/Sports';\nexport default function Page() { return <Sports />; }\n` },
  { path: 'entertainment/page.jsx', content: `import Entertainment from '@/views/Entertainment';\nexport default function Page() { return <Entertainment />; }\n` },
  { path: 'health/page.jsx', content: `import Health from '@/views/Health';\nexport default function Page() { return <Health />; }\n` },
  { path: 'education/page.jsx', content: `import Education from '@/views/Education';\nexport default function Page() { return <Education />; }\n` },
  { path: 'jobs/page.jsx', content: `import Jobs from '@/views/Jobs';\nexport default function Page() { return <Jobs />; }\n` },
  { path: 'real-estate/page.jsx', content: `import RealEstate from '@/views/RealEstate';\nexport default function Page() { return <RealEstate />; }\n` },
  { path: 'lifestyle/page.jsx', content: `import Lifestyle from '@/views/Lifestyle';\nexport default function Page() { return <Lifestyle />; }\n` },
  { path: 'opinion/page.jsx', content: `import Opinion from '@/views/Opinion';\nexport default function Page() { return <Opinion />; }\n` },
  { path: 'explore/page.jsx', content: `import Explore from '@/views/Explore';\nexport default function Page() { return <Explore />; }\n` },
  { path: 'community/page.jsx', content: `import Community from '@/views/Community';\nexport default function Page() { return <Community />; }\n` },
  { path: 'videos/page.jsx', content: `import Videos from '@/views/Videos';\nexport default function Page() { return <Videos />; }\n` },
  { path: 'bookmarks/page.jsx', content: `import Bookmarks from '@/views/Bookmarks';\nexport default function Page() { return <Bookmarks />; }\n` },
  { path: 'settings/page.jsx', content: `import Settings from '@/views/Settings';\nexport default function Page() { return <Settings />; }\n` },
  { path: 'privacy/page.jsx', content: `import Privacy from '@/views/Privacy';\nexport default function Page() { return <Privacy />; }\n` },
  { path: 'terms/page.jsx', content: `import Terms from '@/views/Terms';\nexport default function Page() { return <Terms />; }\n` },
  { path: 'admin/page.jsx', content: `import Admin from '@/views/Admin';\nexport default function Page() { return <Admin />; }\n` },
  { path: 'admin/dashboard/page.jsx', content: `import AdminDashboard from '@/views/AdminDashboard';\nexport default function Page() { return <AdminDashboard />; }\n` },
  { path: 'admin/moderation/page.jsx', content: `import AdminModeration from '@/views/AdminModeration';\nexport default function Page() { return <AdminModeration />; }\n` },
  { path: 'ai-tools/page.jsx', content: `import AITools from '@/views/AITools';\nexport default function Page() { return <AITools />; }\n` },
  { path: 'creator/apply/page.jsx', content: `import CreatorApply from '@/views/CreatorApply';\nexport default function Page() { return <CreatorApply />; }\n` },
  { path: 'creator/new/page.jsx', content: `import CreatePost from '@/views/CreatePost';\nexport default function Page() { return <CreatePost />; }\n` },
  { path: 'creator/space/page.jsx', content: `import CreatorSpace from '@/views/CreatorSpace';\nexport default function Page() { return <CreatorSpace />; }\n` },
  { path: 'search/page.jsx', content: `import { Suspense } from 'react';\nimport Search from '@/views/Search';\nexport default function Page() {\n  return (\n    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}>\n      <Search />\n    </Suspense>\n  );\n}\n` },
];

for (const { path, content } of routes) {
  const full = join(APP, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
console.log(`Created ${routes.length} route files`);
