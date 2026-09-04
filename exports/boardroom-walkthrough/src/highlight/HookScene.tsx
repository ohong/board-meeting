import {CanvasImage, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

export const HookScene = () => {
  const frame = useCurrentFrame();

  return (
    <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0a0c09'}}>
      <CanvasImage
        src={staticFile('assets/deployed/07-executive-memo.png')}
        style={{
          width: 1920,
          height: 1200,
          objectFit: 'cover',
          marginTop: -60,
          filter: 'brightness(0.37) saturate(0.85)',
          scale: interpolate(frame, [0, 36], [1.14, 1.07], {
            ...clamp,
            output: 'perceptual-scale',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 70% 45%, rgba(10,12,9,0.08), rgba(10,12,9,0.84) 72%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 78,
          color: '#f0d482',
          fontFamily: 'monospace',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.18em',
          opacity: interpolate(frame, [0, 4], [0, 1], clamp),
        }}
      >
        A BOARD MEETING. ON DEMAND.
      </div>
      <div
        style={{
          position: 'absolute',
          left: 82,
          right: 82,
          top: 290,
          color: '#f5f1e8',
          fontFamily: 'Georgia, serif',
          fontSize: 144,
          lineHeight: 0.91,
          letterSpacing: '-0.062em',
          opacity: interpolate(frame, [0, 6], [0, 1], clamp),
          translate: interpolate(frame, [0, 12], ['0px 56px', '0px 0px'], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Your hardest decision.
        <br />
        <span style={{color: '#ee6a4b'}}>A whole board.</span>
      </div>
    </div>
  );
};
