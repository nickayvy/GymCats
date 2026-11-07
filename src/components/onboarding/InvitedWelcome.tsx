import { Avatar } from "@/components/team/Avatar";
import type { TeamMember } from "@/lib/team/getTeam";
import { primaryButtonClass } from "./styles";

/** First screen for someone who joined through a partner's invite link. */
export function InvitedWelcome({
  partner,
  onStart,
}: {
  partner: TeamMember;
  onStart: () => void;
}): React.JSX.Element {
  return (
    <div className="title-card relative z-10 flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl px-6 py-10 text-center motion-safe:[animation:battle-enter-up_400ms_ease-out_both] sm:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent/80">Invite accepted</p>

      <div className="flex items-center gap-4">
        <Avatar name={partner.displayName} url={partner.avatarUrl} size="lg" />
        <span aria-hidden="true" className="font-mono text-2xl text-accent/70">
          +
        </span>
        <span
          aria-hidden="true"
          className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-accent/50 font-mono text-xs uppercase tracking-widest text-accent/80"
        >
          You
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">
        You&apos;re on <span className="text-accent-glow">{partner.displayName}</span>&apos;s team!
      </h1>
      <p className="max-w-sm text-sm text-foreground/70">
        Set up your profile so {partner.displayName} can see who&apos;s spotting them. It takes about
        a minute, then you&apos;ll take on this week&apos;s boss together.
      </p>

      <button type="button" onClick={onStart} className={`${primaryButtonClass} px-8 py-3 text-base`}>
        Set up my profile
      </button>
    </div>
  );
}
