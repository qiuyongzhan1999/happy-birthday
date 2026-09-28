<script setup>
// 关卡 1：吹灭蜡烛，许下心愿 → 获得第 1 个数字
import { ref } from 'vue'
import CakeScene from '../CakeScene.vue'
import { CONFIG } from '../../config'
import { sfxDigit } from '../../composables/audio'

const emit = defineEmits(['digit'])

const showDigit = ref(false)
const digit = CONFIG.codeParts[0]
const cake = ref(null)
const hint = ref('')

function onBlown() {
  hint.value = '愿你的每一个心愿都能实现'
  showDigit.value = true
  sfxDigit()
  setTimeout(() => emit('digit', digit), 1600)
}
</script>

<template>
  <section class="scene active candle-scene">
    <div class="step-tag">第一关 · 许愿吹蜡烛</div>
    <h2 class="heading">许个愿吧</h2>
    <p class="sub">点亮的蜡烛，轻轻点一下就能吹灭</p>

    <CakeScene ref="cake" @blown="onBlown" />

    <p class="hint" :class="{ dim: showDigit }">
      {{ showDigit ? hint : `还剩 ${cake?.litCount ?? 3} 根蜡烛亮着` }}
    </p>

    <transition name="pop">
      <div v-if="showDigit" class="digit-card">
        <span class="digit-label">你获得了一个数字</span>
        <span class="digit-value gold-text">{{ digit }}</span>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.candle-scene {
  gap: clamp(10px, 1.6vmin, 18px);
}

.heading {
  font-size: clamp(30px, 5.2vmin, 48px);
  font-weight: 700;
  letter-spacing: 0.1em;
}
.sub {
  font-size: clamp(14px, 2vmin, 18px);
  color: var(--ink-dim);
  letter-spacing: 0.06em;
}
.hint {
  font-size: clamp(14px, 2vmin, 18px);
  color: var(--gold-bright);
  letter-spacing: 0.08em;
  min-height: 1.6em;
  transition: opacity 0.4s ease;
}
.hint.dim {
  opacity: 0.35;
}

.digit-card {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: clamp(26px, 4vmin, 44px) clamp(48px, 8vmin, 88px);
  border-radius: var(--radius-lg);
  background: rgba(20, 11, 48, 0.82);
  border: 1px solid rgba(242, 196, 104, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--glow-gold);
}
.digit-label {
  font-size: clamp(13px, 1.9vmin, 17px);
  color: var(--ink-dim);
  letter-spacing: 0.2em;
}
.digit-value {
  font-size: clamp(56px, 10vmin, 96px);
  font-weight: 800;
  line-height: 1;
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.7);
}
</style>
