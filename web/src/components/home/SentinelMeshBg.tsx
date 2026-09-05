import { useEffect, useRef } from 'react'

export function SentinelMeshBg({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    // Handle resize
    const onResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', onResize)

    // Subtle floating telemetry nodes
    const particleCount = Math.min(28, Math.floor((width * height) / 32000))
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 1,
      alpha: Math.random() * 0.4 + 0.2,
    }))

    // Get live theme signal color
    function getSignalColor() {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--g-signal').trim()
      return val || '#2dd4bf'
    }

    let lastTime = performance.now()

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      ctx.clearRect(0, 0, width, height)
      const signalColor = getSignalColor()

      // Update and draw particles
      ctx.fillStyle = signalColor
      ctx.strokeStyle = signalColor

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx * dt * 60
        p.y += p.vy * dt * 60

        // Wrap boundaries
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        // Draw node
        ctx.globalAlpha = p.alpha * 0.7
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()

        // Connect adjacent nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 130) {
            ctx.globalAlpha = (1 - dist / 130) * 0.15
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* Dynamic Animated Node Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-60" />

      {/* Cyber Orthogonal Grid with Radial Mask */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            'linear-gradient(var(--g-line) 1px, transparent 1px), linear-gradient(90deg, var(--g-line) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 75% 60% at 50% 30%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 60% at 50% 30%, black 20%, transparent 75%)',
        }}
      />

      {/* Secondary Major Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(var(--g-line) 1px, transparent 1px), linear-gradient(90deg, var(--g-line) 1px, transparent 1px)',
          backgroundSize: '192px 192px',
          maskImage: 'radial-gradient(ellipse 80% 55% at 50% 28%, black 10%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 55% at 50% 28%, black 10%, transparent 70%)',
        }}
      />

      {/* Central Ambient Glow Orbs */}
      <div className="absolute left-1/2 top-1/4 h-[420px] w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--g-glow)] opacity-35 blur-[120px]" />
      <div className="absolute right-[-10%] top-1/2 h-[340px] w-[500px] rounded-full bg-[var(--g-alert)] opacity-[0.04] blur-[140px]" />
    </div>
  )
}
