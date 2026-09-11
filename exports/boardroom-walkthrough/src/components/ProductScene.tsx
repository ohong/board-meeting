import {CanvasImage, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Cursor} from './Cursor';

export type ProductSceneProps = {
  image: string;
  eyebrow: string;
  title: string;
  detail: string;
  sceneNumber: string;
  accent?: string;
  cursor?: {x: number; y: number};
  zoom?: number;
  shiftX?: number;
  shiftY?: number;
};

export const ProductScene = ({
  image,
  eyebrow,
  title,
  detail,
  sceneNumber,
  accent = '#e16e57',
  cursor,
  zoom = 1.01,
  shiftX = 0,
  shiftY = 0,
}: ProductSceneProps) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 70% 40%, #242820 0%, #10120f 42%, #080a08 100%)',
        color: '#f5f2eb',
        fontFamily: 'Arial, Helvetica, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 74,
          top: 72,
          width: 300,
          height: 930,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <div style={{display: 'grid', placeItems: 'center', width: 52, height: 52, border: '1px solid #9d8255', fontFamily: 'Georgia, serif', fontSize: 28}}>B</div>
          <div style={{fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.16em', color: '#b8b4aa'}}>BOARDROOM</div>
        </div>
        <div style={{marginTop: 112}}>
          <div style={{fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent}}>{eyebrow}</div>
          <h1
            style={{
              margin: '26px 0 0',
              fontFamily: 'Georgia, serif',
              fontSize: 66,
              lineHeight: 0.98,
              letterSpacing: '-0.045em',
              opacity: interpolate(frame, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              translate: interpolate(frame, [0, 16], ['0px 24px', '0px 0px'], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            {title}
          </h1>
          <p style={{margin: '28px 0 0', fontSize: 28, lineHeight: 1.35, color: '#bbb8af'}}>{detail}</p>
        </div>
        <div style={{marginTop: 'auto', paddingBottom: 12}}>
          <div style={{width: 300, height: 2, background: '#33362f'}}>
            <div style={{width: `${(Number(sceneNumber) / 7) * 100}%`, height: '100%', background: accent}} />
          </div>
          <div style={{marginTop: 14, fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.12em', color: '#777b70'}}>0{sceneNumber} / 07</div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 430,
          top: 90,
          width: 1440,
          height: 900,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 38px 90px rgba(0,0,0,0.48)',
          backgroundColor: '#f4f1ea',
        }}
      >
        <CanvasImage
          src={staticFile(`assets/${image}`)}
          style={{
            width: 1440,
            height: 900,
            scale: interpolate(frame, [0, 220], [1, zoom], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              output: 'perceptual-scale',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(frame, [0, 220], ['0px 0px', `${shiftX}px ${shiftY}px`], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        />
        {cursor ? <Cursor x={cursor.x} y={cursor.y} /> : null}
      </div>
    </div>
  );
};
