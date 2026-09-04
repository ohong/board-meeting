/** The app's chair glyph, copied from `components/ui/icons.tsx`. */
export const ChairIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 11V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
    <rect x="4" y="11" width="16" height="5" rx="2" />
    <path d="M6 16v5M18 16v5" />
  </svg>
);
