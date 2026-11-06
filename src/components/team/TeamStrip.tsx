import Link from "next/link";
import type { TeamMember } from "@/lib/team/getTeam";
import { Avatar } from "./Avatar";

/** "You + partner vs the boss" row shown under the boss on the hub. */
export function TeamStrip({
  me,
  partner,
}: {
  me: TeamMember | null;
  partner: TeamMember | null;
}): React.JSX.Element {
  const myName = me?.displayName ?? "You";

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-accent/70">Your team</p>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <Avatar name={myName} url={me?.avatarUrl ?? null} size="sm" />
          <span className="text-xs text-foreground/70">You</span>
        </div>
        <span aria-hidden="true" className="font-mono text-accent/60">+</span>
        {partner ? (
          <Link href="/partner" className="flex flex-col items-center gap-1">
            <Avatar name={partner.displayName} url={partner.avatarUrl} size="sm" />
            <span className="max-w-[6rem] truncate text-xs text-foreground/70">{partner.displayName}</span>
          </Link>
        ) : (
          <Link href="/partner" className="flex flex-col items-center gap-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-accent/40 text-accent/70">
              ?
            </span>
            <span className="text-xs text-accent hover:text-accent-glow">Invite</span>
          </Link>
        )}
      </div>
    </div>
  );
}
