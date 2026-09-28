<script setup>
// 小游戏 2：翻牌配对 —— 6 对 12 张卡，24 步内全部配对；超步数或超时失败
import { computed, onBeforeUnmount, ref } from 'vue'
import { sfxFlip, sfxPick, sfxWrong, sfxWin } from '../../composables/audio'

const emit = defineEmits(['done'])

const PAIRS = [
  { symbol: 'heart', label: '爱心' },
  { symbol: 'star', label: '星星' },
  { symbol: 'moon', label: '月亮' },
  { symbol: 'crown', label: '皇冠' },
  { symbol: 'bell', label: '铃铛' },
  { symbol: 'diamond', label: '钻石' },
]
const MAX_MOVES = 24
const TIME_LIMIT = 90

const cards = ref([])
const open = ref([]) // 当前翻开的下标
const lock = ref(false)
const moves = ref(0)
const timeLeft = ref(TIME_LIMIT)
const phase = ref('play')

const matchedCount = computed(() => cards.value.filter((c) => c.matched).length)
const allMatched = computed(() => matchedCount.value === cards.value.length)

let timerId = null
let startedAt = 0

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function init() {
  const base = PAIRS.map((p) => ({ ...p, matched: false }))
  cards.value = shuffle([...base, ...base].map((c, i) => ({ ...c, id: i })))
  open.value = []
  lock.value = false
  moves.value = 0
  phase.value = 'play'
  timeLeft.value = TIME_LIMIT
  startedAt = performance.now()
  if (timerId) clearInterval(timerId)
  timerId = setInterval(() => {
    timeLeft.value = Math.max(0, TIME_LIMIT - Math.floor((performance.now() - startedAt) / 1000))
    if (timeLeft.value === 0 && phase.value === 'play') lose()
  }, 500)
}

function flip(i) {
  if (lock.value || phase.value !== 'play') return
  const card = cards.value[i]
  if (card.matched || open.value.includes(i)) return

  sfxFlip()
  open.value.push(i)
  moves.value += 1

  if (open.value.length === 2) {
    lock.value = true
    const [a, b] = open.value
    if (cards.value[a].symbol === cards.value[b].symbol) {
      // 配对成功
      setTimeout(() => {
        cards.value[a].matched = true
        cards.value[b].matched = true
        open.value = []
        lock.value = false
        sfxPick()
        if (allMatched.value) {
          phase.value = 'win'
          sfxWin()
          setTimeout(() => emit('done'), 1500)
        }
      }, 420)
    } else {
      setTimeout(() => {
        open.value = []
        lock.value = false
        sfxWrong()
        if (moves.value >= MAX_MOVES && !allMatched.value) lose()
      }, 850)
    }
  }
}

function lose() {
  runningStop()
  phase.value = 'lose'
}

function runningStop() {
  if (timerId) clearInterval(timerId)
  timerId = null
}

function restart() {
  init()
}

onBeforeUnmount(() => {
  runningStop()
})

init()
</script>

<template>
  <div class="game-shell">
    <div class="hud">
      <span class="hud-item">配对 <b>{{ matchedCount / 2 }}</b> / {{ PAIRS.length }}</span>
      <span class="hud-item">翻动 <b>{{ moves }}</b> / {{ MAX_MOVES }}</span>
      <span class="hud-item">时间 <b>{{ timeLeft }}</b>s</span>
    </div>

    <div class="board">
      <button
        v-for="(card, i) in cards"
        :key="card.id"
        class="card"
        :class="{ flipped: open.includes(i) || card.matched, matched: card.matched }"
        type="button"
        @click="flip(i)"
      >
        <span class="card-face card-back">
          <span class="back-mark">✦</span>
        </span>
        <span class="card-face card-front">
          <svg v-if="card.symbol === 'heart'" viewBox="0 0 24 24" class="symbol" aria-hidden="true">
            <path
              d="M12 21s-7.5-4.7-9.7-9C0.6 8.6 2.4 5 6 5c2.2 0 3.6 1.2 4.5 2.6C11.4 6.2 12.8 5 15 5c3.6 0 5.4 3.6 3.7 7-2.2 4.3-6.7 9-6.7 9z"
              fill="#ff7bac"
            />
          </svg>
          <svg v-else-if="card.symbol === 'star'" viewBox="0 0 24 24" class="symbol" aria-hidden="true">
            <path
              d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"
              fill="#f2c468"
            />
          </svg>
          <svg v-else-if="card.symbol === 'moon'" viewBox="0 0 24 24" class="symbol" aria-hidden="true">
            <path d="M15.5 2.5c4.6 1.7 7.5 6 7.5 10.9 0 6-4.9 8.1-9.5 8.1-3.1 0-6-1-8.1-3A10.3 10.3 0 0 0 15.5 2.5z" fill="#c7a8ff" />
          </svg>
          <svg v-else-if="card.symbol === 'crown'" viewBox="0 0 24 24" class="symbol" aria-hidden="true">
            <path
              d="M2.5 7.5l4.2 4.2L12 4l5.3 7.7 4.2-4.2-1.6 12.5H4.1L2.5 7.5z"
              fill="#ffd98e"
            />
            <rect x="4.6" y="18.2" width="14.8" height="1.8" rx="0.9" fill="#e8b453" />
          </svg>
          <svg v-else-if="card.symbol === 'bell'" viewBox="0 0 24 24" class="symbol" aria-hidden="true">
            <path
              d="M12 3c-3.2 0-5.4 2.6-5.4 5.9 0 3-.9 4.9-1.8 6.1h14.4c-.9-1.2-1.8-3.1-1.8-6.1C17.4 5.6 15.2 3 12 3z"
              fill="#ffa9c7"
            />
            <circle cx="12" cy="20.4" r="1.7" fill="#ffd98e" />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="symbol" aria-hidden="true">
            <path
              d="M12 2.5 16 9l-4 3.2L8 9l4-6.5zM12 12.5 18 9l-1.5 8.5h-9L6 9l6 3.5z"
              fill="#b9e6ff"
            />
          </svg>
        </span>
      </button>
    </div>

    <div v-if="phase === 'win'" class="overlay">
      <p class="overlay-title gold-text">全部配对成功</p>
      <p class="overlay-sub">恭喜获得 1 次抽奖机会</p>
    </div>
    <div v-else-if="phase === 'lose'" class="overlay">
      <p class="overlay-title">差一点点</p>
      <p class="overlay-sub">在 {{ MAX_MOVES }} 步内完成全部配对哦</p>
      <button class="btn-gold" type="button" @click="restart">再试一次</button>
    </div>
  </div>
</template>

<style scoped>
.game-shell {
  position: relative;
  width: min(88vw, 820px);
  min-height: min(52vh, 430px);
  border-radius: var(--radius-lg);
  padding: clamp(16px, 2.6vmin, 26px);
  background: rgba(8, 5, 28, 0.55);
  border: 1px solid rgba(242, 196, 104, 0.25);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2vmin, 20px);
}

.hud {
  display: flex;
  justify-content: center;
  gap: clamp(14px, 3vmin, 30px);
}
.hud-item {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: clamp(13px, 1.9vmin, 17px);
  color: var(--ink-dim);
  background: rgba(20, 11, 48, 0.7);
  border: 1px solid rgba(242, 196, 104, 0.3);
}
.hud-item b {
  color: var(--gold-bright);
  font-size: 1.15em;
}

.board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(8px, 1.4vmin, 14px);
  width: min(62vw, 560px);
  margin: 0 auto;
}

.card {
  position: relative;
  aspect-ratio: 1;
  perspective: 800px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.card-face {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.card-back {
  background: linear-gradient(160deg, rgba(242, 196, 104, 0.2), rgba(20, 11, 48, 0.85));
  border: 1px solid rgba(242, 196, 104, 0.5);
  box-shadow: inset 0 0 24px rgba(242, 196, 104, 0.12);
}
.back-mark {
  font-size: clamp(18px, 2.8vmin, 28px);
  color: var(--gold);
  animation: pulse-soft 2.2s ease-in-out infinite;
}
.card-front {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.12), rgba(38, 24, 84, 0.6));
  border: 1px solid var(--glass-border);
  transform: rotateY(180deg);
}
.card.flipped .card-back {
  transform: rotateY(180deg);
}
.card.flipped .card-front {
  transform: rotateY(0deg);
}
.card.matched .card-front {
  background: rgba(242, 196, 104, 0.16);
  border-color: var(--gold);
  box-shadow: var(--glow-gold);
}
.card:active .card-back {
  transform: scale(0.96);
}

.symbol {
  width: 48%;
  height: 48%;
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  border-radius: var(--radius-lg);
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
