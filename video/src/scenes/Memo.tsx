import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { BottomFade } from "../components/BottomFade";
import { Ui } from "../components/Ui";
import { CROP } from "../shots";
import { Sfx } from "../sound";
import { COLOR } from "../theme";
import { fadeIn, ramp } from "../motion";
import { voLocal } from "../timeline";

/**
 * The memo.
 *
 * The recommendation is the real one, dissent flag and all — and the film points
 * at the dissent rather than at the recommendation, because "the board is
 * divided" surviving into the deliverable is the part of the product a viewer
 * would not expect.
 */
const REC_W = 1500;
const REC_LEFT = (1920 - REC_W) / 2;
const REC_TOP = 336;
const REC_H = (CROP.recommendation.h * REC_W) / CROP.recommendation.w;

export const Memo: React.FC = () => {
  const frame = useCurrentFrame();
  const vo = voLocal("Memo");

  return (
    <AbsoluteFill name="Memo">
      <Backdrop vignette={0.05} />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 92 }}>
        <Caption
          eyebrow="Step 3 · Executive memo"
          headline="You end it. Not the board."
          delay={vo - 12}
          size={70}
          align="center"
          maxWidth={1500}
        />
      </AbsoluteFill>

      <div style={{ position: "absolute", left: REC_LEFT, top: REC_TOP }}>
        <Ui
          crop={CROP.recommendation}
          width={REC_W}
          at={14}
          radius={24}
          floatPhase={0.2}
          name="Recommendation"
        />
      </div>

      {/* The one annotation in the film. */}
      <div
        style={{
          position: "absolute",
          left: REC_LEFT,
          top: REC_TOP + REC_H + 22,
          width: REC_W,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: fadeIn(frame, 58, 14),
        }}
      >
        <div
          style={{
            width: ramp(frame, 58, 24, 0, 300),
            height: 2,
            background: COLOR.dissent,
            opacity: 0.55,
          }}
        />
        <span style={{ fontSize: 30, fontWeight: 600, color: COLOR.dissent, whiteSpace: "nowrap" }}>
          the disagreement, left in
        </span>
        <div
          style={{
            flex: 1,
            height: 2,
            background: COLOR.dissent,
            opacity: 0.18,
          }}
        />
      </div>

      {/* The rest of the memo, running off the bottom of the frame. */}
      <div style={{ position: "absolute", left: REC_LEFT, top: REC_TOP + REC_H + 96, display: "flex", gap: 60 }}>
        <Ui crop={CROP.optionsCol} width={720} at={78} radius={20} shadow={false} name="Options" />
        <Ui crop={CROP.tradeoffsCol} width={720} at={90} radius={20} shadow={false} name="Tradeoffs" />
      </div>

      <BottomFade from={70} />

      <Sfx name="whoosh" at={10} gain={0.6} />
      <Sfx name="boom" at={58} gain={0.7} />
      <Sfx name="tap" at={78} gain={0.6} />
      <Sfx name="tap" at={90} gain={0.6} />
    </AbsoluteFill>
  );
};
