"use client";

import { useMemo, type RefObject } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import { Portrait } from "@/components/ui/portrait";
import { SendIcon } from "@/components/ui/icons";
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

  const canSend = live && draft.trim().length > 0;

  return (
    <div className="border-t border-line bg-surface px-3 pt-2.5 pb-3">
      {pendingQuestion ? (
        <p className="mb-2 animate-rise-in rounded-lg border border-accent-line bg-accent-soft px-3 py-1.5 text-[12px] leading-snug text-accent-deep">
          <span className="font-semibold">Question for you.</span>{" "}
          <span className="text-ink-2">{pendingQuestion.speakerName} is waiting on an answer.</span>
        </p>
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="shrink-0 pr-1 text-[11px] font-semibold tracking-[0.08em] text-faint uppercase">Call on</span>
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={!live}
            onClick={() => onInsertMention(m.persona.mention)}
            className="pill h-7 shrink-0 gap-1.5 pr-2.5 pl-1 text-[11.5px] font-medium transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent-deep disabled:opacity-40"
          >
            <Portrait src={m.persona.portrait} alt="" size={18} />@{m.persona.mention}
          </button>
        ))}
      </div>

      <div
        className={`flex items-end gap-2 rounded-2xl border bg-surface-2 p-1.5 pl-3.5 transition-colors focus-within:border-line-strong focus-within:bg-surface ${
          live ? "border-line" : "border-line opacity-60"
        }`}
      >
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
          placeholder="Ask the board, add context, or call on someone with @Name"
          className="board-scrollbar max-h-[132px] min-h-[44px] flex-1 resize-none bg-transparent py-2 text-[13.5px] leading-snug text-ink outline-none placeholder:text-faint"
          aria-label="Message the board"
        />
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label="Send"
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-faint"
        >
          <SendIcon size={16} />
        </button>
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-faint">Enter to send &middot; Shift + Enter for a new line</p>
    </div>
  );
}
