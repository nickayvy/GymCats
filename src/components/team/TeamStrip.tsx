import Link from "next/link";
import "@/app/styles/entry.css";
import type { TeamMember } from "@/lib/team/getTeam";
import { Avatar } from "./Avatar";

/** "You + partner vs the boss" party row shown under the boss on the hub. */
export function TeamStrip({
  me,
  partner,
}: {
  me: TeamMember | null;
  partner: TeamMember | null;
}): React.JSX.Element {
  const myName = me?.displayName ?? "You";
  const nameClass = "max-w-[6rem] truncate text-xs italic text-white/75";

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="gc-caps">Your party</p>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <Avatar name={myName} url={me?.avatarUrl ?? null} size="sm" />
          <span className={nameClass}>You</span>
        </div>
        <span aria-hidden="true" className="mt-3 font-mono text-sm text-white/45">
          +
        </span>
        {partner ? (
          <Link
            href="/partner"
            className="group flex flex-col items-center gap-1 rounded-[4px] transition-transform hover:-translate-y-0.5"
          >
            <Avatar name={partner.displayName} url={partner.avatarUrl} size="sm" />
            <span className={`${nameClass} group-hover:text-glow`}>{partner.displayName}</span>
          </Link>
        ) : (
          <Link href="/partner" className="group flex flex-col items-center gap-1 rounded-[4px]">
            <span className="gc-party-open flex h-10 w-10 items-center justify-center rounded-[4px] text-lg leading-none">
              <span aria-hidden="true">+</span>
            </span>
            <span className="text-xs italic text-glow group-hover:underline">Invite</span>
          </Link>
        )}
      </div>
    </div>
  );
}
