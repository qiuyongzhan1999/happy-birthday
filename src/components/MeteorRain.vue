<script setup>
// 浪漫粒子层：粉色爱心 + 星光泡泡缓缓上升（温柔梦幻）
import { onBeforeUnmount, onMounted } from 'vue'
import { tsParticles } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'

const containerId = 'meteor-particles'

const options = {
  fullScreen: { enable: false },
  fpsLimit: 60,
  detectRetina: true,
  background: { color: { value: 'transparent' } },
  pauseOnBlur: true,
  particles: {
    number: {
      value: 26,
      density: { enable: false },
    },
    color: { value: ['#ff7bac', '#ffb3d1', '#ffd6e8', '#ffc4d6', '#fff0f6'] },
    shape: {
      type: ['heart', 'circle'],
      options: { heart: { sides: 4 } },
    },
    opacity: {
      value: { min: 0.35, max: 0.85 },
      animation: { enable: true, speed: 0.9, sync: false },
    },
    size: { value: { min: 8, max: 22 }, random: true },
    rotate: {
      value: { min: -25, max: 25 },
      animation: { enable: true, speed: 3, sync: false },
    },
    move: {
      enable: true,
      speed: { min: 12, max: 30 },
      direction: 'top',
      straight: false,
      outModes: { default: 'out' },
    },
  },
  interactivity: {
    events: { onHover: { enable: false }, onClick: { enable: false }, resize: { enable: true } },
  },
}

let container = null

onMounted(async () => {
  // loadSlim 只能注册一次（防 HMR 重复注册报错）
  if (!window.__tspSlimLoaded) {
    await loadSlim(tsParticles)
    window.__tspSlimLoaded = true
  }
  container = await tsParticles.load({
    id: containerId,
    element: document.getElementById(containerId),
    options,
  })
})

onBeforeUnmount(() => {
  try {
    container?.destroy?.()
  } catch {
    /* 忽略 HMR 过渡期的销毁错误 */
  }
})
</script>

<template>
  <div class="meteor-layer">
    <div :id="containerId" class="meteor-container"></div>
  </div>
</template>

<style scoped>
.meteor-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}
.meteor-container {
  position: absolute;
  inset: 0;
}
</style>
