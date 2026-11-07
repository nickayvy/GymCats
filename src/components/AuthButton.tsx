import Link from "next/link";
import { logout } from "@/app/login/actions";

export interface AuthButtonProps {
  email: string | null;
}

const buttonClass = "gc-btn gc-btn-sm bg-black/55 backdrop-blur-md";

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
      <span className="gc-eyebrow hidden max-w-[14rem] truncate sm:inline">{email}</span>
      <button type="submit" className={buttonClass}>
        Log out
      </button>
    </form>
  );
}
