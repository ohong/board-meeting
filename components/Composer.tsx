"use client";

import { useEffect, useRef, useState } from "react";
import type { MemberSeat } from "@/lib/session";

export function Composer({
  members,
  awaitingChair,
  draft,
  onDraftChange,
  onSend,
  onComposingChange,
}: {
  members: MemberSeat[];
  awaitingChair: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (text: string) => void;
  onComposingChange: (composing: boolean) => void;
}) {
  const [sending, setSending] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (draft && box.current && document.activeElement !== box.current) {
      box.current.focus();
      box.current.setSelectionRange(draft.length, draft.length);
    }
  }, [draft]);

  const submit = () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    onDraftChange("");
    onComposingChange(false);
    Promise.resolve(onSend(text)).finally(() => setSending(false));
  };

  return (
    <div className="border-t border-[var(--hairline)] p-3">
      {awaitingChair ? (
        <p className="mb-2 text-[11.5px] text-[var(--brass)]">
          The board has said its piece and is waiting on you. Add context, call on someone, or end the
          meeting.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5 mb-2">
        {members.map((member) => (
          <button
            type="button"
            key={member.slug}
            className="btn-quiet px-2 py-1 text-[10.5px]"
            onClick={() => {
              const spacer = draft && !draft.endsWith(" ") ? " " : "";
              onDraftChange(`${draft}${spacer}@${member.name} `);
              onComposingChange(true);
            }}
          >
            @{member.name.split(" ")[0]}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <textarea
          ref={box}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onFocus={() => onComposingChange(true)}
          onBlur={() => onComposingChange(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Answer the board, add context, or @Name to call on someone"
          className="field w-full px-3 py-2.5 text-[13.5px] leading-relaxed min-h-[76px] resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10.5px] text-[var(--faint)]">Enter to send · Shift+Enter for a new line</span>
          <button type="submit" disabled={!draft.trim() || sending} className="btn-primary px-4 py-1.5 text-[12.5px]">
            {sending ? "Sending" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
