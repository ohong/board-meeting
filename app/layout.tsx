import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { MeetingProvider } from "@/lib/meeting/context";
import { EngineBinding } from "@/components/engine-binding";
import { WebMCPTools } from "@/components/webmcp/webmcp-tools";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Best Board Meeting You've Ever Had",
  description:
    "Convene a personal board of AI advisers modeled on David Senra's guests, chair a live meeting, and invite your own agent through WebMCP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${instrumentSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MeetingProvider>
          {children}
          <EngineBinding />
          <WebMCPTools />
        </MeetingProvider>
      </body>
    </html>
  );
}
