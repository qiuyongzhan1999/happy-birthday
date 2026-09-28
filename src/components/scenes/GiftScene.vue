<script setup>
// 礼物揭晓：盒子打开 → 彩纸爆发 → 口红与项链登场
import { inject, onBeforeUnmount, onMounted, ref } from 'vue'
import MoonMark from '../MoonMark.vue'
import { CONFIG } from '../../config'
import { sfxConfetti, sfxDigit, sfxWin } from '../../composables/audio'

const gift = CONFIG.gift

const confetti = inject('confetti', null)
const opened = ref(false)
const showGifts = ref(false)
let openTimer = null
let giftTimer = null

function openBox() {
  if (opened.value) return
  opened.value = true
  sfxDigit()
  confetti?.burst(window.innerWidth / 2, window.innerHeight / 2, 110)
  confetti?.rain(2400)
  sfxConfetti()
  openTimer = setTimeout(() => {
    showGifts.value = true
    sfxWin()
    confetti?.burst(window.innerWidth / 2, window.innerHeight * 0.3, 70)
  }, 1200)
}

onMounted(() => {
  openTimer = setTimeout(openBox, 900)
})

onBeforeUnmount(() => {
  if (openTimer) clearTimeout(openTimer)
  if (giftTimer) clearTimeout(giftTimer)
})
</script>

<template>
  <section class="scene active gift-scene">
    <div class="step-tag">最后的惊喜</div>

    <transition name="box-hide">
      <div v-if="!showGifts" class="box-stage" :class="{ open: opened }" @click="openBox">
        <span class="box-shine"></span>
        <div class="gift-box">
          <span class="ribbon ribbon--v"></span>
          <span class="ribbon ribbon--h"></span>
          <span class="bow"></span>
          <div class="box-body"></div>
          <div class="box-lid">
            <span class="lid-ribbon"></span>
          </div>
        </div>
        <p class="box-tip" :class="{ gone: opened }">轻触盒子，打开它</p>
      </div>
    </transition>

    <transition name="gift-rise">
      <div v-if="showGifts" class="gifts-stage">
        <MoonMark :size="64" />
        <h2 class="gift-title gold-text">{{ gift.title }}</h2>

        <div class="gift-cards">
          <div class="gift-card">
            <svg class="gift-art" viewBox="0 0 64 64" aria-hidden="true">
              <defs>
                <linearGradient id="lip-body" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#5c2438" />
                  <stop offset="100%" stop-color="#2e1220" />
                </linearGradient>
                <linearGradient id="lip-tip" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#ff5d73" />
                  <stop offset="100%" stop-color="#d9264a" />
                </linearGradient>
              </defs>
              <rect x="18" y="8" width="28" height="14" rx="6" fill="#8a3d55" />
              <path d="M22 22 L42 22 L42 26 L22 26 Z" fill="#5c2438" />
              <path d="M23 26 L41 26 L41 52 a6 6 0 0 1 -6 6 H29 a6 6 0 0 1 -6 -6 Z" fill="url(#lip-body)" />
              <path d="M24 26 L40 26 L37 22 Q32 24.5 27 22 Z" fill="url(#lip-tip)" />
              <circle cx="32" cy="12" r="2.4" fill="#ffe6a8" />
            </svg>
            <b class="gift-name">一支口红</b>
            <span class="gift-line">{{ gift.line1 }}</span>
          </div>

          <div class="gift-card">
            <svg class="gift-art" viewBox="0 0 64 64" aria-hidden="true">
              <defs>
                <linearGradient id="chain-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#ffe6a8" />
                  <stop offset="100%" stop-color="#d9a441" />
                </linearGradient>
              </defs>
              <path
                d="M12 14c5 8 8 12 20 30 12-18 15-22 20-30"
                fill="none"
                stroke="url(#chain-g)"
                stroke-width="2.6"
                stroke-linecap="round"
              />
              <path
                d="M32 44c-2.6 3-6 4.4-8 4.4C21 48.4 19.5 45 22 43c2.6-3 6-4.4 8-4.4 3 0 4.5 3.4 2 5.4z"
                fill="none"
                stroke="#ffe6a8"
                stroke-width="2"
              />
              <path
                d="M29.4 39.6l1.4 1.6 1.4-1.6"
                fill="none"
                stroke="#ffe6a8"
                stroke-width="1.8"
                stroke-linecap="round"
              />
              <circle cx="32" cy="46" r="3" fill="#f2c468" stroke="#fff2d0" stroke-width="1.2" />
            </svg>
            <b class="gift-name">一条项链</b>
            <span class="gift-line">{{ gift.line2 }}</span>
          </div>
        </div>

        <p class="bless">{{ gift.bless }}</p>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.gift-scene {
  gap: clamp(12px, 2vmin, 24px);
}

/* —— 盒子阶段 —— */
.box-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(16px, 2.6vmin, 28px);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.gift-box {
  position: relative;
  width: clamp(180px, 26vmin, 260px);
  height: clamp(160px, 23vmin, 230px);
  animation: floaty 3.6s ease-in-out infinite;
}
.box-body {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 66%;
  border-radius: 12px;
  background: linear-gradient(180deg, #e75a86, #b02c56);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.45);
}
.box-lid {
  position: absolute;
  left: -8%;
  right: -8%;
  top: 0;
  height: 34%;
  border-radius: 12px;
  background: linear-gradient(180deg, #ff8fb2, #e75a86);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  transform-origin: 12% 100%;
  transition: transform 0.8s cubic-bezier(0.34, 1.4, 0.5, 1), opacity 0.7s ease;
  z-index: 3;
}
.lid-ribbon {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: 18%;
  height: 100%;
  background: linear-gradient(180deg, #ffe6a8, #d9a441);
  border-radius: 4px;
}
.ribbon {
  position: absolute;
  z-index: 4;
  background: linear-gradient(180deg, #ffe6a8, #d9a441);
}
.ribbon--v {
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: 18%;
  height: 66%;
}
.ribbon--h {
  left: 0;
  right: 0;
  top: 0;
  height: 18%;
}
.bow {
  position: absolute;
  left: 50%;
  top: 16%;
  transform: translate(-50%, -50%);
  width: clamp(44px, 6vmin, 60px);
  height: clamp(34px, 4.6vmin, 46px);
  z-index: 5;
  background:
    radial-gradient(ellipse at 30% 50%, #ffe6a8 0%, #e8b453 70%),
    radial-gradient(ellipse at 70% 50%, #ffe6a8 0%, #e8b453 70%);
  background-size: 50% 100%, 50% 100%;
  background-position: 0 0, 100% 0;
  background-repeat: no-repeat;
  border-radius: 50%;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
}

.box-stage.open .box-lid {
  transform: rotate(-42deg) translate(-46px, -52px) scale(0.92);
  opacity: 0;
}
.box-stage.open .gift-box {
  animation: none;
}
.box-shine {
  position: absolute;
  top: 20%;
  left: 50%;
  width: 60%;
  height: 60%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 230, 168, 0.5), transparent 70%);
  opacity: 0;
  transition: opacity 0.7s ease 0.15s;
  pointer-events: none;
}
.box-stage.open .box-shine {
  opacity: 1;
  animation: pulse-soft 1.6s ease-in-out infinite;
}

.box-tip {
  font-size: clamp(15px, 2.2vmin, 20px);
  color: var(--gold-bright);
  letter-spacing: 0.12em;
  animation: pulse-soft 2.2s ease-in-out infinite;
  transition: opacity 0.4s ease;
}
.box-tip.gone {
  opacity: 0;
}

/* —— 礼物阶段 —— */
.gifts-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(8px, 1.6vmin, 18px);
}
.gifts-stage > svg {
  margin-bottom: 0.4vmin;
}
.gift-title {
  font-size: clamp(26px, 4.4vmin, 42px);
  font-weight: 800;
  letter-spacing: 0.14em;
}

.gift-cards {
  display: flex;
  gap: clamp(14px, 2.6vmin, 30px);
  margin-top: 1vmin;
}
.gift-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: clamp(150px, 22vmin, 210px);
  padding: clamp(18px, 3vmin, 28px) clamp(16px, 2.6vmin, 26px);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  box-shadow: var(--shadow-card);
}
.gift-art {
  width: clamp(64px, 9vmin, 88px);
  height: clamp(64px, 9vmin, 88px);
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.35));
}
.gift-name {
  font-size: clamp(18px, 2.6vmin, 24px);
  color: var(--gold-bright);
  letter-spacing: 0.08em;
}
.gift-line {
  font-size: clamp(12px, 1.7vmin, 15px);
  color: var(--ink-dim);
  letter-spacing: 0.04em;
  line-height: 1.6;
}

.bless {
  margin-top: 1vmin;
  font-size: clamp(15px, 2.2vmin, 20px);
  color: var(--ink);
  letter-spacing: 0.1em;
  text-shadow: 0 0 24px rgba(242, 196, 104, 0.35);
}

/* —— 过渡 —— */
.box-hide-leave-active {
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.box-hide-leave-to {
  opacity: 0;
  transform: scale(0.86);
}

.gift-rise-enter-active {
  transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.gift-rise-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.92);
}
</style>
