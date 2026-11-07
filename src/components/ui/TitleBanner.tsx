import { Ornament } from "./Ornament";

export interface TitleBannerProps {
  title: React.ReactNode;
  /** Small italic line above the title. */
  eyebrow?: React.ReactNode;
  /** Small italic line under the title. */
  subtitle?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Heading element. Defaults to h1. */
  as?: "h1" | "h2" | "h3";
  /** Play the reveal animation on mount. Default true. */
  animate?: boolean;
  className?: string;
}

const SIZES = {
  sm: "text-xl sm:text-2xl",
  md: "text-3xl sm:text-4xl",
  lg: "text-4xl sm:text-5xl",
  xl: "text-5xl sm:text-7xl",
} as const;

/**
 * Area-title card: an italic eyebrow, a Cinzel title whose letters close in,
 * and ornament rules that grow out from the centre.
 */
export function TitleBanner({
  title,
  eyebrow,
  subtitle,
  size = "md",
  as: Heading = "h1",
  animate = true,
  className = "",
}: TitleBannerProps): React.JSX.Element {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {eyebrow && <p className={`gc-eyebrow ${animate ? "gc-fade" : ""}`}>{eyebrow}</p>}
      <div className="flex w-full items-center justify-center gap-3">
        <span aria-hidden="true" className="hidden min-w-6 max-w-24 flex-1 sm:block">
          <Ornament side="left" className={`block w-full ${animate ? "gc-line-grow-left" : ""}`} />
        </span>
        <Heading className={`gc-title ${SIZES[size]} ${animate ? "gc-title-in" : ""}`}>{title}</Heading>
        <span aria-hidden="true" className="hidden min-w-6 max-w-24 flex-1 sm:block">
          <Ornament side="right" className={`block w-full ${animate ? "gc-line-grow-right" : ""}`} />
        </span>
      </div>
      {subtitle && (
        <p className={`gc-eyebrow mt-1 ${animate ? "gc-fade" : ""}`} style={{ "--d": "500ms" } as React.CSSProperties}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
