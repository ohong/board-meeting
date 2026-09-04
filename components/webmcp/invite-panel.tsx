"use client";

/**
 * Invite panel — OWNED BY THE WEBMCP WORKSTREAM.
 *
 * Rendered by the boardroom while `state.invitePanelOpen` is true (spec §11.2).
 * It generates the copyable invitation prompt from the LIVE board, reports whether
 * this browser exposes site tools, and never prescribes a display name for the
 * joining agent — the agent supplies the name it knows itself by.
 */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import { Button } from "@/components/ui/button";
import { CheckIcon, CloseIcon, CopyIcon } from "@/components/ui/icons";
import { roomShareUrl } from "@/lib/meeting/room-client";

type SupportState = "unknown" | "supported" | "unsupported";

/**
 * Reads the flag written by <WebMCPTools/>. That effect runs in the root layout, so
 * it can land a tick after this panel mounts; poll briefly rather than latch early.
 */
function useSiteToolSupport(): SupportState {
  return useSyncExternalStore<SupportState>(
    (onStoreChange) => {
      const interval = window.setInterval(onStoreChange, 200);
      const stop = window.setTimeout(() => window.clearInterval(interval), 4000);
      return () => {
        window.clearInterval(interval);
        window.clearTimeout(stop);
      };
    },
    () => {
      const flag = window.__boardMeetingWebMCP;
      if (flag) return flag.supported ? "supported" : "unsupported";
      const attr = document.documentElement.dataset.webmcp;
      if (attr === "supported" || attr === "unsupported") return attr;
      return "unknown";
    },
    () => "unknown",
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback (clipboard API needs a secure context
    // and a user gesture, and can be blocked by permissions policy).
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export function InvitePanel({ onClose }: { onClose: () => void }) {
  const session = useSession();
  const state = useMeetingState();
  const support = useSiteToolSupport();
  const [copied, setCopied] = useState(false);
  const pageUrl = state.room?.id ? roomShareUrl(state.room.id) : "";

  // The invitation names a real member of THIS board, never a hard-coded person.
  const members = session.members();
  const focusName = members[0]?.persona.name ?? "a board member";

  const invitation = useMemo(() => {
    const body =
      "You are invited to the active board meeting on this page. Use its site tools to inspect the meeting, " +
      "join using the name you know yourself by, share any relevant context you already have, ask " +
      `${focusName} one focused question about whether that evidence changes their view, and request a ` +
      "synthesis of the discussion. After the human chair ends the meeting, retrieve the final readout.";
    return pageUrl
      ? `${body}\n\nOpen this unique meeting link and use the site tools registered there:\n${pageUrl}`
      : body;
  }, [focusName, pageUrl]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(id);
  }, [copied]);

  const guestJoined = !!state.guest && state.guest.status !== "empty";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invite your agent"
      className="card w-[30rem] max-w-[92vw] animate-rise-in overflow-hidden text-ink shadow-[var(--shadow-float)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-[24px] leading-tight font-semibold">Invite your agent</h2>
          <p className="mt-1 text-[12px] text-muted">One guest seat &middot; joins through this page&apos;s site tools</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close invite panel"
          className="-mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      <div className="space-y-3.5 px-5 py-4">
        <p className="text-[13px] leading-relaxed text-ink-2">
          A compatible personal agent can take the guest seat through this page&apos;s site tools: the ChatGPT
          desktop app&apos;s built-in browser with site tools enabled, or Chrome 149+ with{" "}
          <code className="rounded-lg bg-surface-2 px-1.5 py-0.5 text-[12px] text-ink">
            chrome://flags/#enable-webmcp-testing
          </code>
          . Paste the invitation below into that agent.
        </p>

        <div
          className={[
            "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] leading-snug",
            support === "supported"
              ? "border-live/30 bg-live-soft text-ink-2"
              : support === "unsupported"
                ? "border-line bg-surface-2 text-muted"
                : "border-line bg-surface-2 text-muted",
          ].join(" ")}
        >
          <span
            aria-hidden
            className={[
              "h-2 w-2 shrink-0 rounded-full",
              support === "supported" ? "bg-live" : support === "unsupported" ? "bg-faint" : "bg-faint animate-pulse-soft",
            ].join(" ")}
          />
          <span>
            {support === "supported"
              ? "This browser exposes site tools. An agent here can join directly."
              : support === "unsupported"
                ? "This browser does not expose site tools. The meeting works normally; the invitation still works in an agent browser that does."
                : "Checking whether this browser exposes site tools…"}
          </span>
        </div>

        <div className="rounded-lg border border-line bg-surface-2 p-3.5">
          {pageUrl ? (
            <p className="text-[12px] leading-relaxed whitespace-pre-wrap break-words text-ink">{invitation}</p>
          ) : (
            <p className="text-[12px] leading-relaxed text-muted">
              {state.room?.status === "error"
                ? `The room link could not be created: ${state.room.error ?? "unknown error"}`
                : "Preparing this meeting's private room link…"}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted">
            Guest seat:{" "}
            <span className={guestJoined ? "font-semibold text-ink" : ""}>
              {guestJoined ? `${state.guest?.name} joined` : "empty"}
            </span>
          </p>
          <Button
            variant="primary"
            size="sm"
            disabled={!pageUrl}
            onClick={async () => {
              const ok = await copyText(invitation);
              setCopied(ok);
            }}
          >
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            {copied ? "Copied" : "Copy invitation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
