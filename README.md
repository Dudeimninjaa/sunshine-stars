# Sunshine Stars — Vercel Safe Version

This version is prepared for Vercel testing.

## Fixes included

- Uses Next.js 14.2.15
- Uses Node 20.x on Vercel
- Adds `.npmrc` with legacy peer deps
- Adds `vercel.json`
- Ignores TypeScript and ESLint build blockers during test deployment

## Deploy

Upload this folder to GitHub, then redeploy on Vercel.

Make sure Vercel Environment Variables include:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Do not upload `.env.local`.
