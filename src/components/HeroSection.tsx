import Image from "next/image";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { continueToAuth, dismissInvite } from "@/app/invite/actions";
import { AuthButton } from "@/components/AuthButton";
import { AcceptInviteButton } from "@/components/team/AcceptInviteButton";

/** A partner's invite the visitor can accept from the hero. */
export interface HeroInvite {
  code: string;
  inviterName: string;
  /** Signed in already: accept right here instead of going through sign-up. */
  signedIn: boolean;
}

export interface HeroSectionProps {
  session: Session | null;
  invite?: HeroInvite | null;
}

const primaryClass =
  "rounded-2xl bg-gradient-to-b from-accent-glow to-accent px-10 py-4 text-lg font-bold uppercase tracking-[0.25em] text-background shadow-[0_0_40px_rgba(201,168,108,0.35)] transition hover:scale-105 hover:shadow-[0_0_60px_rgba(201,168,108,0.5)] active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100";
const linkClass =
  "font-mono text-xs text-foreground/60 underline-offset-4 hover:text-accent hover:underline";

function HeroCat({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string | null;
}): React.JSX.Element {
  // Paired up under an invite, the two cats sit side by side even on phones.
  const sizeClass = caption ? "h-auto w-32 sm:w-[280px]" : "";
  return (
    <figure className="relative flex flex-col items-center gap-3">
      <div className="relative">
        <div className="absolute -inset-4 rounded-3xl bg-accent/10 blur-2xl" />
        <Image
          src={src}
          alt={alt}
          width={280}
          height={280}
          priority
          className={`pixel-art relative rounded-xl drop-shadow-2xl ${sizeClass}`}
        />
      </div>
      {caption ? (
        <figcaption className="relative max-w-32 truncate sm:max-w-[16rem] rounded-full border border-accent/40 bg-card/80 px-4 py-1 font-mono text-xs uppercase tracking-[0.25em] text-accent-glow">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function InviteActions({ invite }: { invite: HeroInvite }): React.JSX.Element {
  if (invite.signedIn) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        <AcceptInviteButton code={invite.code} partnerName={invite.inviterName} />
        <form action={dismissInvite}>
          <button type="submit" className={linkClass}>
            Not now
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <form action={continueToAuth}>
        <input type="hidden" name="code" value={invite.code} />
        <input type="hidden" name="mode" value="signup" />
        <button type="submit" className={primaryClass}>
          Accept &amp; sign up
        </button>
      </form>
      <form action={continueToAuth}>
        <input type="hidden" name="code" value={invite.code} />
        <input type="hidden" name="mode" value="login" />
        <button type="submit" className={linkClass}>
          I already have an account
        </button>
      </form>
      <form action={dismissInvite}>
        <button type="submit" className="font-mono text-[11px] text-foreground/40 hover:text-accent">
          Not now
        </button>
      </form>
    </div>
  );
}

export function HeroSection({ session, invite = null }: HeroSectionProps): React.JSX.Element {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      {invite ? null : (
        <div className="absolute right-6 top-6 z-20">
          <AuthButton email={session?.user.email ?? null} />
        </div>
      )}

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 text-center">
        {invite ? (
          <div className="title-card w-full max-w-2xl rounded-2xl px-8 py-10 motion-safe:[animation:battle-enter-down_500ms_ease-out_both] sm:px-12 sm:py-14">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-accent/80 sm:text-sm">
              You&apos;ve been invited by
            </p>
            <h1 className="break-words bg-gradient-to-b from-accent-glow to-accent bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
              {invite.inviterName}
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base text-foreground/70 sm:text-lg">
              Join their team on <strong className="text-foreground">GymCats</strong>. Train side
              by side, earn spins at the gym and take down a boss together every week.
            </p>
          </div>
        ) : (
          <div className="title-card w-full max-w-2xl rounded-2xl px-8 py-10 sm:px-12 sm:py-14">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-accent/80 sm:text-sm">
              Welcome to
            </p>
            <h1 className="bg-gradient-to-b from-accent-glow to-accent bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
              GymCats
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base text-foreground/70 sm:text-lg">
              Train hard. Nap harder. Your pixel-art spotters are ready.
            </p>
          </div>
        )}

        {invite ? (
          <InviteActions invite={invite} />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Link href="/login?mode=signup" className={primaryClass}>
              Get started
            </Link>
            <Link href="/login" className={linkClass}>
              I already have an account
            </Link>
          </div>
        )}

        <div
          className={`relative flex items-center sm:flex-row sm:gap-10 ${invite ? "flex-row gap-4" : "flex-col gap-8"}`}
        >
          <HeroCat
            src="/gymcats-hero-cat.png"
            alt="Pixel art British Shorthair Siamese cat"
            caption={invite ? invite.inviterName : null}
          />
          {invite ? (
            <span aria-hidden="true" className="font-mono text-3xl text-accent/70">
              +
            </span>
          ) : null}
          <HeroCat
            src="/gymcats-hero-tuxedo-cat.png"
            alt="Pixel art tuxedo cat"
            caption={invite ? "You" : null}
          />
        </div>

        {session && !invite && (
          <p className="font-mono text-xs text-foreground/40">Supabase connected</p>
        )}
      </div>
    </main>
  );
}
