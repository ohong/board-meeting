"use client";

import { useMemo, type RefObject } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import type { MessageEntry } from "@/lib/meeting/types";

export function Composer({
  draft,
  setDraft,
  textareaRef,
  onInsertMention,
}: {
  draft: string;
  setDraft: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInsertMention: (mention: string) => void;
}) {
  const session = useSession();
  const state = useMeetingState();
  const live = state.phase === "forming" || state.phase === "discussion";

  const members = useMemo(
    () => Object.values(state.members).sort((a, b) => a.seat - b.seat),
    [state.members],
  );

  /** A member's question is outstanding only if nobody has spoken since. */
  const pendingQuestion = useMemo(() => {
    const messages = state.transcript.filter((e): e is MessageEntry => e.kind === "message");
    const last = messages.at(-1);
    if (!last || last.speakerRole !== "member") return null;
    if (last.intent !== "question" || last.addressedTo !== "chair") return null;
    if (last.streaming) return null;
    return last;
  }, [state.transcript]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const result = session.sendChairMessage(text);
    if (!result.ok) {
      session.notify(result.error.message);
      return;
    }
    setDraft("");
    session.setChairComposing(false);
  }

  function change(value: string) {
    setDraft(value);
    session.setChairComposing(value.trim().length > 0);
  }

  return (
    <div className="border-t border-room-3 bg-room px-4 py-3">
      {pendingQuestion ? (
        <p className="mb-2 animate-rise-in rounded-[3px] border border-brass/35 bg-brass/8 px-2.5 py-1.5 text-[11.5px] leading-snug text-brass">
          <span className="font-semibold tracking-[0.06em] uppercase">Question for you</span>{" "}
          <span className="text-ink/85">&mdash; {pendingQuestion.speakerName} is waiting on an answer.</span>
        </p>
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] tracking-[0.1em] text-faint uppercase">Call on</span>
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={!live}
            onClick={() => onInsertMention(m.persona.mention)}
            className="rounded-full border border-room-3 px-2 py-[3px] text-[11px] text-muted transition-colors duration-150 hover:border-brass hover:text-brass disabled:opacity-40"
          >
            @{m.persona.mention}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={draft}
          rows={2}
          disabled={!live}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Add context, answer a question, or call on someone with @Name"
          className="board-scrollbar max-h-[132px] min-h-[54px] flex-1 resize-none rounded-[3px] border border-room-3 bg-room-2 px-3 py-2 text-[13.5px] leading-snug text-ink outline-none placeholder:text-faint focus:border-brass-dim disabled:opacity-50"
          aria-label="Message the board"
        />
        <button
          type="button"
          onClick={send}
          disabled={!live || draft.trim().length === 0}
          className="h-[54px] shrink-0 rounded-[3px] bg-brass px-4 text-[13px] font-semibold text-walnut-deep transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Send
        </button>
      </div>
      <p className="mt-1.5 text-[10.5px] text-faint">Enter sends &middot; Shift + Enter adds a line</p>
    </div>
  );
}
