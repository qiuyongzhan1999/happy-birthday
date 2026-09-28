/**
 * 粒子特效系统
 * - startStarField(canvas): 星空闪烁 + 偶发流星 + 触摸涟漪星光（常驻背景）
 * - createConfetti(canvas): 彩纸爆发 / 彩纸雨（礼物揭晓用）
 */

/* ---------------- 星空 ---------------- */
export function startStarField(canvas, options = {}) {
  const { touchTarget = window } = options
  const ctx = canvas.getContext('2d')
  let W = 0
  let H = 0
  let raf = 0
  let running = true

  const stars = []
  const shooting = []
  const ripples = []
  let nextShootAt = performance.now() + 1200

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = canvas.clientWidth || window.innerWidth
    H = canvas.clientHeight || window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function spawnStars() {
    stars.length = 0
    const count = Math.floor((W * H) / 9000)
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.4 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.4,
        tint: Math.random() < 0.82 ? '255,255,255' : Math.random() < 0.5 ? '255,214,148' : '255,170,210',
      })
    }
  }

  function spawnShoot() {
    const fromLeft = Math.random() < 0.5
    shooting.push({
      x: fromLeft ? -60 : Math.random() * W,
      y: Math.random() * H * 0.4,
      vx: 4 + Math.random() * 5,
      vy: 1.2 + Math.random() * 2,
      life: 1,
      len: 70 + Math.random() * 80,
    })
  }

  function onTouch(e) {
    const x = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0)
    const y = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0)
    if (!x && !y) return
    ripples.push({
      x, y,
      r: 6,
      vr: 3.4,
      alpha: 0.9,
      particles: Array.from({ length: 6 }, () => ({
        px: x, py: y,
        vx: (Math.random() - 0.5) * 3.2,
        vy: (Math.random() - 0.5) * 3.2 - 1.2,
        life: 1,
        r: 1 + Math.random() * 1.8,
        tint: Math.random() < 0.6 ? '255,214,148' : '255,255,255',
      })),
    })
  }

  function frame(now) {
    if (!running) return
    ctx.clearRect(0, 0, W, H)

    // 星星
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(now * 0.001 * s.speed + s.phase))
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${s.tint},${a})`
      ctx.fill()
    }

    // 流星
    if (now > nextShootAt) {
      spawnShoot()
      nextShootAt = now + 1500 + Math.random() * 3500
    }
    for (let i = shooting.length - 1; i >= 0; i--) {
      const m = shooting[i]
      m.x += m.vx
      m.y += m.vy
      m.life -= 0.012
      if (m.life <= 0) {
        shooting.splice(i, 1)
        continue
      }
      const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 3.2, m.y - m.vy * 3.2)
      grad.addColorStop(0, `rgba(255,240,210,${m.life})`)
      grad.addColorStop(1, 'rgba(255,240,210,0)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(m.x, m.y)
      ctx.lineTo(m.x - m.vx * 3.2, m.y - m.vy * 3.2)
      ctx.stroke()
    }

    // 触摸涟漪
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]
      r.r += r.vr
      r.alpha -= 0.028
      if (r.alpha <= 0) {
        ripples.splice(i, 1)
        continue
      }
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,214,148,${r.alpha})`
      ctx.lineWidth = 1.6
      ctx.stroke()
      for (const p of r.particles) {
        p.px += p.vx
        p.py += p.vy
        p.vy += 0.02
        p.life -= 0.02
        ctx.beginPath()
        ctx.arc(p.px, p.py, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.tint},${Math.max(0, p.life) * r.alpha})`
        ctx.fill()
      }
    }

    raf = requestAnimationFrame(frame)
  }

  resize()
  spawnStars()
  window.addEventListener('resize', resize)
  touchTarget.addEventListener('pointerdown', onTouch)
  raf = requestAnimationFrame(frame)

  return {
    stop() {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      touchTarget.removeEventListener('pointerdown', onTouch)
    },
  }
}

/* ---------------- 彩纸 ---------------- */
export function createConfetti(canvas) {
  const ctx = canvas.getContext('2d')
  let W = 0
  let H = 0
  let raf = 0
  let running = true
  const particles = []
  const COLORS = ['#f2c468', '#ffe6a8', '#ff7bac', '#ffb38a', '#c7a8ff', '#ffffff']

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = canvas.clientWidth || window.innerWidth
    H = canvas.clientHeight || window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function spawn(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 4 + Math.random() * 9
      particles.push({
        x: x ?? W / 2,
        y: y ?? H / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        size: 5 + Math.random() * 8,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
        life: 1,
        decay: 0.004 + Math.random() * 0.006,
        gravity: 0.16,
      })
    }
  }

  function spawnRain() {
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: Math.random() * W,
        y: -12,
        vx: (Math.random() - 0.5) * 1.6,
        vy: 2.4 + Math.random() * 2.6,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.22,
        size: 5 + Math.random() * 7,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
        life: 1,
        decay: 0.0016,
        gravity: 0.05,
      })
    }
  }

  function frame() {
    if (!running) return
    ctx.clearRect(0, 0, W, H)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.rot += p.vr
      p.life -= p.decay
      if (p.life <= 0 || p.y > H + 30) {
        particles.splice(i, 1)
        continue
      }
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6))
      ctx.fillStyle = p.color
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    raf = requestAnimationFrame(frame)
  }

  resize()
  window.addEventListener('resize', resize)
  raf = requestAnimationFrame(frame)

  return {
    /** 从某点爆发 */
    burst(x, y, count = 90) {
      spawn(x, y, count)
    },
    /** 全屏彩纸雨（短暂持续） */
    rain(ms = 2600) {
      const timer = setInterval(spawnRain, 140)
      setTimeout(() => clearInterval(timer), ms)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    },
  }
}
