import type { Plane } from '../lib/apiClient'
import { ssoStartURL, useSSOProviders, type SSOProvider } from './useSSOProviders'

/** Brand marks, since lucide-react v1 no longer ships logo icons. */
function GoogleMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.08Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H1.13v2.84C2.93 20.98 7.26 23 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.97 6.97 0 0 1 5.46 12c0-.74.13-1.46.38-2.11V7.05H1.13A10.99 10.99 0 0 0 0 12c0 1.78.42 3.45 1.13 5.05l4.71-2.94Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.26 1 2.93 3.02 1.13 7.05l4.71 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

function GitHubMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  )
}

function ProviderMark({ vendor }: { vendor: SSOProvider['vendor'] }) {
  if (vendor === 'GOOGLE') return <GoogleMark />
  if (vendor === 'GITHUB') return <GitHubMark />
  // Generic OIDC providers get a neutral key mark.
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 7a5 5 0 1 0-4.9 6H12v3h3v3h4v-4l-3.2-3.2A5 5 0 0 0 15 7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The social sign-in buttons on a login page.
 *
 * Entirely driven by what a super admin has enabled for this plane, so nothing
 * renders until a provider is configured — and turning one on in Platform
 * Settings makes it appear here without a deploy.
 *
 * These are links, not buttons with click handlers: sign-in is a top-level
 * navigation away to the provider and back, which a fetch cannot do.
 */
export function SSOButtons({
  plane,
  redirectAfter,
  className = '',
  // Each sign-in page words its own divider; defaulting here rather than
  // imposing one keeps this component from altering a page's design.
  dividerLabel = 'or continue with',
}: {
  plane: Plane
  redirectAfter?: string
  className?: string
  dividerLabel?: string
}) {
  const { providers, loading } = useSSOProviders(plane)

  // Render nothing at all while loading or when none are configured, so the
  // page does not reserve space for a divider that never gets a button.
  if (loading || providers.length === 0) return null

  return (
    <div className={className}>
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-soft">
          {dividerLabel}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className={providers.length > 1 ? 'grid grid-cols-2 gap-2' : 'grid gap-2'}>
        {providers.map((provider) => (
          <a
            key={provider.slug}
            href={ssoStartURL(plane, provider.slug, redirectAfter)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-xs font-semibold text-ink no-underline transition-colors hover:bg-surface"
          >
            <ProviderMark vendor={provider.vendor} />
            {providers.length > 1 ? provider.display_name : provider.button_label}
          </a>
        ))}
      </div>
    </div>
  )
}
