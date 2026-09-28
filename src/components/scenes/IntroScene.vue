<script setup>
// 开屏：新月 + 音乐解锁入口
import MoonMark from '../MoonMark.vue'
import { unlockMusic, sfxClick } from '../../composables/audio'

const emit = defineEmits(['go'])

function onEnter() {
  sfxClick()
  unlockMusic()
  emit('go')
}
</script>

<template>
  <section class="scene active intro-scene" @click="onEnter">
    <div class="moon-area">
      <MoonMark :size="132" />
      <span class="orbit orbit--a"></span>
      <span class="orbit orbit--b"></span>
    </div>

    <h1 class="title gold-text">新月 · 生日快乐</h1>
    <p class="sub">今夜月光为你而来，一场小小的惊喜已经备好</p>

    <div class="hint-wrap">
      <span class="hint-icon">✦</span>
      <p class="hint">轻触屏幕，进入月光之旅</p>
      <span class="pulse-line"></span>
    </div>

    <button class="enter-btn" type="button" aria-label="进入" @click.stop="onEnter">
      <span class="ring ring--1"></span>
      <span class="ring ring--2"></span>
      <span class="core">✦</span>
    </button>
  </section>
</template>

<style scoped>
.intro-scene {
  cursor: pointer;
}

.moon-area {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: floaty 5s ease-in-out infinite;
}

.orbit {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(242, 196, 104, 0.28);
}
.orbit--a {
  width: 190px;
  height: 190px;
  animation: spin-slow 22s linear infinite;
}
.orbit--b {
  width: 250px;
  height: 250px;
  border-color: rgba(255, 123, 172, 0.18);
  animation: spin-slow 30s linear infinite reverse;
}

.title {
  font-size: clamp(38px, 7vmin, 68px);
  font-weight: 800;
  letter-spacing: 0.18em;
  text-shadow: 0 0 40px rgba(242, 196, 104, 0.25);
  animation: rise-in 1s ease both;
}

.sub {
  font-size: clamp(15px, 2.3vmin, 21px);
  color: var(--ink-dim);
  letter-spacing: 0.08em;
  animation: rise-in 1s 0.15s ease both;
}

.hint-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 2vmin;
  animation: pulse-soft 2.4s ease-in-out infinite;
}
.hint-icon {
  color: var(--gold);
  font-size: clamp(18px, 2.6vmin, 24px);
}
.hint {
  font-size: clamp(14px, 2vmin, 18px);
  color: var(--ink-faint);
  letter-spacing: 0.12em;
}
.pulse-line {
  width: 2px;
  height: 26px;
  background: linear-gradient(180deg, var(--gold), transparent);
}

/* 中央呼吸按钮 */
.enter-btn {
  position: relative;
  width: clamp(74px, 10vmin, 96px);
  height: clamp(74px, 10vmin, 96px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1vmin;
}
.enter-btn .core {
  font-size: clamp(22px, 3vmin, 30px);
  color: var(--gold-bright);
  text-shadow: 0 0 14px rgba(242, 196, 104, 0.9);
  animation: pulse-soft 2s ease-in-out infinite;
}
.enter-btn .ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(242, 196, 104, 0.55);
  animation: ring-out 2.4s ease-out infinite;
}
.enter-btn .ring--2 {
  animation-delay: 1.2s;
}

@keyframes ring-out {
  0% { transform: scale(0.7); opacity: 0.9; }
  100% { transform: scale(1.55); opacity: 0; }
}
</style>
