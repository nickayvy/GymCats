import Link from "next/link";
import { logout } from "@/app/login/actions";

export interface AuthButtonProps {
  email: string | null;
}

const buttonClass =
  "rpg-btn rpg-btn-blue px-4 py-2 text-sm text-accent-glow";

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
