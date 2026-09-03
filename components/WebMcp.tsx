"use client";

import { useEffect } from "react";
import { registerBoardTools } from "@/lib/webmcp";
import type { MeetingSession } from "@/lib/session";

export function WebMcpBridge({ session }: { session: MeetingSession }) {
  useEffect(() => {
    const controller = new AbortController();
    void registerBoardTools(session, controller.signal);
    return () => controller.abort();
  }, [session]);
  return null;
}
