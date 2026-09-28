<script setup>
// CSS 手绘生日蛋糕 + 3 根可吹灭的蜡烛
import { computed, reactive } from 'vue'
import { sfxBlow } from '../composables/audio'

const emit = defineEmits(['blown'])

const candles = reactive([
  { id: 0, out: false, color: '#ff9fb0' },
  { id: 1, out: false, color: '#b39bff' },
  { id: 2, out: false, color: '#ffd98e' },
])

const litCount = computed(() => candles.filter((c) => !c.out).length)
const allOut = computed(() => litCount.value === 0)

function blow(i) {
  if (candles[i].out) return
  candles[i].out = true
  sfxBlow()
  if (allOut.value) {
    setTimeout(() => emit('blown'), 900)
  }
}

defineExpose({ litCount, allOut })
</script>

<template>
  <div class="cake-wrap">
    <div class="candles">
      <button
        v-for="c in candles"
        :key="c.id"
        class="candle"
        :class="['candle--' + c.id, { out: c.out }]"
        :style="{ '--stick': c.color }"
        type="button"
        @click="blow(c.id)"
      >
        <span class="glow" aria-hidden="true"></span>
        <span class="flame" aria-hidden="true">
          <span class="flame-inner"></span>
        </span>
        <span v-if="c.out" class="smoke" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
        <span class="wick" aria-hidden="true"></span>
        <span class="stick" aria-hidden="true"></span>
      </button>
    </div>

    <div class="plate"></div>

    <div class="cake-body">
      <div class="layer top">
        <span v-for="n in 10" :key="n" class="sprinkle" :style="{ '--i': n }"></span>
      </div>
      <div class="cream"></div>
      <div class="layer mid">
        <span v-for="n in 10" :key="'m' + n" class="sprinkle" :style="{ '--i': n }"></span>
      </div>
      <div class="frost"></div>
    </div>
  </div>
</template>

<style scoped>
.cake-wrap {
  position: relative;
  width: min(52vmin, 460px);
  height: min(44vmin, 380px);
  margin-top: 2vmin;
}

/* —— 蜡烛 —— */
.candles {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  gap: clamp(30px, 6vmin, 56px);
  z-index: 3;
}

.candle {
  position: relative;
  width: clamp(26px, 3.4vmin, 38px);
  height: clamp(88px, 14vmin, 130px);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.stick {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: clamp(11px, 1.5vmin, 16px);
  height: 72%;
  border-radius: 6px;
  background: linear-gradient(180deg, var(--stick), color-mix(in srgb, var(--stick) 60%, #5a3a6b));
  box-shadow: inset -2px 0 0 rgba(0, 0, 0, 0.14);
}

.wick {
  position: absolute;
  left: 50%;
  bottom: 68%;
  transform: translateX(-50%);
  width: 2.5px;
  height: 9px;
  background: #3a2a3f;
  border-radius: 2px;
}

.flame {
  position: absolute;
  left: 50%;
  bottom: calc(68% + 6px);
  transform: translateX(-50%);
  width: clamp(16px, 2.3vmin, 24px);
  height: clamp(26px, 3.6vmin, 38px);
  border-radius: 50% 50% 50% 50% / 62% 62% 38% 38%;
  background: radial-gradient(circle at 50% 78%, #fff6d8 0%, #ffd98e 42%, #ff9f4a 78%, rgba(255, 122, 60, 0) 100%);
  transform-origin: 50% 100%;
  animation: flicker 1.6s ease-in-out infinite;
  transition: opacity 0.35s ease, transform 0.35s ease;
  box-shadow: 0 0 22px 6px rgba(255, 170, 80, 0.4);
}
.flame-inner {
  position: absolute;
  left: 50%;
  top: 18%;
  transform: translateX(-50%);
  width: 42%;
  height: 46%;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 80%, #fffdf0 0%, #ffd98e 70%, transparent 100%);
}
.glow {
  position: absolute;
  left: 50%;
  bottom: calc(62% + 2px);
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 200, 110, 0.5) 0%, transparent 70%);
  animation: pulse-soft 2.4s ease-in-out infinite;
  pointer-events: none;
}

.candle.out .flame,
.candle.out .glow {
  opacity: 0;
  transform: translateX(-50%) scale(0.2);
  animation: none;
}

/* 烟 */
.smoke {
  position: absolute;
  left: 50%;
  bottom: 70%;
  transform: translateX(-50%);
  width: 30px;
  height: 54px;
  pointer-events: none;
}
.smoke i {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(226, 222, 255, 0.85);
  filter: blur(3px);
  opacity: 0;
  animation: smoke-rise 1.3s ease-out infinite;
}
.smoke i:nth-child(1) { animation-delay: 0s; }
.smoke i:nth-child(2) { animation-delay: 0.25s; margin-left: -9px; }
.smoke i:nth-child(3) { animation-delay: 0.5s; margin-left: 9px; }

/* —— 蛋糕 —— */
.plate {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 88%;
  height: 4.5%;
  border-radius: 50%;
  background: linear-gradient(180deg, #3d2a6b, #23144e);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
  z-index: 2;
}

.cake-body {
  position: absolute;
  left: 50%;
  bottom: 4%;
  transform: translateX(-50%);
  width: 82%;
  height: 78%;
  z-index: 1;
}

.layer {
  position: absolute;
  left: 0;
  right: 0;
  border-radius: 14px;
}
.layer.top {
  top: 0;
  height: 46%;
  background: linear-gradient(180deg, #ffd7ec 0%, #f3a9d8 100%);
  box-shadow: inset 0 -6px 10px rgba(158, 74, 134, 0.18);
}
.layer.mid {
  bottom: 0;
  height: 58%;
  background: linear-gradient(180deg, #e3b5f5 0%, #b98ae0 100%);
  box-shadow: inset 0 6px 10px rgba(255, 255, 255, 0.4), inset 0 -8px 12px rgba(104, 58, 128, 0.2);
}

.cream {
  position: absolute;
  top: 42%;
  left: -4%;
  right: -4%;
  height: 12%;
  background: linear-gradient(180deg, #fff2fa 0%, #ffd9ee 100%);
  border-radius: 50%;
  box-shadow: 0 3px 6px rgba(158, 74, 134, 0.22);
  z-index: 2;
}
.frost {
  position: absolute;
  bottom: 48%;
  left: -4%;
  right: -4%;
  height: 12%;
  background: linear-gradient(180deg, #e6c8fb 0%, #cfa7ef 100%);
  border-radius: 50%;
  z-index: 0;
}

.sprinkle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: #ffd98e;
  box-shadow: 0 0 6px rgba(255, 217, 142, 0.7);
  animation: pulse-soft 2.6s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.22s);
}
.layer .sprinkle:nth-child(1) { left: 10%; top: 18%; }
.layer .sprinkle:nth-child(2) { left: 24%; top: 42%; }
.layer .sprinkle:nth-child(3) { left: 38%; top: 16%; }
.layer .sprinkle:nth-child(4) { left: 52%; top: 46%; }
.layer .sprinkle:nth-child(5) { left: 64%; top: 20%; }
.layer .sprinkle:nth-child(6) { left: 78%; top: 44%; }
.layer .sprinkle:nth-child(7) { left: 88%; top: 14%; }
.layer .sprinkle:nth-child(8) { left: 16%; top: 64%; }
.layer .sprinkle:nth-child(9) { left: 46%; top: 70%; }
.layer .sprinkle:nth-child(10) { left: 70%; top: 66%; }

@keyframes flicker {
  0%, 100% { transform: translateX(-50%) scaleY(1) rotate(-2deg); }
  30% { transform: translateX(-50%) scaleY(1.12) rotate(1.5deg); }
  60% { transform: translateX(-50%) scaleY(0.94) rotate(-1deg); }
}
@keyframes smoke-rise {
  0% { opacity: 0; transform: translateY(0) scale(0.7); }
  25% { opacity: 0.75; }
  100% { opacity: 0; transform: translateY(-46px) scale(1.7); }
}
</style>
