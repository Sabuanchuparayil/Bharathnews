#!/usr/bin/env node
/**
 * Enable Google (and email/password) sign-in for Firebase Auth via Identity Platform API.
 *
 * Usage:
 *   npm run firebase:enable-google
 *   FIREBASE_PROJECT_ID=thebharathnews-app node scripts/enable-google-auth.mjs
 *   node scripts/enable-google-auth.mjs --sa /path/to/service-account.json
 */

import {
  resolveProjectId,
  resolveServiceAccountPath,
  tokenFromServiceAccount,
  identityRequest,
} from './firebase-admin-utils.mjs';

const GOOGLE_IDP = 'google.com';
const SUPPORT_EMAIL = process.env.FIREBASE_SUPPORT_EMAIL || 'mail@jsabu.com';

function parseSaArg(argv) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--sa' && argv[i + 1]) return argv[++i];
  }
  return '';
}

async function enableGoogleApis(projectId, token) {
  for (const service of [
    'clientauthconfig.googleapis.com',
    'identitytoolkit.googleapis.com',
  ]) {
    try {
      await fetch(`https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${service}:enable`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-goog-user-project': projectId,
        },
      });
    } catch {
      // non-blocking
    }
  }
}

async function authConfigRequest(projectId, token, path, { method = 'GET', body, query = '' } = {}) {
  const url = `https://clientauthconfig.googleapis.com/v1${path}${query}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-goog-user-project': projectId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} failed ${res.status}: ${text.slice(0, 400)}`);
  }
  return json;
}

async function getProjectNumber(projectId, token) {
  const project = await fetch(`https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());
  if (!project.projectNumber) {
    throw new Error(`Could not resolve project number for ${projectId}`);
  }
  return project.projectNumber;
}

async function createOAuthWebClient(projectId, token) {
  const projectNumber = await getProjectNumber(projectId, token);
  const brandsPath = `/projects/${projectNumber}/brands`;

  let brands = [];
  try {
    const listed = await authConfigRequest(projectId, token, brandsPath);
    brands = listed.brands || [];
  } catch {
    brands = [];
  }

  let brandName = brands[0]?.name;
  if (!brandName) {
    console.log('Creating OAuth consent brand…');
    const created = await authConfigRequest(projectId, token, brandsPath, {
      method: 'POST',
      body: {
        applicationTitle: 'The Bharath News',
        supportEmail: SUPPORT_EMAIL,
      },
    });
    brandName = created.name;
  }

  const redirectUris = [
    `https://${projectId}.firebaseapp.com/__/auth/handler`,
    `https://${projectId}.web.app/__/auth/handler`,
    'https://www.thebharathnews.com/__/auth/handler',
    'https://thebharathnews.com/__/auth/handler',
  ];
  const javascriptOrigins = [
    `https://${projectId}.firebaseapp.com`,
    `https://${projectId}.web.app`,
    'https://www.thebharathnews.com',
    'https://thebharathnews.com',
    'http://localhost:3000',
  ];

  console.log('Creating OAuth web client for Firebase Auth…');
  const createdClient = await authConfigRequest(projectId, token, `${brandName}/oauthClients`, {
    method: 'POST',
    body: {
      displayName: 'Web client (Firebase Auth)',
      redirectUris,
      javascriptOrigins,
    },
  });

  const clientId = createdClient.clientId || createdClient.name?.split('/').pop();
  const clientSecret = createdClient.clientSecret || createdClient.secret || '';
  if (!clientId || !clientSecret) {
    throw new Error('OAuth client created but client ID/secret were not returned.');
  }
  return { clientId, clientSecret };
}

async function resolveOAuthCredentials(projectId, token) {
  if (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    };
  }

  const discovered = await fetchFirebaseWebOAuthClient(projectId, token);
  if (discovered.clientId && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return { clientId: discovered.clientId, clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET };
  }

  try {
    return await createOAuthWebClient(projectId, token);
  } catch (err) {
    throw new Error(
      `${err.message}\n\nManual fallback: create a Web OAuth client in Google Cloud Console, then run:\n` +
      '  GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com GOOGLE_OAUTH_CLIENT_SECRET=xxx npm run firebase:enable-google',
    );
  }
}

async function fetchFirebaseWebOAuthClient(projectId, token) {
  const appsRes = await fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (appsRes.ok) {
    const apps = await appsRes.json();
    const appId = apps.apps?.[0]?.appId;
    if (appId) {
      const cfgRes = await fetch(
        `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps/${appId}/config`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        const clientId = cfg.clientId || cfg.oauthClientId || cfg.apiKey || '';
        if (clientId.includes('.apps.googleusercontent.com')) {
          return { clientId, appId };
        }
      }
    }
  }

  const brandsRes = await fetch(`https://iap.googleapis.com/v1/projects/${projectId}/brands`, {
    headers: { Authorization: `Bearer ${token}`, 'x-goog-user-project': projectId },
  });
  if (brandsRes.ok) {
    const brands = await brandsRes.json();
    for (const brand of brands.brands || []) {
      const clientsRes = await fetch(`${brand.name}/identityAwareProxyClients`, {
        headers: { Authorization: `Bearer ${token}`, 'x-goog-user-project': projectId },
      });
      if (!clientsRes.ok) continue;
      const clients = await clientsRes.json();
      for (const client of clients.identityAwareProxyClients || []) {
        if (client.displayName?.includes('Web client') || client.name?.includes('web')) {
          return { clientId: client.name.split('/').pop() };
        }
      }
    }
  }

  const projectRes = await fetch(`https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (projectRes.ok) {
    const project = await projectRes.json();
    const projectNumber = project.projectNumber;
    const authClientsRes = await fetch(
      `https://clientauthconfig.googleapis.com/v1/projects/${projectNumber}/brands`,
      { headers: { Authorization: `Bearer ${token}`, 'x-goog-user-project': projectId } },
    );
    if (authClientsRes.ok) {
      const authBrands = await authClientsRes.json();
      for (const brand of authBrands.brands || []) {
        const oauthClientsRes = await fetch(`${brand.name}/oauthClients`, {
          headers: { Authorization: `Bearer ${token}`, 'x-goog-user-project': projectId },
        });
        if (!oauthClientsRes.ok) continue;
        const oauthClients = await oauthClientsRes.json();
        for (const client of oauthClients.oauthClients || []) {
          const clientId = client.name?.split('/').pop() || client.clientId;
          if (clientId?.includes('.apps.googleusercontent.com')) {
            return { clientId };
          }
        }
      }
    }
  }

  return { clientId: '' };
}

async function ensureGoogleProvider(projectId, token) {
  const resource = `projects/${projectId}/defaultSupportedIdpConfigs/${GOOGLE_IDP}`;

  try {
    const existing = await identityRequest(projectId, token, `/admin/v2/${resource}`);
    if (existing.enabled) {
      console.log('Google sign-in already enabled.');
      return existing;
    }
    return identityRequest(projectId, token, `/admin/v2/${resource}`, {
      method: 'PATCH',
      query: '?updateMask=enabled',
      body: { enabled: true },
    });
  } catch (err) {
    if (!String(err.message).includes('404')) throw err;
  }

  console.log('Creating Google sign-in provider…');
  const { clientId, clientSecret } = await resolveOAuthCredentials(projectId, token);

  const body = {
    name: resource,
    enabled: true,
    clientId,
    clientSecret,
  };

  try {
    return await identityRequest(projectId, token, `/v2/projects/${projectId}/defaultSupportedIdpConfigs`, {
      method: 'POST',
      query: '?idpId=google.com',
      body,
    });
  } catch (err) {
    if (!String(err.message).includes('409')) throw err;
    return identityRequest(projectId, token, `/admin/v2/${resource}`, {
      method: 'PATCH',
      query: '?updateMask=enabled,clientId,clientSecret',
      body: { enabled: true, clientId, clientSecret },
    });
  }
}

async function ensureEmailSignIn(projectId, token) {
  const config = await identityRequest(
    projectId,
    token,
    `/admin/v2/projects/${projectId}/config`,
  );

  if (config.signIn?.email?.enabled) {
    console.log('Email/password sign-in already enabled.');
    return config;
  }

  console.log('Enabling email/password sign-in…');
  return identityRequest(
    projectId,
    token,
    `/admin/v2/projects/${projectId}/config`,
    {
      method: 'PATCH',
      query: '?updateMask=signIn.email.enabled,signIn.email.passwordRequired',
      body: {
        signIn: {
          email: {
            enabled: true,
            passwordRequired: true,
          },
        },
      },
    },
  );
}

async function inspectAuth(projectId, token) {
  const config = await identityRequest(
    projectId,
    token,
    `/admin/v2/projects/${projectId}/config`,
  );
  console.log('signIn:', JSON.stringify(config.signIn, null, 2));
  console.log('authorizedDomains:', config.authorizedDomains);

  try {
    const list = await identityRequest(
      projectId,
      token,
      `/v2/projects/${projectId}/defaultSupportedIdpConfigs`,
    );
    console.log('defaultSupportedIdpConfigs:', JSON.stringify(list, null, 2));
  } catch (err) {
    console.log('defaultSupportedIdpConfigs list error:', err.message);
  }

  const appsRes = await fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('webApps status:', appsRes.status);
  const apps = await appsRes.json();
  const appId = apps.apps?.[0]?.appId;
  console.log('webAppId:', appId || 'none');
  if (appId) {
    const cfgRes = await fetch(
      `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps/${appId}/config`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    console.log('webApp config status:', cfgRes.status);
    const cfg = await cfgRes.json();
    console.log('webApp config keys:', Object.keys(cfg));
    console.log('webApp config (non-secret):', JSON.stringify({
      projectId: cfg.projectId,
      authDomain: cfg.authDomain,
      clientId: cfg.clientId,
      oauthClientId: cfg.oauthClientId,
    }, null, 2));
  }
}

async function main() {
  const projectId = resolveProjectId();
  const saPath = resolveServiceAccountPath(parseSaArg(process.argv.slice(2)));
  if (!saPath) {
    throw new Error('No service account. Set FIREBASE_SERVICE_ACCOUNT_JSON or workers/secrets.env');
  }

  const token = await tokenFromServiceAccount(saPath);

  if (process.argv.includes('--inspect')) {
    await inspectAuth(projectId, token);
    return;
  }

  await enableGoogleApis(projectId, token);
  await ensureEmailSignIn(projectId, token);
  const google = await ensureGoogleProvider(projectId, token);

  console.log(`Project: ${projectId}`);
  console.log(`Support email (set in Firebase Console if needed): ${SUPPORT_EMAIL}`);
  console.log(`Google provider enabled: ${google.enabled !== false}`);
  console.log('Done. Try Google sign-in at /login again.');
}

main().catch((err) => {
  console.error('Failed to enable Google auth:', err.message || err);
  process.exit(1);
});
