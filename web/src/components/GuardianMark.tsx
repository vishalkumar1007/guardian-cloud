export function GuardianMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M20 4L32 10V20.5C32 28 26.2 33.8 20 36C13.8 33.8 8 28 8 20.5V10L20 4Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="20" r="3.2" fill="currentColor" />
      <path
        d="M20 12V16.5M20 23.5V28"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  )
}
