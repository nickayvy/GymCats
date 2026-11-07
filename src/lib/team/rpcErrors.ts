/** Maps pairing RPC exceptions (raised in SQL) to user-facing messages. */
export function mapPairingError(message: string): string {
  if (message.includes("not_authenticated")) {
    return "Your session expired. Please log in again.";
  }
  if (message.includes("invalid_code")) {
    return "That invite code doesn't exist.";
  }
  if (message.includes("own_code")) {
    return "That's your own invite code — send it to your partner.";
  }
  if (message.includes("already_paired")) {
    return "You're already paired with a partner.";
  }
  if (message.includes("couple_full")) {
    return "That couple already has two members.";
  }
  return "Something went wrong. Please try again.";
}
