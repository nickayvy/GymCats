import { BattleScreen } from "@/components/battle/BattleScreen";
import { requireOnboardedUser } from "@/lib/auth/requireOnboardedUser";
import { loadBattleState } from "@/lib/battle/server";
import { previewBattleState } from "@/lib/battle/state";
import { createClient } from "@/lib/supabase/server";
import "@/app/styles/battle.css";

export const metadata = { title: "Battle · GymCats" };

export default async function BattlePage(): Promise<React.JSX.Element> {
  const { preview } = await requireOnboardedUser();
  if (preview) {
    return <BattleScreen initialState={previewBattleState()} preview />;
  }

  const result = await loadBattleState(await createClient());
  if (!result.ok) {
    throw new Error(`Failed to load the battle: ${result.error}`);
  }
  return <BattleScreen initialState={result.data} preview={false} />;
}
