# Supabase Setup for The Bharath News

## 1. Create project

1. Go to https://supabase.com and sign up / log in
2. **New project** → Name: `bharathnews` → Region: **South Asia (Mumbai)** or closest
3. Save your database password

## 2. Run schema

1. Dashboard → **SQL Editor** → New query
2. Paste contents of `supabase/schema.sql` → **Run**

## 3. Enable auth providers

Dashboard → **Authentication** → **Providers**:

- **Email**: Enable (confirm email optional for dev)
- **Google**: Enable — see [Google OAuth setup](#google-oauth-setup) below

### Google OAuth setup

#### A. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → select your project (or create one)
2. **APIs & Services** → **OAuth consent screen**
   - User type: **External**
   - App name: `The Bharath News`
   - Support email: your email
   - Authorized domains: `thebharathnews.com`, `supabase.co`
   - Save
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `Bharath News Supabase`
   - **Authorized JavaScript origins** (optional but recommended):
     - `https://ectcwkpwhfmzpgmpwjwm.supabase.co`
     - `http://localhost:3000`
     - `https://bharathnews-production.up.railway.app`
     - `https://www.thebharathnews.com`
   - **Authorized redirect URIs** (required — only this one):
     ```
     https://ectcwkpwhfmzpgmpwjwm.supabase.co/auth/v1/callback
     ```
4. Copy the **Client ID** and **Client Secret**

#### B. Supabase Dashboard

1. **Authentication** → **Providers** → **Google** → Enable
2. Paste **Client ID** and **Client Secret**
3. Save

#### C. Redirect URLs (Supabase)

**Authentication** → **URL Configuration**:

- Site URL: `https://bharathnews-production.up.railway.app`
- Redirect URLs:
  - `http://localhost:3000/**`
  - `https://bharathnews-production.up.railway.app/**`
  - `https://www.thebharathnews.com/**`

The app uses `/auth/callback` to complete Google sign-in and redirect back to the dashboard (or admin).

### Optional: Google Cloud Translation API

For automatic article translation in the worker pipeline:

1. **Google Cloud Console** → **APIs & Services** → enable **Cloud Translation API**
2. Create an API key (or use a service account JSON for OAuth-based NMT)
3. Add to `.env.local` and `workers/secrets.env`:
   - `GOOGLE_TRANSLATE_API_KEY=AIza...` **or**
   - `FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}`
4. Run `npm run setup:google-translate` to verify the key

### Optional: YouTube Data API v3

Videos are fetched via YouTube RSS feeds by default (no key required). For optional metadata enrichment:

1. Enable **YouTube Data API v3** in Google Cloud Console
2. Add `YOUTUBE_API_KEY=AIza...` to `workers/secrets.env`
3. Redeploy the worker: `npm run worker:deploy`

## 4. Copy API keys

Dashboard → **Project Settings** → **API**:

| Key | Env var |
|-----|---------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role (secret!) | `SUPABASE_SERVICE_ROLE_KEY` |

Workers use:
- `SUPABASE_URL` = same as NEXT_PUBLIC_SUPABASE_URL
- `SUPABASE_SERVICE_KEY` = service_role key

## 5. Configure redirect URLs

Authentication → **URL Configuration**:

- Site URL: `https://www.thebharathnews.com` (or Railway URL for staging)
- Redirect URLs: `http://localhost:3000/**`, `https://www.thebharathnews.com/**`, `https://bharathnews-production.up.railway.app/**`

## 6. Set first admin

After signing up once via the app:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## 7. Seed RSS sources (optional)

After setting Supabase env vars in `.env.local`:

```bash
npm run seed:sources
```

## 8. Deploy

```bash
# Next.js (Railway)
npm run build
railway up

# Cloudflare Workers pipeline
npm run worker:deploy
npm run worker:secrets   # set SUPABASE_URL + SUPABASE_SERVICE_KEY
```

## 9. Railway env vars

In Railway → Variables, set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Remove old `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_*` vars
