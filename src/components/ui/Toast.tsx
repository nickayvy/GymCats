"use client";

import { useEffect, useState } from "react";

export interface ToastProps {
  /** Icon or sprite on the left. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  message?: React.ReactNode;
  /** Hide after this many ms. Omit to keep it until unmounted. */
  durationMs?: number;
  onDone?: () => void;
  /** "corner" pins it to the bottom-right of the screen; "inline" flows with content. */
  placement?: "corner" | "inline";
  className?: string;
}

/** Item-get style notification that slides in from the right. */
export function Toast({
  icon,
  title,
  message,
  durationMs,
  onDone,
  placement = "inline",
  className = "",
}: ToastProps): React.JSX.Element | null {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!durationMs) return;
    const leave = window.setTimeout(() => setLeaving(true), durationMs);
    const done = window.setTimeout(() => {
      setGone(true);
      onDone?.();
    }, durationMs + 320);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, [durationMs, onDone]);

  if (gone) return null;

  return (
    <div
      role="status"
      data-leaving={leaving || undefined}
      className={`gc-toast gc-panel gc-panel-strong flex items-center gap-3 rounded-sm px-4 py-3 ${
        placement === "corner" ? "fixed bottom-6 right-4 z-40 max-w-[calc(100vw-2rem)] sm:right-6" : ""
      } ${className}`}
    >
      {icon && <span className="flex shrink-0 items-center justify-center">{icon}</span>}
      <span className="min-w-0">
        <span className="block font-semibold italic text-ink">{title}</span>
        {message && <span className="block text-sm italic text-white/65">{message}</span>}
      </span>
    </div>
  );
}
