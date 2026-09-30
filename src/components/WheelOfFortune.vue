<script setup>
// 幸运大转盘：单段连贯减速停转，停稳闪烁后弹窗揭晓
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getPrizeIconUrl } from '../composables/prizeIcons'
import {
  sfxClick,
  sfxConfetti,
  sfxWin,
  playPrizeAnnounce,
  startTenseMusic,
  stopTenseMusic,
} from '../composables/audio'

const props = defineProps({
  prizes: { type: Array, required: true },
  tickets: { type: Number, default: 0 },
  coreNames: { type: Array, default: () => [] },
})

const emit = defineEmits(['spun'])
const confetti = inject('confetti', null)

const canvasRef = ref(null)
const spinning = ref(false)
/** idle | rush | settle | reveal */
const phase = ref('idle')

const COLORS = ['#ffe0ec', '#ffb3c9', '#f6d188', '#ffc4e0', '#e8b4f0', '#ffd6a8']
/** 单段连贯减速停转，约 20 秒（不再中途停顿再挪） */
const SPIN_MS = 20000
const SPIN_EASE = 'cubic-bezier(0.12, 0.75, 0.08, 1)'
/** 停稳后短促定格再揭晓 */
const SETTLE_MS = 450
const REVEAL_HOLD_MS = 900

let ctx = null
let D = 0
let dpr = 1
let rotate = 0
let highlightIdx = -1
let spinTimer = 0
let phaseTimer = 0
let onSpinEnd = null
const iconImgs = []

const PHASE_HINT = {
  idle: '',
  rush: '命运齿轮正在转动…',
  settle: '好运揭晓中…',
  reveal: '好运揭晓！',
}

function applyRotate(deg, { duration = 0, ease = 'linear' } = {}) {
  rotate = deg
  const el = canvasRef.value
  if (!el) return
  if (duration > 0) {
    el.style.transition = `transform ${duration}ms ${ease}`
  } else {
    el.style.transition = 'none'
  }
  el.style.transform = `rotate(${deg}deg) translateZ(0)`
}

function clearSpinListeners() {
  if (spinTimer) {
    clearTimeout(spinTimer)
    spinTimer = 0
  }
  if (phaseTimer) {
    clearTimeout(phaseTimer)
    phaseTimer = 0
  }
  const el = canvasRef.value
  if (el && onSpinEnd) {
    el.removeEventListener('transitionend', onSpinEnd)
    onSpinEnd = null
  }
}

function sectorAngle() {
  return 360 / props.prizes.length
}

function resize() {
  const c = canvasRef.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  D = c.clientWidth
  c.width = D * dpr
  c.height = D * dpr
  ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw()
}

function loadIcons() {
  iconImgs.length = 0
  props.prizes.forEach((p, i) => {
    const img = new Image()
    img.onload = () => draw()
    img.src = p.image || getPrizeIconUrl(p)
    iconImgs[i] = img
  })
}

function drawSector(i, color) {
  const step = sectorAngle()
  const start = ((i * step - 90) * Math.PI) / 180
  const end = (((i + 1) * step - 90) * Math.PI) / 180
  ctx.beginPath()
  ctx.moveTo(D / 2, D / 2)
  ctx.arc(D / 2, D / 2, D / 2 - 8, start, end)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'
  ctx.lineWidth = 2
  ctx.stroke()
  if (i === highlightIdx) {
    ctx.strokeStyle = '#ffe6a8'
    ctx.lineWidth = 5
    ctx.stroke()
  }
}

function drawPrize(i) {
  const prize = props.prizes[i]
  const step = sectorAngle()
  const mid = ((i * step + step / 2 - 90) * Math.PI) / 180
  const radius = D * 0.34
  const cx = D / 2 + Math.cos(mid) * radius
  const cy = D / 2 + Math.sin(mid) * radius
  const s = D * 0.062

  const img = iconImgs[i]
  ctx.save()
  ctx.translate(cx, cy)
  ctx.beginPath()
  ctx.arc(0, 0, s, 0, Math.PI * 2)
  ctx.clip()
  if (img && img.width) {
    ctx.drawImage(img, -s, -s, s * 2, s * 2)
  } else {
    ctx.fillStyle = prize.color || '#ff7bac'
    ctx.fillRect(-s, -s, s * 2, s * 2)
  }
  ctx.restore()

  ctx.beginPath()
  ctx.arc(cx, cy, s, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawHub() {
  ctx.beginPath()
  ctx.arc(D / 2, D / 2, D / 2 - 3, 0, Math.PI * 2)
  const ring = ctx.createLinearGradient(0, 0, D, D)
  ring.addColorStop(0, '#ffe6a8')
  ring.addColorStop(0.5, '#ff9fc4')
  ring.addColorStop(1, '#f2c468')
  ctx.strokeStyle = ring
  ctx.lineWidth = 10
  ctx.stroke()

  const grad = ctx.createLinearGradient(0, D / 2 - D * 0.12, 0, D / 2 + D * 0.12)
  grad.addColorStop(0, '#ffe6a8')
  grad.addColorStop(1, '#d9a441')
  ctx.beginPath()
  ctx.arc(D / 2, D / 2, D * 0.12, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.shadowColor = 'rgba(242,196,104,0.75)'
  ctx.shadowBlur = 18
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#3a2410'
  ctx.font = `800 ${D * 0.045}px "PingFang SC","Microsoft YaHei",sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(spinning.value ? '…' : '抽奖', D / 2, D / 2)
}

function draw() {
  if (!ctx || !D) return
  ctx.clearRect(0, 0, D, D)
  for (let i = 0; i < props.prizes.length; i++) {
    drawSector(i, COLORS[i % COLORS.length])
  }
  for (let i = 0; i < props.prizes.length; i++) {
    drawPrize(i)
  }
  drawHub()
}

function pickIndex() {
  const n = props.prizes.length
  const coreIdx = []
  props.prizes.forEach((p, i) => {
    if (props.coreNames.includes(p.name)) coreIdx.push(i)
  })
  if (coreIdx.length) {
    return coreIdx[(Math.random() * coreIdx.length) | 0]
  }
  return (Math.random() * n) | 0
}

function revealPrize(idx) {
  if (!spinning.value) return
  clearSpinListeners()
  applyRotate(rotate)
  phase.value = 'reveal'
  highlightIdx = idx
  draw()

  const prize = props.prizes[idx]

  const announced = (() => {
    // 中奖播报时短暂让出，不离开抽奖页；播完继续 choujiang
    if (playPrizeAnnounce(prize.name)) return true
    return false
  })()
  sfxConfetti()
  if (!announced) sfxWin()
  confetti?.burst?.(window.innerWidth / 2, window.innerHeight * 0.4, 100)
  confetti?.fireworks?.(2200)

  // 短暂停顿闪烁，再通知父级弹出结果（弹窗由父级持有，避免本组件重绘时被拆掉）
  let blinks = 0
  const blink = () => {
    highlightIdx = blinks % 2 === 0 ? idx : -1
    draw()
    blinks += 1
    if (blinks < 6) {
      phaseTimer = window.setTimeout(blink, 120)
      return
    }
    highlightIdx = idx
    draw()
    spinning.value = false
    phase.value = 'idle'
    emit('spun', prize)
  }
  phaseTimer = window.setTimeout(blink, REVEAL_HOLD_MS * 0.35)
}

function waitTransition(el, duration) {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      if (onSpinEnd && el) el.removeEventListener('transitionend', onSpinEnd)
      onSpinEnd = null
      if (spinTimer) {
        clearTimeout(spinTimer)
        spinTimer = 0
      }
      resolve()
    }
    onSpinEnd = (e) => {
      if (e.target !== el || e.propertyName !== 'transform') return
      finish()
    }
    el?.addEventListener('transitionend', onSpinEnd)
    spinTimer = window.setTimeout(finish, duration + 100)
  })
}

async function runSpinSequence(idx) {
  const el = canvasRef.value
  const step = sectorAngle()
  // 扇区中心对准顶部指针
  const target = (360 - (idx * step + step / 2) + 360) % 360
  const spins = 8 + ((Math.random() * 3) | 0)
  const from = rotate
  const current = ((from % 360) + 360) % 360
  const delta = (target - current + 360) % 360
  const finalDeg = from + spins * 360 + delta

  clearSpinListeners()
  applyRotate(from)
  if (el) void el.offsetWidth

  // 一次转到正中：长尾减速，视觉上自然停住，不再「停了又挪」
  phase.value = 'rush'
  applyRotate(finalDeg, { duration: SPIN_MS, ease: SPIN_EASE })
  await waitTransition(el, SPIN_MS)
  if (!spinning.value) return

  phase.value = 'settle'
  await new Promise((r) => {
    phaseTimer = window.setTimeout(r, SETTLE_MS)
  })
  if (!spinning.value) return

  revealPrize(idx)
}

function spin() {
  if (spinning.value || props.tickets <= 0) return false
  if (!props.prizes.length) return false
  sfxClick()
  spinning.value = true
  phase.value = 'rush'
  highlightIdx = -1
  draw()
  startTenseMusic()

  const idx = pickIndex()
  runSpinSequence(idx)
  return true
}

watch(
  () => props.prizes,
  () => {
    applyRotate(0)
    resize()
    loadIcons()
  }
)

onMounted(() => {
  resize()
  loadIcons()
  applyRotate(0)
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  spinning.value = false
  clearSpinListeners()
  stopTenseMusic()
})

defineExpose({ spin })
</script>

<template>
  <div class="wheel-root" :class="[`phase-${phase}`, { 'is-spinning': spinning }]">
    <div class="wheel-wrap">
      <div class="wheel-box">
        <div class="pointer" aria-hidden="true">
          <span class="pointer-tri"></span>
          <span class="pointer-dot"></span>
        </div>
        <div class="lights" aria-hidden="true">
          <i v-for="n in 16" :key="n" class="light" :style="{ '--i': n }"></i>
        </div>
        <canvas ref="canvasRef" class="wheel-canvas" />
        <div v-if="spinning" class="spin-veil" aria-hidden="true"></div>
      </div>
    </div>

    <p class="spin-hint" :class="{ visible: spinning && PHASE_HINT[phase] }" aria-live="polite">
      {{ PHASE_HINT[phase] }}
    </p>
  </div>
</template>

<style scoped>
.wheel-root {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.wheel-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}
.wheel-box {
  position: relative;
  width: min(72vmin, 540px);
  height: min(72vmin, 540px);
}
.wheel-box::before {
  content: '';
  position: absolute;
  inset: 4%;
  border-radius: 50%;
  box-shadow: 0 0 36px 8px rgba(255, 123, 172, 0.4);
  pointer-events: none;
  z-index: 0;
  transition: box-shadow 0.4s ease;
}
.is-spinning .wheel-box::before {
  box-shadow: 0 0 48px 14px rgba(255, 123, 172, 0.55), 0 0 80px 20px rgba(242, 196, 104, 0.25);
}
.phase-rush .wheel-box::before {
  animation: suspense-glow 0.7s ease-in-out infinite alternate;
}
@keyframes suspense-glow {
  from {
    box-shadow: 0 0 36px 10px rgba(255, 123, 172, 0.45), 0 0 60px 16px rgba(242, 196, 104, 0.2);
  }
  to {
    box-shadow: 0 0 56px 18px rgba(255, 190, 100, 0.65), 0 0 90px 28px rgba(255, 123, 172, 0.35);
  }
}
.wheel-canvas {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 50%;
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
}
.spin-veil {
  position: absolute;
  inset: 6%;
  border-radius: 50%;
  z-index: 2;
  pointer-events: none;
  background: radial-gradient(
    circle at 50% 18%,
    rgba(255, 230, 168, 0.18),
    transparent 42%
  );
  mix-blend-mode: soft-light;
}
.pointer {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.45));
  transform-origin: 50% 12px;
}
.phase-rush .pointer {
  animation: pointer-buzz 0.14s linear infinite;
}
.phase-settle .pointer,
.phase-reveal .pointer {
  animation: none;
  transform: translateX(-50%);
}
@keyframes pointer-buzz {
  0%,
  100% {
    transform: translateX(-50%) rotate(-1.2deg);
  }
  50% {
    transform: translateX(-50%) rotate(1.2deg);
  }
}
.pointer-tri {
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-top: 38px solid var(--gold-bright);
}
.pointer-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(180deg, #ffe6a8, #d9a441);
  margin-top: -4px;
  border: 2px solid rgba(255, 255, 255, 0.65);
}
.lights {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}
.light {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  margin: -4px;
  border-radius: 50%;
  background: #ffe6a8;
  box-shadow: 0 0 8px #ff9fc4;
  transform: rotate(calc(var(--i) * 22.5deg)) translateY(calc(min(36vmin, 270px) * -1 + 6px));
  animation: blink 1.2s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.08s);
}
.phase-rush .light {
  animation-duration: 0.45s;
}
.phase-settle .light {
  animation-duration: 0.9s;
  background: #fff3c4;
  box-shadow: 0 0 12px #ffe6a8, 0 0 18px #ff9fc4;
}
@keyframes blink {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}

.spin-hint {
  min-height: 1.4em;
  margin: 14px 0 0;
  font-size: clamp(14px, 2.2vmin, 17px);
  letter-spacing: 0.18em;
  color: rgba(255, 230, 200, 0.92);
  text-align: center;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.spin-hint.visible {
  opacity: 1;
  transform: translateY(0);
}
.phase-settle .spin-hint {
  color: #ffe6a8;
}
</style>
