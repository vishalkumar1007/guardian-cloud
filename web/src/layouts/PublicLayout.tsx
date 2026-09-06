import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Moon, Sun, ShieldCheck } from 'lucide-react'
import { GuardianMark } from '../components/GuardianMark'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'
import { useTheme } from '../theme/useTheme'

export function PublicLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isAuth = location.pathname === '/login' || location.pathname === '/signup'
  const [scrolled, setScrolled] = useState(false)
  const { isDark, toggleColorMode } = useTheme()

  useEffect(() => {
    let ticking = false
    const update = () => {
      ticking = false
      if (!isHome) {
        setScrolled(true)
        return
      }
      setScrolled(window.scrollY > window.innerHeight * 0.15)
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
    }
  }, [isHome])

  return (
    <div className={cn('g-atmosphere g-public-shell relative min-h-screen', isHome && 'g-landing', isAuth && 'g-auth-shell')}>
      {!isAuth && <header className={cn('g-public-nav', scrolled && 'scrolled')}>
        <div className="g-public-nav-inner">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 text-ink no-underline">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal text-mist-deep shadow-sm">
              <GuardianMark className="h-5 w-5" />
            </span>
            <span className="font-display text-[15px] font-bold tracking-tight md:text-[17px]">Guardian</span>
          </Link>

          <nav className="g-public-nav-links" aria-label="Primary">
            {isHome ? (
              <>
                <a href="#what">What</a>
                <a href="#portals">Portals</a>
                <a href="#how">How</a>
                <a href="#plans">Plans</a>
                <a href="#faq">FAQ</a>
              </>
            ) : (
              <>
                <Link to="/">Home</Link>
                <Link to="/signup">Start</Link>
              </>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleColorMode}
              className="rounded-full"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full hidden lg:inline-flex gap-1.5">
              <Link to="/super/login"><ShieldCheck className="h-3.5 w-3.5" /> Super Admin</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full hidden sm:inline-flex">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild variant="signal" size="sm" className="rounded-full shadow-[0_4px_14px_color-mix(in_srgb,var(--g-signal)_28%,transparent)]">
              <Link to="/signup">Start watchline</Link>
            </Button>
          </div>
        </div>
      </header>}

      <main className="relative z-10">
        <Outlet />
      </main>

      {!isAuth && <footer className="relative z-10 border-t border-line bg-surface/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal text-mist-deep shadow-sm">
                  <GuardianMark className="h-5 w-5" />
                </span>
                <span className="font-display text-lg font-bold tracking-tight">Guardian</span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
                Continuous endpoint security for people and organizations. Presence, signals, protect — one watchline.
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink-soft">© {new Date().getFullYear()} Guardian Cloud</p>
            </div>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">Product</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="/#what" className="text-ink-soft no-underline hover:text-ink transition-colors">What is Guardian</a></li>
                <li><a href="/#portals" className="text-ink-soft no-underline hover:text-ink transition-colors">Portals</a></li>
                <li><a href="/#product" className="text-ink-soft no-underline hover:text-ink transition-colors">Capabilities</a></li>
                <li><a href="/#plans" className="text-ink-soft no-underline hover:text-ink transition-colors">Plans</a></li>
                <li><a href="/#faq" className="text-ink-soft no-underline hover:text-ink transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">Platform</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link to="/login" className="text-ink-soft no-underline hover:text-ink transition-colors">Sign in</Link></li>
                <li><Link to="/signup" className="text-ink-soft no-underline hover:text-ink transition-colors">Create account</Link></li>
                <li><Link to="/super/login" className="inline-flex items-center gap-1.5 text-ink-soft no-underline hover:text-ink transition-colors"><ShieldCheck className="h-3 w-3 text-signal" /> Super Admin Console</Link></li>
                <li><a href="/#how" className="text-ink-soft no-underline hover:text-ink transition-colors">How it works</a></li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">Appearance</p>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">Sun / moon in the nav toggles light and dark. Saved on this device and synced to your theme.</p>
              <div className="mt-4 flex items-center gap-2 rounded-full border border-line bg-mist/30 px-3 py-2 w-fit">
                <span className={`h-2 w-2 rounded-full ${isDark ? 'bg-signal' : 'bg-amber-500'}`} />
                <span className="font-mono text-xs text-ink-soft">{isDark ? 'Dark mode' : 'Light mode'} active</span>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">Guardian Cloud — Continuous security</p>
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-ink-soft">
              <a href="#" className="hover:text-ink transition-colors no-underline">Privacy</a>
              <span className="h-3 w-px bg-line" />
              <a href="#" className="hover:text-ink transition-colors no-underline">Terms</a>
              <span className="h-3 w-px bg-line" />
              <a href="#" className="hover:text-ink transition-colors no-underline">Security</a>
            </div>
          </div>
        </div>
      </footer>}
    </div>
  )
}
