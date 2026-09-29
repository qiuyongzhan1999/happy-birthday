<script setup>
// 回忆拼图：合照打成 3×3，支持拖拽 / 点击交换，限时 60 秒
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { CONFIG } from '../../config'
import couplePhoto from '../../assets/couple-photo.png'
import { sfxClick, sfxPick, sfxWin, sfxWrong } from '../../composables/audio'

const emit = defineEmits(['done'])
const confetti = inject('confetti', null)

const photoSrc = computed(() => CONFIG.photoUrl || couplePhoto)
const timeLimit = CONFIG.puzzle?.timeLimit || 60

const boardRef = ref(null)
const tiles = ref([]) // 当前位置上的正确索引 0-8
const selected = ref(-1)
const left = ref(timeLimit)
const won = ref(false)
const failed = ref(false)
const showFull = ref(false)

// 拖拽状态
const dragging = ref(false)
const dragFrom = ref(-1)
const dragOver = ref(-1)
const ghost = ref(null) // { x, y, w, h, correctIdx }

let timer = null
let pointerId = null
let startX = 0
let startY = 0
let moved = false
const DRAG_THRESHOLD = 8

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  if (a.every((v, i) => v === i)) return shuffle(arr)
  return a
}

function isSolved(arr) {
  return arr.every((v, i) => v === i)
}

function init() {
  tiles.value = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8])
  selected.value = -1
  left.value = timeLimit
  won.value = false
  failed.value = false
  showFull.value = false
  resetDrag()
  clearInterval(timer)
  timer = setInterval(() => {
    if (won.value || failed.value) return
    left.value -= 1
    if (left.value <= 0) {
      left.value = 0
      failed.value = true
      clearInterval(timer)
      sfxWrong()
    }
  }, 1000)
}

function tileStyle(correctIdx) {
  const row = Math.floor(correctIdx / 3)
  const col = correctIdx % 3
  return {
    backgroundImage: `url(${photoSrc.value})`,
    backgroundSize: '300% 300%',
    backgroundPosition: `${(col / 2) * 100}% ${(row / 2) * 100}%`,
  }
}

function tryWin(arr) {
  if (!isSolved(arr)) return
  clearInterval(timer)
  won.value = true
  showFull.value = true
  sfxWin()
  confetti?.burst?.(window.innerWidth / 2, window.innerHeight * 0.4, 90)
  confetti?.rain?.(2000)
  setTimeout(() => emit('done'), 2200)
}

function swap(a, b) {
  if (a === b || a < 0 || b < 0) return
  const next = [...tiles.value]
  ;[next[a], next[b]] = [next[b], next[a]]
  tiles.value = next
  selected.value = -1
  sfxPick()
  tryWin(next)
}

function posFromPoint(clientX, clientY) {
  const board = boardRef.value
  if (!board) return -1
  const cells = board.querySelectorAll('.tile')
  for (let i = 0; i < cells.length; i++) {
    const r = cells[i].getBoundingClientRect()
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      return i
    }
  }
  return -1
}

function resetDrag() {
  dragging.value = false
  dragFrom.value = -1
  dragOver.value = -1
  ghost.value = null
  pointerId = null
  moved = false
}

function onPointerDown(pos, e) {
  if (won.value || failed.value || showFull.value) return
  if (e.button != null && e.button !== 0) return
  e.preventDefault()
  const el = e.currentTarget
  el.setPointerCapture?.(e.pointerId)
  pointerId = e.pointerId
  startX = e.clientX
  startY = e.clientY
  moved = false
  dragFrom.value = pos
  dragOver.value = pos

  const r = el.getBoundingClientRect()
  ghost.value = {
    x: r.left,
    y: r.top,
    w: r.width,
    h: r.height,
    offsetX: e.clientX - r.left,
    offsetY: e.clientY - r.top,
    correctIdx: tiles.value[pos],
  }
}

function onPointerMove(e) {
  if (pointerId == null || e.pointerId !== pointerId) return
  if (won.value || failed.value) return
  e.preventDefault()

  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (!moved && dx * dx + dy * dy >= DRAG_THRESHOLD * DRAG_THRESHOLD) {
    moved = true
    dragging.value = true
    selected.value = -1
    sfxClick()
  }
  if (!dragging.value || !ghost.value) return

  ghost.value = {
    ...ghost.value,
    x: e.clientX - ghost.value.offsetX,
    y: e.clientY - ghost.value.offsetY,
  }
  dragOver.value = posFromPoint(e.clientX, e.clientY)
}

function onPointerUp(e) {
  if (pointerId == null || e.pointerId !== pointerId) return
  e.preventDefault()

  const from = dragFrom.value
  const over = posFromPoint(e.clientX, e.clientY)

  if (dragging.value) {
    if (over >= 0 && over !== from) swap(from, over)
    resetDrag()
    return
  }

  // 未拖动：点击交换
  resetDrag()
  if (won.value || failed.value || showFull.value) return
  sfxClick()
  if (selected.value < 0) {
    selected.value = from
    return
  }
  if (selected.value === from) {
    selected.value = -1
    return
  }
  swap(selected.value, from)
}

function onPointerCancel() {
  resetDrag()
}

function retry() {
  sfxClick()
  init()
}

onMounted(init)
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="puzzle">
    <div class="hud">
      <span class="timer" :class="{ danger: left <= 10 && !won }">⏱ {{ left }}s</span>
      <span class="hint">拖动拼图交换位置，也可点击两块交换</span>
    </div>

    <div class="board-wrap">
      <transition name="reveal">
        <div v-if="showFull" class="full-photo" :style="{ backgroundImage: `url(${photoSrc})` }">
          <div class="full-veil">
            <b>拼好啦</b>
            <span>这是我们的珍贵瞬间</span>
          </div>
        </div>
      </transition>

      <div v-show="!showFull" ref="boardRef" class="board">
        <div
          v-for="(correctIdx, pos) in tiles"
          :key="pos"
          class="tile"
          :class="{
            selected: selected === pos,
            source: dragging && dragFrom === pos,
            target: dragging && dragOver === pos && dragOver !== dragFrom,
          }"
          :style="tileStyle(correctIdx)"
          @pointerdown="onPointerDown(pos, $event)"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerCancel"
        />
      </div>

      <!-- 拖拽浮层 -->
      <div
        v-if="dragging && ghost"
        class="ghost"
        :style="{
          ...tileStyle(ghost.correctIdx),
          width: ghost.w + 'px',
          height: ghost.h + 'px',
          transform: `translate(${ghost.x}px, ${ghost.y}px)`,
        }"
      />
    </div>

    <div v-if="failed" class="fail-bar">
      <p>时间到啦，再试一次吧～</p>
      <button class="btn-gold" type="button" @click="retry">重新挑战</button>
    </div>
  </div>
</template>

<style scoped>
.puzzle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(12px, 2vmin, 20px);
  width: min(92vw, 480px);
  margin-top: clamp(48px, 8vmin, 72px);
}
.hud {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.timer {
  font-size: clamp(22px, 3.4vmin, 32px);
  font-weight: 700;
  color: var(--gold-bright);
  letter-spacing: 0.08em;
}
.timer.danger {
  color: #ff8fab;
  animation: pulse-soft 0.8s ease-in-out infinite;
}
.hint {
  font-size: clamp(13px, 1.8vmin, 16px);
  color: var(--ink-dim);
}
.board-wrap {
  position: relative;
  width: min(86vw, 420px);
  aspect-ratio: 1;
  touch-action: none;
  user-select: none;
}
.board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  width: 100%;
  height: 100%;
  padding: 4px;
  border-radius: var(--radius-md);
  background: rgba(42, 17, 71, 0.45);
  border: 1px solid var(--glass-border);
}
.tile {
  border: none;
  border-radius: 8px;
  background-repeat: no-repeat;
  cursor: grab;
  touch-action: none;
  transition: box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}
.tile:active {
  cursor: grabbing;
}
.tile.selected {
  transform: scale(0.94);
  box-shadow: 0 0 0 3px var(--gold-bright), var(--glow-pink);
}
.tile.source {
  opacity: 0.35;
  transform: scale(0.96);
}
.tile.target {
  box-shadow: 0 0 0 3px #ff8fab, var(--glow-pink);
  transform: scale(1.03);
}
.ghost {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 80;
  border-radius: 8px;
  background-repeat: no-repeat;
  pointer-events: none;
  box-shadow: 0 12px 28px rgba(80, 10, 60, 0.55), 0 0 0 2px rgba(255, 234, 243, 0.7);
  opacity: 0.95;
  will-change: transform;
}
.full-photo {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  background-size: cover;
  background-position: center;
  overflow: hidden;
  box-shadow: var(--glow-pink), var(--shadow-card);
}
.full-veil {
  position: absolute;
  inset: auto 0 0 0;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: linear-gradient(transparent, rgba(42, 17, 71, 0.85));
  color: var(--ink);
}
.full-veil b {
  font-size: clamp(22px, 3.2vmin, 30px);
  color: var(--gold-bright);
}
.full-veil span {
  font-size: clamp(13px, 1.8vmin, 16px);
  color: var(--ink-dim);
}
.fail-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.fail-bar p {
  color: var(--ink-dim);
}
.reveal-enter-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal-enter-from {
  opacity: 0;
  transform: scale(0.92);
}
</style>
