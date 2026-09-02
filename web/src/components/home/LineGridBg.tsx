export function LineGridBg({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage: `linear-gradient(var(--g-line) 1px, transparent 1px), linear-gradient(90deg, var(--g-line) 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 70% 52% at 50% 28%, black 18%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 52% at 50% 28%, black 18%, transparent 72%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: `linear-gradient(var(--g-line) 1px, transparent 1px), linear-gradient(90deg, var(--g-line) 1px, transparent 1px)`,
          backgroundSize: '168px 168px',
          maskImage: 'radial-gradient(ellipse 75% 50% at 50% 26%, black 8%, transparent 68%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 50% at 50% 26%, black 8%, transparent 68%)',
        }}
      />
    </div>
  )
}
