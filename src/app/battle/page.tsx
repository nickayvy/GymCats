import { BattleScreen } from "@/components/battle/BattleScreen";
import { getCurrentBoss } from "@/lib/boss/currentBoss";
import { requireOnboardedUser } from "@/lib/auth/requireOnboardedUser";
import { createClient } from "@/lib/supabase/server";
import { getTeam } from "@/lib/team/getTeam";

export const metadata = { title: "Battle · GymCats" };

export default async function BattlePage(): Promise<React.JSX.Element> {
  const { preview, userId } = await requireOnboardedUser();
  const team = !preview && userId ? await getTeam(await createClient(), userId) : null;
  return <BattleScreen boss={getCurrentBoss()} partnerName={team?.partner?.displayName ?? null} />;
}
