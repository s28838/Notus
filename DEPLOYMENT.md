# Deploying Notus Frontend

## Vercel

Use the `Notus` directory as the Vercel project root.

Build settings:

```text
Framework Preset=Vite
Build Command=npm run build
Output Directory=dist
Install Command=npm install
```

Set these Vercel environment variables:

```text
VITE_API_URL=https://your-render-backend.onrender.com
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
VITE_SENTRY_DSN=your-frontend-sentry-dsn
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

Set these only for production builds that upload source maps to Sentry:

```text
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=notus-0j
SENTRY_PROJECT=notus-frontend
```

Do not add a `VITE_` prefix to `SENTRY_AUTH_TOKEN`.

After Vercel deploys, copy the Vercel URL back into the backend environment variables:

```text
CORS_ALLOWED_ORIGIN_PATTERNS=https://your-vercel-app.vercel.app
APP_FRONTEND_BASE_URL=https://your-vercel-app.vercel.app
```
