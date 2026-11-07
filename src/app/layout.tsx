import type { Metadata } from "next";
import { Pixelify_Sans, Silkscreen } from "next/font/google";
import { RouteTransition } from "@/components/transition/RouteTransition";
import "./globals.css";

// Retro RPG type: a readable pixel face for text and headings, and a
// blocky small-caps face for labels and numbers (Tailwind's font-mono).
const pixelSans = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
});

const pixelCaps = Silkscreen({
  variable: "--font-pixel-caps",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GymCats",
  description: "Train hard. Nap harder. Welcome to GymCats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${pixelSans.variable} ${pixelCaps.variable}`}
      >
        {children}
        <RouteTransition />
      </body>
    </html>
  );
}
