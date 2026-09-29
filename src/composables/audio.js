/**
 * 音乐与音效系统
 * 播放策略：CONFIG.musicUrl → /music/happy-birthday.m4a → Web Audio 合成《生日快乐歌》兜底
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

/* ---------- 合成音乐：多编曲变奏，播完自动切下一首（避免单曲死循环的重复感） ---------- */
// 三种不同听感的变奏：八音盒 / 抒情钢琴 / 欢快派对
const VARIANTS = [
  { beat: 0.42, mode: 'bell', bass: false, sparkle: false, vol: 0.09 }, // 八音盒（原版）
  { beat: 0.6, mode: 'soft', bass: true, sparkle: false, vol: 0.12 }, // 抒情钢琴
]
// G 大调四句和声根音：G / C / G / F#
const BASS_ROOTS = [98.0, 130.81, 98.0, 92.5]

function scheduleSynthOnce(variant, onDone) {
  if (!ctx || !musicOn) return
  const { beat, mode, bass, sparkle, vol } = variant
  let t = ctx.currentTime + 0.15
  MELODY.forEach(([name, beats], i) => {
    const dur = beats * beat * 0.95
    if (mode === 'bell') {
      playBell(N[name], t, dur, vol)
    } else {
      // 抒情钢琴：三角波主音 + 低八度润色 + 长延音
      playTone(N[name], t, dur * 1.35, vol, 'triangle')
      playTone(N[name] / 2, t, dur * 1.45, vol * 0.35, 'sine')
    }
    if (bass) {
      const root = BASS_ROOTS[Math.floor(i / 6) % 4]
      playTone(root, t, dur, vol * 0.9, 'sine')
      playTone(root * 2, t, dur, vol * 0.25, 'triangle')
    }
    if (sparkle && i % 2 === 0) {
      playTone(N[name] * 2, t + dur * 0.5, dur * 0.5, vol * 0.3, 'triangle')
    }
    t += beats * beat
  })
  const loopLen = (t - ctx.currentTime) * 1000
  synthTimer = setTimeout(onDone, loopLen + 900)
}

function stopSynth() {
  if (synthTimer) {
    clearTimeout(synthTimer)
    synthTimer = null
  }
}

let trackIdx = 0 // 0 = 文件音乐；1..3 = 合成变奏

function playFileMusic() {
  if (!musicOn) return
  if (!audioEl) {
    playNextSynth()
    return
  }
  useSynth = false
  audioEl.currentTime = 0
  audioEl.play().catch(() => playNextSynth())
}

function playNextSynth() {
  if (!musicOn) return
  useSynth = true
  trackIdx = (trackIdx % VARIANTS.length) + 1
  scheduleSynthOnce(VARIANTS[trackIdx - 1], () => {
    if (!musicOn) return
    // 变奏播完：切回文件音乐；文件不可用时继续下一个变奏
    if (audioEl) playFileMusic()
    else playNextSynth()
  })
}

/* ---------- 音乐控制 ---------- */
async function resolveMusicUrl() {
  if (CONFIG.musicUrl) return CONFIG.musicUrl
  try {
    const resp = await fetch(`${base}music/happy-birthday.m4a`, { method: 'HEAD' })
    if (resp.ok) return `${base}music/happy-birthday.m4a`
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
      audioEl.loop = false
      audioEl.volume = 0.55
      // 文件音乐播完 → 切合成变奏（多曲轮播）
      audioEl.addEventListener('ended', () => {
        if (musicOn) playNextSynth()
      })
      await audioEl.play()
      useSynth = false
      return true
    } catch (e) {
      audioEl = null
    }
  }
  // 兜底：合成变奏轮播
  playNextSynth()
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


export function sfxDigit() {
  sfx(() => {
    const t = ctx.currentTime
    playBell(523.25, t, 0.3, 0.1)
    playBell(659.25, t + 0.12, 0.3, 0.1)
    playBell(783.99, t + 0.24, 0.5, 0.12)
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

/* ---------- 抽奖紧张刺激 BGM（Web Audio 合成） ---------- */
let tenseOn = false
let tenseTimer = null
let bgMusicPausedForTense = false

// 钢琴音色：三角波基音 + 泛音叠加，短促衰减
function pianoNote(freq, start, dur, vol) {
  playTone(freq, start, dur, vol, 'triangle')
  playTone(freq * 2, start, dur * 0.6, vol * 0.22, 'sine')
  playTone(freq * 3, start, dur * 0.4, vol * 0.08, 'sine')
}

function scheduleTenseLoop() {
  if (!ctx || !tenseOn) return
  // 浪漫钢琴小品（C 大调）：琶音伴奏 + 主旋律 + 低音进行，循环约 6.5s
  const sp = 0.1425 // 16分音符时长
  let t = ctx.currentTime + 0.1
  // 低音进行：C3 G2 A2 F2（每 8 个 16 分换）
  const bassProg = [130.81, 98.0, 110.0, 87.31]
  // 琶音：C5-E5-G5-C6
  const arp = [523.25, 659.25, 783.99, 1046.5]
  // 旋律：[频率, 16分长度]
  const MEL = [
    [659.25, 1], [783.99, 1], [659.25, 2], [587.33, 2], [659.25, 2], [523.25, 4],
    [587.33, 1], [659.25, 1], [783.99, 2], [880.0, 2], [783.99, 4],
    [659.25, 1], [783.99, 1], [880.0, 2], [987.77, 2], [880.0, 4],
    [783.99, 2], [659.25, 2], [587.33, 4],
  ]
  let i = 0
  while (i < MEL.length) {
    const [f, len] = MEL[i]
    if (f) pianoNote(f, t, len * sp * 1.15, 0.09)
    if (i % 4 === 0) {
      arp.forEach((af, k) => pianoNote(af, t + k * sp, sp * 1.6, 0.04))
    }
    if (i % 8 === 0) {
      const root = bassProg[(i / 8) | 0] || bassProg[0]
      playTone(root, t, sp * 6, 0.1, 'sine')
      playTone(root * 2, t, sp * 6, 0.035, 'triangle')
    }
    t += len * sp
    i += 1
  }
  const loopLen = (t - ctx.currentTime) * 1000
  tenseTimer = setTimeout(scheduleTenseLoop, loopLen + 1500)
}

/** 抽奖开始：暂停背景生日快乐歌，播放紧张循环 */
export function startTenseMusic() {
  ensureCtx()
  if (!ctx) return
  if (tenseOn) return
  tenseOn = true
  if (audioEl && !audioEl.paused) {
    audioEl.pause()
    bgMusicPausedForTense = true
  } else if (useSynth && musicOn) {
    stopSynth()
    bgMusicPausedForTense = true
  }
  scheduleTenseLoop()
}

/** 抽奖结束：停紧张曲，恢复背景音乐 */
export function stopTenseMusic() {
  tenseOn = false
  if (tenseTimer) {
    clearTimeout(tenseTimer)
    tenseTimer = null
  }
  if (bgMusicPausedForTense && musicOn) {
    bgMusicPausedForTense = false
    if (audioEl && !audioEl.ended) {
      audioEl.play().catch(() => {})
    } else if (audioEl) {
      playFileMusic()
    } else {
      playNextSynth()
    }
  }
}

/** 红包点击：880Hz 短促叮 */
export function sfxRedHit() {
  sfx(() => {
    const t = ctx.currentTime
    playTone(880, t, 0.04, 0.14, 'sine')
    playTone(1320, t, 0.03, 0.06, 'triangle')
  })
}

/** 炸弹：低沉冲击 */
export function sfxBomb() {
  sfx(() => {
    const t = ctx.currentTime
    playTone(90, t, 0.25, 0.18, 'sawtooth')
    playTone(60, t + 0.08, 0.3, 0.12, 'sine')
  })
}

/** 红包雨结算上升音阶 */
export function sfxRedResult() {
  sfx(() => {
    const t = ctx.currentTime
    ;[523, 659, 784, 1047].forEach((f, i) => {
      playBell(f, t + i * 0.1, 0.35, 0.1)
    })
  })
}
