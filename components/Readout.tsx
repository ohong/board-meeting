"use client";

import { useState } from "react";
import { createDisplayedReadout, NONE_RECORDED } from "@/lib/displayed-readout";
import type { MeetingSession, MeetingState } from "@/lib/session";
import type { ClosingComment } from "@/lib/types";
import { Portrait } from "./Portrait";
import styles from "./Readout.module.css";

type CopyStatus = "idle" | "success" | "error";

export function Readout({
  session,
  state,
}: {
  session: MeetingSession;
  state: MeetingState;
}) {
  const readout = state.readout;
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  if (!readout) return null;

  const { meetingDate, readoutText } = createDisplayedReadout(readout, state);

  async function handleCopy() {
    setCopyStatus("idle");
    try {
      await copyToClipboard(readoutText);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  function handleReset() {
    session.reset();
    window.scrollTo(0, 0);
  }

  return (
    <main className={styles.page} id="main-content">
      <a href="#readout-decision" className={styles.skipLink}>
        Skip to the decision
      </a>

      <div className={styles.sheet}>
        <header className={styles.masthead}>
          <div className={styles.wordmark} aria-label="Board Meeting">
            <span className={styles.wordmarkMonogram} aria-hidden="true">
              BM
            </span>
            <span>Board Meeting</span>
          </div>

          <div className={styles.documentTitle}>
            <p>Executive memo</p>
            <h1>Board readout</h1>
          </div>

          <div className={styles.headerActions} aria-label="Readout actions">
            <button type="button" className={styles.secondaryAction} onClick={handleReset}>
              New board
            </button>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => void handleCopy()}
              aria-describedby="copy-receipt"
            >
              <CopyIcon />
              Copy readout
            </button>
          </div>
        </header>

        <div className={styles.metadata} aria-label="Meeting details">
          <div>
            <span>Meeting date</span>
            <strong>{meetingDate}</strong>
          </div>
          <div className={styles.participantDetail}>
            <span>Participants</span>
            <strong>
              You, chair · {state.members.length} board member
              {state.members.length === 1 ? "" : "s"}
              {state.guest.name ? ` · ${state.guest.name}, guest agent` : ""}
            </strong>
          </div>
          <div
            id="copy-receipt"
            className={`${styles.copyReceipt} ${
              copyStatus === "error" ? styles.copyReceiptError : ""
            }`}
            role={copyStatus === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {copyStatus === "success" ? (
              <>
                <CheckIcon /> Readout copied
              </>
            ) : copyStatus === "error" ? (
              "Couldn’t copy the readout. Check clipboard access and try again."
            ) : (
              "Ready to copy"
            )}
          </div>
        </div>

        <ul className={styles.roster} aria-label="Meeting participants">
          <li className={styles.chairParticipant}>
            <span className={styles.chairMark} aria-hidden="true">
              Y
            </span>
            <span>
              <strong>You</strong>
              <small>Chair</small>
            </span>
          </li>
          {state.members.map((member) => (
            <li className={styles.participant} key={member.slug}>
              <Portrait
                slug={member.slug}
                name={member.name}
                initials={member.initials}
                size="preview"
              />
              <span>
                <strong>{member.name}</strong>
                <small>{member.role}</small>
              </span>
            </li>
          ))}
          {state.guest.name ? (
            <li className={`${styles.participant} ${styles.guestParticipant}`}>
              <span className={styles.guestMark} aria-hidden="true">
                {initialsFor(state.guest.name)}
              </span>
              <span>
                <strong>{state.guest.name}</strong>
                <small>Guest agent</small>
              </span>
            </li>
          ) : null}
        </ul>

        <article className={styles.memo} aria-label="Executive board readout">
          <section className={`${styles.section} ${styles.decision}`} id="readout-decision">
            <SectionHeading title="Decision under discussion" />
            <p>{readout.decision || NONE_RECORDED}</p>
          </section>

          <section className={`${styles.section} ${styles.recommendation}`}>
            <SectionHeading title="Board recommendation" />
            <div className={styles.recommendationSpread}>
              <p className={styles.recommendationStatement}>
                {readout.recommendation || NONE_RECORDED}
              </p>
              <div
                className={`${styles.alignmentNote} ${
                  readout.divided ? styles.dividedNote : ""
                }`}
              >
                <span>{readout.divided ? "Meaningful dissent" : "Board position"}</span>
                <strong>
                  {readout.divided ? "The board remains divided." : "The board is aligned."}
                </strong>
                <p>
                  {readout.divided
                    ? "The closing views below are preserved separately so the disagreement remains visible."
                    : "The closing views below preserve each member’s basis for that position."}
                </p>
              </div>
            </div>
          </section>

          <MemoListSection
            title="Options considered"
            items={readout.options}
            variant="options"
          />

          <MemoListSection
            title="Key tradeoffs"
            items={readout.tradeoffs}
            variant="tradeoffs"
          />

          <div className={styles.pairedSections}>
            <MemoListSection
              title="Important assumptions"
              items={readout.assumptions}
              variant="compact"
            />

            <MemoListSection
              title="Open questions"
              items={readout.openQuestions}
              variant="compact"
            />
          </div>

          <MemoListSection
            title="Recommended next actions"
            items={readout.nextActions}
            variant="nextActions"
          />

          <section className={`${styles.section} ${styles.closingComments}`}>
            <SectionHeading title="Closing comments by board member" />
            {readout.closingComments.length ? (
              <div className={styles.commentList}>
                {readout.closingComments.map((comment, index) => (
                  <ClosingView
                    key={`${comment.memberId}-${index}`}
                    comment={comment}
                    state={state}
                    divided={readout.divided}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>{NONE_RECORDED}</p>
            )}
          </section>
        </article>

        <footer className={styles.footer}>
          <span>Board readout · {meetingDate}</span>
          <span>{readout.divided ? "Dissent preserved" : "Meeting complete"}</span>
        </footer>
      </div>
    </main>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <header className={styles.sectionHeading}>
      <h2>{title}</h2>
    </header>
  );
}

function MemoListSection({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "options" | "tradeoffs" | "compact" | "nextActions";
}) {
  return (
    <section className={`${styles.section} ${styles[variant]}`}>
      <SectionHeading title={title} />
      {items.length ? (
        <ol className={styles.memoList}>
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>
              <span className={styles.rowNumber} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.emptyState}>{NONE_RECORDED}</p>
      )}
    </section>
  );
}

function ClosingView({
  comment,
  state,
  divided,
}: {
  comment: ClosingComment;
  state: MeetingState;
  divided: boolean;
}) {
  const member = state.members.find((candidate) => candidate.slug === comment.memberId);

  return (
    <figure className={`${styles.closingView} ${divided ? styles.dissentView : ""}`}>
      <div className={styles.commentIdentity}>
        {member ? (
          <Portrait
            slug={member.slug}
            name={member.name}
            initials={member.initials}
            size="roster"
          />
        ) : (
          <span className={styles.commentMark} aria-hidden="true">
            {initialsFor(comment.name)}
          </span>
        )}
        <figcaption>
          <strong>{comment.name}</strong>
          <small>{member?.role ?? "Board participant"}</small>
        </figcaption>
      </div>
      <blockquote>“{comment.comment || NONE_RECORDED}”</blockquote>
    </figure>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="6.5" y="6.5" width="9" height="9" rx="1" />
      <path d="M4.5 13.5h-1v-10h10v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m3.5 8.2 2.7 2.7 6.3-6.3" />
    </svg>
  );
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    try {
      textarea.focus();
      textarea.select();
      if (!document.execCommand("copy")) throw new Error("Clipboard write failed");
    } finally {
      textarea.remove();
    }
  }
}
