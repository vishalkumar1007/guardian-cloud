type PlaceholderPageProps = {
  title: string
  purpose: string
  hint?: string
}

export function PlaceholderPage({ title, purpose, hint }: PlaceholderPageProps) {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 text-base text-ink-soft">{purpose}</p>
      {hint ? (
        <div className="mt-10 border-t border-line pt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Coming next</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{hint}</p>
        </div>
      ) : null}
    </div>
  )
}
