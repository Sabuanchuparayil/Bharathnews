import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', 'src');
const SKIP = new Set(['app', 'lib/firebase-server.js', 'services/firestore-server.js']);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'app') continue;
      walk(p, files);
    } else if (/\.(jsx|js)$/.test(name)) {
      files.push(p);
    }
  }
  return files;
}

const CLIENT_MARKERS = [
  'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext',
  'useReducer', 'useLayoutEffect', 'framer-motion', 'useAuth', 'useTheme',
  'useLocation', 'useNavigate', 'useParams', 'usePathname', 'useRouter',
  'useScroll', 'useTransform', 'AnimatePresence', 'localStorage', 'sessionStorage',
  'window.', 'document.', 'onAuthStateChanged', 'toast.',
];

function migrate(content, filePath) {
  let c = content;

  // react-router-dom → next
  if (c.includes('react-router-dom')) {
    c = c.replace(/import\s*\{([^}]+)\}\s*from\s*['"]react-router-dom['"]/g, (match, imports) => {
      const parts = imports.split(',').map(s => s.trim()).filter(Boolean);
      const lines = [];
      const remaining = [];

      for (const part of parts) {
        if (part === 'Link') lines.push("import Link from 'next/link'");
        else if (part.startsWith('Link ')) lines.push("import Link from 'next/link'");
        else if (part === 'useNavigate' || part === 'useRouter') remaining.push('useRouter');
        else if (part === 'useLocation' || part === 'usePathname') remaining.push('usePathname');
        else if (part === 'useParams') { /* dropped — use props */ }
        else remaining.push(part);
      }

      if (remaining.length) {
        const uniq = [...new Set(remaining)];
        lines.push(`import { ${uniq.join(', ')} } from 'next/navigation'`);
      }
      return lines.join('\n');
    });

    c = c.replace(/\buseNavigate\(\)/g, 'useRouter()');
    c = c.replace(/const navigate = useRouter\(\)/g, 'const router = useRouter()');
    c = c.replace(/\bnavigate\(/g, 'router.push(');
    c = c.replace(/\buseLocation\(\)/g, 'usePathname()');
    c = c.replace(/const location = usePathname\(\)/g, 'const pathname = usePathname()');
    c = c.replace(/location\.pathname/g, 'pathname');
    c = c.replace(/<Link\s+to=/g, '<Link href=');
    c = c.replace(/to=\{`/g, 'href={`');
    c = c.replace(/to="([^"]+)"/g, 'href="$1"');
    c = c.replace(/to='([^']+)'/g, "href='$1'");
  }

  // Remove Helmet imports and blocks (metadata handled in app router)
  c = c.replace(/import\s*\{[^}]*Helmet[^}]*\}\s*from\s*['"]react-helmet-async['"];?\n?/g, '');
  c = c.replace(/<Helmet>[\s\S]*?<\/Helmet>\s*/g, '');

  const needsClient = CLIENT_MARKERS.some(m => c.includes(m)) || filePath.includes('/context/') || filePath.includes('/hooks/') || filePath.includes('/components/') || filePath.includes('/pages/');

  if (needsClient && !c.startsWith("'use client'") && !c.startsWith('"use client"')) {
    c = `'use client';\n\n${c}`;
  }

  return c;
}

const files = walk(ROOT);
let count = 0;
for (const f of files) {
  const rel = f.replace(ROOT + '/', '');
  if (SKIP.has(rel.split('/')[0])) continue;
  const original = readFileSync(f, 'utf8');
  const updated = migrate(original, f);
  if (updated !== original) {
    writeFileSync(f, updated);
    count++;
  }
}
console.log(`Migrated ${count} files`);
