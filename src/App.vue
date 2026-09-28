<script setup>
// 新月 · 生日惊喜 主框架：背景星空 + 场景流转 + 彩纸层
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import bgStar from './assets/bg-star.jpg'
import IntroScene from './components/scenes/IntroScene.vue'
import WelcomeScene from './components/scenes/WelcomeScene.vue'
import GameHubScene from './components/scenes/GameHubScene.vue'
import CandleScene from './components/scenes/CandleScene.vue'
import QuizScene from './components/scenes/QuizScene.vue'
import ScratchScene from './components/scenes/ScratchScene.vue'
import LockScene from './components/scenes/LockScene.vue'
import GiftScene from './components/scenes/GiftScene.vue'
import { createConfetti, startStarField } from './composables/particles'

const idx = ref(0)
const digits = ref([])
const starCanvas = ref(null)
const confettiCanvas = ref(null)

const scenes = [
  IntroScene,
  WelcomeScene,
  GameHubScene,
  CandleScene,
  QuizScene,
  ScratchScene,
  LockScene,
  GiftScene,
]
const current = computed(() => scenes[idx.value])

let starCtrl = null
let confettiCtrl = null

function next() {
  idx.value = Math.min(scenes.length - 1, idx.value + 1)
}

function collectDigit(d) {
  digits.value.push(d)
  next()
}

provide('confetti', {
  burst(x, y, n) {
    confettiCtrl?.burst(x, y, n)
  },
  rain(ms) {
    confettiCtrl?.rain(ms)
  },
})

onMounted(() => {
  starCtrl = startStarField(starCanvas.value)
  confettiCtrl = createConfetti(confettiCanvas.value)
})

onBeforeUnmount(() => {
  starCtrl?.stop()
  confettiCtrl?.stop()
})
</script>

<template>
  <div class="app-root">
    <div class="bg-layer" :style="{ backgroundImage: `url(${bgStar})` }"></div>
    <div class="bg-veil"></div>
    <canvas ref="starCanvas" class="fx-canvas star-canvas"></canvas>

    <div class="stage">
      <transition name="scene-fade" mode="out-in">
        <component
          :is="current"
          :key="idx"
          @go="next"
          @continue="next"
          @digit="collectDigit"
          @unlock="next"
        />
      </transition>
    </div>

    <canvas ref="confettiCanvas" class="fx-canvas confetti-canvas"></canvas>
  </div>
</template>

<style scoped>
.app-root {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

.bg-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.bg-veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    160deg,
    rgba(8, 5, 28, 0.55) 0%,
    rgba(21, 13, 56, 0.42) 50%,
    rgba(37, 22, 80, 0.6) 100%
  );
}

.fx-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.star-canvas {
  z-index: 2;
  pointer-events: none;
}
.confetti-canvas {
  z-index: 90;
  pointer-events: none;
}

.stage {
  position: absolute;
  inset: 0;
  z-index: 10;
}
</style>
