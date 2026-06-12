#!/usr/bin/env node
/**
 * Enable Cloud Translation API and grant the Firebase service account access.
 * Requires a GCP account with Service Usage Admin + Project IAM Admin (Owner works).
 *
 * Usage:
 *   node scripts/setup-google-translate.mjs
 *   FIREBASE_SERVICE_ACCOUNT_JSON=/path/to/sa.json node scripts/setup-google-translate.mjs --test
 */
import { execSync } from 'child_process';
import {
  resolveProjectId,
  resolveServiceAccountPath,
  tokenFromServiceAccount,
} from './firebase-admin-utils.mjs';
import { readFileSync } from 'fs';

const projectId = resolveProjectId();
const saPath = resolveServiceAccountPath();
const testOnly = process.argv.includes('--test');

if (!saPath) {
  console.error('Set FIREBASE_SERVICE_ACCOUNT_JSON or add it to workers/secrets.env');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(saPath, 'utf8'));
const saEmail = sa.client_email;

function run(cmd, { ignoreError = false } = {}) {
  console.log(`\n→ ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (out.trim()) console.log(out.trim());
    return true;
  } catch (err) {
    const msg = err.stderr?.toString() || err.message;
    if (ignoreError) {
      console.warn('  (skipped:', msg.split('\n')[0], ')');
      return false;
    }
    console.error(msg);
    return false;
  }
}

async function testTranslation() {
  console.log('\nTesting Google NMT with service account…');
  const token = await tokenFromServiceAccount(saPath);
  const res = await fetch('https://translation.googleapis.com/language/translate/v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: ['Hello', 'Firefighters at the Pentagon'],
      source: 'en',
      target: 'ml',
      format: 'text',
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Translation test failed:', JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log('✓ Malayalam output:', data.data.translations.map(t => t.translatedText).join(' | '));
}

if (testOnly) {
  await testTranslation();
  process.exit(0);
}

console.log(`Project: ${projectId}`);
console.log(`Service account: ${saEmail}`);

run(`gcloud config set project ${projectId}`, { ignoreError: true });
run(`gcloud services enable translate.googleapis.com --project=${projectId}`);
run(
  `gcloud projects add-iam-policy-binding ${projectId} ` +
  `--member="serviceAccount:${saEmail}" ` +
  `--role="roles/cloudtranslate.user"`,
  { ignoreError: true },
);

console.log('\nOptional: restrict an API key to Translation API only (alternative to service account OAuth):');
console.log('  gcloud services api-keys create --display-name="Bharath News Translate" \\');
console.log('    --api-target=service=translate.googleapis.com');
console.log('  Then: cd workers && npx wrangler secret put GOOGLE_TRANSLATE_API_KEY');

await testTranslation();
console.log('\nDone. Deploy the worker: npm run worker:deploy');
