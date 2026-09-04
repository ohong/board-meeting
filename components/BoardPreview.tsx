import type { CatalogMember } from "@/lib/types";
import { Portrait } from "./Portrait";

const PREVIEW_SEATS = Array.from({ length: 6 }, (_, index) => index);

export function BoardPreview({
  members,
  compact = false,
}: {
  members: CatalogMember[];
  compact?: boolean;
}) {
  return (
    <section
      className={`board-preview ${compact ? "board-preview-compact" : ""}`}
      aria-label={`Your board, ${members.length} of 6 advisers selected`}
    >
      <div className="board-preview-heading">
        <h2>Your board</h2>
        <span>{members.length} of 6</span>
      </div>

      <div className="preview-stage">
        <div className="preview-table" aria-hidden="true">
          <span>Decision table</span>
        </div>
        <div className="preview-seats">
          {PREVIEW_SEATS.map((index) => {
            const member = members[index];
            return (
              <div
                className={`preview-seat preview-seat-${index + 1} ${member ? "is-filled" : ""}`}
                key={member?.slug ?? `open-seat-${index}`}
              >
                {member ? (
                  <>
                    <Portrait
                      slug={member.slug}
                      name={member.name}
                      initials={member.initials}
                      size="preview"
                    />
                    <span className="preview-nameplate">{member.name}</span>
                  </>
                ) : (
                  <span className="preview-open-seat" aria-label={`Open adviser seat ${index + 1}`}>
                    <i aria-hidden="true" />
                    Open seat
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="chair-anchor">
          <span className="chair-mark" aria-hidden="true">
            Y
          </span>
          <span>
            <strong>You</strong>
            <small>Chair</small>
          </span>
        </div>
      </div>
    </section>
  );
}
