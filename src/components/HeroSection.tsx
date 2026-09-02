import Image from "next/image";
import type { Session } from "@supabase/supabase-js";

export interface HeroSectionProps {
  session: Session | null;
}

export function HeroSection({ session }: HeroSectionProps): React.JSX.Element {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div className="hero-glow pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 text-center">
        <div className="title-card w-full max-w-2xl rounded-2xl px-8 py-10 sm:px-12 sm:py-14">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-accent/80 sm:text-sm">
            Welcome to
          </p>
          <h1 className="bg-gradient-to-b from-accent-glow to-accent bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
            GymCats
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base text-foreground/70 sm:text-lg">
            Train hard. Nap harder. Your British Shorthair spotter is ready.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-accent/10 blur-2xl" />
          <Image
            src="/gymcats-hero-cat.png"
            alt="Pixel art British Shorthair Siamese cat"
            width={320}
            height={320}
            priority
            className="pixel-art relative rounded-xl drop-shadow-2xl"
          />
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
