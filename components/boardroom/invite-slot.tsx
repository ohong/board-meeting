"use client";

import { useEffect } from "react";
import { InvitePanel } from "@/components/webmcp/invite-panel";
import { useMeetingState, useSession } from "@/lib/meeting/context";

/** Modal mount point for the WebMCP invitation panel: backdrop click or Escape closes it. */
export function InviteSlot() {
  const session = useSession();
  const open = useMeetingState().invitePanelOpen;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") session.closeInvitePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, session]);

  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink/20 p-6 backdrop-blur-[3px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) session.closeInvitePanel();
      }}
    >
      <div className="animate-materialize">
        <InvitePanel onClose={() => session.closeInvitePanel()} />
      </div>
    </div>
  );
}
