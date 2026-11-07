import Image from "next/image";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { AuthButton } from "@/components/AuthButton";

export interface HeroSectionProps {
  session: Session | null;
}

export function HeroSection({ session }: HeroSectionProps): React.JSX.Element {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="absolute right-6 top-6 z-20"><AuthButton email={session?.user.email ?? null} /></div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 text-center">
        <div className="title-card w-full max-w-2xl px-8 py-10 sm:px-12 sm:py-14">
          <p className="rpg-label mb-4 sm:text-sm">Welcome to</p>
          <h1 className="rpg-title text-6xl font-bold sm:text-8xl">GymCats</h1>
          <p className="mx-auto mt-6 max-w-md text-base text-foreground/80 sm:text-lg">
            Train hard. Nap harder. Your pixel-art spotters are ready.
          </p>
        </div>

        <nav aria-label="Start" className="rpg-window flex w-full max-w-xs flex-col items-stretch gap-4 px-6 py-5">
          <Link href="/login?mode=signup" className="rpg-btn rpg-btn-gold px-8 py-3 text-lg uppercase tracking-[0.15em]">
            Get started
          </Link>
          <Link
            href="/login"
            className="rpg-cursor relative self-center text-sm text-foreground/80 underline-offset-4 hover:text-accent-glow hover:underline"
          >
            I already have an account
          </Link>
        </nav>

        <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
          <div className="rpg-window p-2">
            <Image
              src="/gymcats-hero-cat.png"
              alt="Pixel art British Shorthair Siamese cat"
              width={280}
              height={280}
              priority
              className="pixel-art relative rounded-sm"
            />
          </div>

          <div className="rpg-window p-2">
            <Image
              src="/gymcats-hero-tuxedo-cat.png"
              alt="Pixel art tuxedo cat"
              width={280}
              height={280}
              priority
              className="pixel-art relative rounded-sm"
            />
          </div>
        </div>

        {session && (
          <p className="font-mono text-xs text-foreground/40">
            Supabase connected
          </p>
        )}
      </div>
    </main>
  );
}
