"use client";

export interface RangeSliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max"> {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
}

/** Styled range input with a glowing filled track and a diamond thumb. */
export function RangeSlider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  className = "",
  style,
  ...rest
}: RangeSliderProps): React.JSX.Element {
  const clamped = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  const fill = max > min ? ((clamped - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={clamped}
      onChange={(e) => onValueChange(Number(e.target.value))}
      className={`gc-range ${className}`}
      style={{ "--fill": `${fill}%`, ...style } as React.CSSProperties}
      {...rest}
    />
  );
}
