<script setup>
// 密码锁：输入三关收集到的 3 位数字，打开礼物箱
import { ref } from 'vue'
import { CONFIG } from '../../config'
import { sfxClick, sfxDigit, sfxUnlock, sfxWrong } from '../../composables/audio'

const emit = defineEmits(['unlock'])

const target = CONFIG.codeParts.join('')
const code = ref('')
const shakeIt = ref(false)
const unlocked = ref(false)

const slots = [0, 1, 2]
const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

function press(d) {
  if (unlocked.value || code.value.length >= 3) return
  sfxClick()
  code.value += d
  if (code.value.length === 3) check()
}

function backspace() {
  if (unlocked.value) return
  sfxClick()
  code.value = code.value.slice(0, -1)
}

function check() {
  if (code.value === target) {
    unlocked.value = true
    sfxUnlock()
    setTimeout(() => emit('unlock'), 1100)
  } else {
    sfxWrong()
    shakeIt.value = true
    setTimeout(() => {
      shakeIt.value = false
      code.value = ''
    }, 620)
  }
}
</script>

<template>
  <section class="scene active lock-scene">
    <div class="step-tag">开箱密码</div>
    <h2 class="heading">输入你的开箱密码</h2>
    <p class="sub">还记得刚刚三关收集到的数字吗？按顺序输入</p>

    <div class="slots" :class="{ shake: shakeIt }">
      <span v-for="(s, i) in slots" :key="i" class="slot" :class="{ filled: code[i] }">
        {{ code[i] ?? '' }}
      </span>
    </div>

    <div class="keypad">
      <button
        v-for="k in keys"
        :key="k"
        class="key"
        type="button"
        @click="press(k)"
      >
        {{ k }}
      </button>
      <button class="key key--back" type="button" @click="backspace">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M9 4h11a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9l-6-8z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M12.5 9.5l5 5m0-5l-5 5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <transition name="pop">
      <div v-if="unlocked" class="unlock-card">
        <span class="unlock-mark gold-text">✦</span>
        <span class="unlock-text">密码正确，箱子打开啦</span>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.lock-scene {
  gap: clamp(10px, 1.8vmin, 20px);
}

.heading {
  font-size: clamp(28px, 4.8vmin, 44px);
  font-weight: 700;
  letter-spacing: 0.08em;
}
.sub {
  font-size: clamp(14px, 2vmin, 18px);
  color: var(--ink-dim);
  letter-spacing: 0.05em;
}

.slots {
  display: flex;
  gap: clamp(14px, 2.4vmin, 24px);
  margin-top: 1vmin;
}
.slot {
  width: clamp(58px, 8vmin, 80px);
  height: clamp(58px, 8vmin, 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: clamp(32px, 5vmin, 46px);
  font-weight: 800;
  color: var(--gold-bright);
  background: rgba(20, 11, 48, 0.7);
  border: 1px solid rgba(242, 196, 104, 0.35);
  box-shadow: inset 0 0 20px rgba(242, 196, 104, 0.08);
}
.slot.filled {
  border-color: var(--gold);
  box-shadow: var(--glow-gold);
}
.slots.shake {
  animation: shake-x 0.5s ease;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(10px, 1.7vmin, 16px);
  width: min(52vw, 420px);
  margin-top: 0.8vmin;
}
.key {
  aspect-ratio: 1.25;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: clamp(20px, 3vmin, 28px);
  font-weight: 700;
  color: var(--ink);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  transition: transform 0.15s ease, background 0.2s ease;
}
.key:active {
  transform: scale(0.93);
  background: rgba(242, 196, 104, 0.18);
}
.key--back {
  color: var(--gold);
}

@keyframes shake-x {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-14px); }
  40% { transform: translateX(12px); }
  60% { transform: translateX(-9px); }
  80% { transform: translateX(6px); }
}

.unlock-card {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: clamp(28px, 4.4vmin, 46px) clamp(48px, 8vmin, 90px);
  border-radius: var(--radius-lg);
  background: rgba(20, 11, 48, 0.85);
  border: 1px solid rgba(242, 196, 104, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--glow-gold);
}
.unlock-mark {
  font-size: clamp(34px, 6vmin, 54px);
  animation: pulse-soft 1.6s ease-in-out infinite;
}
.unlock-text {
  font-size: clamp(16px, 2.4vmin, 22px);
  letter-spacing: 0.1em;
  color: var(--gold-bright);
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
