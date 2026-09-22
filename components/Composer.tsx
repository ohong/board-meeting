"use client";

import { useMemo, useRef, useState } from "react";
import type { MemberSeat } from "@/lib/session";

/**
 * Attached to the bottom of the minutes sheet. Typing `@` offers the seated advisers;
 * clicking a seat inserts the same mention. No toolbar, no attachments, no slash commands.
 */
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
  const [highlighted, setHighlighted] = useState(0);
  const box = useRef<HTMLTextAreaElement>(null);

  // The mention fragment currently being typed, if the caret is inside one.
  const fragment = useMemo(() => {
    const match = /@([A-Za-z'’.-]*)$/.exec(draft);
    return match ? match[1].toLowerCase() : null;
  }, [draft]);

  const suggestions = useMemo(() => {
    if (fragment === null) return [];
    return members.filter((member) => member.name.toLowerCase().includes(fragment)).slice(0, 5);
  }, [fragment, members]);

  const complete = (member: MemberSeat) => {
    onDraftChange(`${draft.replace(/@[A-Za-z'’.-]*$/, "")}@${member.name} `);
    onComposingChange(true);
    setHighlighted(0);
    box.current?.focus();
  };

  const submit = () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    onDraftChange("");
    onComposingChange(false);
    Promise.resolve(onSend(text)).finally(() => setSending(false));
  };

  return (
    <div className="relative border-t border-[var(--rule)] px-6 py-4">
      {awaitingChair ? (
        <p className="mb-3 text-[13px] text-[var(--ink-secondary)]">
          The board has said its piece. Add context, call on someone, or end the meeting.
        </p>
      ) : null}

      {suggestions.length ? (
        <ul className="absolute bottom-full left-6 right-6 mb-1 overflow-hidden rounded-[var(--radius-control)] border border-[var(--rule)] bg-[var(--paper-sheet)] shadow-lg">
          {suggestions.map((member, index) => (
            <li key={member.slug}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  complete(member);
                }}
                className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-[14px]"
                style={{ background: index === highlighted ? "var(--soft-fill)" : "transparent" }}
              >
                <span className="font-medium">{member.name}</span>
                <span className="text-[12.5px] text-[var(--ink-secondary)]">{member.house}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className="sr-only" htmlFor="composer">
          Add context or call on someone
        </label>
        <textarea
          id="composer"
          ref={box}
          value={draft}
          onChange={(event) => {
            onDraftChange(event.target.value);
            onComposingChange(event.target.value.trim().length > 0);
            setHighlighted(0);
          }}
          onFocus={() => onComposingChange(draft.trim().length > 0)}
          onBlur={() => onComposingChange(false)}
          onKeyDown={(event) => {
            if (suggestions.length) {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlighted((index) => (index + 1) % suggestions.length);
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlighted((index) => (index - 1 + suggestions.length) % suggestions.length);
                return;
              }
              if (event.key === "Tab" || (event.key === "Enter" && !event.shiftKey)) {
                event.preventDefault();
                complete(suggestions[highlighted]);
                return;
              }
              if (event.key === "Escape") {
                event.preventDefault();
                onDraftChange(draft.replace(/@[A-Za-z'’.-]*$/, ""));
                return;
              }
            }
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="Add context or call on someone with @"
          className="field w-full resize-none px-3 py-2.5 text-[15px] leading-[1.5]"
        />
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[12px] text-[var(--ink-secondary)]">Enter sends</span>
          <button type="submit" disabled={!draft.trim() || sending} className="btn-primary py-2">
            {sending ? "Sending" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
