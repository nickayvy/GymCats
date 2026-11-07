import Link from "next/link";
import { Panel, TitleBanner } from "@/components/ui";

export const metadata = { title: "Page not found · GymCats" };

export default function NotFound(): React.JSX.Element {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <TitleBanner eyebrow="404" title="Page not found" size="lg" />
      <Panel className="gc-rise flex w-full max-w-sm flex-col items-center gap-5 px-6 py-6">
        <p className="italic text-white/75">This page doesn&apos;t exist or has moved.</p>
        <Link href="/" className="gc-btn gc-btn-primary w-full">
          Back home
        </Link>
      </Panel>
    </main>
  );
}
