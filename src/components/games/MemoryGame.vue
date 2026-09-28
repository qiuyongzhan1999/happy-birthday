<script setup>
// 小游戏 2：翻牌配对 —— 找到 3 对相同的图案，全部配对过关
import { computed, ref } from 'vue'
import { sfxFlip, sfxPick, sfxWrong, sfxWin } from '../../composables/audio'

const emit = defineEmits(['done'])

const PAIRS = [
  { symbol: 'heart', label: '爱心' },
  { symbol: 'star', label: '星星' },
  { symbol: 'moon', label: '月亮' },
]

const cards = ref([])
const open = ref([]) // 当前翻开的下标
const lock = ref(false)
const moves = ref(0)
const phase = ref('play')

const matchedCount = computed(() => cards.value.filter((c) => c.matched).length)
const allMatched = computed(() => matchedCount.value === cards.value.length)

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
      }, 850)
    }
  }
}

init()
</script>

<template>
  <div class="game-shell">
    <div class="hud">
      <span class="hud-item">配对 <b>{{ matchedCount / 2 }}</b> / {{ PAIRS.length }}</span>
      <span class="hud-item">翻动 <b>{{ moves }}</b> 次</span>
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
          <svg v-else viewBox="0 0 24 24" class="symbol" aria-hidden="true">
            <path
              d="M15.5 2.5c4.6 1.7 7.5 6 7.5 10.9 0 6-4.9 8.1-9.5 8.1-3.1 0-6-1-8.1-3A10.3 10.3 0 0 0 15.5 2.5z"
              fill="#c7a8ff"
            />
          </svg>
        </span>
      </button>
    </div>

    <div v-if="phase === 'win'" class="overlay">
      <p class="overlay-title gold-text">全部配对成功</p>
      <p class="overlay-sub">恭喜获得 1 次抽奖机会</p>
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
  gap: clamp(18px, 4vmin, 40px);
}
.hud-item {
  padding: 8px 18px;
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
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(10px, 1.8vmin, 18px);
  width: min(60vw, 560px);
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
  font-size: clamp(20px, 3vmin, 30px);
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
  width: 46%;
  height: 46%;
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
