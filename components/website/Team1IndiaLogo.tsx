"use client";

export function Team1IndiaLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 580 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Team1 India"
    >
      {/* "team" in white bold */}
      <text
        x="0"
        y="64"
        fill="white"
        fontFamily="var(--font-kanit), sans-serif"
        fontWeight="700"
        fontSize="72"
        letterSpacing="-2"
      >
        team
      </text>

      {/* "1" red block - the distinctive Team1 mark */}
      <g transform="translate(210, 4)">
        {/* Top horizontal bar */}
        <rect x="0" y="0" width="42" height="20" rx="3" fill="#ff394a" />
        {/* Vertical bar */}
        <rect x="22" y="0" width="20" height="62" rx="3" fill="#ff394a" />
      </g>

      {/* "India" in white bold */}
      <text
        x="265"
        y="64"
        fill="white"
        fontFamily="var(--font-kanit), sans-serif"
        fontWeight="700"
        fontSize="72"
        letterSpacing="-2"
      >
        India
      </text>
    </svg>
  );
}
