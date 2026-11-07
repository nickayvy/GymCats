"use client";

export interface StepperProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name. */
  label: string;
  /** Also submit the value with a form. */
  name?: string;
  /** Wrap around at the ends. Default false. */
  loop?: boolean;
  disabled?: boolean;
  className?: string;
}

/** ◀ value ▶ option cycler, a compact replacement for a <select>. */
export function Stepper<T extends string>({
  options,
  value,
  onChange,
  label,
  name,
  loop = false,
  disabled,
  className = "",
}: StepperProps<T>): React.JSX.Element {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const canPrev = loop || index > 0;
  const canNext = loop || index < options.length - 1;

  function go(step: number): void {
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
  }

  return (
    <div
      className={`gc-stepper ${className}`}
      role="group"
      aria-label={label}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "ArrowLeft" && canPrev) {
          e.preventDefault();
          go(-1);
        } else if (e.key === "ArrowRight" && canNext) {
          e.preventDefault();
          go(1);
        }
      }}
    >
      <button type="button" aria-label={`Previous ${label}`} disabled={disabled || !canPrev} onClick={() => go(-1)}>
        ◀
      </button>
      <output aria-live="polite">{options[index]?.label}</output>
      <button type="button" aria-label={`Next ${label}`} disabled={disabled || !canNext} onClick={() => go(1)}>
        ▶
      </button>
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
