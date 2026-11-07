import { Panel } from "./Panel";

export interface DialogBoxProps {
  children: React.ReactNode;
  /** Speaker name shown on the top-left edge. */
  speaker?: React.ReactNode;
  /** "spoken" is a rounded pill; "written" is a rectangle (signs, letters, notes). */
  variant?: "spoken" | "written";
  /** Bouncing ▽ under the box. */
  showContinue?: boolean;
  className?: string;
}

/**
 * In-game dialog box. Wrap keywords in <span className="gc-key"> (cyan),
 * "gc-warn" (ember) or "gc-gold" to highlight them.
 */
export function DialogBox({
  children,
  speaker,
  variant = "spoken",
  showContinue = false,
  className = "",
}: DialogBoxProps): React.JSX.Element {
  return (
    <div className={`relative ${className}`}>
      {speaker && <p className="gc-label absolute -top-5 left-8 z-10 text-white/85">{speaker}</p>}
      <Panel variant={variant === "spoken" ? "pill" : "strong"} className={`text-center italic leading-relaxed text-ink ${variant === "written" ? "px-8 py-4" : ""}`}>
        {children}
      </Panel>
      {showContinue && (
        <svg viewBox="0 0 16 12" aria-hidden="true" className="gc-continue mx-auto -mt-1.5 block h-3 w-4 text-white/85">
          <path d="M1 1 H15 L8 11 Z" fill="rgba(0,0,0,0.6)" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )}
    </div>
  );
}
