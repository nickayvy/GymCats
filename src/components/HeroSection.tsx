import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import "@/app/styles/entry.css";
import { AuthButton } from "@/components/AuthButton";
import { CAT_SPRITES, PixelSprite, type SpriteSheet } from "@/components/sprites";
import { TitleBanner } from "@/components/ui";

export interface HeroSectionProps {
  session: Session | null;
}

function rise(ms: number): React.CSSProperties {
  return { "--d": `${ms}ms` } as React.CSSProperties;
}

/** One player cat: floating sprite, soft ground shadow, player tag. */
function PlayerCat({
  sheet,
  label,
  player,
  flip = false,
  delay,
}: {
  sheet: SpriteSheet;
  label: string;
  player: string;
  flip?: boolean;
  delay: string;
}): React.JSX.Element {
  return (
    <figure className="flex flex-col items-center">
      <div className="gc-float" style={{ animationDelay: delay }}>
        <PixelSprite sheet={sheet} scale={5} label={label} animate flip={flip} className="block! sm:hidden!" />
        <PixelSprite sheet={sheet} scale={6} label={label} animate flip={flip} className="hidden! sm:block!" />
      </div>
      <div className="gc-sprite-shadow -mt-2 w-24 sm:w-28" style={{ animationDelay: delay }} />
      <figcaption className="gc-caps mt-2">{player}</figcaption>
    </figure>
  );
}

export function HeroSection({ session }: HeroSectionProps): React.JSX.Element {
  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-x-hidden px-4 pb-6 pt-4 sm:pb-8 sm:pt-6">
      <div className="z-20 flex w-full max-w-5xl justify-end">
        <AuthButton email={session?.user.email ?? null} />
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 py-6 text-center sm:gap-8">
        <TitleBanner
          eyebrow="A co-op fitness adventure"
          title="GymCats"
          subtitle="Train hard. Nap harder. Your pixel-art spotters are ready."
          size="xl"
        />

        <div className="gc-rise flex items-end justify-center gap-6 sm:gap-16" style={rise(350)}>
          <PlayerCat sheet={CAT_SPRITES.siamese} label="Pixel art Siamese cat" player="Player 1" delay="0s" />
          <PlayerCat sheet={CAT_SPRITES.tuxedo} label="Pixel art tuxedo cat" player="Player 2" flip delay="-1.6s" />
        </div>

        <p className="gc-press gc-title text-sm tracking-[0.3em] text-white/85 sm:text-base" aria-hidden="true">
          ◆ Press start ◆
        </p>

        <div className="gc-rise flex w-full max-w-xs flex-col items-center gap-2" style={rise(550)}>
          <Link href="/login?mode=signup" className="gc-btn gc-btn-primary gc-btn-lg gc-shine w-full">
            Get started
          </Link>
          <Link href="/login" className="gc-btn gc-btn-ghost w-full">
            I already have an account
          </Link>
        </div>
      </div>

      {session && (
        <footer className="z-10 flex w-full max-w-5xl justify-center pt-3">
          <p className="gc-caps">Supabase connected</p>
        </footer>
      )}
    </main>
  );
}
