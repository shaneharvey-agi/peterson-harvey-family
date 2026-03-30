# Peterson — Harvey Family Command Center (Next.js)

Converted from single `index.html` to Next.js 14 App Router for proper Supabase Realtime WebSocket support.

## Quick Start (Local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push this folder to your GitHub repo (`shaneharvey-agi/peterson-harvey-family`)
2. In Vercel dashboard, set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
3. Deploy — Vercel auto-detects Next.js

## What Changed (index.html → Next.js)

- **Supabase Realtime** — Now uses proper WebSocket connection via `@supabase/supabase-js` client (no more CHANNEL_ERROR)
- **Environment variables** — Credentials moved from hardcoded JS to `.env.local` / Vercel env vars
- **Error handling** — Every async operation has try/catch with sync status indicator
- **Retry logic** — Realtime subscription retries with unique channel names (no infinite recursion)
- **Mobile improvements** — `min()` CSS for modals, extra 480px breakpoint, `white-space: nowrap` on clock

## File Structure

```
app/
  layout.tsx      — Root layout, fonts, metadata
  page.tsx        — Main dashboard (all views + modals)
  globals.css     — Full design system (dark futuristic theme)
lib/
  supabase.ts     — Supabase client + TypeScript types
  store.ts        — All CRUD operations + Realtime subscription
  constants.ts    — Colors, family members, quotes, weather
  helpers.ts      — Date formatting utilities
```

## Supabase Tables

events, todos, shopping, priorities, weeklys, recipes, dinner_plan, pantry

All tables have RLS enabled with public access policies and Realtime publication.
