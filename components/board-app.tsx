"use client";

/**
 * Top-level product state switch — OWNED BY THE UI WORKSTREAM.
 * selecting | briefing -> onboarding; forming | discussion | closing -> boardroom; readout -> readout.
 */
import { useEffect } from "react";
import { Boardroom } from "@/components/boardroom/boardroom";
import { BriefScreen } from "@/components/brief/brief-screen";
import { ReadoutView } from "@/components/readout/readout-view";
import { SelectScreen } from "@/components/select/select-screen";
import { Button } from "@/components/ui/button";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import { startNewMeeting } from "@/lib/meeting/room-client";
import type { PersonaSummary } from "@/lib/meeting/types";

export function BoardApp({ catalog }: { catalog: PersonaSummary[] }) {
  const session = useSession();
  const state = useMeetingState();
  // The catalog is not meeting state, but WebMCP needs the same choices the UI
  // renders when an agent launches a meeting from the empty page.
  session.setCatalog(catalog);

  // Non-fatal notices are transient everywhere they are rendered.
  const noticeId = state.notice?.id ?? null;
  useEffect(() => {
    if (!noticeId) return;
    const t = setTimeout(() => session.clearNotice(), 3000);
    return () => clearTimeout(t);
  }, [noticeId, session]);

  switch (state.phase) {
    case "selecting":
      return <SelectScreen catalog={catalog} />;
    case "briefing":
      return <BriefScreen />;
    case "forming":
    case "discussion":
    case "closing":
      return <Boardroom />;
    case "readout":
      return state.readout ? (
        <ReadoutView readout={state.readout} />
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-canvas px-8 text-center text-ink">
          <div className="card px-8 py-8">
            <p className="font-display text-[24px] font-semibold">The memo is not available.</p>
            <Button variant="primary" className="mt-4" onClick={() => startNewMeeting(session)}>
              Start a new meeting
            </Button>
          </div>
        </div>
      );
  }
}
