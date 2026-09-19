/** Taksin kattokyltti, jossa kurssikäyrä: taksi + pörssi. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 18) / 28} viewBox="0 0 28 18" aria-hidden>
      <path d="M4 3.5 Q4 1 6.5 1 H21.5 Q24 1 24 3.5 L26.5 15 Q27 17 25 17 H3 Q1 17 1.5 15 Z" fill="#ffc53d" />
      <path
        d="M6 12.5 L10.5 8.5 L14 10.5 L19.5 5.5 L22 7"
        fill="none"
        stroke="#0a1322"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
