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
3. Copy the **Project URL** and **publishable** key (`sb_publishable_…`; the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works) into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## Database setup

Run `supabase/migrations/20261106000000_onboarding.sql` in the Supabase SQL editor, or apply it with `supabase db push`. It creates the `profiles`, `couples` and `couple_members` tables with row-level security, the pairing functions (`create_couple`, `join_couple`) and a private `avatars` storage bucket.

Then run `supabase/migrations/20261107000000_workout_log.sql` for workout logging. It adds `workouts`, `workout_exercises` and `spin_wallets`, plus the `log_workout` function that saves a workout and awards spins. Clients can only read these tables; every write goes through `log_workout`.

## Log & Grow

From the hub, **Log & Grow** opens `/log`, where you log each exercise as sets of weight × reps. Each exercise is compared with your previous session of the same exercise (names are matched case-insensitively). It counts as **growth** if you:

- lift a heavier top set (even with fewer sets or reps), or
- move more total volume (reps × weight): +1 rep, +2 reps, an extra set, or an extra set at a lighter weight, or
- for bodyweight work (weight left blank), do more total reps.

Each exercise that grows earns **1 spin**. An exercise can earn at most one spin every 20 hours, so logging the same lift twice in a row doesn't pay out twice. The first time you log an exercise sets your baseline. The log screen shows your last session and one-tap "Grow it" targets (+1 rep, +2 reps, +5 lb, +1 set).

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
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy — Vercel auto-detects Next.js.

Or use the Vercel CLI:

```bash
npx vercel
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
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
    log/              # Log & Grow: workout logging and its server action
  components/
    onboarding/       # Onboarding wizard and form steps
    boss/             # Boss placeholder and HP bar
    hub/              # Hub battle and Log & Grow buttons, spin badge
    battle/           # Battle screen
    log/              # Workout logger, exercise cards, results
  lib/
    supabase/         # Supabase client helpers
    onboarding/       # Onboarding validation schemas and types
    boss/             # Weekly boss roster and week helpers
    auth/             # Onboarded-user route guard
    workouts/         # Growth rules, schemas and workout queries
  middleware.ts       # Session refresh
supabase/
  migrations/         # Schema, RLS policies, pairing and workout-logging functions
public/
  gymcats-hero-cat.png
```
