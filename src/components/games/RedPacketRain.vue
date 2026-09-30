<script setup>
// 红包雨：Canvas + rAF，点击领取，炸弹 -1，30 秒结算
import { inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { CONFIG } from '../../config'
import { sfxBomb, sfxClick, sfxRedHit, sfxRedResult } from '../../composables/audio'

const emit = defineEmits(['done'])
const confetti = inject('confetti', null)

const cfg = CONFIG.redPacketRain || {}
const DURATION = cfg.duration || 30
const PENALTY = cfg.bombPenalty || 1

const canvasRef = ref(null)
const phase = ref('ready') // ready | play | result
const left = ref(DURATION)
const caught = ref(0)
const displayAmount = ref(0)

let ctx = null
let W = 0
let H = 0
let dpr = 1
let items = []
let raf = 0
let lastTs = 0
let spawnAcc = 0
let countdownTimer = null

function resize() {
  const c = canvasRef.value
  if (!c) return
  const parent = c.parentElement
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = parent.clientWidth
  H = parent.clientHeight
  c.width = W * dpr
  c.height = H * dpr
  c.style.width = W + 'px'
  c.style.height = H + 'px'
  ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function spawn() {
  const isBomb = Math.random() < 0.34
  // 尺寸随舞台宽度缩放：红包约为宽度的 4.5%~7.5%，炸弹 4%~9%（可大可小）
  const size = isBomb ? W * (0.04 + Math.random() * 0.05) : W * (0.045 + Math.random() * 0.03)
  items.push({
    x: Math.random() * (W - size),
    y: -size - Math.random() * 80,
    // 速度随屏幕高度缩放：每秒穿过 30%~55% 屏高，任何屏幕下落节奏一致
    vy: H * (0.3 + Math.random() * 0.25),
    vx: (Math.random() - 0.5) * W * 0.05,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 3,
    size,
    bomb: isBomb,
    dead: false,
  })
}

function drawRed(it) {
  const { x, y, size, rot } = it
  ctx.save()
  ctx.translate(x + size / 2, y + size / 2)
  ctx.rotate(rot)
  const g = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2)
  g.addColorStop(0, '#ff4d6d')
  g.addColorStop(1, '#c1121f')
  ctx.fillStyle = g
  roundRectPath(-size / 2, -size / 2, size, size * 1.15, size * 0.12)
  ctx.fill()
  // 金圆
  ctx.beginPath()
  ctx.arc(0, -size * 0.08, size * 0.22, 0, Math.PI * 2)
  ctx.fillStyle = '#f2c468'
  ctx.fill()
  ctx.fillStyle = '#9b2226'
  ctx.font = `bold ${size * 0.22}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('福', 0, -size * 0.08)
  ctx.restore()
}

function drawBomb(it) {
  const { x, y, size, rot } = it
  ctx.save()
  ctx.translate(x + size / 2, y + size / 2)
  ctx.rotate(rot)
  ctx.beginPath()
  ctx.arc(0, 4, size * 0.38, 0, Math.PI * 2)
  ctx.fillStyle = '#2b2d42'
  ctx.fill()
  ctx.strokeStyle = '#8d99ae'
  ctx.lineWidth = 2
  ctx.stroke()
  // 引线
  ctx.strokeStyle = '#f2c468'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.32)
  ctx.quadraticCurveTo(size * 0.15, -size * 0.5, size * 0.08, -size * 0.58)
  ctx.stroke()
  ctx.fillStyle = '#ff6b35'
  ctx.beginPath()
  ctx.arc(size * 0.08, -size * 0.58, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${size * 0.28}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('!', 0, 6)
  ctx.restore()
}

function roundRectPath(x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function loop(ts) {
  if (phase.value !== 'play') return
  if (!ctx || !W || !H) return
  if (!lastTs) lastTs = ts
  const dt = Math.min(0.05, (ts - lastTs) / 1000)
  lastTs = ts

  spawnAcc += dt
  // 生成间隔随舞台宽度缩放，保证大屏/平板上的红包密度一致
  const spawnGap = Math.max(0.18, Math.min(0.34, (0.28 * 800) / W))
  while (spawnAcc > spawnGap) {
    spawnAcc -= spawnGap
    spawn()
    if (Math.random() > 0.55) spawn()
  }

  ctx.clearRect(0, 0, W, H)
  items = items.filter((it) => !it.dead && it.y < H + 80)
  for (const it of items) {
    it.y += it.vy * dt
    it.x += it.vx * dt
    it.rot += it.vr * dt
    if (it.bomb) drawBomb(it)
    else drawRed(it)
  }

  raf = requestAnimationFrame(loop)
}

function hitTest(clientX, clientY) {
  const c = canvasRef.value
  const rect = c.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top
  // 从上往下优先点中最上层
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]
    if (it.dead) continue
    if (x >= it.x && x <= it.x + it.size && y >= it.y && y <= it.y + it.size * 1.15) {
      return it
    }
  }
  return null
}

function onPointer(e) {
  if (phase.value !== 'play') return
  const pt = e.touches ? e.touches[0] : e
  const it = hitTest(pt.clientX, pt.clientY)
  if (!it) return
  it.dead = true
  if (it.bomb) {
    caught.value = Math.max(0, caught.value - PENALTY)
    sfxBomb()
  } else {
    caught.value += 1
    sfxRedHit()
  }
}

function settle() {
  phase.value = 'result'
  cancelAnimationFrame(raf)
  clearInterval(countdownTimer)
  const n = caught.value
  // 每个红包固定 5 元：结算金额 = 接到的红包数 × 5
  displayAmount.value = n > 0 ? n * 5 : 0
  sfxRedResult()
  if (displayAmount.value > 0) {
    confetti?.rain?.(2000)
    confetti?.burst?.(window.innerWidth / 2, window.innerHeight * 0.35, 70)
  }
}

async function start() {
  sfxClick()
  phase.value = 'play'
  caught.value = 0
  left.value = DURATION
  items = []
  lastTs = 0
  spawnAcc = 0
  // 等 canvas 挂载完成后再初始化尺寸，否则拿不到 ctx
  await nextTick()
  resize()
  if (!ctx) return
  raf = requestAnimationFrame(loop)
  countdownTimer = setInterval(() => {
    left.value -= 1
    if (left.value <= 0) {
      left.value = 0
      settle()
    }
  }, 1000)
}

function finish() {
  sfxClick()
  emit('done')
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearInterval(countdownTimer)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <div class="rain">
    <template v-if="phase === 'ready'">
      <h3 class="title">红包雨来啦</h3>
      <p class="desc">限时 {{ DURATION }} 秒，点击接住红包；小心炸弹会扣掉红包</p>
      <button class="btn-gold" type="button" @click="start">开始接红包</button>
    </template>

    <template v-else-if="phase === 'play'">
      <div class="hud">
        <span class="timer">{{ left }}s</span>
        <span class="count">已领 <b>{{ caught }}</b></span>
      </div>
      <div class="stage">
        <canvas
          ref="canvasRef"
          @pointerdown.prevent="onPointer"
          @touchstart.prevent="onPointer"
        />
      </div>
    </template>

    <template v-else>
      <div class="result">
        <p class="eyebrow">红包雨结束</p>
        <p class="amount">
          <template v-if="displayAmount === 0">这次一个都没接到哦</template>
          <template v-else>
            你获得了 <b>{{ displayAmount }}</b> 元红包
          </template>
        </p>
        <button class="btn-gold" type="button" @click="finish">返回</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.rain {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(12px, 2vmin, 18px);
  width: min(94vw, 1180px);
  margin-top: clamp(40px, 6vmin, 60px);
}
.title {
  font-size: clamp(26px, 4vmin, 40px);
  font-weight: 700;
  letter-spacing: 0.08em;
}
.desc {
  font-size: clamp(14px, 2vmin, 17px);
  color: var(--ink-dim);
  text-align: center;
  line-height: 1.5;
}
.desc.faint {
  color: var(--ink-faint);
  font-size: clamp(12px, 1.7vmin, 15px);
}
.hud {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  justify-content: center;
}
.timer {
  font-size: clamp(24px, 3.6vmin, 34px);
  font-weight: 700;
  color: var(--gold-bright);
}
.count {
  font-size: clamp(16px, 2.2vmin, 20px);
  color: var(--ink-dim);
}
.count b {
  color: #ff8fab;
  font-size: 1.3em;
  margin: 0 4px;
}
.stage {
  width: 100%;
  height: min(78vh, 900px);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: radial-gradient(ellipse at top, rgba(255, 77, 109, 0.2), rgba(42, 17, 71, 0.35));
  border: 1px solid var(--glass-border);
  touch-action: none;
}
.stage canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: clamp(24px, 4vmin, 40px);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
  min-width: min(86vw, 360px);
}
.eyebrow {
  letter-spacing: 0.18em;
  color: var(--gold);
  font-size: clamp(13px, 1.8vmin, 15px);
}
.amount {
  font-size: clamp(20px, 3.2vmin, 28px);
  text-align: center;
  line-height: 1.4;
}
.amount b {
  color: #ffe066;
  font-size: 1.45em;
  margin: 0 4px;
}
.sub {
  font-size: clamp(13px, 1.8vmin, 15px);
  color: var(--ink-faint);
}
</style>
