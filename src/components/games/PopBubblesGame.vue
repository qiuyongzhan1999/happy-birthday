<script setup>
// 小游戏 3：点泡泡 —— 金色泡泡 +2、粉色泡泡 +1、炸弹泡泡扣 1 条命并减 3 秒
// 拿到 20 分过关；生命归零或超时失败
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { sfxPop, sfxWrong, sfxWin } from '../../composables/audio'

const emit = defineEmits(['done'])

const TARGET = 20
const TIME_LIMIT = 30
const LIVES = 3

const areaRef = ref(null)
const bubbles = ref([])
const score = ref(0)
const lives = ref(LIVES)
const timeLeft = ref(TIME_LIMIT)
const phase = ref('play')

let raf = 0
let running = false
let timerId = null
let startedAt = 0
let lastSpawn = 0
let areaW = 0
let areaH = 0

function measure() {
  const el = areaRef.value
  if (!el) return
  areaW = el.clientWidth
  areaH = el.clientHeight
}

function spawn() {
  const roll = Math.random()
  const r = 24 + Math.random() * 22
  let kind = 'pink'
  let color = '#ff9fb0'
  let vxBase = 0.9
  if (roll < 0.28) {
    kind = 'gold'
    color = '#ffd98e'
    vxBase = 1.1
  } else if (roll < 0.42) {
    kind = 'bomb'
    color = '#6b2d52'
    vxBase = 0.8
  }
  bubbles.value.push({
    id: Date.now() + Math.random(),
    x: r + Math.random() * Math.max(20, areaW - r * 2),
    y: areaH + r,
    r,
    kind,
    vx: (Math.random() - 0.5) * vxBase,
    vy: 1.1 + Math.random() * 1.5,
    color,
    phase: Math.random() * Math.PI * 2,
    popping: false,
  })
  if (bubbles.value.length > 45) bubbles.value.shift()
}

function tick() {
  if (!running) return
  const now = performance.now()
  if (now - lastSpawn > 430) {
    spawn()
    lastSpawn = now
  }
  for (const b of bubbles.value) {
    b.x += b.vx + Math.sin(now * 0.001 + b.phase) * 0.4
    b.y -= b.vy
    if (b.y < -b.r * 3) b.y = areaH + b.r
    if (b.x < b.r || b.x > areaW - b.r) b.vx *= -1
  }
  raf = requestAnimationFrame(tick)
}

function pop(id) {
  if (phase.value !== 'play') return
  const b = bubbles.value.find((x) => x.id === id)
  if (!b || b.popping) return
  b.popping = true
  if (b.kind === 'bomb') {
    sfxWrong()
    lives.value -= 1
    timeLeft.value = Math.max(0, timeLeft.value - 3)
    if (lives.value <= 0) {
      lose()
      return
    }
  } else {
    sfxPop()
    score.value += b.kind === 'gold' ? 2 : 1
    if (score.value >= TARGET) {
      win()
      return
    }
  }
  setTimeout(() => {
    bubbles.value = bubbles.value.filter((x) => x.id !== id)
  }, 260)
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
  bubbles.value = []
  score.value = 0
  lives.value = LIVES
  timeLeft.value = TIME_LIMIT
  phase.value = 'play'
  measure()
  lastSpawn = 0
  startedAt = performance.now()
  if (timerId) clearInterval(timerId)
  timerId = setInterval(() => {
    timeLeft.value = Math.max(0, TIME_LIMIT - Math.floor((performance.now() - startedAt) / 1000))
    if (timeLeft.value === 0 && phase.value === 'play') lose()
  }, 500)
  running = true
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  restart()
})

onBeforeUnmount(() => {
  running = false
  cancelAnimationFrame(raf)
  clearInterval(timerId)
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <div class="game-shell">
    <div class="hud">
      <span class="hud-item">得分 <b>{{ score }}</b> / {{ TARGET }}</span>
      <span class="hud-item hud-lives">
        生命
        <b class="lives">
          <i v-for="n in LIVES" :key="n" class="life" :class="{ lost: n > lives }">♥</i>
        </b>
      </span>
      <span class="hud-item">时间 <b>{{ timeLeft }}</b>s</span>
    </div>

    <div ref="areaRef" class="bubble-area">
      <div
        v-for="b in bubbles"
        :key="b.id"
        class="bubble"
        :class="{ popping: b.popping, bomb: b.kind === 'bomb', gold: b.kind === 'gold' }"
        :style="{
          left: b.x + 'px',
          top: b.y + 'px',
          width: b.r * 2 + 'px',
          height: b.r * 2 + 'px',
          background:
            b.kind === 'bomb'
              ? 'radial-gradient(circle at 34% 30%, rgba(190,120,170,0.5) 0%, #4a1e3d 55%, rgba(26,10,20,0.9) 100%)'
              : `radial-gradient(circle at 34% 30%, rgba(255,255,255,0.85) 0%, ${b.color} 58%, rgba(120,60,110,0.25) 100%)`,
        }"
        @click="pop(b.id)"
      >
        <span v-if="b.kind === 'bomb'" class="bomb-mark">⚡</span>
        <span v-else-if="b.kind === 'gold'" class="gold-mark">✦</span>
        <span v-else class="bubble-shine"></span>
      </div>
    </div>

    <div v-if="phase === 'win'" class="overlay overlay--win">
      <p class="overlay-title gold-text">泡泡都戳破啦</p>
      <p class="overlay-sub">恭喜获得 1 次抽奖机会</p>
    </div>
    <div v-else-if="phase === 'lose'" class="overlay">
      <p class="overlay-title">差一点点</p>
      <p class="overlay-sub">小心炸弹泡泡！再来一次</p>
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

.bubble-area {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: manipulation;
}

.hud {
  position: absolute;
  top: 14px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: clamp(14px, 3vmin, 30px);
  z-index: 5;
  pointer-events: none;
}
.hud-item {
  padding: 8px 16px;
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
.lives {
  display: inline-flex;
  gap: 3px;
  letter-spacing: 1px;
}
.life {
  font-style: normal;
  color: #ff7bac;
  text-shadow: 0 0 8px rgba(255, 123, 172, 0.8);
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.life.lost {
  opacity: 0.25;
  transform: scale(0.82);
}

.bubble {
  position: absolute;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.24s ease, opacity 0.24s ease;
  -webkit-tap-highlight-color: transparent;
  box-shadow: inset -4px -6px 14px rgba(120, 60, 110, 0.18);
}
.bubble:active {
  transform: scale(1.12);
}
.bubble.popping {
  transform: scale(1.6);
  opacity: 0;
}
.bubble.gold {
  box-shadow:
    inset -4px -6px 14px rgba(180, 120, 40, 0.2),
    0 0 16px rgba(255, 217, 142, 0.55);
}
.bubble.bomb {
  box-shadow:
    inset -4px -6px 14px rgba(40, 10, 30, 0.5),
    0 0 14px rgba(140, 45, 120, 0.45);
}
.bubble-shine {
  width: 30%;
  height: 24%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
  transform: translate(-30%, -20%);
}
.gold-mark {
  color: #7a4d00;
  font-size: 0.42em;
  text-shadow: 0 0 8px rgba(255, 240, 190, 0.9);
  font-style: normal;
}
.bomb-mark {
  color: #ffd98e;
  font-size: 0.4em;
  text-shadow: 0 0 10px rgba(255, 110, 90, 0.8);
  font-style: normal;
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
