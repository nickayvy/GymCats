import { BattleScreen } from "@/components/battle/BattleScreen";
import { getCurrentBoss } from "@/lib/boss/currentBoss";
import { requireOnboardedUser } from "@/lib/auth/requireOnboardedUser";

export const metadata = { title: "Battle · GymCats" };

export default async function BattlePage(): Promise<React.JSX.Element> {
  await requireOnboardedUser();
  return <BattleScreen boss={getCurrentBoss()} />;
}
