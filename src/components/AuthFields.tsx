// Shared fields for the log-in and sign-up forms.

/** Labelled gc-input used by the log-in and sign-up forms. */
export function AuthField({
  id,
  label,
  type,
  autoComplete,
  minLength,
  placeholder,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  minLength?: number;
  placeholder?: string;
  /** Controlled value. React resets uncontrolled fields after a form action,
      so the email is kept in state to survive a server error. */
  value?: string;
  onValueChange?: (value: string) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="gc-label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        placeholder={placeholder}
        {...(value !== undefined ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onValueChange?.(e.target.value) } : {})}
        className="gc-input"
      />
    </div>
  );
}

/** Full-width parchment submit button. */
export function AuthSubmit({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}): React.JSX.Element {
  return (
    <button type="submit" disabled={pending} className="gc-btn gc-btn-primary gc-btn-lg mt-2 w-full">
      {pending ? pendingLabel : label}
    </button>
  );
}
