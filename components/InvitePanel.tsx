"use client";

import { useState } from "react";

const TOOL_NAMES = [
  "inspect_board_meeting",
  "join_board_meeting",
  "contribute_to_board_meeting",
  "address_board_member",
  "request_board_synthesis",
  "get_board_meeting_readout",
];

export function InvitePanel({
  prompt,
  supported,
  activity,
  onClose,
}: {
  prompt: string;
  supported: boolean | null;
  activity: { id: string; label: string }[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <aside className="panel p-5 overflow-y-auto min-h-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">WebMCP</div>
          <h2 className="serif text-[20px] font-semibold mt-1">Invite your agent</h2>
        </div>
        <button type="button" onClick={onClose} className="btn-quiet px-2 py-1 text-[12px]">
          Close
        </button>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--muted)]">
        Your own assistant can take the guest seat through this page&rsquo;s site tools — no server
        integration, no second transcript. Paste this into your agent while the meeting is open.
      </p>

      <textarea
        readOnly
        value={prompt}
        onFocus={(event) => event.currentTarget.select()}
        className="field w-full mt-3 h-40 p-3 text-[12px] leading-relaxed resize-none"
      />

      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          className="btn-primary px-4 py-2 text-[13px]"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(prompt);
            } catch {
              // Clipboard permission can be refused; the textarea is still selectable.
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2400);
          }}
        >
          {copied ? "Copied to clipboard" : "Copy invitation"}
        </button>
        <span className="text-[11px] text-[var(--faint)]">The agent chooses its own name.</span>
      </div>

      <div className="rule my-4" />

      <div className="eyebrow">Site tools on this page</div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {TOOL_NAMES.map((name) => (
          <li key={name} className="text-[11px] font-mono text-[var(--muted)]">
            {name}
          </li>
        ))}
      </ul>

      {supported === false ? (
        <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--concern)]">
          This browser does not expose site tools, so an agent cannot join from here. The board
          meeting itself is unaffected — carry on and end it whenever you like.
        </p>
      ) : null}
      {supported === true ? (
        <p className="mt-3 text-[11.5px] text-[var(--live)]">
          Site tools are registered on this page and discoverable now.
        </p>
      ) : null}

      {activity.length ? (
        <>
          <div className="rule my-4" />
          <div className="eyebrow">Guest agent activity</div>
          <ul className="mt-2 space-y-1">
            {activity.map((entry) => (
              <li key={entry.id} className="text-[11.5px] text-[var(--guest)]">
                {entry.label}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </aside>
  );
}
