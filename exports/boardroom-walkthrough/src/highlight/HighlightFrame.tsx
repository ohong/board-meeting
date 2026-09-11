import {CanvasImage, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Cursor} from '../components/Cursor';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};
export const HighlightFrame = ({
  image,
  kicker,
  headline,
  accent = '#ee6a4b',
  dark = true,
  cursor,
  imagePosition = 'center',
  zoom = 1.025,
}: {
  image: string;
  kicker: string;
  headline: string;
  accent?: string;
  dark?: boolean;
  cursor?: {x: number; y: number};
  imagePosition?: string;
  zoom?: number;
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: dark ? '#0a0c09' : '#f2eee5',
        color: dark ? '#f4f0e7' : '#10120f',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: interpolate(frame, [0, 8], [0.3, 1], clamp),
          scale: interpolate(frame, [0, 120], [1.035, zoom], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          }),
        }}
      >
        <CanvasImage
          src={staticFile(`assets/${image}`)}
          style={{
            width: 1920,
            height: 1200,
            objectFit: 'cover',
            objectPosition: imagePosition,
            marginTop: -60,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: dark
            ? 'linear-gradient(90deg, rgba(7,9,7,0.96) 0%, rgba(7,9,7,0.76) 34%, rgba(7,9,7,0.02) 72%)'
            : 'linear-gradient(90deg, rgba(244,240,231,0.98) 0%, rgba(244,240,231,0.8) 36%, rgba(244,240,231,0.02) 72%)',
        }}
      />

      <div style={{position: 'absolute', left: 86, top: 70, display: 'flex', alignItems: 'center', gap: 16}}>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 50,
            height: 50,
            border: `1px solid ${accent}`,
            fontFamily: 'Georgia, serif',
            fontSize: 27,
          }}
        >
          B
        </div>
        <div style={{fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.18em'}}>BOARDROOM</div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 86,
          top: 340,
          width: 750,
          opacity: interpolate(frame, [0, 8], [0, 1], clamp),
          translate: interpolate(frame, [0, 16], ['0px 46px', '0px 0px'], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div
          style={{
            color: accent,
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 25,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            marginTop: 24,
            maxWidth: 720,
            fontFamily: 'Georgia, serif',
            fontSize: 104,
            fontWeight: 500,
            letterSpacing: '-0.055em',
            lineHeight: 0.92,
          }}
        >
          {headline}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 86,
          bottom: 64,
          width: 340,
          height: 4,
          background: dark ? '#2c3029' : '#ccc5b8',
        }}
      >
        <div
          style={{
            width: `${interpolate(frame, [0, 120], [10, 100], clamp)}%`,
            height: '100%',
            background: accent,
          }}
        />
      </div>

      {cursor ? (
        <div style={{position: 'absolute', left: 0, top: -60}}>
          <Cursor x={cursor.x} y={cursor.y} />
        </div>
      ) : null}
    </div>
  );
};
