# GymCats

Gym motivator for couples. Hero landing page with a pixel-art British Shorthair Siamese cat.

## Stack

- **Next.js 15** (App Router, **TypeScript**, Tailwind CSS)
- **Vercel** — deployment
- **Supabase** — auth & database

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase URL and anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API**.
3. Copy the **Project URL** and **anon public** key into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Deploy to Vercel

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add the same environment variables under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Next.js.

Or use the Vercel CLI:

```bash
npx vercel
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel --prod
```

## Project structure

```
src/
  app/
    page.tsx          # Hero page with title card
    layout.tsx
    globals.css
  lib/supabase/       # Supabase client helpers
  middleware.ts       # Session refresh
public/
  gymcats-hero-cat.png
```
