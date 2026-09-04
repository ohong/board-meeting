import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MeetingProvider } from "@/lib/meeting/context";
import { EngineBinding } from "@/components/engine-binding";
import { WebMCPTools } from "@/components/webmcp/webmcp-tools";
import { RoomSync } from "@/components/room-sync";

/* SF Pro is used wherever it exists (see `--font-sans` in globals.css). Inter is
   the stand-in everywhere else: same grotesque skeleton, close metrics, so the
   layout does not shift between platforms. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Best Board Meeting You've Ever Had",
  description:
    "Convene a personal board of AI advisers modeled on David Senra's guests, chair a live meeting, and invite your own agent through WebMCP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MeetingProvider>
          {children}
          <EngineBinding />
          <RoomSync />
          <WebMCPTools />
        </MeetingProvider>
      </body>
    </html>
  );
}
