import type { ElementType } from "react";

export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** "default" translucent, "strong" nearly opaque, "pill" rounded speech box. */
  variant?: "default" | "strong" | "pill";
}

/** Translucent dark field panel with a thin light border. */
export function Panel({
  as: Tag = "div",
  variant = "default",
  className = "",
  ...rest
}: PanelProps): React.JSX.Element {
  const base = variant === "pill" ? "gc-pill" : variant === "strong" ? "gc-panel gc-panel-strong" : "gc-panel";
  return <Tag className={`${base} ${className}`} {...rest} />;
}

/** Small italic heading inside a panel, with a rule under it. */
export function PanelHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={`mb-3 ${className}`}>
      <h2 className="gc-title text-lg">{children}</h2>
      <span aria-hidden="true" className="mt-1 block h-px w-full bg-gradient-to-r from-white/40 via-white/15 to-transparent" />
    </div>
  );
}
