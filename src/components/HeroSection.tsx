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
        <div className="title-card w-full max-w-2xl rounded-2xl px-8 py-10 sm:px-12 sm:py-14">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-accent/80 sm:text-sm">
            Welcome to
          </p>
          <h1 className="bg-gradient-to-b from-accent-glow to-accent bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
            GymCats
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base text-foreground/70 sm:text-lg">
            Train hard. Nap harder. Your pixel-art spotters are ready.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/login?mode=signup"
            className="rounded-2xl bg-gradient-to-b from-accent-glow to-accent px-10 py-4 text-lg font-bold uppercase tracking-[0.25em] text-background shadow-[0_0_40px_rgba(201,168,108,0.35)] transition hover:scale-105 hover:shadow-[0_0_60px_rgba(201,168,108,0.5)] active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="font-mono text-xs text-foreground/60 underline-offset-4 hover:text-accent hover:underline"
          >
            I already have an account
          </Link>
        </div>

        <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-accent/10 blur-2xl" />
            <Image
              src="/gymcats-hero-cat.png"
              alt="Pixel art British Shorthair Siamese cat"
              width={280}
              height={280}
              priority
              className="pixel-art relative rounded-xl drop-shadow-2xl"
            />
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-accent/10 blur-2xl" />
            <Image
              src="/gymcats-hero-tuxedo-cat.png"
              alt="Pixel art tuxedo cat"
              width={280}
              height={280}
              priority
              className="pixel-art relative rounded-xl drop-shadow-2xl"
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
