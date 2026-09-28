/**
 * 音乐与音效系统
 * 播放策略：CONFIG.musicUrl → /music/happy-birthday.mp3 → Web Audio 合成《生日快乐歌》兜底
 * 浏览器要求用户交互后才能出声，因此在开屏点击时调用 unlock()
 */
import { CONFIG } from '../config'

const base = import.meta.env.BASE_URL || '/'

let ctx = null
let master = null
let musicOn = false
let audioEl = null
let synthTimer = null
let useSynth = false
let resolveQueue = null

/* ---------- 合成旋律定义（生日快乐歌，G 大调） ---------- */
const N = {
  G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33,
  E5: 659.25, F5: 698.46, G5: 783.99,
}
const BEAT = 0.42 // 每拍秒数

// [音符, 拍数]
const MELODY = [
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
  ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
  ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2],
]

/* ---------- 内部工具 ---------- */
function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(freq, start, dur, vol, type = 'sine', dest = master) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(start)
  osc.stop(start + dur + 0.1)
}

function playBell(freq, start, dur, vol) {
  // 双振荡器做出空灵的铃音
  if (!ctx) return
  const g = ctx.createGain()
  g.gain.value = 1
  g.connect(master)
  playTone(freq, start, dur, vol * 0.8, 'sine', g)
  playTone(freq * 2, start, dur * 0.7, vol * 0.25, 'triangle', g)
  playTone(freq * 1.5, start, dur * 0.6, vol * 0.12, 'sine', g)
}

/* ---------- 合成音乐循环 ---------- */
function scheduleSynthLoop() {
  if (!ctx || !musicOn) return
  let t = ctx.currentTime + 0.15
  MELODY.forEach(([name, beats]) => {
    playBell(N[name], t, beats * BEAT * 0.95, 0.09)
    t += beats * BEAT
  })
  const loopLen = (t - ctx.currentTime) * 1000
  synthTimer = setTimeout(scheduleSynthLoop, loopLen + 1200)
}

function stopSynth() {
  if (synthTimer) {
    clearTimeout(synthTimer)
    synthTimer = null
  }
}

/* ---------- 音乐控制 ---------- */
async function resolveMusicUrl() {
  if (CONFIG.musicUrl) return CONFIG.musicUrl
  try {
    const resp = await fetch(`${base}music/happy-birthday.mp3`, { method: 'HEAD' })
    if (resp.ok) return `${base}music/happy-birthday.mp3`
  } catch (e) {
    /* 忽略 */
  }
  return null
}

/**
 * 用户首次交互时调用：解锁音频并开始播放
 */
export async function unlockMusic() {
  const c = ensureCtx()
  if (!c) return false
  if (musicOn) return true
  musicOn = true

  const url = await resolveMusicUrl()
  if (url) {
    try {
      audioEl = new Audio(url)
      audioEl.loop = true
      audioEl.volume = 0.55
      await audioEl.play()
      useSynth = false
      return true
    } catch (e) {
      audioEl = null
    }
  }
  // 兜底：合成旋律
  useSynth = true
  scheduleSynthLoop()
  return true
}

export function stopMusic() {
  musicOn = false
  if (audioEl) {
    audioEl.pause()
    audioEl = null
  }
  stopSynth()
}

export function isMusicOn() {
  return musicOn
}

/* ---------- 音效 ---------- */
function sfx(fn) {
  if (!ctx || !musicOn) return
  try {
    fn()
  } catch (e) {
    /* 忽略 */
  }
}

export function sfxClick() {
  sfx(() => playTone(740, ctx.currentTime, 0.12, 0.12, 'sine'))
}

export function sfxBlow() {
  // 吹气声：白噪声 + 下滑
  sfx(() => {
    const t = ctx.currentTime
    const dur = 0.5
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const flt = ctx.createBiquadFilter()
    flt.type = 'lowpass'
    flt.frequency.setValueAtTime(1800, t)
    flt.frequency.exponentialRampToValueAtTime(320, t + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.16, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(flt)
    flt.connect(g)
    g.connect(master)
    src.start(t)
    src.stop(t + dur)
  })
}

export function sfxDigit() {
  sfx(() => {
    const t = ctx.currentTime
    playBell(523.25, t, 0.3, 0.1)
    playBell(659.25, t + 0.12, 0.3, 0.1)
    playBell(783.99, t + 0.24, 0.5, 0.12)
  })
}

export function sfxUnlock() {
  sfx(() => {
    const t = ctx.currentTime
    playBell(523.25, t, 0.5, 0.12)
    playBell(659.25, t + 0.16, 0.5, 0.12)
    playBell(783.99, t + 0.32, 0.5, 0.12)
    playBell(1046.5, t + 0.48, 1.4, 0.16)
  })
}

export function sfxConfetti() {
  sfx(() => {
    const t = ctx.currentTime
    for (let i = 0; i < 6; i++) {
      playTone(1200 + Math.random() * 1800, t + i * 0.05, 0.12, 0.05, 'triangle')
    }
  })
}

export function sfxWrong() {
  sfx(() => {
    const t = ctx.currentTime
    playTone(220, t, 0.22, 0.1, 'sine')
    playTone(174, t + 0.18, 0.3, 0.1, 'sine')
  })
}

export function sfxPick() {
  sfx(() => {
    const t = ctx.currentTime
    playBell(880, t, 0.18, 0.09)
    playBell(1174.66, t + 0.06, 0.18, 0.07)
  })
}

export function sfxFlip() {
  sfx(() => playTone(620, ctx.currentTime, 0.1, 0.08, 'triangle'))
}

export function sfxPop() {
  sfx(() => {
    const t = ctx.currentTime
    playTone(500 + Math.random() * 300, t, 0.09, 0.1, 'triangle')
  })
}

export function sfxWin() {
  sfx(() => {
    const t = ctx.currentTime
    playBell(659.25, t, 0.3, 0.1)
    playBell(783.99, t + 0.12, 0.3, 0.1)
    playBell(1046.5, t + 0.24, 0.6, 0.12)
  })
}
