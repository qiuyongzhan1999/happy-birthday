<script setup>
// 幸运大转盘：扇区 + 奖品图，缓动停转；中奖全屏居中，仅 ❌ 可关
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getPrizeIconUrl } from '../composables/prizeIcons'
import {
  sfxClick,
  sfxConfetti,
  sfxWin,
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
const showResult = ref(false)
const wonPrize = ref(null)
const wonIcon = ref('')

const COLORS = ['#ffe0ec', '#ffb3c9', '#f6d188', '#ffc4e0', '#e8b4f0', '#ffd6a8']
const SPIN_MS = 4700

let ctx = null
let D = 0
let dpr = 1
let rotate = 0
let highlightIdx = -1
let spinRaf = 0
const iconImgs = []

function applyRotate(deg) {
  rotate = deg
  const el = canvasRef.value
  if (el) el.style.transform = `rotate(${deg}deg)`
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
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
    img.src = p.image || getPrizeIconUrl(p)  // 优先真实商品图（本地资源），无图再回退插画
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
    ctx.lineWidth = 4
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
  // 外圈装饰
  ctx.beginPath()
  ctx.arc(D / 2, D / 2, D / 2 - 3, 0, Math.PI * 2)
  const ring = ctx.createLinearGradient(0, 0, D, D)
  ring.addColorStop(0, '#ffe6a8')
  ring.addColorStop(0.5, '#ff9fc4')
  ring.addColorStop(1, '#f2c468')
  ctx.strokeStyle = ring
  ctx.lineWidth = 10
  ctx.stroke()

  // 中心圆
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
  ctx.fillText('抽奖', D / 2, D / 2)
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

function spin() {
  if (spinning.value || props.tickets <= 0 || showResult.value) return false
  if (!props.prizes.length) return false
  sfxClick()
  spinning.value = true
  highlightIdx = -1
  draw()
  startTenseMusic()

  const n = props.prizes.length
  const step = sectorAngle()
  // 核心奖品固定必中：只从 coreNames 对应扇区随机；未传 coreNames 时全池随机
  let idx
  const coreIdx = []
  props.prizes.forEach((p, i) => {
    if (props.coreNames.includes(p.name)) coreIdx.push(i)
  })
  if (coreIdx.length) {
    idx = coreIdx[(Math.random() * coreIdx.length) | 0]
  } else {
    idx = (Math.random() * n) | 0
  }
  // 扇区中心对准顶部指针（-90° 为顶部）
  const target = (360 - (idx * step + step / 2) + 360) % 360
  const spins = 5 + ((Math.random() * 3) | 0)
  const from = rotate
  const current = ((from % 360) + 360) % 360
  const delta = (target - current + 360) % 360
  const to = from + spins * 360 + delta

  if (spinRaf) cancelAnimationFrame(spinRaf)

  const t0 = performance.now()
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / SPIN_MS)
    applyRotate(from + (to - from) * easeOutCubic(p))
    if (p < 1) {
      spinRaf = requestAnimationFrame(tick)
      return
    }
    spinRaf = 0
    applyRotate(to)
    spinning.value = false
    highlightIdx = idx
    draw()
    stopTenseMusic()
    sfxConfetti()
    sfxWin()
    confetti?.burst?.(window.innerWidth / 2, window.innerHeight * 0.4, 100)
    confetti?.fireworks?.(2200)

    const prize = props.prizes[idx]
    wonPrize.value = prize
    wonIcon.value = prize.image || getPrizeIconUrl(prize)
    showResult.value = true
    emit('spun', prize)
  }
  spinRaf = requestAnimationFrame(tick)
  return true
}

function closeResult() {
  sfxClick()
  showResult.value = false
  wonPrize.value = null
}

// 奖品池变化（抽中移除）时重绘转盘
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
  if (spinRaf) cancelAnimationFrame(spinRaf)
  stopTenseMusic()
})

defineExpose({ spin })
</script>

<template>
  <div class="wheel-root">
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
      </div>
    </div>

    <!-- 中奖全屏：仅 ❌ 可关 -->
    <Teleport to="body">
      <transition name="prize-pop">
        <div v-if="showResult && wonPrize" class="prize-overlay" @click.stop>
          <div class="prize-panel">
            <button class="prize-close" type="button" aria-label="关闭" @click="closeResult">
              ✕
            </button>
            <p class="prize-label">恭喜获得</p>
            <div class="prize-icon" :style="{ backgroundImage: `url(${wonIcon})` }"></div>
            <h3 class="prize-name">{{ wonPrize.name }}</h3>
          </div>
        </div>
      </transition>
    </Teleport>
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
  filter: drop-shadow(0 0 36px rgba(255, 123, 172, 0.4));
}
.wheel-canvas {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 50%;
  will-change: transform;
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
@keyframes blink {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}

.prize-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 8, 32, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.prize-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: min(86vw, 380px);
  padding: clamp(36px, 5vmin, 48px) clamp(28px, 4vmin, 40px);
  border-radius: 28px;
  background: linear-gradient(165deg, rgba(99, 34, 92, 0.95), rgba(42, 17, 71, 0.96));
  border: 1px solid rgba(255, 190, 218, 0.45);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45), 0 0 40px rgba(255, 123, 172, 0.35);
}
.prize-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 190, 218, 0.45);
  background: rgba(255, 255, 255, 0.1);
  color: #ffeaf3;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
}
.prize-close:active {
  transform: scale(0.92);
}
.prize-close:hover {
  background: rgba(255, 123, 172, 0.35);
}
.prize-label {
  font-size: clamp(14px, 2vmin, 17px);
  letter-spacing: 0.28em;
  color: var(--gold);
}
.prize-icon {
  width: min(52vw, 220px);
  height: min(52vw, 220px);
  border-radius: 28px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35), 0 0 24px rgba(255, 150, 190, 0.4);
}
.prize-name {
  font-size: clamp(28px, 5vmin, 40px);
  font-weight: 800;
  color: var(--gold-bright);
  letter-spacing: 0.1em;
  text-align: center;
}
.prize-pop-enter-active,
.prize-pop-leave-active {
  transition: opacity 0.28s ease;
}
.prize-pop-enter-active .prize-panel,
.prize-pop-leave-active .prize-panel {
  transition: transform 0.32s cubic-bezier(0.22, 1.2, 0.36, 1), opacity 0.28s ease;
}
.prize-pop-enter-from,
.prize-pop-leave-to {
  opacity: 0;
}
.prize-pop-enter-from .prize-panel,
.prize-pop-leave-to .prize-panel {
  opacity: 0;
  transform: scale(0.82);
}
</style>
