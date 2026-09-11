import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const captions = [
  {start: 0, end: 5.4, text: 'Shjavokhir and I built Boardroom to help you make better high-stakes decisions.'},
  {start: 5.4, end: 8.2, text: 'Assemble and consult your own Board of Directors.'},
  {start: 8.8, end: 10.1, text: 'Here’s how it works.'},
  {start: 11.2, end: 13.5, text: 'First, pick who you want on your board.'},
  {start: 14, end: 16.4, text: 'In this scenario, let’s say I’m Sundar at Google.'},
  {start: 16.9, end: 22.1, text: 'What should Alphabet do to lead the AI race?'},
  {start: 22.9, end: 28.4, text: 'Each board member is an AI agent grounded in that person’s body of work and interviews.'},
  {start: 28.9, end: 32.5, text: 'Each one notices different things and asks different questions.'},
  {start: 33.2, end: 36.8, text: 'They discuss the decision with me—and amongst each other.'},
  {start: 37.1, end: 41.5, text: 'Different experts see what I might have missed.'},
  {start: 41.9, end: 46.4, text: 'With native WebMCP, I can invite my own AI assistant.'},
  {start: 46.7, end: 49.3, text: 'Just like inviting someone to a virtual conference.'},
  {start: 50, end: 52.6, text: 'Codex is now participating in the discussion.'},
  {start: 53.5, end: 59.2, text: 'I leave with a clear recommendation, trade-offs, open questions, and next steps.'},
  {start: 59.2, end: 60, text: 'That’s Boardroom.'},
] as const;

export const CaptionLayer = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const caption = captions.find(({start, end}) => seconds >= start && seconds < end);

  if (!caption) return null;

  const startFrame = caption.start * fps;
  const endFrame = caption.end * fps;
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 4, endFrame - 4, endFrame],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: 470,
        right: 40,
        bottom: 34,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1260,
          padding: '10px 22px 12px',
          borderRadius: 9,
          background: 'rgba(7, 8, 7, 0.88)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
          color: '#fffdf5',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 38,
          fontWeight: 650,
          lineHeight: 1.18,
          letterSpacing: '-0.018em',
          textAlign: 'center',
          textWrap: 'balance',
        }}
      >
        {caption.text}
      </div>
    </div>
  );
};
