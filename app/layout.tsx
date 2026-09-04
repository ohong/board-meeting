import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

/**
 * Three families, per design/design-engineer-instructions.md: an editorial serif for
 * page-defining statements, an interface sans for everything operational, and a mono
 * reserved for short WebMCP receipts and bounded identifiers.
 */
const newsreader = Newsreader({
  variable: "--font-editorial",
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-interface",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-operational",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Best Board Meeting You've Ever Had",
  description:
    "Convene a board you could never normally assemble and pressure-test a consequential decision.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
