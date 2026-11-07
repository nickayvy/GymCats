import Link from "next/link";

const TABS = [
  { id: "hub", href: "/hub", label: "Hub" },
  { id: "companions", href: "/companions", label: "Companions" },
] as const;

export type HubTabId = (typeof TABS)[number]["id"];

/** Bottom tab bar shared by the hub and the companions screen. */
export function HubTabs({ active }: { active: HubTabId }): React.JSX.Element {
  return (
    <nav
      aria-label="Hub sections"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4"
    >
      <div className="rpg-window pointer-events-auto flex w-full max-w-sm gap-3 p-2">
        {TABS.map((tab) => {
          const current = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={current ? "page" : undefined}
              className={`rpg-btn flex-1 px-3 py-2 font-mono text-sm uppercase tracking-[0.12em] ${
                current ? "rpg-btn-gold" : "rpg-btn-blue"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
