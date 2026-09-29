<script setup>
// 惊喜游乐园：回忆拼图 + 默契问答 → 抽奖机会；红包雨独立；大转盘抽奖
import { computed, ref } from 'vue'
import { CONFIG } from '../../config'
import { getPrizeIconUrl } from '../../composables/prizeIcons'
import PuzzleGame from '../games/PuzzleGame.vue'
import ChemistryQuiz from '../games/ChemistryQuiz.vue'
import RedPacketRain from '../games/RedPacketRain.vue'
import WheelOfFortune from '../WheelOfFortune.vue'
import { sfxClick, sfxDigit } from '../../composables/audio'

const view = ref('hub') // hub | puzzle | chem | rain | wheel
const done = ref({ puzzle: false, chem: false })
const tickets = ref(0)
const results = ref([])
const spinning = ref(false)
const wheelRef = ref(null)
const rainPlayed = ref(false)

const games = [
  { key: 'puzzle', name: '回忆拼图', doneKey: 'puzzle' },
  { key: 'chem', name: '默契问答', doneKey: 'chem' },
]

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

function openRain() {
  sfxClick()
  view.value = 'rain'
}

function onRainDone() {
  rainPlayed.value = true
  view.value = 'hub'
}

function openWheel() {
  sfxClick()
  view.value = 'wheel'
}

// 转盘展示全部奖品扇区；核心奖品（兰蔻小黑瓶 / 老庙黄金项链）固定必中：
// 第 1 次抽奖在两者中随机，抽中后移出候选，第 2 次必中另一个
const CORE_NAMES = ['兰蔻超修小黑瓶精华', '老庙黄金项链']
const wheelPrizes = [
  ...CONFIG.prizes.filter((p) => !CORE_NAMES.includes(p.name)),
  ...CONFIG.prizes.filter((p) => CORE_NAMES.includes(p.name)),
]
const remaining = ref(wheelPrizes)
const wonCore = ref([])
const unwonCore = computed(() => CORE_NAMES.filter((n) => !wonCore.value.includes(n)))

function onSpun(prize) {
  tickets.value -= 1
  results.value = [prize, ...results.value]
  if (CORE_NAMES.includes(prize.name)) wonCore.value.push(prize.name)
  spinning.value = false
}

function goHub() {
  sfxClick()
  spinning.value = false
  view.value = 'hub'
}

function doSpin() {
  if (tickets.value <= 0 || spinning.value) return
  const ok = wheelRef.value?.spin?.()
  spinning.value = !!ok
}

function prizeThumb(r) {
  return { backgroundImage: `url(${r.image || getPrizeIconUrl(r)})`, backgroundSize: 'cover' }
}
</script>

<template>
  <section class="scene active hub-scene">
    <!-- ===== 大厅 ===== -->
    <template v-if="view === 'hub'">
      <div class="step-tag">惊喜游乐园</div>
      <h2 class="heading">先玩小游戏，再抽大奖</h2>
      <p class="sub">完成拼图与默契问答，各获得 1 次抽奖机会</p>

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
            <svg v-if="g.key === 'puzzle'" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm14.5 0a2.5 2.5 0 0 1 0 5H21v2h-3.5a4.5 4.5 0 0 1 0-9H21v2h-3.5z"
                fill="currentColor"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 3c-1.5 2.5-4 4-7 4 0 5 3 9 7 11 4-2 7-6 7-11-3 0-5.5-1.5-7-4z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span class="game-name">{{ g.name }}</span>
          <span class="game-state">{{ done[g.doneKey] ? '已完成 · 已获得抽奖机会' : '去玩' }}</span>
        </button>

        <button
          class="game-card card--rain"
          :class="{ done: rainPlayed }"
          type="button"
          @click="openRain"
        >
          <span class="game-ico ico--rain">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="4" width="12" height="16" rx="2" fill="currentColor" />
              <circle cx="12" cy="10" r="2.5" fill="rgba(255,255,255,0.85)" />
            </svg>
          </span>
          <span class="game-name">红包雨</span>
          <span class="game-state">{{ rainPlayed ? '已体验' : '开抢' }}</span>
        </button>
      </div>

      <div class="wheel-entry">
        <span class="ticket-count">
          剩余抽奖机会 <b>{{ tickets }}</b> 次
        </span>
        <button class="btn-gold" type="button" @click="openWheel">
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
          <i class="won-thumb" :style="prizeThumb(r)"></i>
          {{ r.name }}
        </span>
      </div>

    </template>

    <!-- ===== 回忆拼图 ===== -->
    <template v-else-if="view === 'puzzle'">
      <div class="game-top">
        <button class="btn-ghost back-btn" type="button" @click="goHub">返回</button>
        <div class="step-tag">小游戏 · 回忆拼图</div>
      </div>
      <PuzzleGame @done="onGameDone('puzzle')" />
    </template>

    <!-- ===== 默契问答 ===== -->
    <template v-else-if="view === 'chem'">
      <div class="game-top">
        <button class="btn-ghost back-btn" type="button" @click="goHub">返回</button>
        <div class="step-tag">小游戏 · 默契问答</div>
      </div>
      <ChemistryQuiz @done="onGameDone('chem')" />
    </template>

    <!-- ===== 红包雨 ===== -->
    <template v-else-if="view === 'rain'">
      <div class="game-top">
        <button class="btn-ghost back-btn" type="button" @click="goHub">返回</button>
        <div class="step-tag">红包雨</div>
      </div>
      <RedPacketRain @done="onRainDone" />
    </template>

    <!-- ===== 大转盘抽奖 ===== -->
    <template v-else>
      <div class="game-top">
        <button class="btn-ghost back-btn" type="button" @click="goHub">返回</button>
        <div class="step-tag">抽奖大转盘</div>
      </div>

      <h2 class="heading">转动你的好运气</h2>
      <p class="sub">剩余抽奖机会 <b class="gold-text">{{ tickets }}</b> 次</p>

      <WheelOfFortune
        ref="wheelRef"
        :prizes="remaining"
        :core-names="unwonCore"
        :tickets="tickets"
        @spun="onSpun"
      />

      <button
        class="btn-gold spin-btn"
        type="button"
        :disabled="tickets <= 0 || spinning"
        @click="doSpin"
      >
        开始抽奖
      </button>

      <p v-if="tickets <= 0" class="no-ticket-tip">
        还没有抽奖机会～ 完成「回忆拼图」或「默契问答」即可获得抽奖机会
      </p>

      <transition-group name="chip" tag="div" class="won-list">
        <div v-for="(r, i) in results" :key="i" class="won-card">
          <i class="won-thumb" :style="prizeThumb(r)"></i>
          <b class="won-name-only">{{ r.name }}</b>
        </div>
      </transition-group>
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
.gold-text {
  color: var(--gold-bright);
}

.cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(12px, 2.2vmin, 24px);
  margin-top: 1vmin;
}
.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: clamp(140px, 22vmin, 200px);
  padding: clamp(16px, 2.8vmin, 28px) clamp(12px, 2.2vmin, 22px);
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
.ico--chem {
  background: linear-gradient(180deg, #ffd0e2, #ff9fc4);
  box-shadow: var(--glow-pink);
}
.ico--rain {
  background: linear-gradient(180deg, #ff8fab, #e63946);
  color: #fff7fb;
  box-shadow: 0 0 20px rgba(230, 57, 70, 0.45);
  animation: icoRain 1.6s ease-in-out infinite;
}
@keyframes icoRain {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 14px rgba(230, 57, 70, 0.4);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 30px rgba(230, 57, 70, 0.75);
  }
}
.card--rain {
  border: 2px solid rgba(230, 57, 70, 0.7);
  background: linear-gradient(180deg, rgba(255, 77, 109, 0.16), rgba(42, 17, 71, 0.5));
  animation: cardRain 2.4s ease-in-out infinite;
}
.card--rain:hover {
  border-color: rgba(255, 123, 140, 0.95);
}
@keyframes cardRain {
  0%,
  100% {
    box-shadow: 0 0 16px rgba(230, 57, 70, 0.3);
  }
  50% {
    box-shadow: 0 0 38px rgba(230, 57, 70, 0.6);
  }
}
.game-name {
  font-size: clamp(17px, 2.5vmin, 22px);
  font-weight: 700;
  letter-spacing: 0.06em;
}
.game-desc {
  font-size: clamp(12px, 1.7vmin, 15px);
  color: var(--ink-faint);
  text-align: center;
}
.game-state {
  font-size: clamp(12px, 1.7vmin, 15px);
  color: var(--gold);
  letter-spacing: 0.04em;
}

.wheel-entry {
  display: flex;
  align-items: center;
  gap: clamp(16px, 3vmin, 30px);
  margin-top: 1vmin;
  flex-wrap: wrap;
  justify-content: center;
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

.spin-btn {
  margin-top: 0.5vmin;
  padding: 16px 64px;
}
.spin-btn:disabled {
  opacity: 0.45;
  pointer-events: none;
}


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
  background-position: center;
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
.won-name-only {
  color: var(--gold-bright);
  font-size: clamp(15px, 2.1vmin, 19px);
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