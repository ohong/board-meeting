import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { RoomStage } from "../components/RoomStage";
import { Ui } from "../components/Ui";
import { CROP } from "../shots";
import { Sfx } from "../sound";
import { ANGLES, BOARD, SHORT, STAGE } from "../cast";
import { COLOR } from "../theme";
import { ramp } from "../motion";
import { voLocal } from "../timeline";

/**
 * The guest seat.
 *
 * The camera pulls back out to the wide framing and a fifth participant arrives
 * — not on the ring, because the app does not put it there either: the agent
 * gets its own card at the edge of the room, wired to the table.
 */
const JOIN_AT = 30;

export const Seat: React.FC = () => {
  const frame = useCurrentFrame();
  const vo = voLocal("Seat");

  // Off the chair's axis: a wire straight down the middle would run through
  // the "You / Board Chair" label, which is the one seat that is not an agent.
  const wireFrom = { x: 1636, y: 690 };
  const wireTo = { x: 1668, y: 884 };

  return (
    <AbsoluteFill name="Seat">
      <Backdrop room vignette={0.06} />

      <RoomStage
        {...STAGE}
        seats={BOARD.map((member, i) => ({
          face: member.face,
          name: SHORT[i],
          org: member.org,
          angle: ANGLES[i],
          at: -30,
        }))}
      />

      {/* The wire from the room to the agent's card. */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={`M ${wireFrom.x} ${wireFrom.y} C ${wireFrom.x} ${wireFrom.y + 80} ${wireTo.x} ${
            wireTo.y - 80
          } ${wireTo.x} ${wireTo.y}`}
          fill="none"
          stroke={COLOR.live}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={240}
          strokeDashoffset={240 * (1 - ramp(frame, JOIN_AT - 8, 18, 0, 1))}
          opacity={0.6}
        />
      </svg>

      <div style={{ position: "absolute", left: 1438, top: 882 }}>
        <Ui
          crop={CROP.codexConnected}
          width={462}
          at={JOIN_AT}
          enter="land"
          radius={22}
          name="Guest agent"
        />
      </div>

      <AbsoluteFill style={{ paddingLeft: 120, justifyContent: "center" }}>
        <div style={{ width: 640 }}>
          <Caption
            eyebrow="The part nobody else does"
            headline={"Your own agent\ntakes a seat."}
            sub="Not a screenshot of one. The same room, from its own browser."
            delay={vo - 12}
            size={78}
          />
        </div>
      </AbsoluteFill>

      <Sfx name="whoosh" at={JOIN_AT - 8} gain={0.6} />
      <Sfx name="unlock" at={JOIN_AT} />
    </AbsoluteFill>
  );
};
