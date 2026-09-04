import { AbsoluteFill, Interactive, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { RoomStage } from "../components/RoomStage";
import { Ui } from "../components/Ui";
import { CROP } from "../shots";
import { Sfx } from "../sound";
import { ANGLES, BOARD, SHORT, STAGE } from "../cast";
import { COLOR, SHADOW_FLOAT } from "../theme";
import { fadeIn, land, rise } from "../motion";
import { voLocal } from "../timeline";

/**
 * The room fills.
 *
 * Each real catalog card is dealt into the same slot and, on the same frame, the
 * matching seat flies onto the ring. The one-to-one is the whole point: what you
 * pick in the list is who is sitting at the table.
 */
const SEAT_AT = [14, 46, 78];

export const Board: React.FC = () => {
  const frame = useCurrentFrame();
  const vo = voLocal("Board");

  const cards = [CROP.cardEk, CROP.cardDhh, CROP.cardLulu];

  return (
    <AbsoluteFill name="Board">
      <Backdrop room vignette={0.06} />

      <RoomStage
        {...STAGE}
        seats={BOARD.map((member, i) => ({
          face: member.face,
          name: SHORT[i],
          org: member.org,
          angle: ANGLES[i],
          at: SEAT_AT[i],
        }))}
      />

      <AbsoluteFill style={{ paddingLeft: 120, paddingTop: 156 }}>
        <div style={{ width: 660 }}>
          <Caption
            eyebrow="Step 1 · Board setup"
            headline="Build the room."
            sub="Three to six advisers, each arguing from their own public record."
            delay={vo - 12}
            size={82}
          />

          {/* The catalog, dealt one card at a time into the same slot. */}
          <div style={{ position: "relative", height: 250, marginTop: 62 }}>
            {cards.map((crop, i) => {
              const at = SEAT_AT[i] - 4;
              const gone = i < cards.length - 1 ? SEAT_AT[i + 1] - 4 : 9999;
              return (
                <div
                  key={crop.x}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    opacity: fadeIn(frame, at, 12) * (frame < gone ? 1 : 0),
                    translate: `0px ${rise(frame, at, 40, 22)}px`,
                  }}
                >
                  <Ui crop={crop} width={700} at={at} enter="none" name={`Adviser ${i + 1}`} />
                </div>
              );
            })}
          </div>

          <Interactive.Div
            name="Counter"
            style={{
              marginTop: 30,
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 30px",
              borderRadius: 9999,
              background: COLOR.ink,
              color: COLOR.surface,
              fontSize: 27,
              fontWeight: 600,
              boxShadow: SHADOW_FLOAT,
              opacity: fadeIn(frame, 116, 12),
              scale: land(frame, 116, 0.84, 18),
            }}
          >
            3 of 6 seated · Start Board Meeting →
          </Interactive.Div>
        </div>
      </AbsoluteFill>

      {SEAT_AT.map((at) => (
        <Sfx key={at} name="tap" at={at} />
      ))}
      <Sfx name="click" at={116} gain={0.7} />
    </AbsoluteFill>
  );
};
