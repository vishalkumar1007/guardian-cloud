export function GuardianMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        {/* Left facet gradient: creates chiseled light & shadow depth */}
        <linearGradient id="gm-facet-l" x1="7" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
        </linearGradient>

        {/* Right facet gradient: complementary depth with 'G' return */}
        <linearGradient id="gm-facet-r" x1="33" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.65" />
        </linearGradient>

        {/* Luminous diamond core */}
        <linearGradient id="gm-core" x1="16" y1="12" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.9" />
        </linearGradient>

        {/* Inner ambient glow filter */}
        <filter id="gm-glow" x="12" y="8" width="16" height="24" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Left Shield Wing — Architectural facet with sharp bevel */}
      <path
        d="M19 4.2L8.2 8.9C7.4 9.2 7 10 7 11V20.5C7 27.8 12.1 33.9 19 36V28.5C14.6 26.8 11.5 22.5 11.5 17.5V12.4L19 9.1V4.2Z"
        fill="url(#gm-facet-l)"
      />

      {/* Right Shield Wing — Seamlessly integrates the proud 'G' monogram crossbar */}
      <path
        d="M21 4.2V9.1L28.5 12.4V17.5C28.5 21.2 26.4 24.5 23.2 26.2L23.2 21H19.5V25.2H21.5C21.3 26.4 21 27.5 21 28.5V36C27.9 33.9 33 27.8 33 20.5V11C33 10 32.6 9.2 31.8 8.9L21 4.2Z"
        fill="url(#gm-facet-r)"
      />

      {/* Center Sentinel Diamond — Cryptographic Watchline Beacon */}
      <path
        d="M20 11.5L24.5 17L20 22.5L15.5 17L20 11.5Z"
        fill="url(#gm-core)"
      />

      {/* Precision Core Signal Dot */}
      <circle cx="20" cy="17" r="1.6" fill="currentColor" />

      {/* Upper stealth notch accent */}
      <path
        d="M18.5 4.5L20 3L21.5 4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.5"
      />
    </svg>
  )
}
