"use client";

import { useState } from "react";

/**
 * The guest pass. Readable prose, not source code; mono is reserved for the short WebMCP
 * label and the tool names. It keeps the room and part of the minutes visible while open.
 */
export function InvitePanel({
  prompt,
  supported,
  guestName,
  activity,
  onClose,
}: {
  prompt: string;
  supported: boolean | null;
  guestName: string | null;
  activity: { id: string; label: string }[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <aside
      aria-label="Invite your agent"
      className="sheet flex min-h-0 flex-col overflow-y-auto px-5 py-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="operational text-[var(--guest)]">WebMCP</p>
          <h2 className="editorial mt-1 text-[24px] leading-tight">Invite your agent</h2>
        </div>
        <button type="button" onClick={onClose} className="btn-secondary py-1.5 text-[13px]">
          Close
        </button>
      </div>

      <p className="mt-3 text-[14px] leading-[1.5] text-[var(--ink-secondary)]">
        This page exposes the meeting as tools a compatible agent can call. Give this invitation
        to a personal agent while the meeting remains open.
      </p>

      <div className="mt-4 rounded-[3px] border border-[var(--rule)] bg-[var(--paper-canvas)] p-3.5">
        <p className="max-h-52 overflow-y-auto whitespace-pre-wrap text-[13px] leading-[1.55]">
          {prompt}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary py-2"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(prompt);
            } catch {
              // Clipboard permission can be refused; the text above is still selectable.
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2400);
          }}
        >
          {copied ? "Copied" : "Copy invitation"}
        </button>
        <span className="text-[13px] text-[var(--ink-secondary)]">
          {guestName ? `${guestName} is at the table.` : copied ? "Waiting for your agent…" : "The agent chooses its own name."}
        </span>
      </div>

      {supported === false ? (
        <p className="mt-4 text-[13px] leading-[1.5] text-[var(--human)]">
          This browser does not expose site tools, so an agent cannot join from here. The meeting
          is unaffected.
        </p>
      ) : null}

      {activity.length ? (
        <div className="mt-6 border-t border-[var(--rule)] pt-4">
          <h3 className="text-[13px] font-medium">What your agent has done</h3>
          <ul className="mt-2 space-y-1.5">
            {activity.map((entry) => (
              <li key={entry.id} className="text-[13px] leading-[1.4] text-[var(--ink-secondary)]">
                {entry.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 border-t border-[var(--rule)] pt-4">
        <h3 className="text-[13px] font-medium">Tools on this page</h3>
        <ul className="operational mt-2 grid grid-cols-1 gap-y-1 text-[var(--ink-secondary)]">
          {[
            "inspect_board_meeting",
            "join_board_meeting",
            "contribute_to_board_meeting",
            "address_board_member",
            "request_board_synthesis",
            "get_board_meeting_readout",
          ].map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
