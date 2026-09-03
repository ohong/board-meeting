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

/** The current page URL, read without tripping a hydration mismatch. */
function usePageUrl(): string {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.href,
    () => "",
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
  const pageUrl = usePageUrl();

  // The invitation names a real member of THIS board, never a hard-coded person.
  const members = session.members();
  const focusName = members[0]?.persona.name ?? "a board member";

  const invitation = useMemo(() => {
    const body =
      "You are invited to the active board meeting on this page. Use its site tools to inspect the meeting, " +
      "join using the name you know yourself by, share any relevant context you already have, ask " +
      `${focusName} one focused question about whether that evidence changes their view, and request a ` +
      "synthesis of the discussion. After the human chair ends the meeting, retrieve the final readout.";
    return pageUrl ? `${body}\n${pageUrl}` : body;
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
      aria-label="Invite your agent"
      className="w-[27rem] max-w-[92vw] overflow-hidden rounded-xl border border-[#8a6a3b]/70 bg-[#1c1309] text-[#e9dcc4] shadow-2xl shadow-black/60"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#8a6a3b]/40 bg-[#241809] px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-wide text-[#f0e3c8]">Invite your agent</h2>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-[#c9a227]">
            One guest seat · joins through this page
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close invite panel"
          className="-mr-1 rounded-md px-2 py-1 text-lg leading-none text-[#c9b491] transition hover:bg-[#3a2a15] hover:text-[#f0e3c8]"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 px-4 py-3.5">
        <p className="text-[12.5px] leading-relaxed text-[#d9caab]">
          A compatible personal agent can take the guest seat through this page&apos;s site tools — the
          ChatGPT desktop app&apos;s built-in browser with site tools enabled, or Chrome 149+ with{" "}
          <code className="rounded bg-[#2b1e0d] px-1 py-0.5 text-[11px] text-[#e3c877]">
            chrome://flags/#enable-webmcp-testing
          </code>
          . Paste the invitation below into that agent.
        </p>

        <div
          className={[
            "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11.5px]",
            support === "supported"
              ? "border-[#5c7f4a]/60 bg-[#1a2413] text-[#b9d3a3]"
              : support === "unsupported"
                ? "border-[#8a6a3b]/50 bg-[#251a0c] text-[#c8b48c]"
                : "border-[#8a6a3b]/40 bg-[#221708] text-[#b6a482]",
          ].join(" ")}
        >
          <span
            aria-hidden
            className={[
              "h-1.5 w-1.5 shrink-0 rounded-full",
              support === "supported" ? "bg-[#8fbf6a]" : support === "unsupported" ? "bg-[#a9865a]" : "bg-[#7d6a48]",
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

        <div className="rounded-md border border-[#8a6a3b]/40 bg-[#120c06] p-3">
          <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#e6d9bd]">{invitation}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-[#bfae8b]">
            Guest seat:{" "}
            <span className={guestJoined ? "text-[#e8d49a]" : "text-[#9c8c6d]"}>
              {guestJoined ? `${state.guest?.name} joined` : "empty"}
            </span>
          </p>
          <button
            type="button"
            onClick={async () => {
              const ok = await copyText(invitation);
              setCopied(ok);
            }}
            className="rounded-md border border-[#c9a227]/70 bg-[#3a2a10] px-3 py-1.5 text-[12px] font-medium text-[#f2e2b6] transition hover:bg-[#4a3614] active:translate-y-px"
          >
            {copied ? "Copied" : "Copy invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}
