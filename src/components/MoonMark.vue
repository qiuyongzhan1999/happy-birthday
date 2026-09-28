<script setup>
// 签名元素：粉色爱心徽记（整页贯穿，自带辉光）
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
      <linearGradient :id="`${uid}-heart`" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stop-color="#ffe3ee" />
        <stop offset="55%" stop-color="#ff7bac" />
        <stop offset="100%" stop-color="#e0568f" />
      </linearGradient>
      <filter :id="`${uid}-glow`" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="3.6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- 主爱心 -->
    <path
      d="M50 88 C 20 66, 8 50, 8 34 C 8 20, 20 10, 33 10 C 40 10, 47 14, 50 20 C 53 14, 60 10, 67 10 C 80 10, 92 20, 92 34 C 92 50, 80 66, 50 88 Z"
      :fill="`url(#${uid}-heart)`"
      :filter="`url(#${uid}-glow)`"
    />
    <!-- 高光 -->
    <ellipse
      cx="36"
      cy="30"
      rx="10"
      ry="5.5"
      fill="rgba(255,255,255,0.6)"
      transform="rotate(-24 36 30)"
    />
    <!-- 小星光点缀 -->
    <circle cx="26" cy="18" r="2.2" fill="#fff3f8" />
    <circle cx="78" cy="22" r="1.8" fill="#ffe3ee" />
  </svg>
</template>

<style scoped>
.moon-mark {
  display: block;
  filter: drop-shadow(0 0 20px rgba(255, 123, 172, 0.6));
}
</style>
