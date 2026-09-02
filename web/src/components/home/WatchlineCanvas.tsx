import { useEffect, useRef } from 'react'

type Node = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  pulse: number
}

/**
 * Soft presence mesh for the marketing hero — drifting spine nodes linked by
 * faint signal lines. Theme-aware via --g-signal / --g-ink CSS vars.
 */
export function WatchlineCanvas({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let nodes: Node[] = []
    let w = 0
    let h = 0

    function readColor(varName: string, fallback: string) {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      return raw || fallback
    }

    function resize() {
      const parent = canvas!.parentElement
      if (!parent) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = parent.clientWidth
      h = parent.clientHeight
      canvas!.width = Math.floor(w * dpr)
      canvas!.height = Math.floor(h * dpr)
      canvas!.style.width = `${w}px`
      canvas!.style.height = `${h}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.max(14, Math.floor((w * h) / 38000))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 1.2 + Math.random() * 2.2,
        pulse: Math.random() * Math.PI * 2,
      }))
    }

    function frame(t: number) {
      const signal = readColor('--g-signal', '#0f766e')
      const ink = readColor('--g-ink', '#0b1220')
      ctx!.clearRect(0, 0, w, h)

      // soft vignette wash
      const wash = ctx!.createRadialGradient(w * 0.5, h * 0.2, 0, w * 0.5, h * 0.35, Math.max(w, h) * 0.7)
      wash.addColorStop(0, hexAlpha(signal, 0.07))
      wash.addColorStop(1, 'transparent')
      ctx!.fillStyle = wash
      ctx!.fillRect(0, 0, w, h)

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        if (!reduced) {
          a.x += a.vx
          a.y += a.vy
          if (a.x < 0 || a.x > w) a.vx *= -1
          if (a.y < 0 || a.y > h) a.vy *= -1
          a.pulse += 0.012
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist < 140) {
            ctx!.beginPath()
            ctx!.strokeStyle = hexAlpha(signal, 0.12 * (1 - dist / 140))
            ctx!.lineWidth = 1
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.stroke()
          }
        }

        const glow = 0.35 + Math.sin(a.pulse + t * 0.001) * 0.2
        ctx!.beginPath()
        ctx!.fillStyle = hexAlpha(signal, 0.35 + glow * 0.35)
        ctx!.arc(a.x, a.y, a.r, 0, Math.PI * 2)
        ctx!.fill()

        ctx!.beginPath()
        ctx!.strokeStyle = hexAlpha(ink, 0.08)
        ctx!.lineWidth = 1
        ctx!.arc(a.x, a.y, a.r + 3 + glow * 2, 0, Math.PI * 2)
        ctx!.stroke()
      }

      if (!reduced) raf = requestAnimationFrame(frame)
    }

    resize()
    frame(0)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
    />
  )
}

function hexAlpha(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  if (h.length !== 6) return `rgba(15, 118, 110, ${alpha})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
