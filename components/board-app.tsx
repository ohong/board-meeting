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
import { useMeetingState, useSession } from "@/lib/meeting/context";
import type { PersonaSummary } from "@/lib/meeting/types";

export function BoardApp({ catalog }: { catalog: PersonaSummary[] }) {
  const session = useSession();
  const state = useMeetingState();

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
        <div className="flex min-h-screen items-center justify-center bg-paper px-8 text-center text-paper-ink">
          <div>
            <p className="font-display text-[22px] font-semibold">The readout is not available.</p>
            <button
              type="button"
              onClick={() => session.reset()}
              className="mt-4 rounded-sm bg-paper-ink px-4 py-2.5 text-[13px] font-semibold text-paper"
            >
              Start a new meeting
            </button>
          </div>
        </div>
      );
  }
}
