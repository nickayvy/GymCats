"use client";

import { useRef } from "react";

export interface ToggleOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export interface ToggleProps<T extends string> {
  options: readonly ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group. */
  label: string;
  /** Also submit the value with a form. */
  name?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Segmented switch (ON | OFF, lb | kg, ...). A radio group: arrow keys move
 * between options.
 */
export function Toggle<T extends string>({
  options,
  value,
  onChange,
  label,
  name,
  disabled,
  className = "",
}: ToggleProps<T>): React.JSX.Element {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number): void {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={label} className={`gc-toggle ${className}`}>
      {options.map((opt, i) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {opt.label}
          </button>
        );
      })}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
