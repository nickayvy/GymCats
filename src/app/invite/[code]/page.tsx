import Link from "next/link";
import type { Metadata } from "next";
import "@/app/styles/entry.css";
import { continueToAuth, dismissInvite } from "@/app/invite/actions";
import { AcceptInviteButton } from "@/components/team/AcceptInviteButton";
import { Avatar } from "@/components/team/Avatar";
import { InviteLinkCard } from "@/components/team/InviteLinkCard";
import { DialogBox, Panel, TitleBanner, PreviewNotice } from "@/components/ui";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { normalizeInviteCode } from "@/lib/team/inviteCode";

export const metadata: Metadata = { title: "Team invite · GymCats" };

const primaryClass = "gc-btn gc-btn-primary gc-btn-lg gc-shine w-full";
const secondaryClass = "gc-btn w-full";
const ghostClass = "gc-btn gc-btn-ghost gc-btn-sm";

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

function DismissLink({ label, primary = false }: { label: string; primary?: boolean }): React.JSX.Element {
  return (
    <form action={dismissInvite} className={primary ? "w-full" : undefined}>
      <button type="submit" className={primary ? secondaryClass : ghostClass}>
        {label}
      </button>
    </form>
  );
}

/** Two party slots: the inviter and an open seat for the visitor. */
function PartyRow({ inviterName }: { inviterName: string }): React.JSX.Element {
  return (
    <div className="flex items-start justify-center gap-4 sm:gap-6">
      <div className="flex flex-col items-center gap-2">
        <Avatar name={inviterName} url={null} size="md" />
        <span className="max-w-[7rem] truncate text-sm italic text-ink">{inviterName}</span>
      </div>
      <span aria-hidden="true" className="mt-5 font-mono text-xl text-white/45">
        +
      </span>
      <div className="flex flex-col items-center gap-2">
        <span className="gc-party-open flex h-16 w-16 items-center justify-center rounded-[4px] text-2xl leading-none">
          <span aria-hidden="true">?</span>
        </span>
        <span className="text-sm italic text-glow">You</span>
      </div>
    </div>
  );
}

/** Message screen for dead ends: a written note plus one way out. */
function NoticeBody({ text, children }: { text: React.ReactNode; children: React.ReactNode }): React.JSX.Element {
  return (
    <>
      <DialogBox variant="written" className="w-full">
        {text}
      </DialogBox>
      {children}
    </>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<React.JSX.Element> {
  const view = await loadView((await params).code);

  const title =
    view.kind === "open"
      ? `${view.inviterName} wants you on their team`
      : view.kind === "own"
        ? "This is your invite link"
        : view.kind === "alreadyPaired"
          ? "You're already on a team"
          : view.kind === "full"
            ? "This team is already full"
            : view.kind === "invalid"
              ? "This invite link doesn't work"
              : "Team invites need Supabase";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-x-hidden px-4 py-10 sm:py-16">
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-6">
        <TitleBanner eyebrow="Team invite" title={title} size={view.kind === "open" ? "md" : "sm"} />

        <Panel
          as="section"
          className="gc-rise flex w-full max-w-md flex-col items-center gap-6 px-5 py-7 text-center sm:px-8"
          style={{ "--d": "180ms" } as React.CSSProperties}
        >
          {view.kind === "open" ? (
            <>
              <PartyRow inviterName={view.inviterName} />
              <DialogBox speaker={view.inviterName} className="mt-2 w-full">
                Partners on GymCats train side by side and take down a{" "}
                <span className="gc-warn">boss</span> together every week.
              </DialogBox>
              {view.signedIn ? (
                <div className="flex w-full flex-col items-center gap-2">
                  <AcceptInviteButton code={view.code} partnerName={view.inviterName} />
                  <DismissLink label="Not now" />
                </div>
              ) : (
                <div className="flex w-full flex-col items-center gap-2">
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
                    <button type="submit" className={ghostClass}>
                      I already have an account
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : null}

          {view.kind === "own" ? (
            <>
              <p className="gc-eyebrow">Send it to your partner so they can join your team.</p>
              <InviteLinkCard code={view.code} />
              <Link href="/" className={ghostClass}>
                Back
              </Link>
            </>
          ) : null}

          {view.kind === "alreadyPaired" ? (
            <NoticeBody
              text={<>Leave your current team from your partner&apos;s profile before joining another one.</>}
            >
              <DismissLink label="Back to GymCats" primary />
            </NoticeBody>
          ) : null}

          {view.kind === "full" || view.kind === "invalid" ? (
            <NoticeBody text="Ask your partner to send you a fresh link from GymCats.">
              <DismissLink label="Go to GymCats" primary />
            </NoticeBody>
          ) : null}

          {view.kind === "preview" ? (
            <>
              <PartyRow inviterName="Your partner" />
              <PreviewNotice detail="so invites can't be used." />
              <Link href="/" className={ghostClass}>
                Back home
              </Link>
            </>
          ) : null}
        </Panel>
      </div>
    </main>
  );
}
