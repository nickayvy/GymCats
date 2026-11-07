"use client";

import { useRouter } from "next/navigation";
import { InvitePanel } from "./InvitePanel";

export function PartnerInvite({ inviteCode }: { inviteCode: string | null }): React.JSX.Element {
  const router = useRouter();
  return <InvitePanel initialInviteCode={inviteCode} onJoined={() => router.refresh()} />;
}
