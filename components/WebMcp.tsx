"use client";

import { useEffect } from "react";
import { registerBoardTools } from "@/lib/webmcp";
import type { MeetingSession } from "@/lib/session";

/**
 * Registers the six site tools on the top-level page for the life of the session. The
 * tools close over the same session object the human interface drives, so there is exactly
 * one meeting.
 */
export function WebMcpBridge({
  session,
  onSupportChange,
}: {
  session: MeetingSession;
  onSupportChange: (supported: boolean) => void;
}) {
  useEffect(() => {
    const controller = new AbortController();
    void registerBoardTools(session, controller.signal)
      .then((result) => onSupportChange(result.supported))
      .catch(() => onSupportChange(false));
    return () => controller.abort();
  }, [session, onSupportChange]);

  return null;
}
