<script setup>
// 小游戏 1：接星星 —— 移动篮子接住落下的星星，接满 10 颗过关
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { sfxDigit, sfxPick, sfxWin } from '../../composables/audio'

const emit = defineEmits(['done'])

const TARGET = 10
const TIME_LIMIT = 30

const canvasRef = ref(null)
const score = ref(0)
const timeLeft = ref(TIME_LIMIT)
const phase = ref('play') // play | win | lose

let ctx = null
let W = 0
let H = 0
let raf = 0
let running = false
let basket = { x: 0.5, w: 0 } // 比例坐标
let stars = []
let lastSpawn = 0
let startedAt = 0
let timerId = null

function resize() {
  const c = canvasRef.value
  if (!c) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = c.clientWidth
  H = c.clientHeight
  c.width = W * dpr
  c.height = H * dpr
  ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  basket.w = Math.min(W * 0.14, 84)
}

function spawnStar() {
  const colors = ['#ffe6a8', '#ffd98e', '#ff9fb0', '#c7a8ff']
  stars.push({
    x: 0.06 + Math.random() * 0.88,
    y: -0.04,
    vy: 0.0016 + Math.random() * 0.0012,
    r: 0.011 + Math.random() * 0.009,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.02,
    color: colors[(Math.random() * colors.length) | 0],
  })
}

function onMove(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : null)
  if (clientX == null) return
  basket.x = Math.min(0.92, Math.max(0.08, (clientX - rect.left) / rect.width))
}

function frame(now) {
  if (!running) return
  ctx.clearRect(0, 0, W, H)

  // 生成星星
  if (now - lastSpawn > 420) {
    spawnStar()
    lastSpawn = now
  }

  const basketX = basket.x * W
  const basketY = H - 34

  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i]
    s.y += s.vy
    s.x += (Math.random() - 0.5) * 0.0006
    s.rot += s.vr
    const px = s.x * W
    const py = s.y * H
    const pr = s.r * H * 2

    // 碰撞检测
    if (
      py + pr > basketY - 14 &&
      Math.abs(px - basketX) < basket.w / 2 + pr
    ) {
      stars.splice(i, 1)
      score.value += 1
      sfxPick()
      if (score.value >= TARGET) {
        win()
        return
      }
      continue
    }
    // 漏掉
    if (py - pr > H) {
      stars.splice(i, 1)
      continue
    }

    // 画星星（五角星）
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(s.rot)
    ctx.beginPath()
    for (let k = 0; k < 5; k++) {
      const a1 = -Math.PI / 2 + (k * Math.PI * 2) / 5
      const a2 = a1 + Math.PI / 5
      if (k === 0) ctx.moveTo(Math.cos(a1) * pr, Math.sin(a1) * pr)
      else ctx.lineTo(Math.cos(a1) * pr, Math.sin(a1) * pr)
      ctx.lineTo(Math.cos(a2) * pr * 0.45, Math.sin(a2) * pr * 0.45)
    }
    ctx.closePath()
    ctx.fillStyle = s.color
    ctx.shadowColor = 'rgba(255,214,148,0.8)'
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.restore()
  }

  // 篮子
  ctx.save()
  ctx.translate(basketX, basketY)
  ctx.beginPath()
  ctx.moveTo(-basket.w / 2, -8)
  ctx.lineTo(basket.w / 2, -8)
  ctx.lineTo(basket.w / 2 - 4, 12)
  ctx.lineTo(-basket.w / 2 + 4, 12)
  ctx.closePath()
  const grad = ctx.createLinearGradient(0, -10, 0, 14)
  grad.addColorStop(0, '#ffe6a8')
  grad.addColorStop(1, '#d9a441')
  ctx.fillStyle = grad
  ctx.shadowColor = 'rgba(242,196,104,0.6)'
  ctx.shadowBlur = 14
  ctx.fill()
  ctx.restore()

  raf = requestAnimationFrame(frame)
}

function win() {
  running = false
  cancelAnimationFrame(raf)
  clearInterval(timerId)
  phase.value = 'win'
  sfxWin()
  setTimeout(() => emit('done'), 1500)
}

function lose() {
  running = false
  cancelAnimationFrame(raf)
  clearInterval(timerId)
  phase.value = 'lose'
}

function restart() {
  stars = []
  score.value = 0
  timeLeft.value = TIME_LIMIT
  phase.value = 'play'
  startedAt = performance.now()
  lastSpawn = 0
  if (timerId) clearInterval(timerId)
  timerId = setInterval(() => {
    timeLeft.value = Math.max(0, TIME_LIMIT - Math.floor((performance.now() - startedAt) / 1000))
    if (timeLeft.value === 0 && phase.value === 'play') lose()
  }, 500)
  running = true
  raf = requestAnimationFrame(frame)
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onMove)
  restart()
})

onBeforeUnmount(() => {
  running = false
  cancelAnimationFrame(raf)
  clearInterval(timerId)
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', onMove)
})
</script>

<template>
  <div class="game-shell">
    <div class="hud">
      <span class="hud-item">星星 <b>{{ score }}</b> / {{ TARGET }}</span>
      <span class="hud-item">时间 <b>{{ timeLeft }}</b>s</span>
    </div>

    <canvas ref="canvasRef" class="game-canvas" @pointerdown="onMove" @pointermove="onMove" />

    <div v-if="phase === 'win'" class="overlay overlay--win">
      <p class="overlay-title gold-text">接满星星啦</p>
      <p class="overlay-sub">恭喜获得 1 次抽奖机会</p>
    </div>
    <div v-else-if="phase === 'lose'" class="overlay">
      <p class="overlay-title">差一点点</p>
      <p class="overlay-sub">再来一次，星星不会跑远</p>
      <button class="btn-gold" type="button" @click="restart">再试一次</button>
    </div>
  </div>
</template>

<style scoped>
.game-shell {
  position: relative;
  width: min(88vw, 900px);
  height: min(52vh, 430px);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgba(8, 5, 28, 0.55);
  border: 1px solid rgba(242, 196, 104, 0.25);
  box-shadow: var(--shadow-card);
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

.hud {
  position: absolute;
  top: 14px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: clamp(18px, 4vmin, 40px);
  z-index: 5;
  pointer-events: none;
}
.hud-item {
  padding: 8px 18px;
  border-radius: 999px;
  font-size: clamp(13px, 1.9vmin, 17px);
  color: var(--ink-dim);
  background: rgba(20, 11, 48, 0.7);
  border: 1px solid rgba(242, 196, 104, 0.3);
  backdrop-filter: blur(8px);
}
.hud-item b {
  color: var(--gold-bright);
  font-size: 1.15em;
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: rgba(8, 5, 28, 0.78);
  backdrop-filter: blur(8px);
  animation: rise-in 0.4s ease both;
}
.overlay-title {
  font-size: clamp(26px, 4.6vmin, 42px);
  font-weight: 800;
  letter-spacing: 0.1em;
}
.overlay-sub {
  font-size: clamp(14px, 2vmin, 18px);
  color: var(--ink-dim);
  letter-spacing: 0.06em;
}
</style>
