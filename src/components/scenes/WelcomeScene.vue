<script setup>
// 欢迎页：照片 / 名字 / 日期 + 领取礼物入口
import { computed } from 'vue'
import MoonMark from '../MoonMark.vue'
import { CONFIG } from '../../config'
import { sfxClick } from '../../composables/audio'

const emit = defineEmits(['go'])

const hasPhoto = computed(() => Boolean(CONFIG.photoUrl))

function onClaim() {
  sfxClick()
  emit('go')
}
</script>

<template>
  <section class="scene active welcome-scene">
    <div class="photo-wrap">
      <div v-if="hasPhoto" class="photo">
        <img :src="CONFIG.photoUrl" alt="她的照片" />
      </div>
      <div v-else class="photo photo--default">
        <MoonMark :size="72" />
        <span class="spark spark--1">✦</span>
        <span class="spark spark--2">✧</span>
        <span class="spark spark--3">✦</span>
      </div>
      <span class="halo"></span>
    </div>

    <p class="greeting">生日快乐，</p>
    <h1 class="name gold-text">{{ CONFIG.name }}</h1>
    <p class="date">{{ CONFIG.date }}</p>
    <p class="lead">今晚，有一份礼物正等着你来开启</p>

    <button class="btn-gold claim-btn" type="button" @click="onClaim">
      <svg class="gift-ico" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path
          d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9z"
          fill="currentColor"
          opacity="0.9"
        />
        <path d="M3 7h18v4H3z" fill="currentColor" opacity="0.95" />
        <path
          d="M12 7v14M12 7c-2.2 0-4-1.3-4-3 0-1.4 1.1-2.5 2.5-2.5C11.9 1.5 12 7 12 7zm0 0c2.2 0 4-1.3 4-3 0-1.4-1.1-2.5-2.5-2.5C12.1 1.5 12 7 12 7z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
      领取你的生日礼物
    </button>

    <p class="tiny">提示：礼物需要一点点小闯关才能打开哦</p>
  </section>
</template>

<style scoped>
.welcome-scene {
  gap: clamp(10px, 1.8vmin, 20px);
}

.photo-wrap {
  position: relative;
  margin-bottom: 1vmin;
}

.photo {
  position: relative;
  width: clamp(120px, 17vmin, 168px);
  height: clamp(120px, 17vmin, 168px);
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(242, 196, 104, 0.75);
  box-shadow: 0 0 34px rgba(242, 196, 104, 0.4), inset 0 0 0 4px rgba(255, 255, 255, 0.12);
  z-index: 2;
}
.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo--default {
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 35%, var(--bg-soft) 0%, var(--bg-mid) 65%, var(--bg-deep) 100%);
}
.spark {
  position: absolute;
  color: var(--gold-bright);
  font-size: 14px;
  animation: pulse-soft 2.2s ease-in-out infinite;
}
.spark--1 { top: 12%; left: 14%; }
.spark--2 { top: 22%; right: 12%; color: var(--pink); animation-delay: 0.5s; }
.spark--3 { bottom: 18%; left: 20%; animation-delay: 1s; }

.halo {
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  border: 1px dashed rgba(242, 196, 104, 0.4);
  animation: spin-slow 26s linear infinite;
  z-index: 1;
}

.greeting {
  font-size: clamp(20px, 3vmin, 28px);
  letter-spacing: 0.14em;
  color: var(--ink-dim);
}
.name {
  font-size: clamp(44px, 8vmin, 76px);
  font-weight: 800;
  letter-spacing: 0.16em;
  text-shadow: 0 0 42px rgba(242, 196, 104, 0.3);
}
.date {
  font-size: clamp(14px, 2vmin, 18px);
  color: var(--pink);
  letter-spacing: 0.22em;
}
.lead {
  font-size: clamp(15px, 2.2vmin, 20px);
  color: var(--ink-dim);
  letter-spacing: 0.06em;
}

.claim-btn {
  margin-top: 1.2vmin;
  animation: pulse-soft 2.6s ease-in-out infinite;
}
.gift-ico {
  margin-right: 2px;
}

.tiny {
  font-size: clamp(12px, 1.7vmin, 15px);
  color: var(--ink-faint);
  letter-spacing: 0.08em;
}
</style>
