import Link from "next/link";
import type { TeamMember } from "@/lib/team/getTeam";
import { Avatar } from "./Avatar";

const chip =
  "flex items-center rounded border bg-black/60 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md transition";

/** Top-right HUD chip on the hub: your partner, or a prompt to invite one. */
export function PartnerBadge({ partner }: { partner: TeamMember | null }): React.JSX.Element {
  if (!partner) {
    return (
      <Link
        href="/partner"
        className={`${chip} gap-2 border-dashed border-glow/60 px-4 py-2 text-sm font-semibold italic text-[#e9fffd] hover:border-glow hover:shadow-[0_0_18px_rgba(116,230,226,0.35)]`}
      >
        <span
          aria-hidden="true"
          className="flex h-5 w-5 items-center justify-center rounded-sm bg-glow text-sm font-bold not-italic leading-none text-black"
        >
          +
        </span>
        Invite partner
      </Link>
    );
  }

  return (
    <Link
      href="/partner"
      aria-label={`View ${partner.displayName}'s profile`}
      className={`${chip} gap-3 border-white/20 py-1 pl-4 pr-1 hover:border-white/60 hover:shadow-[0_0_18px_rgba(255,236,170,0.25)]`}
    >
      <span className="flex flex-col items-end leading-tight">
        <span className="gc-caps">Partner</span>
        <span className="max-w-[9rem] truncate text-sm font-semibold italic text-ink">
          {partner.displayName}
        </span>
      </span>
      <Avatar name={partner.displayName} url={partner.avatarUrl} size="sm" />
    </Link>
  );
}
