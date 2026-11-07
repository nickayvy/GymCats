"use client";

import { useEffect, useState } from "react";
import { invitePath } from "@/lib/team/inviteCode";

const buttonClass =
  "rounded-lg border border-accent/40 px-4 py-2 font-semibold text-accent transition hover:border-accent disabled:opacity-50";

/** Shows a partner invite link (and its code) with copy and share buttons. */
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
    <div className="flex w-full flex-col items-center gap-3">
      <p
        data-testid="invite-link"
        className="rpg-input select-all break-all px-3 py-2 text-center font-mono text-sm text-foreground/80"
      >
        {link}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={handleCopy} className={buttonClass}>
          {copied ? "Copied!" : "Copy link"}
        </button>
        {canShare ? (
          <button type="button" onClick={handleShare} className={buttonClass}>
            Share…
          </button>
        ) : null}
      </div>
      <p className="font-mono text-xs text-foreground/50">
        or share code <span className="tracking-[0.15em] text-accent-glow">{code}</span>
      </p>
    </div>
  );
}
