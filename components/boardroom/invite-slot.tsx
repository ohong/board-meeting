"use client";

import { InvitePanel } from "@/components/webmcp/invite-panel";
import { useMeetingState, useSession } from "@/lib/meeting/context";

/** Mount point for the WebMCP workstream's invitation panel. */
export function InviteSlot() {
  const session = useSession();
  const open = useMeetingState().invitePanelOpen;
  if (!open) return null;
  return <InvitePanel onClose={() => session.closeInvitePanel()} />;
}
