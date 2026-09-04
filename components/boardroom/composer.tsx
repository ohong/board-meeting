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
  const chair = session.isChair();
  const live = chair && (state.phase === "forming" || state.phase === "discussion");

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

  if (!chair) {
    return (
      <div className="material-strong border-t border-line px-4 py-4 text-[12px] leading-relaxed text-muted">
        This browser is following the shared room. The invited agent participates through this page&apos;s site tools.
      </div>
    );
  }

  return (
    <div className="material-strong relative z-10 border-t border-line px-3 pt-2.5 pb-3">
      {pendingQuestion ? (
        <p className="mb-2 flex animate-rise-in items-start gap-2 rounded-lg border border-accent-line bg-accent-soft px-3 py-2 text-[12px] leading-snug text-accent-deep">
          <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 animate-pulse-soft rounded-full bg-accent" />
          <span>
            <span className="font-semibold">Question for you.</span>{" "}
            <span className="text-ink-2">{pendingQuestion.speakerName} is waiting on an answer.</span>
          </span>
        </p>
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="shrink-0 pr-1 text-[12px] font-semibold tracking-[0.08em] text-faint uppercase">Call on</span>
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={!live}
            onClick={() => onInsertMention(m.persona.mention)}
            title={`Call on ${m.persona.name}`}
            className="pill press h-7 shrink-0 gap-1.5 pr-2.5 pl-1 text-[12px] font-medium transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-accent-line hover:bg-accent-soft hover:text-accent-deep disabled:opacity-40"
          >
            <Portrait src={m.persona.portrait} alt="" size={18} />@{m.persona.mention}
          </button>
        ))}
      </div>

      <div
        className={`flex items-end gap-2 rounded-2xl border bg-surface-2 p-1.5 pl-3.5 transition-[background-color,border-color,box-shadow] duration-200 ease-out focus-within:border-accent-line focus-within:bg-surface focus-within:shadow-[0_0_0_3px_var(--color-accent-soft)] ${
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
          className="board-scrollbar max-h-[132px] min-h-[44px] flex-1 resize-none bg-transparent py-2 text-[13px] leading-snug text-ink outline-none placeholder:text-faint"
          aria-label="Message the board"
        />
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label="Send"
          className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-[background-color,color,box-shadow,transform] duration-200 ease-out ${
            canSend
              ? "press bg-accent text-white shadow-[0_6px_16px_-8px_var(--color-accent)] hover:bg-accent-deep"
              : "cursor-not-allowed bg-surface-3 text-faint"
          }`}
        >
          <SendIcon size={14} />
        </button>
      </div>
      <p className="mt-1.5 px-1 text-[12px] text-faint">Enter to send &middot; Shift + Enter for a new line</p>
    </div>
  );
}
