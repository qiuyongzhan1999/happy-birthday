<script setup>
// 礼物揭晓 · 大屏炫酷版：光束开场 → 礼盒升起弹跳 → 开盒烟花爆发 → 礼物卡光晕渐现 → 祝福语打字机
import { inject, onBeforeUnmount, onMounted, ref } from 'vue'
import MoonMark from '../MoonMark.vue'
import { CONFIG } from '../../config'
import { sfxConfetti, sfxDigit, sfxWin } from '../../composables/audio'

const gift = CONFIG.gift

const confetti = inject('confetti', null)
const opened = ref(false)
const showGifts = ref(false)
const typedBless = ref('')
let openTimer = null
let giftTimer = null
let typeTimer = null

function typeBless() {
  const text = gift.bless
  typedBless.value = ''
  let i = 0
  typeTimer = setInterval(() => {
    i += 1
    typedBless.value = text.slice(0, i)
    if (i >= text.length) {
      clearInterval(typeTimer)
      typeTimer = null
    }
  }, 90)
}

function openBox() {
  if (opened.value) return
  opened.value = true
  sfxDigit()
  // 全屏大爆发 + 彩纸雨 + 烟花
  confetti?.burst(window.innerWidth / 2, window.innerHeight / 2, 160)
  confetti?.burst(window.innerWidth / 2, window.innerHeight * 0.3, 90)
  confetti?.rain(3200)
  confetti?.fireworks?.(2600)
  sfxConfetti()
  openTimer = setTimeout(() => {
    showGifts.value = true
    sfxWin()
    confetti?.burst(window.innerWidth / 2, window.innerHeight * 0.32, 80)
    confetti?.fireworks?.(2400)
    typeBless()
  }, 1500)
}

onMounted(() => {
  openTimer = setTimeout(openBox, 950)
})

onBeforeUnmount(() => {
  if (openTimer) clearTimeout(openTimer)
  if (giftTimer) clearTimeout(giftTimer)
  if (typeTimer) clearInterval(typeTimer)
})
</script>

<template>
  <section class="scene active gift-scene">
    <!-- 全屏光束扫过 -->
    <div class="light-beam" aria-hidden="true"></div>

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
        <MoonMark :size="76" />
        <h2 class="gift-title gold-text">{{ gift.title }}</h2>

        <div class="gift-cards">
          <div class="gift-card card--lip">
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

          <div class="gift-card card--necklace">
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

        <p class="bless" :class="{ typing: typeTimer }">
          {{ typedBless }}<span class="caret" v-if="typedBless && typedBless.length < gift.bless.length"></span>
        </p>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.gift-scene {
  gap: clamp(12px, 2vmin, 24px);
  overflow: hidden;
}

/* —— 全屏光束 —— */
.light-beam {
  position: absolute;
  top: -30%;
  left: -30%;
  width: 60%;
  height: 170%;
  background: linear-gradient(100deg, transparent 0%, rgba(255, 230, 168, 0.16) 45%, rgba(255, 230, 168, 0.32) 50%, rgba(255, 230, 168, 0.16) 55%, transparent 100%);
  filter: blur(2px);
  transform: rotate(16deg);
  animation: beam-sweep 3s cubic-bezier(0.4, 0, 0.2, 1) both;
  pointer-events: none;
}
@keyframes beam-sweep {
  0% {
    left: -80%;
    opacity: 0;
  }
  18% {
    opacity: 1;
  }
  70% {
    left: 130%;
    opacity: 0.5;
  }
  100% {
    left: 150%;
    opacity: 0;
  }
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
  width: clamp(200px, 30vmin, 300px);
  height: clamp(178px, 26.5vmin, 265px);
  animation: rise-bounce 0.9s cubic-bezier(0.22, 1.4, 0.32, 1) both;
}
@keyframes rise-bounce {
  0% {
    transform: translateY(42vh) scale(0.55);
    opacity: 0;
  }
  55% {
    transform: translateY(-2.4vh) scale(1.04);
    opacity: 1;
  }
  75% {
    transform: translateY(1vh) scale(0.985);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}
.box-body {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 66%;
  border-radius: 14px;
  background: linear-gradient(180deg, #e75a86, #b02c56);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
}
.box-lid {
  position: absolute;
  left: -8%;
  right: -8%;
  top: 0;
  height: 34%;
  border-radius: 14px;
  background: linear-gradient(180deg, #ff8fb2, #e75a86);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.32);
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
  width: clamp(48px, 7vmin, 66px);
  height: clamp(38px, 5.4vmin, 52px);
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
  transform: rotate(-42deg) translate(-52px, -58px) scale(0.92);
  opacity: 0;
}
.box-stage.open .gift-box {
  animation: none;
}
.box-shine {
  position: absolute;
  top: 12%;
  left: 50%;
  width: 90%;
  height: 90%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 230, 168, 0.65), transparent 70%);
  opacity: 0;
  transition: opacity 0.7s ease 0.15s;
  pointer-events: none;
}
.box-stage.open .box-shine {
  opacity: 1;
  animation: pulse-soft 1.4s ease-in-out infinite;
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

/* —— 礼物阶段 · 大屏展示 —— */
.gifts-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(8px, 1.6vmin, 18px);
}
.gifts-stage > svg {
  margin-bottom: 0.4vmin;
  filter: drop-shadow(0 0 18px rgba(242, 196, 104, 0.6));
  animation: pulse-soft 2.2s ease-in-out infinite;
}
.gift-title {
  font-size: clamp(34px, 6.4vmin, 64px);
  font-weight: 800;
  letter-spacing: 0.16em;
  text-shadow: 0 0 30px rgba(242, 196, 104, 0.55);
  animation: title-glow 2.4s ease-in-out infinite;
}
@keyframes title-glow {
  0%,
  100% {
    text-shadow: 0 0 22px rgba(242, 196, 104, 0.4);
  }
  50% {
    text-shadow: 0 0 40px rgba(242, 196, 104, 0.85);
  }
}

.gift-cards {
  display: flex;
  gap: clamp(16px, 3vmin, 36px);
  margin-top: 1vmin;
}
.gift-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: clamp(170px, 26vmin, 260px);
  padding: clamp(22px, 3.6vmin, 36px) clamp(18px, 3vmin, 30px);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  box-shadow: var(--shadow-card);
  animation: card-in 0.9s cubic-bezier(0.22, 1.3, 0.36, 1) both;
}
.card--necklace {
  animation-delay: 0.18s;
}
@keyframes card-in {
  0% {
    opacity: 0;
    transform: translateY(26px) scale(0.45) rotateY(60deg);
    filter: blur(6px);
  }
  60% {
    opacity: 1;
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotateY(0);
  }
}
.gift-card:hover {
  transform: translateY(-4px) scale(1.02);
}
.gift-art {
  width: clamp(72px, 10vmin, 100px);
  height: clamp(72px, 10vmin, 100px);
  filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.4));
}
.gift-name {
  font-size: clamp(20px, 3vmin, 28px);
  color: var(--gold-bright);
  letter-spacing: 0.08em;
}
.gift-line {
  font-size: clamp(13px, 1.8vmin, 16px);
  color: var(--ink-dim);
  letter-spacing: 0.04em;
  line-height: 1.6;
}

.bless {
  margin-top: 1.2vmin;
  font-size: clamp(18px, 2.8vmin, 26px);
  color: var(--ink);
  letter-spacing: 0.12em;
  min-height: 1.6em;
  text-shadow: 0 0 26px rgba(242, 196, 104, 0.45);
  animation: fade-up 0.8s ease both;
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.caret {
  display: inline-block;
  width: 0.14em;
  height: 1em;
  margin-left: 2px;
  vertical-align: -0.12em;
  background: var(--gold-bright);
  animation: caret-blink 0.8s step-end infinite;
}
@keyframes caret-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
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
