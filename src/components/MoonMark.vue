<script setup>
// 签名元素：金色新月徽记（整页贯穿，自带辉光）
import { useId } from 'vue'

defineProps({
  size: { type: Number, default: 120 },
})

const uid = useId()
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    class="moon-mark"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`${uid}-gold`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffe6a8" />
        <stop offset="55%" stop-color="#f2c468" />
        <stop offset="100%" stop-color="#d9a441" />
      </linearGradient>
      <filter :id="`${uid}-glow`" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <mask :id="`${uid}-mask`">
        <rect width="100" height="100" fill="white" />
        <circle cx="74" cy="26" r="33" fill="black" />
      </mask>
    </defs>
    <circle
      cx="50"
      cy="50"
      r="38"
      :fill="`url(#${uid}-gold)`"
      :mask="`url(#${uid}-mask)`"
      :filter="`url(#${uid}-glow)`"
    />
  </svg>
</template>

<style scoped>
.moon-mark {
  display: block;
  filter: drop-shadow(0 0 18px rgba(242, 196, 104, 0.55));
}
</style>
