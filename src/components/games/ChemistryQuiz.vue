<script setup>
// 默契问答：如果世界漆黑 → 除了我还有谁？
import { inject, ref } from 'vue'
import { CONFIG } from '../../config'
import { sfxClick, sfxWin, sfxWrong } from '../../composables/audio'

const emit = defineEmits(['done'])
const confetti = inject('confetti', null)

const quiz = CONFIG.chemistryQuiz
const picked = ref(-1)
const wrong = ref(false)
const done = ref(false)

function choose(i) {
  if (done.value) return
  sfxClick()
  picked.value = i
  if (i === quiz.correct) {
    wrong.value = false
    done.value = true
    sfxWin()
    confetti?.burst?.(window.innerWidth / 2, window.innerHeight * 0.4, 60)
    setTimeout(() => emit('done'), 1200)
  } else {
    wrong.value = true
    sfxWrong()
    setTimeout(() => {
      picked.value = -1
      wrong.value = false
    }, 700)
  }
}
</script>

<template>
  <div class="chem">
    <p class="eyebrow">默契问答</p>
    <h3 class="q">{{ quiz.q }}</h3>
    <p class="tip">选对才能获得抽奖机会哦</p>

    <div class="opts">
      <button
        v-for="(opt, i) in quiz.options"
        :key="i"
        class="opt"
        :class="{
          picked: picked === i,
          correct: done && i === quiz.correct,
          bad: wrong && picked === i,
        }"
        type="button"
        @click="choose(i)"
      >
        {{ opt }}
      </button>
    </div>

    <p v-if="wrong" class="feedback bad-text">再想想～我们的暗号不是这个</p>
    <p v-else-if="done" class="feedback good-text">心有灵犀！抽奖机会 +1</p>
  </div>
</template>

<style scoped>
.chem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(10px, 1.8vmin, 18px);
  width: min(92vw, 520px);
  margin-top: clamp(48px, 8vmin, 72px);
}
.eyebrow {
  font-size: clamp(22px, 3.4vmin, 32px);
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--gold-bright);
  text-shadow: 0 0 18px rgba(255, 150, 190, 0.45);
}
.q {
  font-size: clamp(22px, 3.6vmin, 34px);
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.06em;
  line-height: 1.4;
}
.tip {
  font-size: clamp(13px, 1.8vmin, 15px);
  color: var(--ink-faint);
}
.opts {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}
.opt {
  width: 100%;
  padding: clamp(14px, 2.2vmin, 20px) clamp(16px, 2.6vmin, 24px);
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--ink);
  font-size: clamp(15px, 2.2vmin, 19px);
  letter-spacing: 0.04em;
  text-align: left;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
}
.opt:active {
  transform: scale(0.98);
}
.opt.picked {
  border-color: var(--gold);
}
.opt.correct {
  background: rgba(242, 196, 104, 0.22);
  border-color: var(--gold-bright);
  color: var(--gold-bright);
}
.opt.bad {
  background: rgba(230, 57, 70, 0.25);
  border-color: #ff8fab;
}
.feedback {
  min-height: 1.4em;
  font-size: clamp(14px, 2vmin, 17px);
}
.bad-text {
  color: #fff;
  font-weight: 700;
  background: linear-gradient(135deg, #ff4d6d, #e62e4d);
  padding: 8px 18px;
  border-radius: 999px;
  display: inline-block;
  box-shadow: 0 4px 18px rgba(255, 45, 85, 0.45);
}
.good-text {
  color: var(--gold-bright);
}
</style>
