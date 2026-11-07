/** Cookie that carries a partner's invite code through sign-up and login. */
export const INVITE_COOKIE = "gc_invite";
export const INVITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const INVITE_CODE_PATTERN = /^[A-Z0-9]{6}$/;

/** Normalizes a user-supplied invite code; returns null if it can't be one. */
export function normalizeInviteCode(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  return INVITE_CODE_PATTERN.test(code) ? code : null;
}

export function invitePath(code: string): string {
  return `/invite/${code}`;
}
