"use client";

import { Portrait, initialsFor } from "./LetterMark";
import { GUEST_STATE, REACTION, SEAT_STATE } from "./vocabulary";
import type { GuestSeat, MemberSeat } from "@/lib/session";

type Place = { left: string; top: string };

/**
 * Fixed, art-directed seating rather than points distributed round an ellipse. Each
 * arrangement puts the chair at the near end, the guest threshold at the near right, and
 * the advisers where a conversation would actually put them.
 */
const ARRANGEMENTS: Record<number, Place[]> = {
  3: [
    { left: "50%", top: "7%" },
    { left: "11%", top: "40%" },
    { left: "89%", top: "40%" },
  ],
  4: [
    { left: "33%", top: "6%" },
    { left: "67%", top: "6%" },
    { left: "10%", top: "44%" },
    { left: "90%", top: "44%" },
  ],
  5: [
    { left: "50%", top: "4%" },
    { left: "19%", top: "13%" },
    { left: "81%", top: "13%" },
    { left: "10%", top: "48%" },
    { left: "90%", top: "48%" },
  ],
  6: [
    { left: "34%", top: "4%" },
    { left: "66%", top: "4%" },
    { left: "12%", top: "20%" },
    { left: "88%", top: "20%" },
    { left: "10%", top: "52%" },
    { left: "90%", top: "52%" },
  ],
};

const CHAIR: Place = { left: "50%", top: "78%" };
const GUEST: Place = { left: "87%", top: "76%" };

export function BoardTable({
  members,
  guest,
  decision,
  phaseLabel,
  guestArrived,
  onMention,
  onInspectBrief,
}: {
  members: MemberSeat[];
  guest: GuestSeat;
  decision: string;
  phaseLabel: string;
  guestArrived: boolean;
  onMention: (name: string) => void;
  onInspectBrief: () => void;
}) {
  const places = ARRANGEMENTS[members.length] ?? ARRANGEMENTS[3];

  return (
    <div className="room-field relative h-full w-full">
      <div className="table-top h-[48%] w-[62%]" aria-hidden />

      <div className="agenda-folio w-[min(360px,30%)] px-5 py-4">
        <p className="text-[11px] font-medium text-[var(--ink-secondary)]">{phaseLabel}</p>
        <p className="editorial mt-1.5 line-clamp-3 text-[17px] leading-[1.25]">{decision}</p>
        <button
          type="button"
          onClick={onInspectBrief}
          className="mt-2.5 text-[12px] text-[var(--ink-secondary)] underline decoration-[var(--rule)] underline-offset-4 hover:text-[var(--ink)]"
        >
          Read the full brief
        </button>
      </div>

      {/* A linear roster for assistive technology; the spatial arrangement is decorative. */}
      <ul className="sr-only">
        {members.map((member) => (
          <li key={member.slug}>
            {member.name}, {member.role}. {SEAT_STATE[member.status]}.
          </li>
        ))}
        <li>You, chair.</li>
        <li>{guest.name ? `${guest.name}, guest agent.` : "Guest agent place, open."}</li>
      </ul>

      <div aria-hidden>
        {members.map((member, index) => (
          <button
            type="button"
            key={member.slug}
            className="seat"
            data-state={member.status}
            style={places[index]}
            onClick={() => onMention(member.name)}
            tabIndex={-1}
            title={`${member.name} — ${member.role}`}
          >
            <div className="mx-auto w-fit">
              <Portrait initials={member.initials} size="lg" />
            </div>
            <div className="mt-2.5">
              <span className="nameplate">{member.name}</span>
            </div>
            <span className="mt-1.5 block text-[12px] leading-tight text-[var(--room-secondary)]">
              {member.status === "ready" && member.reaction
                ? REACTION[member.reaction]
                : SEAT_STATE[member.status]}
            </span>
            {member.status === "thinking" ? <span className="considering" /> : null}
          </button>
        ))}

        <div className="seat" style={CHAIR}>
          <div className="mx-auto w-fit">
            <Portrait initials="YOU" size="md" />
          </div>
          <div className="mt-2.5">
            <span className="nameplate" style={{ borderColor: "var(--human-room)" }}>
              You
            </span>
          </div>
          <span className="mt-1.5 block text-[12px] leading-tight text-[var(--room-secondary)]">
            Chair
          </span>
        </div>

        <div
          className={`seat${guestArrived ? " seat-guest-arrive" : ""}`}
          style={GUEST}
          data-state={guest.status === "empty" ? "thinking" : "ready"}
        >
          <div className="mx-auto w-fit">
            <Portrait
              initials={guest.name ? initialsFor(guest.name) : ""}
              size="md"
              variant={guest.name ? "guest" : "vacant"}
            />
          </div>
          <div className="mt-2.5">
            <span
              className="nameplate"
              style={
                guest.name
                  ? { borderColor: "var(--guest-room)", color: "var(--guest-room)" }
                  : { opacity: 0.5 }
              }
            >
              {guest.name ?? "Guest agent"}
            </span>
          </div>
          <span
            className="mt-1.5 block text-[12px] leading-tight"
            style={{ color: guest.name ? "var(--guest-room)" : "var(--room-secondary)" }}
          >
            {GUEST_STATE[guest.status]}
          </span>
        </div>
      </div>
    </div>
  );
}
