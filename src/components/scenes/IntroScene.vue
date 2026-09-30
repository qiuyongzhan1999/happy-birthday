<script setup>
// 开屏：爱心 + 音乐解锁入口（粉色浪漫梦幻版）
import MoonMark from '../MoonMark.vue'
import { unlockMusic, sfxClick } from '../../composables/audio'

const emit = defineEmits(['go'])

function onEnter() {
  sfxClick()
  // 先切场景，音乐在后台解锁，避免 HEAD/Audio 抢主线程拖慢切换
  emit('go')
  unlockMusic()
}
</script>

<template>
  <section class="scene active intro-scene" @click="onEnter">
    <!-- 背景光晕：粉色双色缓慢漂移 -->
    <div class="aurora aurora--a"></div>
    <div class="aurora aurora--b"></div>
    <!-- 开场粉色扫光（一次性） -->
    <div class="sweep"></div>

    <!-- 爱心徽记区：升起 + 光环 + 星光 -->
    <div class="moon-area">
      <span class="halo"></span>
      <span class="spark spark--1"></span>
      <span class="spark spark--2"></span>
      <span class="spark spark--3"></span>
      <MoonMark :size="132" />
      <span class="orbit orbit--a"></span>
      <span class="orbit orbit--b"></span>
    </div>

    <h1 class="title gold-text">生日快乐</h1>
    <p class="sub">今天是你专属的日子，一场甜蜜惊喜已经备好</p>

    <div class="claim-wrap">
      <button class="claim-btn" type="button" aria-label="领取你的生日礼物" @click.stop="onEnter">
        <span class="claim-glow"></span>
        <span class="claim-heart">♥</span>
        <span class="claim-text">领取你的生日礼物</span>
      </button>
      <p class="claim-tip">礼物需要一点点小闯关才能打开哦</p>
    </div>
  </section>
</template>

<style scoped>
.intro-scene {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

/* ---------- 背景光晕 ---------- */
.aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(56px);
  pointer-events: none;
  z-index: 0;
}
.aurora--a {
  width: 72vmin;
  height: 72vmin;
  left: -14vmin;
  top: -10vmin;
  background: radial-gradient(circle, rgba(255, 123, 172, 0.42) 0%, rgba(255, 123, 172, 0) 68%);
  animation: aurora-drift 14s ease-in-out infinite alternate;
}
.aurora--b {
  width: 62vmin;
  height: 62vmin;
  right: -14vmin;
  bottom: -12vmin;
  background: radial-gradient(circle, rgba(255, 196, 214, 0.4) 0%, rgba(255, 196, 214, 0) 70%);
  animation: aurora-drift 18s ease-in-out infinite alternate-reverse;
}
@keyframes aurora-drift {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.55;
  }
  100% {
    transform: translate(7vmin, 5vmin) scale(1.28);
    opacity: 0.95;
  }
}

/* ---------- 开场粉色扫光 ---------- */
.sweep {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    transparent 0%,
    rgba(255, 190, 218, 0.12) 42%,
    rgba(255, 240, 246, 0.6) 50%,
    rgba(255, 190, 218, 0.12) 58%,
    transparent 100%
  );
  transform: translateX(-130%) skewX(-14deg);
  animation: sweep-once 1.5s 0.45s cubic-bezier(0.25, 0.9, 0.35, 1) forwards;
}
@keyframes sweep-once {
  0% {
    transform: translateX(-130%) skewX(-14deg);
  }
  100% {
    transform: translateX(130%) skewX(-14deg);
  }
}

/* ---------- 爱心徽记区 ---------- */
.moon-area {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  animation:
    heart-in 1.35s cubic-bezier(0.22, 1, 0.36, 1) both,
    floaty 5s ease-in-out 1.35s infinite;
}
@keyframes heart-in {
  0% {
    transform: translate(0, 34vmin) scale(0.5);
    opacity: 0;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
}

/* 徽记光环：粉色呼吸光圈 */
.halo {
  position: absolute;
  width: 196px;
  height: 196px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 123, 172, 0.5) 0%,
    rgba(255, 123, 172, 0.18) 42%,
    transparent 68%
  );
  animation: halo-pulse 3.2s ease-in-out infinite;
}
@keyframes halo-pulse {
  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.75;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* 环绕星光 */
.spark {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff0f6;
  box-shadow: 0 0 12px 3px rgba(255, 123, 172, 0.85);
  animation: spark-twinkle 2.6s ease-in-out infinite;
  z-index: 2;
}
.spark--1 {
  top: -14px;
  left: 16%;
}
.spark--2 {
  top: 26%;
  right: -8px;
  width: 6px;
  height: 6px;
  animation-delay: 0.8s;
}
.spark--3 {
  bottom: 2%;
  left: -4px;
  width: 5px;
  height: 5px;
  animation-delay: 1.6s;
}
@keyframes spark-twinkle {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.7);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}

.orbit {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 123, 172, 0.3);
}
.orbit--a {
  width: 190px;
  height: 190px;
  animation: spin-slow 22s linear infinite;
}
.orbit--b {
  width: 250px;
  height: 250px;
  border-color: rgba(255, 179, 209, 0.22);
  animation: spin-slow 30s linear infinite reverse;
}

/* ---------- 标题：粉色流光 + 辉光脉动 + 浮动 ---------- */
.title {
  position: relative;
  z-index: 1;
  font-size: clamp(38px, 7vmin, 68px);
  font-weight: 800;
  letter-spacing: 0.18em;
  background: linear-gradient(
    110deg,
    var(--gold-deep) 0%,
    var(--gold) 22%,
    #fff0f6 50%,
    var(--gold) 78%,
    var(--gold-deep) 100%
  );
  background-size: 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation:
    rise-in 1s ease both,
    title-shimmer 4s ease-in-out 1.1s infinite,
    title-float 5s ease-in-out 1.4s infinite;
}
@keyframes title-shimmer {
  0%,
  100% {
    background-position: 0% 0;
    filter: drop-shadow(0 0 16px rgba(255, 123, 172, 0.4))
      drop-shadow(0 0 40px rgba(255, 123, 172, 0.16));
  }
  50% {
    background-position: 100% 0;
    filter: drop-shadow(0 0 26px rgba(255, 123, 172, 0.7))
      drop-shadow(0 0 66px rgba(255, 196, 214, 0.42));
  }
}
@keyframes title-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-7px);
  }
}

/* ---------- 副文案：辉光呼吸 ---------- */
.sub {
  position: relative;
  z-index: 1;
  font-size: clamp(15px, 2.3vmin, 21px);
  color: var(--ink-dim);
  letter-spacing: 0.08em;
  animation:
    rise-in 1s 0.3s ease both,
    sub-glow 3s ease-in-out 1.6s infinite;
}
@keyframes sub-glow {
  0%,
  100% {
    text-shadow: 0 0 10px rgba(255, 123, 172, 0.25);
    opacity: 0.88;
  }
  50% {
    text-shadow: 0 0 22px rgba(255, 123, 172, 0.6);
    opacity: 1;
  }
}

.hint-wrap,
.claim-wrap {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 3.4vmin;
}

/* ---------- 领取按钮：粉色渐变 + 辉光呼吸 ---------- */
.claim-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 46px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  background: linear-gradient(120deg, #ff9cc4 0%, #f0629a 55%, #e0568f 100%);
  box-shadow:
    0 10px 34px rgba(255, 123, 172, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
  animation: claim-pulse 2.3s ease-in-out infinite;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.claim-btn:hover,
.claim-btn:active {
  transform: translateY(-2px) scale(1.04);
  box-shadow:
    0 14px 44px rgba(255, 123, 172, 0.65),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
}
@keyframes claim-pulse {
  0%,
  100% {
    box-shadow:
      0 10px 34px rgba(255, 123, 172, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.55);
    transform: scale(1);
  }
  50% {
    box-shadow:
      0 14px 52px rgba(255, 123, 172, 0.75),
      0 0 30px rgba(255, 196, 214, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.55);
    transform: scale(1.035);
  }
}
/* 按钮内扫光 */
.claim-glow {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: linear-gradient(
    110deg,
    transparent 30%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 70%
  );
  background-size: 220% 100%;
  animation: claim-sweep 3s ease-in-out infinite;
  pointer-events: none;
}
@keyframes claim-sweep {
  0% {
    background-position: 120% 0;
  }
  55%,
  100% {
    background-position: -120% 0;
  }
}
.claim-heart {
  font-size: clamp(16px, 2.4vmin, 22px);
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  animation: heart-beat 1.6s ease-in-out infinite;
}
@keyframes heart-beat {
  0%,
  100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.25);
  }
  40% {
    transform: scale(1);
  }
}
.claim-text {
  font-size: clamp(17px, 2.7vmin, 23px);
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #fff;
  text-shadow: 0 2px 8px rgba(180, 40, 100, 0.45);
}
.claim-tip {
  font-size: clamp(12px, 1.8vmin, 15px);
  color: var(--ink-faint);
  letter-spacing: 0.1em;
  animation: pulse-soft 2.4s ease-in-out infinite;
}
</style>
