export interface ItemSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Number badge in the bottom-right corner. */
  count?: number | string;
  selected?: boolean;
  equipped?: boolean;
  /** Small marker in the top-left corner (e.g. a bonus icon). */
  badge?: React.ReactNode;
  size?: number;
}

/** Square inventory slot. Empty when it has no children. */
export function ItemSlot({
  children,
  count,
  selected,
  equipped,
  badge,
  size = 72,
  className = "",
  style,
  ...rest
}: ItemSlotProps): React.JSX.Element {
  const empty = children == null;
  return (
    <div
      className={`gc-slot ${className}`}
      data-empty={empty || undefined}
      data-selected={selected || undefined}
      data-equipped={equipped || undefined}
      style={{ width: size, ...style }}
      {...rest}
    >
      {badge && <span className="absolute left-1 top-1">{badge}</span>}
      {children}
      {count !== undefined && <span className="gc-slot-count gc-num">{count}</span>}
    </div>
  );
}
