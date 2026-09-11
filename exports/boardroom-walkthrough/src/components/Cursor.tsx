import {Easing, interpolate, useCurrentFrame} from 'remotion';

export const Cursor = ({x, y}: {x: number; y: number}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x - 18,
          top: y - 18,
          width: 36,
          height: 36,
          borderRadius: 999,
          border: '3px solid rgba(255,255,255,0.9)',
          opacity: interpolate(frame, [16, 26, 40], [0, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [16, 28, 40], [0.6, 1.35, 1.7], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            output: 'perceptual-scale',
          }),
          boxShadow: '0 0 0 8px rgba(124,156,255,0.16)',
        }}
      />
      <svg
        viewBox="0 0 32 40"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 32,
          height: 40,
          filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.45))',
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          translate: interpolate(frame, [0, 30], ['22px 18px', '0px 0px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <path d="M3 2L28 23H17L12 37L6 34L11 21H3V2Z" fill="white" stroke="#111" strokeWidth="2" />
      </svg>
    </>
  );
};
