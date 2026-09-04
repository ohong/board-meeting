import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { RoomStage } from "../components/RoomStage";
import { Ui } from "../components/Ui";
import { CROP } from "../shots";
import { Sfx } from "../sound";
import { ANGLES, BOARD, SHORT } from "../cast";
import { speechCardPoint } from "../seat-layout";
import { fadeIn, ramp } from "../motion";
import { voLocal } from "../timeline";

/**
 * The room opens.
 *
 * The camera is in close enough that the table runs off both edges, which is the
 * only shot in the film that feels like a room rather than a screen. The arc
 * drawn between two seats is the beat the product exists for: these advisers
 * answer each other, not the chair.
 */
const CX = 990;
const CY = 596;
const S = 1.86;

const ARC_AT = 40;
const SPEAK_AT = 22;

export const Argue: React.FC = () => {
  const frame = useCurrentFrame();
  const vo = voLocal("Argue");

  const card = speechCardPoint(ANGLES[2]);

  return (
    <AbsoluteFill name="Argue">
      <Backdrop room vignette={0.08} />

      <RoomStage
        cx={CX}
        cy={CY}
        scale={S}
        spotlightAngle={ANGLES[2]}
        spotlightAt={SPEAK_AT}
        arc={{ from: ANGLES[0], to: ANGLES[1], at: ARC_AT }}
        seats={BOARD.map((member, i) => ({
          face: member.face,
          name: SHORT[i],
          org: member.org,
          angle: ANGLES[i],
          at: -30,
          speaking: i === 2,
          dim: i !== 2,
          pill:
            i === 0
              ? { label: "Concerned", tone: "warn" as const, at: 8 }
              : i === 1
                ? { label: "Wants to respond", tone: "warn" as const, at: 16 }
                : { label: "Speaking", tone: "ink" as const, at: SPEAK_AT },
        }))}
      >
        {/* The live turn, on the table in front of whoever holds the floor. */}
        <div
          style={{
            position: "absolute",
            left: CX + card.x * S,
            top: CY + card.y * S,
            transform: "translate(-50%, -50%)",
            opacity: fadeIn(frame, SPEAK_AT + 4, 14),
            scale: ramp(frame, SPEAK_AT + 4, 22, 0.9, 1),
          }}
        >
          <Ui
            crop={CROP.speechCard}
            width={540}
            at={SPEAK_AT + 4}
            enter="none"
            radius={18}
            name="Live turn"
          />
        </div>
      </RoomStage>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 66 }}>
        <Caption
          headline="Then they go at each other."
          delay={vo - 12}
          size={64}
          align="center"
          maxWidth={1500}
        />
      </AbsoluteFill>

      {/* The product's own word for it, lifted out of the minutes. */}
      <div style={{ position: "absolute", right: 56, bottom: 74 }}>
        <Ui
          crop={CROP.interrupting}
          width={600}
          at={ARC_AT + 12}
          enter="land"
          tilt={-1.6}
          floatPhase={0.4}
          name="Interrupting"
        />
      </div>

      <Sfx name="unlock" at={2} gain={0.8} />
      <Sfx name="tap" at={8} gain={0.7} />
      <Sfx name="tap" at={16} gain={0.7} />
      <Sfx name="whoosh" at={ARC_AT} gain={0.55} />
      <Sfx name="pop" at={ARC_AT + 12} />
    </AbsoluteFill>
  );
};
