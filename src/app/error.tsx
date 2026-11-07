"use client";

import Link from "next/link";
import { Panel, TitleBanner } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }): React.JSX.Element {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <TitleBanner eyebrow="Something went wrong" title="Couldn't load this page" size="md" />
      <Panel className="gc-rise flex w-full max-w-sm flex-col items-center gap-3 px-6 py-6">
        <p className="italic text-white/75">Check your connection and try again.</p>
        <button type="button" onClick={reset} className="gc-btn gc-btn-primary w-full">
          Try again
        </button>
        <Link href="/hub" className="gc-btn gc-btn-ghost w-full">
          Back to the hub
        </Link>
      </Panel>
    </main>
  );
}
