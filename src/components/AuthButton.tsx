import Link from "next/link";
import { logout } from "@/app/login/actions";

export interface AuthButtonProps {
  email: string | null;
}

const buttonClass =
  "rounded-lg border border-accent/40 bg-card/80 px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent transition hover:border-accent hover:text-accent-glow";

export function AuthButton({ email }: AuthButtonProps): React.JSX.Element {
  if (email === null) {
    return (
      <Link href="/login" className={buttonClass}>
        Log in
      </Link>
    );
  }

  return (
    <form action={logout} className="flex items-center gap-3">
      <span className="hidden font-mono text-xs text-foreground/60 sm:inline">
        {email}
      </span>
      <button type="submit" className={buttonClass}>
        Log out
      </button>
    </form>
  );
}
