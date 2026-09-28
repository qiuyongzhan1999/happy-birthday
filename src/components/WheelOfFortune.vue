<script setup>
// 大转盘抽奖：canvas 绘制 12 个扇区 + 奖品小图，旋转缓动，指针停在顶部
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { sfxClick, sfxConfetti, sfxWin } from '../composables/audio'

const props = defineProps({
  prizes: { type: Array, required: true },
  gridUrl: { type: String, required: true },
  redUrl: { type: String, default: '' },
  tickets: { type: Number, default: 0 },
})

const emit = defineEmits(['spun'])

const canvasRef = ref(null)
const spinning = ref(false)

const COLORS = ['#f6d188', '#ffa9c7', '#b9a0f5']

let ctx = null
let D = 0
let dpr = 1
let rotate = 0
let img = null
let redImg = null
let highlightIdx = -1
let spinTimer = null

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

function drawSector(i, color) {
  const start = ((i * 30 - 90) * Math.PI) / 180
  const end = (((i + 1) * 30 - 90) * Math.PI) / 180
  ctx.beginPath()
  ctx.moveTo(D / 2, D / 2)
  ctx.arc(D / 2, D / 2, D / 2 - 1, start, end)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 1.2
  ctx.stroke()
  if (i === highlightIdx) {
    ctx.strokeStyle = '#ffe6a8'
    ctx.lineWidth = 3.5
    ctx.stroke()
  }
}

function drawPrize(i) {
  const prize = props.prizes[i]
  const mid = ((i * 30 + 15 - 90) * Math.PI) / 180
  const radius = D * 0.36
  const cx = D / 2 + Math.cos(mid) * radius
  const cy = D / 2 + Math.sin(mid) * radius
  const s = D * 0.052

  // 奖品图（圆形裁切）
  ctx.save()
  ctx.translate(cx, cy)
  ctx.beginPath()
  ctx.arc(0, 0, s, 0, Math.PI * 2)
  ctx.clip()
  if (prize.img === 'red' && redImg && redImg.width) {
    const gs = redImg.width / 3
    ctx.drawImage(redImg, (prize.cell % 3) * gs, 0, gs, redImg.height, -s, -s, s * 2, s * 2)
  } else if (img && img.width) {
    const gs = img.width / 4
    const row = Math.floor(prize.cell / 4)
    const col = prize.cell % 4
    ctx.drawImage(img, col * gs, row * gs, gs, gs, -s, -s, s * 2, s * 2)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillRect(-s, -s, s * 2, s * 2)
  }
  ctx.restore()
  // 图外细描边
  ctx.beginPath()
  ctx.arc(cx, cy, s, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1
  ctx.stroke()

  // 中文名（沿半径方向排布，位于图片内侧，间距拉开）
  ctx.save()
  ctx.translate(D / 2, D / 2)
  ctx.rotate(mid)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const m = prize.name.match(/^(\d+)(.*)$/)
  if (m) {
    // 红包：数字大行 + “红包”小行
    ctx.fillStyle = 'rgba(130,16,36,0.95)'
    ctx.font = `800 ${D * 0.033}px "PingFang SC","Microsoft YaHei",sans-serif`
    ctx.fillText(m[1], 0, -D * 0.218)
    ctx.fillStyle = 'rgba(130,16,36,0.8)'
    ctx.font = `700 ${D * 0.021}px "PingFang SC","Microsoft YaHei",sans-serif`
    ctx.fillText(m[2], 0, -D * 0.265)
  } else {
    ctx.fillStyle = 'rgba(58,36,16,0.92)'
    ctx.font = `700 ${D * 0.031}px "PingFang SC","Microsoft YaHei",sans-serif`
    ctx.fillText(prize.name, 0, -D * 0.245)
  }
  ctx.restore()
}

function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, D, D)
  for (let i = 0; i < props.prizes.length; i++) {
    drawSector(i, COLORS[i % COLORS.length])
  }
  for (let i = 0; i < props.prizes.length; i++) {
    drawPrize(i)
  }
  // 中心圆
  const grad = ctx.createLinearGradient(0, D / 2 - D * 0.13, 0, D / 2 + D * 0.13)
  grad.addColorStop(0, '#ffe6a8')
  grad.addColorStop(1, '#d9a441')
  ctx.beginPath()
  ctx.arc(D / 2, D / 2, D * 0.13, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.shadowColor = 'rgba(242,196,104,0.7)'
  ctx.shadowBlur = 16
  ctx.fill()
  ctx.shadowBlur = 0
  // 中心小星
  ctx.fillStyle = '#fff7e0'
  ctx.beginPath()
  for (let k = 0; k < 5; k++) {
    const a1 = -Math.PI / 2 + (k * Math.PI * 2) / 5
    const a2 = a1 + Math.PI / 5
    const px = D / 2 + Math.cos(a1) * D * 0.045
    const py = D / 2 + Math.sin(a1) * D * 0.045
    if (k === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
    ctx.lineTo(D / 2 + Math.cos(a2) * D * 0.018, D / 2 + Math.sin(a2) * D * 0.018)
  }
  ctx.closePath()
  ctx.fill()
}

function spin() {
  if (spinning.value || props.tickets <= 0) return
  sfxClick()
  spinning.value = true
  highlightIdx = -1

  const idx = (Math.random() * props.prizes.length) | 0
  const target = (345 - idx * 30 + 360) % 360 // 扇区中心对准顶部指针
  const spins = 5 + ((Math.random() * 3) | 0)
  const current = ((rotate % 360) + 360) % 360
  const delta = (target - current + 360) % 360
  rotate += spins * 360 + delta

  canvasRef.value.style.transform = `rotate(${rotate}deg)`

  if (spinTimer) clearTimeout(spinTimer)
  spinTimer = setTimeout(() => {
    spinning.value = false
    highlightIdx = idx
    draw()
    sfxConfetti()
    sfxWin()
    emit('spun', props.prizes[idx])
  }, 4700)
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  img = new Image()
  img.onload = () => draw()
  img.src = props.gridUrl
  if (props.redUrl) {
    redImg = new Image()
    redImg.onload = () => draw()
    redImg.src = props.redUrl
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (spinTimer) clearTimeout(spinTimer)
})

defineExpose({ spin })
</script>

<template>
  <div class="wheel-wrap">
    <div class="wheel-box">
      <div class="pointer" aria-hidden="true">
        <span class="pointer-tri"></span>
        <span class="pointer-dot"></span>
      </div>
      <canvas ref="canvasRef" class="wheel-canvas" :style="{ transform: `rotate(${rotate}deg)` }" />
    </div>
  </div>
</template>

<style scoped>
.wheel-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wheel-box {
  position: relative;
  width: min(52vmin, 360px);
  height: min(52vmin, 360px);
  filter: drop-shadow(0 0 26px rgba(242, 196, 104, 0.28));
}

.wheel-canvas {
  width: 100%;
  height: 100%;
  display: block;
  transition: transform 4.6s cubic-bezier(0.12, 0.82, 0.14, 1);
}

/* 顶部指针 */
.pointer {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
}
.pointer-tri {
  width: 0;
  height: 0;
  border-left: 13px solid transparent;
  border-right: 13px solid transparent;
  border-top: 34px solid var(--gold-bright);
}
.pointer-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(180deg, #ffe6a8, #d9a441);
  margin-top: -3px;
  border: 2px solid rgba(255, 255, 255, 0.6);
}
</style>
