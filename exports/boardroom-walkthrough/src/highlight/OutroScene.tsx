import {CanvasImage, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';

const cards = [
  {src: 'deployed/04-live-boardroom.png', rotate: '-5deg', x: -460, y: 18},
  {src: 'deployed/07-executive-memo.png', rotate: '4deg', x: 455, y: 38},
];

export const OutroScene = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 45%, #22251e 0%, #10120f 44%, #070907 100%)',
        color: '#f5f1e8',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {cards.map((card, index) => (
        <div
          key={card.src}
          style={{
            position: 'absolute',
            left: '50%',
            top: 215,
            width: 810,
            height: 506,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 34px 90px rgba(0,0,0,0.52)',
            translate: `${card.x}px ${card.y + interpolate(frame, [0, 120], [36, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px`,
            rotate: card.rotate,
            opacity: interpolate(frame, [index * 4, index * 4 + 14], [0, 0.55], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <CanvasImage src={staticFile(`assets/${card.src}`)} style={{width: 810, height: 506}} />
        </div>
      ))}

      <div style={{position: 'absolute', inset: 0, background: 'rgba(7,9,7,0.45)'}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          opacity: interpolate(frame, [4, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          scale: interpolate(frame, [0, 26], [0.94, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            output: 'perceptual-scale',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 82,
            height: 82,
            border: '1px solid #f0d482',
            fontFamily: 'Georgia, serif',
            fontSize: 45,
          }}
        >
          B
        </div>
        <div style={{marginTop: 28, fontFamily: 'monospace', fontSize: 25, letterSpacing: '0.22em', color: '#f0d482'}}>BOARDROOM</div>
        <div style={{marginTop: 34, fontFamily: 'Georgia, serif', fontSize: 112, lineHeight: 0.94, letterSpacing: '-0.055em'}}>
          Bring your hardest
          <br />
          decision.
        </div>
        <div style={{marginTop: 34, fontSize: 35, color: '#c7c3ba'}}>Leave with a way forward.</div>
      </div>
    </div>
  );
};
