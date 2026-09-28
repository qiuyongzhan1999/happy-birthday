<script setup>
// 关卡 2：关于你们的 3 道小测验 → 获得第 2 个数字
import { computed, ref } from 'vue'
import { CONFIG } from '../../config'
import { sfxDigit, sfxWrong } from '../../composables/audio'

const emit = defineEmits(['digit'])

const quiz = CONFIG.quiz
const qIndex = ref(0)
const picked = ref(null)
const shake = ref(false)
const showDigit = ref(false)
const digit = CONFIG.codeParts[1]

const current = computed(() => quiz[qIndex.value])
const isLast = computed(() => qIndex.value === quiz.length - 1)

function pick(i) {
  if (picked.value !== null || showDigit.value) return
  picked.value = i
  if (i === current.value.correct) {
    if (isLast.value) {
      showDigit.value = true
      sfxDigit()
      setTimeout(() => emit('digit', digit), 1500)
    } else {
      setTimeout(() => {
        qIndex.value += 1
        picked.value = null
      }, 750)
    }
  } else {
    shake.value = true
    sfxWrong()
    setTimeout(() => {
      shake.value = false
      picked.value = null
    }, 900)
  }
}
</script>

<template>
  <section class="scene active quiz-scene">
    <div class="step-tag">第二关 · 我们的回忆</div>
    <p class="counter">{{ qIndex + 1 }} / {{ quiz.length }}</p>
    <h2 class="heading">{{ current.q }}</h2>

    <div class="options" :class="{ shake }">
      <button
        v-for="(opt, i) in current.options"
        :key="i"
        class="opt"
        :class="[
          picked !== null && i === current.correct ? 'opt--right' : '',
          picked === i && i !== current.correct ? 'opt--wrong' : '',
        ]"
        type="button"
        :disabled="picked !== null"
        @click="pick(i)"
      >
        <span class="opt-mark">{{ '甲乙丙'[i] }}</span>
        <span class="opt-text">{{ opt }}</span>
      </button>
    </div>

    <p class="hint">{{ picked === null ? '选出正确答案，点亮我们的回忆' : current.hint }}</p>

    <transition name="pop">
      <div v-if="showDigit" class="digit-card">
        <span class="digit-label">你获得了一个数字</span>
        <span class="digit-value gold-text">{{ digit }}</span>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.quiz-scene {
  gap: clamp(10px, 1.8vmin, 20px);
}

.counter {
  font-size: clamp(13px, 1.9vmin, 17px);
  color: var(--ink-faint);
  letter-spacing: 0.2em;
}
.heading {
  font-size: clamp(26px, 4.6vmin, 42px);
  font-weight: 700;
  letter-spacing: 0.05em;
  max-width: 88vw;
}

.options {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2vmin, 20px);
  width: min(78vw, 720px);
}
.options.shake {
  animation: shake-x 0.5s ease;
}

.opt {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: clamp(16px, 2.6vmin, 26px) clamp(22px, 3.4vmin, 34px);
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  font-size: clamp(17px, 2.5vmin, 24px);
  color: var(--ink);
  transition: transform 0.2s ease, background 0.25s ease, border-color 0.25s ease;
}
.opt:active {
  transform: scale(0.97);
}
.opt-mark {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: clamp(34px, 4.6vmin, 44px);
  height: clamp(34px, 4.6vmin, 44px);
  border-radius: 50%;
  font-size: clamp(14px, 2vmin, 18px);
  font-weight: 700;
  color: var(--gold-deep);
  background: rgba(242, 196, 104, 0.16);
  border: 1px solid rgba(242, 196, 104, 0.4);
}
.opt--right {
  background: rgba(242, 196, 104, 0.2);
  border-color: var(--gold);
  box-shadow: var(--glow-gold);
}
.opt--right .opt-mark {
  color: #3a2410;
  background: var(--gold);
}
.opt--wrong {
  background: rgba(255, 123, 123, 0.16);
  border-color: rgba(255, 123, 123, 0.6);
}
.opt--wrong .opt-mark {
  color: #ff7b7b;
  border-color: rgba(255, 123, 123, 0.6);
}

.hint {
  font-size: clamp(13px, 1.9vmin, 17px);
  color: var(--ink-faint);
  letter-spacing: 0.06em;
  min-height: 1.6em;
}

@keyframes shake-x {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-12px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-8px); }
  80% { transform: translateX(6px); }
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
