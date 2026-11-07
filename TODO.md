# TODO: boss battles follow-ups

Handoff list for a higher-reasoning model. Each item stands on its own: context, the files involved, and what done looks like. Items 1–3 are linked and should be designed together.

Background: players earn spins at their gym (1 on check-in, +1 per 10 verified minutes) and spend them on a case-opening reel against a weekly boss shared with their partner. The rules live in `src/lib/battle/rules.ts` (UI) and the SQL migrations (enforcement). See the "Boss battles" and "Gym search" sections of `README.md`.

---

## 1. Decide what the 24 Hour Fitness list is for, then wire it in

**Status:** needs a product decision from the owner (asked, not yet answered).

`partner_gyms` holds the Google place IDs of 104 24 Hour Fitness clubs in SoCal (`supabase/migrations/20261109000000_partner_gyms.sql`, built by `scripts/fetch-24hf-socal.mjs`). Nothing reads it yet. Options:

- **A. Allowlist (recommended):** players may only pick a club on the list. Verification becomes "place ID is in `partner_gyms`", with no distance maths on Google coordinates. This also fixes most of item 2.
- **B. Badge:** any gym is allowed; listed clubs get a "24 Hour Fitness" badge and sort first in `GymPicker`.

Also decide what happens to players outside SoCal under option A: block them, or fall back to option B.

**Done when:** the chosen behaviour is implemented in `src/app/battle/actions.ts` (`checkInAtGym`, `findNearbyGyms`) and `src/components/battle/GymPicker.tsx`, and is enforced server-side, not just in the UI.

## 2. Comply with Google Maps Platform terms

**Status:** the current code breaks these. Quotes are from the Service Specific Terms (Places section 14) and the general terms (3.2.3), read on 2026-11-06.

- **Coordinates:** "Customer may temporarily cache latitude and longitude values from the Places API for up to 30 consecutive calendar days." `checkInAtGym` stores the gym's Google coordinates in `user_gyms.lat/lng` indefinitely.
- **Names and addresses:** the general terms ban saving "business names, addresses". `GymPicker` prefills the gym name from Google and `user_gyms.name` stores it.
- **Distance checks:** the general terms ban using "latitude/longitude values from the Places API as an input for point-in-polygon analysis". The radius check against Google coordinates (150 m since 20261114000000_gym_radius_150m.sql) (in `checkInAtGym` and on every check-in) is close to that. It's a grey area, not a clear breach.
- **Attribution:** results shown without a Google Map must carry Google's attribution. `GymPicker` shows none. The exact styling rules are at https://developers.google.com/maps/documentation/places/web-service/policies (this environment couldn't reach that page).
- **Place IDs are fine:** the terms allow caching `place_id` indefinitely.

Suggested fix (simplest fully compliant):

- Players save their gym while standing in it.
- The check-in centre is the player's own GPS fix, not Google's coordinates.
- The name is a nickname the player types.
- Verification is either the item 1 allowlist or "the place ID appears in a Google Nearby Search around the player's fix", so Google does the spatial filtering.
- Add a "Google Maps" attribution under the picker list.

If picking a gym from a distance must stay, the alternative is:

- Keep Google's coordinates with a `fetched_at`.
- Refresh them by place ID before they're 30 days old, and have a scheduled job delete them once they're older than 30 days.
- This needs the server-only writes from item 3.

**Done when:** no Google names, addresses or coordinates are stored beyond what the terms allow, attribution is shown, and the README "Gym search" section matches.

## 3. Make gym writes server-only

**Status:** open security gap.

`set_my_gym` is granted to the `authenticated` role, so a signed-in user can call it straight from the browser console with any name, coordinates and place ID. That skips the Places checks in `checkInAtGym`. The fix:

- Revoke `set_my_gym` from `authenticated`.
- Add a variant that takes a user ID and is callable only with the Supabase service-role key.
- Call it from the server action with a service-role client. That needs a new server-only env var, `SUPABASE_SERVICE_ROLE_KEY`, on Vercel and in `.env.example`. Never prefix it with `NEXT_PUBLIC_`.

Consider the same for the check-in RPCs. Faked GPS can't be stopped in a browser anyway, so weigh the cost.

**Done when:** calling `set_my_gym` with the publishable key fails, and the UI flow still works.

## 4. Test on a real phone against the real Supabase project

**Status:** never done. All testing so far:

- SQL on a local Postgres with stubbed `auth` and `storage` schemas.
- The UI in headless Chromium with a mocked location.
- Places calls against the live API.

Steps:

1. Run the three migrations on the Supabase project, in order: `20261107000000_boss_battles.sql`, `20261108000000_gym_places.sql`, `20261109000000_partner_gyms.sql`.
2. Deploy a preview (`GOOGLE_MAPS_API_KEY` is already set on Vercel for Production and Preview).
3. On iOS Safari and Android Chrome: set a gym, check in, keep the screen open for 10+ minutes, lock the phone for about 15 minutes and reopen, check out.
4. Check the wake lock, the location permission prompt, heartbeats after `visibilitychange`, the spin reel, and partner updates on a second account.

**Done when:** each step works or has a filed fix.

## 5. Balance pass

Current maths:

- An average spin does about 3.5% of max HP, so a 1000 HP boss takes about 29 spins.
- That's about 4–5 hours of gym time a week across two partners.

The legendary hit (0.01%, flat 50% of max HP) will almost never happen. The spin reel's filler cards use inflated odds (`FILLER_WEIGHTS` in `SpinReel.tsx`) for show. The real odds are in the drop-rate table.

Revisit after real use:

- Boss HP per partner count (solo players face the same 1000 HP).
- Spin interval.
- Whether unspent gym spins should carry over between weeks. (Log & Grow spins already do: they live in `spin_wallets` and `roll_spin` spends them after this week's gym spins. See `supabase/migrations/20261112000000_unified_spins.sql`.)

## 6. Capacitor (native wrapper) evaluation

Browsers can't geofence or track location in the background, so the web app needs a check every ≤30 minutes and can't notify on arrival. Capacitor plus a geofencing plugin would allow arrival notifications and accurate session timing. Candidate plugins:

- `@capgo/background-geolocation` (MIT, has geofencing)
- Capawesome Geofences (paid)
- `@capacitor-community/background-geolocation` (no geofencing)

Costs:

- The Apple developer fee ($99/yr) and store review.
- An "Always" location permission prompt.
- Google Play's background location approval.
- Replacing Next.js server actions with API routes: a Capacitor build needs `output: 'export'`, and loading the live site with `server.url` risks App Store rejection.

**Done when:** there's a written recommendation with a spike branch.

## 7. Smaller known issues

- **Solo players lose the week's progress when they pair up.** `boss_battles.party_id` is the user ID for solo players and the couple ID once paired, so pairing mid-week starts a new battle. Decide whether to migrate the solo battle (`my_party_id()`, `ensure_current_battle()` in the boss battles migration).
- **The reel doesn't re-centre on resize.** `SpinReel` measures the viewport width but doesn't recompute its offset if the width changes mid-spin.
- **No live partner updates.** Partner hits only appear after a reload or the next action. Consider Supabase Realtime on `boss_attacks`.
- **Rules are duplicated between TS and SQL.** Gym radius, odds and damage bounds are in `rules.ts` and the migrations (`roll_spin` now lives in the unified spins migration). Add a check (for example, a test that reads both) so they can't drift.
- **No automated tests.** The repo has no test runner. The SQL was tested with ad-hoc scripts on a local Postgres with stubbed `auth.uid()` and `storage`. Formalise that, for example with pgTAP or a Node script run in CI, and add unit tests for `rules.ts`.
