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

Then run `supabase/migrations/20261107000000_boss_battles.sql`. It adds the boss battle tables (`bosses`, `user_gyms`, `gym_sessions`, `boss_battles`, `boss_attacks`) and the functions the battle screen calls (`get_battle_state`, `set_my_gym`, `gym_check_in`, `gym_heartbeat`, `gym_check_out`, `roll_spin`). Clients can read these tables but never write them directly. Every write goes through those functions, so spins and damage can't be forged.

## Boss battles

You and your partner share one boss each week (Monday to Monday, UTC). You damage it by spending spins:

- **Earning spins:** save your gym's location once (you can change it once a week). Checking in within about 150 m of it gives you 1 spin, at most once every 6 hours. You then get 1 more spin for every 10 minutes you stay. While the battle screen is open it checks your location every minute. Browsers pause location in the background, so if your phone is locked, the time since the last check counts (up to 30 minutes) when you open the app again, as long as you're still at the gym. A location check away from the gym ends the session. Sessions stop earning after 3 hours. Spins expire at the end of the week.
- **Spinning:** each spin rolls on a case-opening reel. The server picks the result; the reel only animates it.

| Rarity | Colour | Odds | Damage (share of the boss's max HP) |
|---|---|---|---|
| Common | Grey | 69.99% | up to 1% |
| Uncommon | Green | 20% | over 1%, up to 10% |
| Rare | Blue | 10% | over 10%, up to 30% |
| Legendary | Gold | 0.01% | a flat 50% |

The rules live in `src/lib/battle/rules.ts` (UI) and the boss battles migration (enforcement). Change both together.

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
    battle/           # Battle screen and its server actions (check-in, spins)
  components/
    onboarding/       # Onboarding wizard and form steps
    boss/             # Boss placeholder and HP bar
    hub/              # Hub battle button
    battle/           # Battle screen, spin reel, gym check-in panel
  lib/
    supabase/         # Supabase client helpers
    onboarding/       # Onboarding validation schemas and types
    boss/             # Weekly boss roster and week helpers
    battle/           # Spin odds and damage rules, battle state types
    auth/             # Onboarded-user route guard
  middleware.ts       # Session refresh
supabase/
  migrations/         # Schema, RLS policies and pairing functions
public/
  gymcats-hero-cat.png
```
