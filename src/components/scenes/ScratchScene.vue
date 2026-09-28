<script setup>
// 关卡 3：刮刮卡 —— 刮开涂层露出第 3 个数字
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { CONFIG } from '../../config'
import { sfxDigit } from '../../composables/audio'

const emit = defineEmits(['digit'])

const digit = CONFIG.codeParts[2]
const canvasRef = ref(null)
const revealed = ref(false)
const hint = ref('用手指按住，把银色涂层擦掉')

let ctx = null
let W = 0
let H = 0
let scratching = false
let moveCount = 0
let checkTimer = null

function paintCover() {
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#7a6fa0')
  grad.addColorStop(1, '#4a3f72')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
  // 星星纹理
  for (let i = 0; i < 70; i++) {
    ctx.beginPath()
    ctx.arc(Math.random() * W, Math.random() * H, 0.6 + Math.random() * 2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${0.12 + Math.random() * 0.3})`
    ctx.fill()
  }
  // 提示文字
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = `600 ${Math.min(W * 0.07, 30)}px 'PingFang SC', sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('刮开此处', W / 2, H / 2)
}

function pos(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : null)
  const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : null)
  if (clientX == null || clientY == null) return null
  return { x: clientX - rect.left, y: clientY - rect.top }
}

function eraseAt(p) {
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(p.x, p.y, Math.max(W, H) * 0.045, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
}

function checkReveal() {
  const data = ctx.getImageData(0, 0, W, H).data
  let total = 0
  let clear = 0
  for (let i = 3; i < data.length; i += 4 * 7) {
    total++
    if (data[i] === 0) clear++
  }
  if (total > 0 && clear / total > 0.52 && !revealed.value) {
    revealed.value = true
    hint.value = ''
    sfxDigit()
    setTimeout(() => emit('digit', digit), 1300)
  }
}

function onDown(e) {
  const p = pos(e)
  if (!p || revealed.value) return
  scratching = true
  eraseAt(p)
}

function onMove(e) {
  if (!scratching || revealed.value) return
  const p = pos(e)
  if (!p) return
  eraseAt(p)
  moveCount++
  if (moveCount % 9 === 0) checkReveal()
}

function onUp() {
  if (!scratching) return
  scratching = false
  checkReveal()
}

onMounted(() => {
  const c = canvasRef.value
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = c.clientWidth
  H = c.clientHeight
  c.width = W * dpr
  c.height = H * dpr
  ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  paintCover()
})

onBeforeUnmount(() => {
  if (checkTimer) clearTimeout(checkTimer)
})
</script>

<template>
  <section class="scene active scratch-scene">
    <div class="step-tag">第三关 · 刮开惊喜</div>
    <h2 class="heading">刮开这张卡</h2>
    <p class="sub">用手轻轻擦掉涂层，看看你的幸运数字</p>

    <div class="scratch-wrap">
      <div class="scratch-under">
        <span class="under-label">你的幸运数字</span>
        <b class="under-value gold-text">{{ digit }}</b>
        <span class="under-spark">✦</span>
      </div>
      <canvas
        ref="canvasRef"
        class="scratch-canvas"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      />
    </div>

    <p class="hint" :class="{ done: revealed }">{{ hint }}</p>
  </section>
</template>

<style scoped>
.scratch-scene {
  gap: clamp(10px, 1.8vmin, 20px);
}

.heading {
  font-size: clamp(28px, 5vmin, 46px);
  font-weight: 700;
  letter-spacing: 0.1em;
}
.sub {
  font-size: clamp(14px, 2vmin, 18px);
  color: var(--ink-dim);
  letter-spacing: 0.05em;
}

.scratch-wrap {
  position: relative;
  width: min(64vw, 620px);
  height: min(34vh, 280px);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card), var(--glow-gold);
}

.scratch-under {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(160deg, rgba(38, 24, 84, 0.9), rgba(20, 11, 48, 0.94));
}
.under-label {
  font-size: clamp(13px, 1.9vmin, 17px);
  color: var(--ink-dim);
  letter-spacing: 0.2em;
}
.under-value {
  font-size: clamp(60px, 11vmin, 104px);
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 0 30px rgba(242, 196, 104, 0.45);
}
.under-spark {
  position: absolute;
  top: 16%;
  right: 18%;
  color: var(--gold);
  font-size: clamp(16px, 2.4vmin, 22px);
  animation: pulse-soft 2s ease-in-out infinite;
}

.scratch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: pointer;
}

.hint {
  font-size: clamp(14px, 2vmin, 18px);
  color: var(--gold-bright);
  letter-spacing: 0.06em;
  min-height: 1.5em;
}
.hint.done {
  opacity: 0;
}
</style>
