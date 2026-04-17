# Mikayla.ai (Next.js)

Your family, handled. Next.js 14 App Router + Supabase Realtime family coordination app.

## Quick Start (Local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to the connected GitHub repo
2. In Vercel dashboard, set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
3. Deploy — Vercel auto-detects Next.js

## Stack Notes

- **Supabase Realtime** — WebSocket connection via `@supabase/supabase-js` client
- **Environment variables** — Credentials in `.env.local` / Vercel env vars
- **Error handling** — Every async operation has try/catch with sync status indicator
- **Retry logic** — Realtime subscription retries with unique channel names

## File Structure

```
app/
  layout.tsx      — Root layout + metadata
  page.tsx        — Main dashboard (all views + modals)
  globals.css     — Design system (Mikayla dark + gold)
lib/
  supabase.ts     — Supabase client + TypeScript types
  store.ts        — CRUD operations + Realtime subscription
  constants.ts    — Colors, family members, quotes, weather
  helpers.ts      — Date formatting utilities
```

## Supabase Tables (active in app)

events, todos

All tables have RLS enabled with public access policies and Realtime publication.
