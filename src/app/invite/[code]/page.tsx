import Link from "next/link";
import type { Metadata } from "next";
import { continueToAuth, dismissInvite } from "@/app/invite/actions";
import { AcceptInviteButton } from "@/components/team/AcceptInviteButton";
import { InviteLinkCard } from "@/components/team/InviteLinkCard";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { normalizeInviteCode } from "@/lib/team/inviteCode";

export const metadata: Metadata = { title: "Team invite · GymCats" };

const primaryClass =
  "w-full rounded-2xl bg-gradient-to-b from-accent-glow to-accent px-8 py-4 text-lg font-bold uppercase tracking-[0.2em] text-background shadow-[0_0_40px_rgba(201,168,108,0.35)] transition hover:scale-105 active:scale-95 motion-reduce:transition-none";
const linkClass = "font-mono text-xs text-foreground/60 underline-offset-4 hover:text-accent hover:underline";

type View =
  | { kind: "preview" }
  | { kind: "invalid" }
  | { kind: "full" }
  | { kind: "own"; code: string }
  | { kind: "alreadyPaired" }
  | { kind: "open"; code: string; inviterName: string; signedIn: boolean };

async function loadView(rawCode: string): Promise<View> {
  if (!getSupabaseConfig()) return { kind: "preview" };

  const code = normalizeInviteCode(rawCode);
  if (!code) return { kind: "invalid" };

  const supabase = await createClient();
  const [{ data: userData }, { data: preview, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("get_invite_preview", { p_code: code }),
  ]);
  if (error) throw new Error(`Failed to load invite: ${error.message}`);

  const row = preview?.[0];
  const signedIn = Boolean(userData.user);

  if (!row || row.status === "invalid") return { kind: "invalid" };
  if (row.status === "own") return { kind: "own", code };
  if (row.status === "full") return { kind: "full" };

  if (signedIn) {
    const { data: coupleId } = await supabase.rpc("my_couple_id");
    if (coupleId) return { kind: "alreadyPaired" };
  }

  return {
    kind: "open",
    code,
    inviterName: row.inviter_name ?? "Your partner",
    signedIn,
  };
}

function DismissLink({ label }: { label: string }): React.JSX.Element {
  return (
    <form action={dismissInvite}>
      <button type="submit" className={linkClass}>
        {label}
      </button>
    </form>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<React.JSX.Element> {
  const view = await loadView((await params).code);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <section className="title-card relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl px-8 py-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent/80">Team invite</p>

        {view.kind === "open" ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight">
              {view.inviterName} wants you on their team
            </h1>
            <p className="text-sm text-foreground/70">
              Partners on GymCats train side by side and take down a boss together every week.
            </p>
            {view.signedIn ? (
              <>
                <AcceptInviteButton code={view.code} partnerName={view.inviterName} />
                <DismissLink label="Not now" />
              </>
            ) : (
              <>
                <form action={continueToAuth} className="w-full">
                  <input type="hidden" name="code" value={view.code} />
                  <input type="hidden" name="mode" value="signup" />
                  <button type="submit" className={primaryClass}>
                    Sign up to join
                  </button>
                </form>
                <form action={continueToAuth}>
                  <input type="hidden" name="code" value={view.code} />
                  <input type="hidden" name="mode" value="login" />
                  <button type="submit" className={linkClass}>
                    I already have an account
                  </button>
                </form>
              </>
            )}
          </>
        ) : null}

        {view.kind === "own" ? (
          <>
            <h1 className="text-2xl font-bold">This is your invite link</h1>
            <p className="text-sm text-foreground/70">Send it to your partner so they can join your team.</p>
            <InviteLinkCard code={view.code} />
            <Link href="/" className={linkClass}>
              Back
            </Link>
          </>
        ) : null}

        {view.kind === "alreadyPaired" ? (
          <>
            <h1 className="text-2xl font-bold">You&apos;re already on a team</h1>
            <p className="text-sm text-foreground/70">
              Leave your current team from your partner&apos;s profile before joining another one.
            </p>
            <DismissLink label="Back to GymCats" />
          </>
        ) : null}

        {view.kind === "full" || view.kind === "invalid" ? (
          <>
            <h1 className="text-2xl font-bold">
              {view.kind === "full" ? "This team is already full" : "This invite link doesn't work"}
            </h1>
            <p className="text-sm text-foreground/70">
              Ask your partner to send you a fresh link from GymCats.
            </p>
            <DismissLink label="Go to GymCats" />
          </>
        ) : null}

        {view.kind === "preview" ? (
          <>
            <h1 className="text-2xl font-bold">Team invites need Supabase</h1>
            <p className="text-sm text-foreground/70">Preview mode: Supabase isn&apos;t configured.</p>
            <Link href="/" className={linkClass}>
              Back home
            </Link>
          </>
        ) : null}
      </section>
    </main>
  );
}
