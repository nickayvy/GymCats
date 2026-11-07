/**
 * The one "preview mode" notice, shown when Supabase isn't configured.
 * `detail` says what that means on this screen.
 */
export function PreviewNotice({
  detail,
  className = "",
}: {
  detail?: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <p
      className={`gc-fade flex w-fit max-w-full items-center gap-2 rounded-[4px] border border-gold/40 bg-black/60 px-3 py-1.5 text-xs italic text-gold backdrop-blur-sm ${className}`}
    >
      <span aria-hidden="true" className="not-italic">
        ◆
      </span>
      <span>
        Preview mode: Supabase isn&apos;t configured{detail ? <>, {detail}</> : "."}
      </span>
    </p>
  );
}
