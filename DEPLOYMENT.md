# Deploying Notus Frontend

## Vercel

Use the `Notus` directory as the Vercel project root.

- Framework preset: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

Set these Vercel environment variables:

```text
VITE_API_URL=https://your-render-backend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

The `vercel.json` rewrite sends client-side routes back to `index.html`, so direct links like `/teacher` keep working after deployment.
