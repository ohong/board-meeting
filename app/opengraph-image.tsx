import { ImageResponse } from "next/og";

/**
 * The card a shared link renders. Paper mode, the same racetrack table the app draws, and
 * the project's full name — which appears here and on the first screen, nowhere else.
 */
export const alt = "The Best Board Meeting You’ve Ever Had";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SEATS = ["DE", "DH", "LM", "MO", "SA"];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F2EEE6",
          color: "#171714",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#B84432" }} />
          <div style={{ fontSize: 22, letterSpacing: 2, color: "#6B6659" }}>BOARD MEETING</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 78, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>
            The Best Board Meeting You’ve Ever Had
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.35, color: "#6B6659", maxWidth: 820 }}>
            Convene a board you could never normally assemble, and let your own agent take the
            last seat.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {SEATS.map((seat) => (
            <div
              key={seat}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                border: "1px solid #D8D2C6",
                backgroundColor: "#FBF9F5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color: "#6B6659",
              }}
            >
              {seat}
            </div>
          ))}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              border: "1px dashed #315EDB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#315EDB",
            }}
          >
            you
          </div>
        </div>
      </div>
    ),
    size,
  );
}
