import Link from "next/link";
import type { TeamMember } from "@/lib/team/getTeam";
import { Avatar } from "./Avatar";

/** Top-right chip on the hub: your partner, or a prompt to invite one. */
export function PartnerBadge({ partner }: { partner: TeamMember | null }): React.JSX.Element {
  if (!partner) {
    return (
      <Link
        href="/partner"
        className="flex items-center gap-2 rounded-full border border-dashed border-accent/50 bg-card/80 px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent transition hover:border-accent hover:text-accent-glow"
      >
        <span aria-hidden="true" className="text-base leading-none">+</span>
        Invite partner
      </Link>
    );
  }

  return (
    <Link
      href="/partner"
      aria-label={`View ${partner.displayName}'s profile`}
      className="flex items-center gap-3 rounded-full border border-accent/40 bg-card/80 py-1 pl-4 pr-1 transition hover:border-accent"
    >
      <span className="flex flex-col items-end leading-tight">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent/70">Partner</span>
        <span className="max-w-[9rem] truncate text-sm font-semibold text-foreground">
          {partner.displayName}
        </span>
      </span>
      <Avatar name={partner.displayName} url={partner.avatarUrl} size="sm" />
    </Link>
  );
}
