# Partner pairing

How two GymCats accounts become a team, what we chose, and why one couple's data can't reach anyone else.

## The flow (what's built)

1. **Alice** finishes her profile. On the last onboarding step (or later on `/partner`) she taps **Get my invite link** and gets `https://<site>/invite/K7QX2M`, with Copy and the native Share sheet on phones.
2. **Bob** opens the link. `/invite/[code]` shows the hero page in invite mode: "You've been invited by **Alice**", with the two cats captioned "Alice" + "You".
   - **Signed out:** **Accept & sign up** saves the code in an httpOnly `gc_invite` cookie (7 days) and opens sign-up. While the cookie is pending, the home hero (`/`) shows the same invite, and the login card keeps saying "You're joining Alice's team", including across the sign-up → log-in step and an email-confirmation round trip in the same browser. **Not now** clears it.
   - **Signed in:** **Team up with Alice** joins right away.
3. Logging in with a pending invite joins Alice's team in the `login` action (Bob already said yes on the invite screen), clears the cookie and goes straight to onboarding. If the invite went full or dead in the meantime, the cookie stays and `/` sends Bob to the invite page, which explains what happened.
4. Bob's onboarding starts with a welcome screen ("You're on Alice's team!"), shows a "Joining Alice's team" chip on every step, and ends with **Meet your partner**: Alice's photo, goals and weekly training next to Bob's own photo.
5. Both hubs show the partner in the top-right (photo and name). It links to `/partner`, a read-only view of the partner's profile with a **Leave team** option.

The 6-character code still works as a fallback: "Have a code?" on the partner step and on `/partner`.

## Options considered

| Approach | How it works | Pros | Cons |
|---|---|---|---|
| **Typed short code** (what we had) | Partner types `K7QX2M` | Simple, works in person | Typing friction, easy to drop off |
| **Invite link carrying the code** ✅ chosen | `/invite/CODE`; the code rides a cookie through sign-up | One tap, Sweatmates-style, works with any messenger, reuses the existing `couples` and RPCs | Anyone holding the link can join, until the team is full |
| **Single-use, expiring token link** | A separate `couple_invites` table holding a 128-bit random token (stored hashed), `expires_at` and `used_at` | Can't be guessed, can be revoked, can expire | Needs a new table and cleanup. Worth it once we have strangers at scale |
| **Invite by email or phone** | Look up the partner's account, or send them an email | Feels personal | Reveals whether an email has an account, and needs an email/SMS provider |
| **Mutual request and accept** | A requests B, B confirms (like friend requests) | Both sides explicitly agree | Needs a user directory or search, which is itself a leak |
| **QR code** | Render the invite link as a QR code | Great in person | Only a different way to show the link; easy to add later |

**Recommendation:** use links now. When we open up beyond friends and family, switch the code to single-use expiring tokens and rate-limit `join_couple` and `get_invite_preview`, for example with an attempts table or Vercel Firewall rate limiting on `/invite/*`.

## Why data doesn't leak between accounts

Every rule is enforced in Postgres (RLS and `security definer` functions). The UI can't bypass them.

- **One team per user:** `couple_members.user_id` is `unique`. `join_couple` locks the couple row and refuses a third member (`couple_full`).
- **No direct writes:** `couples` and `couple_members` have only SELECT policies, so joining and leaving go only through `join_couple` and `leave_couple`. A direct insert fails with `42501`.
- **Reads are scoped to your couple:** profiles, couples and memberships are visible only when they belong to `my_couple_id()`. An outsider gets 0 rows. Only your own profile is writable.
- **Avatars:** the private bucket allows read and write in your own folder, plus **read only** in your partner's (`avatars_partner_select`). Photos are served as signed URLs that expire after 1 hour.
- **The invite preview reveals almost nothing:** the public `get_invite_preview` returns the inviter's display name only while the invite is open. Full or unknown codes return just a status.
- **Old links die:** when someone leaves, `leave_couple` gives the remaining partner a new code, so a link shared earlier can't be used to join them. A team left empty is deleted.
- **Guessing:** a code is 6 characters from a 32-symbol alphabet, about 1.07 billion combinations. That's fine for a small user base; see the recommendation above for scale.

Each of these is checked in `e2e/partner-pairing.cjs` (outsider "Carol" tries to read, join and overwrite).

## Not done yet

- Shared boss HP or damage. The hub and battle screen show the team, but the boss still has static HP. A `couple_boss_progress (couple_id, week_start, damage)` table written by an RPC would make "defeat it together" real.
- Showing body stats (height and weight) to the partner. They're readable under RLS, but the partner page leaves them out on purpose.
