import type { Metadata } from "next";
import { Cinzel, Roboto, Roboto_Condensed } from "next/font/google";
import { RouteTransition } from "@/components/transition/RouteTransition";
import { WorldBackdrop } from "@/components/ui/WorldBackdrop";
import "./globals.css";

// Display titles.
const cinzel = Cinzel({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Body copy and italic in-game labels.
const roboto = Roboto({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  style: ["normal", "italic"],
});

// Small caps labels, numbers and badges (Tailwind's font-mono).
const robotoCondensed = Roboto_Condensed({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
        className={`${cinzel.variable} ${roboto.variable} ${robotoCondensed.variable} antialiased`}
      >
        <WorldBackdrop />
        {children}
        <RouteTransition />
      </body>
    </html>
  );
}
