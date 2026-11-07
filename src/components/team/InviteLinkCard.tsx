"use client";

import { useEffect, useState } from "react";
import "@/app/styles/entry.css";
import { invitePath } from "@/lib/team/inviteCode";

/**
 * A written note holding the partner invite link (and its code), with copy
 * and share buttons.
 */
export function InviteLinkCard({ code }: { code: string }): React.JSX.Element {
  const [link, setLink] = useState(invitePath(code));
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // The origin is only known in the browser (localhost, previews, prod).
  useEffect(() => {
    setLink(`${window.location.origin}${invitePath(code)}`);
    setCanShare(typeof navigator.share === "function");
  }, [code]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Clipboard unavailable; the link is still selectable by hand.
    }
  }

  async function handleShare(): Promise<void> {
    try {
      await navigator.share({
        title: "Join my GymCats team",
        text: "Team up with me on GymCats and let's beat this week's boss together.",
        url: link,
      });
    } catch {
      // Share sheet dismissed.
    }
  }

  return (
    <div className="gc-panel gc-panel-strong flex w-full flex-col items-center gap-4 px-4 py-5 text-center sm:px-6">
      <p className="gc-caps">Invite link</p>
      <p
        data-testid="invite-link"
        className="w-full select-all break-all rounded-[3px] border border-white/10 bg-black/50 px-3 py-2.5 font-mono text-sm text-[#e9fffd] shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]"
      >
        {link}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={handleCopy} className="gc-btn gc-btn-glow gc-btn-sm min-w-[8.5rem]" aria-live="polite">
          {copied ? "Copied!" : "Copy link"}
        </button>
        {canShare ? (
          <button type="button" onClick={handleShare} className="gc-btn gc-btn-sm min-w-[6rem]">
            Share…
          </button>
        ) : null}
      </div>
      <div className="gc-divider w-full text-xs">
        <span className="gc-eyebrow">or share code</span>
      </div>
      <p className="flex items-center gap-1.5">
        <span className="sr-only">{code}</span>
        {code.split("").map((ch, i) => (
          <span key={i} aria-hidden="true" className="gc-code-tile">
            {ch}
          </span>
        ))}
      </p>
    </div>
  );
}
