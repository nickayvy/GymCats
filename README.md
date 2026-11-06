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

## Database setup

Run `supabase/migrations/20261106000000_onboarding.sql` in the Supabase SQL editor, or apply it with `supabase db push`. It creates the `profiles`, `couples` and `couple_members` tables with row-level security, the pairing functions (`create_couple`, `join_couple`) and a private `avatars` storage bucket.

## Goal assistant (AI)

The onboarding goals step can turn a free-text description of your goals into a weekly plan. It calls a model through the Vercel AI Gateway.

- `AI_GATEWAY_API_KEY`: set in `.env.local` for local use. On Vercel, OIDC authentication is used automatically.
- `GOAL_PLAN_MODEL`: optional. Overrides the default model, `deepseek/deepseek-v4.1-flash`.

Without a gateway key, the assistant shows a "not configured" message instead of building a plan.

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
    login/            # Login page and actions
    onboarding/       # Onboarding wizard route and server actions
    hub/              # Weekly boss hub (onboarded users only)
    battle/           # Battle screen against the weekly boss
  components/
    onboarding/       # Onboarding wizard and form steps
    boss/             # Boss placeholder and HP bar
    hub/              # Hub battle button
    battle/           # Battle screen
  lib/
    supabase/         # Supabase client helpers
    onboarding/       # Onboarding validation schemas and types
    boss/             # Weekly boss roster and week helpers
    auth/             # Onboarded-user route guard
  middleware.ts       # Session refresh
supabase/
  migrations/         # Schema, RLS policies and pairing functions
public/
  gymcats-hero-cat.png
```
