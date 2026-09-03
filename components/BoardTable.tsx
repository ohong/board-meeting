"use client";

import { LetterMark, initialsFor } from "./LetterMark";
import { Reaction } from "./Reaction";
import type { GuestSeat, MemberSeat } from "@/lib/session";
import type { SeatStatus } from "@/lib/types";

const SEAT_STATUS: Record<SeatStatus, string> = {
  thinking: "Forming a view",
  ready: "",
  speaking: "Speaking",
  wants_to_respond: "Wants the floor",
  reconnecting: "Reconnecting",
};

const GUEST_STATUS: Record<GuestSeat["status"], string> = {
  empty: "Seat reserved",
  waiting: "Awaiting your agent",
  joining: "Joining",
  joined: "Joined via WebMCP",
  contributing: "Adding context",
  asking: "Asking a question",
};

/**
 * Seats sit on an ellipse. The chair takes the near edge, advisers fill the far arc, and
 * the guest seat sits at the near left so an arrival is unmissable. Angles are measured
 * clockwise from the right, screen coordinates, so 90 is the bottom and 270 the top.
 */
function place(angleDeg: number): { left: string; top: string } {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    left: `${50 + Math.cos(radians) * 40}%`,
    top: `${50 + Math.sin(radians) * 30}%`,
  };
}

function adviserAngles(count: number): number[] {
  if (count <= 1) return [270];
  const start = 202;
  const end = 338;
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, index) => start + step * index);
}

export function BoardTable({
  members,
  guest,
  chairLabel,
  onMention,
}: {
  members: MemberSeat[];
  guest: GuestSeat;
  chairLabel: string;
  onMention: (name: string) => void;
}) {
  const angles = adviserAngles(members.length);

  return (
    <div className="relative w-full h-full">
      <div className="table-surface">
        <div className="table-crest">
          In session
          <div className="mt-1 text-[9px] tracking-[0.2em] opacity-70">The Board</div>
        </div>
      </div>

      {members.map((member, index) => (
        <button
          type="button"
          key={member.slug}
          className="seat"
          data-status={member.status}
          style={place(angles[index])}
          onClick={() => onMention(member.name)}
          title={`${member.name} — ${member.role}. Click to address them.`}
        >
          <div className="mx-auto w-fit">
            <LetterMark initials={member.initials} seed={member.slug} />
          </div>
          <strong className="seat-name">{member.name}</strong>
          <span className="nameplate">{member.house}</span>
          <span className="status-line">
            {member.status === "ready" && member.reaction ? (
              <Reaction kind={member.reaction} />
            ) : (
              SEAT_STATUS[member.status]
            )}
          </span>
        </button>
      ))}

      <div className="seat" data-guest={guest.status} style={place(148)}>
        <div className="mx-auto w-fit">
          {guest.name ? (
            <LetterMark initials={initialsFor(guest.name)} variant="guest" />
          ) : (
            <LetterMark initials="＋" variant="vacant" />
          )}
        </div>
        <strong className="seat-name" style={guest.name ? { color: "var(--guest)" } : undefined}>
          {guest.name ?? "Guest seat"}
        </strong>
        <span className="nameplate" style={{ opacity: guest.name ? 1 : 0.5 }}>
          {guest.name ? "External agent" : "Your agent"}
        </span>
        <span className="status-line" style={guest.name ? { color: "var(--guest)" } : undefined}>
          {GUEST_STATUS[guest.status]}
        </span>
      </div>

      <div className="seat" style={place(90)}>
        <div className="mx-auto w-fit">
          <LetterMark initials="YOU" size="md" />
        </div>
        <strong className="seat-name">You</strong>
        <span className="nameplate">Chair</span>
        <span className="status-line">{chairLabel}</span>
      </div>
    </div>
  );
}
