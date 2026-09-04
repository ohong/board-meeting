import { AbsoluteFill } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { RoomStage } from "../components/RoomStage";
import { Sfx } from "../sound";
import { STAGE } from "../cast";
import { memberAngles } from "../seat-layout";
import { voLocal } from "../timeline";

/**
 * An empty table.
 *
 * The film opens on what the product is actually about: a room with one person
 * in it and five chairs nobody is sitting in. Everything after this is that room
 * filling up. The headline tracks the voiceover almost word for word, because X
 * autoplays muted and most of the audience will never hear the read.
 */
export const Open: React.FC = () => {
  const vo = voLocal("Open");

  return (
    <AbsoluteFill name="Open">
      <Backdrop room vignette={0.06} />

      <RoomStage seats={[]} empty={memberAngles(5)} emptyAt={30} drawAt={0} {...STAGE} />

      <AbsoluteFill style={{ paddingLeft: 120, justifyContent: "center" }}>
        <div style={{ width: 620 }}>
          <Caption
            headline={"One decision\nyou shouldn't\nmake alone."}
            sub="Five empty chairs and a deadline."
            delay={vo - 14}
            size={86}
          />
        </div>
      </AbsoluteFill>

      <Sfx name="whoosh" at={0} />
      <Sfx name="ring" at={31} gain={0.9} />
    </AbsoluteFill>
  );
};
