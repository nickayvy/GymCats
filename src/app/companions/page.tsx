import { CompanionInventory } from "@/components/companions/CompanionInventory";
import { HubTabs } from "@/components/hub/HubTabs";
import { requireOnboardedUser } from "@/lib/auth/requireOnboardedUser";
import { COMPANIONS, INVENTORY_SLOTS } from "@/lib/companions/roster";

export const metadata = { title: "Companions · GymCats" };

export default async function CompanionsPage(): Promise<React.JSX.Element> {
  await requireOnboardedUser();

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-10 sm:px-6">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="rpg-title text-3xl font-bold sm:text-4xl">Companions</h1>
          <p className="text-sm text-foreground/70">Your collection of gym spotters.</p>
        </header>
        <CompanionInventory companions={COMPANIONS} slots={INVENTORY_SLOTS} />
      </div>
      <HubTabs active="companions" />
    </main>
  );
}
