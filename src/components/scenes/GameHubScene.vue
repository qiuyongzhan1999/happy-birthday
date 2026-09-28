<script setup>
// 惊喜游乐园：3 个小游戏 → 每完成 1 个获得 1 次抽奖机会 → 大转盘抽奖
import { computed, ref } from 'vue'
import { CONFIG } from '../../config'
import prizesGrid from '../../assets/prizes-grid.jpg'
import redEnvelopes from '../../assets/red-envelopes.jpg'
import CatchStarsGame from '../games/CatchStarsGame.vue'
import MemoryGame from '../games/MemoryGame.vue'
import PopBubblesGame from '../games/PopBubblesGame.vue'
import WheelOfFortune from '../WheelOfFortune.vue'
import { sfxClick, sfxDigit } from '../../composables/audio'

const emit = defineEmits(['continue'])

const view = ref('hub') // hub | catch | memory | pop | wheel
const done = ref({ catch: false, memory: false, pop: false })
const tickets = ref(0)
const results = ref([])
const spinning = ref(false)
const wheelRef = ref(null)

const games = [
  { key: 'catch', name: '接星星', desc: '接住落下的星星', doneKey: 'catch' },
  { key: 'memory', name: '翻牌配对', desc: '找到三对图案', doneKey: 'memory' },
  { key: 'pop', name: '点泡泡', desc: '戳破漂浮泡泡', doneKey: 'pop' },
]

const doneCount = computed(() => Object.values(done.value).filter(Boolean).length)
const allTicketsUsed = computed(() => doneCount.value >= games.length)

function openGame(key) {
  sfxClick()
  view.value = key
}

function onGameDone(key) {
  if (done.value[key]) {
    view.value = 'hub'
    return
  }
  done.value[key] = true
  tickets.value += 1
  sfxDigit()
  setTimeout(() => (view.value = 'hub'), 300)
}

function openWheel() {
  sfxClick()
  view.value = 'wheel'
}

function onSpun(prize) {
  tickets.value -= 1
  results.value = [prize, ...results.value]
  spinning.value = false
}

function prizePos(r) {
  if (r.img === 'red') {
    return {
      backgroundImage: `url(${redEnvelopes})`,
      backgroundSize: '300% 100%',
      backgroundPosition: `${((r.cell % 3) / 2) * 100}% 50%`,
    }
  }
  const row = Math.floor(r.cell / 4)
  const col = r.cell % 4
  return {
    backgroundImage: `url(${prizesGrid})`,
    backgroundSize: '400% 400%',
    backgroundPosition: `${(col / 3) * 100}% ${(row / 3) * 100}%`,
  }
}

function goHub() {
  sfxClick()
  view.value = 'hub'
}

function doSpin() {
  if (tickets.value <= 0 || spinning.value) return
  spinning.value = true
  wheelRef.value?.spin()
}
</script>

<template>
  <section class="scene active hub-scene">
    <!-- ===== 大厅 ===== -->
    <template v-if="view === 'hub'">
      <div class="step-tag">惊喜游乐园</div>
      <h2 class="heading">先玩 3 个小游戏</h2>
      <p class="sub">每完成一个小游戏，就能获得 1 次抽奖机会</p>

      <div class="cards">
        <button
          v-for="g in games"
          :key="g.key"
          class="game-card"
          :class="{ done: done[g.doneKey] }"
          type="button"
          @click="openGame(g.key)"
        >
          <span class="game-ico" :class="'ico--' + g.key">
            <svg v-if="g.key === 'catch'" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"
                fill="currentColor"
              />
            </svg>
            <svg v-else-if="g.key === 'memory'" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2" y="5" width="15" height="18" rx="2.5" fill="currentColor" opacity="0.85" />
              <rect x="7" y="1" width="15" height="18" rx="2.5" fill="currentColor" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="currentColor" />
              <circle cx="9.5" cy="9" r="2.4" fill="rgba(255,255,255,0.85)" />
            </svg>
          </span>
          <span class="game-name">{{ g.name }}</span>
          <span class="game-desc">{{ g.desc }}</span>
          <span class="game-state">{{ done[g.doneKey] ? '已完成 · 已获得抽奖机会' : '去玩' }}</span>
        </button>
      </div>

      <div class="wheel-entry">
        <span class="ticket-count">
          剩余抽奖机会 <b>{{ tickets }}</b> 次
        </span>
        <button class="btn-gold" type="button" :disabled="tickets <= 0" @click="openWheel">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
            <circle cx="12" cy="12" r="2.4" fill="currentColor" />
            <path d="M12 3a9 9 0 0 1 8.5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          抽奖大转盘
        </button>
      </div>

      <div v-if="results.length" class="won-list">
        <span v-for="(r, i) in results" :key="i" class="won-chip">
          <i class="won-thumb" :style="prizePos(r)"></i>
          {{ r.name }}
        </span>
      </div>

      <div class="bottom-row">
        <button v-if="allTicketsUsed" class="btn-gold continue-btn" type="button" @click="emit('continue')">
          继续领取你的生日礼物
        </button>
        <button class="btn-ghost skip-btn" type="button" @click="emit('continue')">
          跳过游戏，直接去领礼物
        </button>
      </div>
    </template>

    <!-- ===== 小游戏 ===== -->
    <template v-else-if="view === 'catch' || view === 'memory' || view === 'pop'">
      <div class="game-top">
        <button class="btn-ghost back-btn" type="button" @click="goHub">返回</button>
        <div class="step-tag">小游戏 · {{ games.find((g) => g.key === view)?.name }}</div>
      </div>
      <CatchStarsGame v-if="view === 'catch'" @done="onGameDone('catch')" />
      <MemoryGame v-else-if="view === 'memory'" @done="onGameDone('memory')" />
      <PopBubblesGame v-else @done="onGameDone('pop')" />
    </template>

    <!-- ===== 大转盘 ===== -->
    <template v-else>
      <div class="game-top">
        <button class="btn-ghost back-btn" type="button" @click="goHub">返回</button>
        <div class="step-tag">幸运大转盘</div>
      </div>

      <h2 class="heading">转动你的好运气</h2>
      <p class="sub">剩余抽奖机会 <b class="gold-text">{{ tickets }}</b> 次</p>

      <WheelOfFortune
        ref="wheelRef"
        :prizes="CONFIG.prizes"
        :grid-url="prizesGrid"
        :red-url="redEnvelopes"
        :tickets="tickets"
        @spun="onSpun"
      />

      <button
        class="btn-gold spin-btn"
        type="button"
        :disabled="tickets <= 0 || spinning"
        @click="doSpin"
      >
        抽奖
      </button>

      <transition-group name="chip" tag="div" class="won-list">
        <div v-for="(r, i) in results" :key="i" class="won-card">
          <i class="won-thumb" :style="prizePos(r)"></i>
          <div class="won-info">
            <b>{{ r.name }}</b>
            <span>{{ r.tag }}</span>
          </div>
        </div>
      </transition-group>

      <button v-if="allTicketsUsed" class="btn-gold continue-btn" type="button" @click="emit('continue')">
        继续领取你的生日礼物
      </button>
    </template>
  </section>
</template>

<style scoped>
.hub-scene {
  gap: clamp(10px, 1.7vmin, 20px);
}

.heading {
  font-size: clamp(28px, 4.8vmin, 46px);
  font-weight: 700;
  letter-spacing: 0.08em;
}
.sub {
  font-size: clamp(14px, 2vmin, 18px);
  color: var(--ink-dim);
  letter-spacing: 0.05em;
}

/* —— 大厅 —— */
.cards {
  display: flex;
  gap: clamp(12px, 2.2vmin, 24px);
  margin-top: 1vmin;
}
.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: clamp(150px, 24vmin, 220px);
  padding: clamp(18px, 3vmin, 30px) clamp(14px, 2.4vmin, 24px);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  transition: transform 0.22s ease, background 0.25s ease, border-color 0.25s ease;
}
.game-card:active {
  transform: scale(0.95);
}
.game-card.done {
  background: rgba(242, 196, 104, 0.14);
  border-color: rgba(242, 196, 104, 0.6);
}
.game-ico {
  width: clamp(52px, 7.4vmin, 68px);
  height: clamp(52px, 7.4vmin, 68px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #3a2410;
  background: linear-gradient(180deg, #ffe6a8, #f2c468);
  box-shadow: var(--glow-gold);
}
.game-ico svg {
  width: 46%;
  height: 46%;
}
.ico--memory {
  background: linear-gradient(180deg, #ffd0e2, #ff9fc4);
  box-shadow: var(--glow-pink);
}
.ico--pop {
  background: linear-gradient(180deg, #d6c4ff, #a88bff);
  box-shadow: 0 0 20px rgba(168, 139, 255, 0.45);
}
.game-name {
  font-size: clamp(18px, 2.6vmin, 24px);
  font-weight: 700;
  letter-spacing: 0.06em;
}
.game-desc {
  font-size: clamp(12px, 1.7vmin, 15px);
  color: var(--ink-faint);
}
.game-state {
  font-size: clamp(12px, 1.7vmin, 15px);
  color: var(--gold);
  letter-spacing: 0.04em;
}

/* —— 转盘入口 —— */
.wheel-entry {
  display: flex;
  align-items: center;
  gap: clamp(16px, 3vmin, 30px);
  margin-top: 1vmin;
}
.ticket-count {
  font-size: clamp(15px, 2.2vmin, 20px);
  color: var(--ink-dim);
  letter-spacing: 0.05em;
}
.ticket-count b {
  color: var(--gold-bright);
  font-size: 1.3em;
  margin: 0 4px;
}
.wheel-entry .btn-gold:disabled {
  opacity: 0.45;
  pointer-events: none;
}

/* —— 底部 —— */
.bottom-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 1vmin;
}
.continue-btn {
  margin-top: 1vmin;
  animation: pulse-soft 2.4s ease-in-out infinite;
}
.skip-btn {
  font-size: clamp(13px, 1.8vmin, 16px);
}

/* —— 游戏视图 —— */
.game-top {
  position: absolute;
  top: clamp(14px, 2.6vmin, 28px);
  left: clamp(14px, 2.6vmin, 28px);
  right: clamp(14px, 2.6vmin, 28px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 20;
}
.back-btn {
  padding: 10px 22px;
  font-size: clamp(13px, 1.8vmin, 16px);
}

/* —— 转盘视图 —— */
.spin-btn {
  margin-top: 0.5vmin;
  padding: 16px 64px;
}
.spin-btn:disabled {
  opacity: 0.45;
  pointer-events: none;
}

/* —— 中奖展示 —— */
.won-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(10px, 1.8vmin, 16px);
  margin-top: 0.8vmin;
  max-width: 86vw;
}
.won-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 8px 8px;
  border-radius: 999px;
  font-size: clamp(13px, 1.8vmin, 16px);
  background: rgba(242, 196, 104, 0.14);
  border: 1px solid rgba(242, 196, 104, 0.4);
  color: var(--gold-bright);
}
.won-thumb {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: inline-block;
  background-repeat: no-repeat;
}
.won-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px 10px 10px;
  border-radius: var(--radius-md);
  background: rgba(38, 24, 84, 0.55);
  border: 1px solid var(--glass-border);
}
.won-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.won-info b {
  color: var(--gold-bright);
  font-size: clamp(15px, 2.1vmin, 19px);
}
.won-info span {
  color: var(--ink-faint);
  font-size: clamp(12px, 1.6vmin, 14px);
}

.chip-enter-active,
.chip-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.chip-enter-from,
.chip-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}
</style>
