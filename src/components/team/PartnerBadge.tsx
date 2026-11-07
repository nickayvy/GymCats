import Link from "next/link";
import type { TeamMember } from "@/lib/team/getTeam";
import { Avatar } from "./Avatar";

/** Top-right chip on the hub: your partner, or a prompt to invite one. */
export function PartnerBadge({ partner }: { partner: TeamMember | null }): React.JSX.Element {
  if (!partner) {
    return (
      <Link
        href="/partner"
        className="rpg-btn rpg-btn-blue px-3 py-1.5 text-sm text-accent-glow"
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
      className="rpg-btn rpg-btn-blue gap-3 py-1 pl-3 pr-1"
    >
      <span className="flex flex-col items-end leading-tight">
        <span className="rpg-label text-[10px]">Partner</span>
        <span className="max-w-[9rem] truncate text-sm font-semibold text-foreground">
          {partner.displayName}
        </span>
      </span>
      <Avatar name={partner.displayName} url={partner.avatarUrl} size="sm" />
    </Link>
  );
}
