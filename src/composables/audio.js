/**
 * 音乐与音效系统
 * 背景音乐：src/assets/music/srkl.mp3（循环）
 * 红包雨：src/assets/music/hbyu.mp3（进入红包雨页即播）
 * 浏览器可能拦截自动播放：首页挂载时尝试播放，失败则等用户首次交互再播
 */
import bgmUrl from '../assets/music/srkl.mp3'
import lankouUrl from '../assets/music/lankou.mp3'
import huangjinUrl from '../assets/music/huangjin.mp3'
import hbyuUrl from '../assets/music/hbyu.mp3'
import choujiangUrl from '../assets/music/choujiang.mp3'

let ctx = null
let master = null
let musicOn = false
let audioEl = null
let announceEl = null
let rainEl = null
let rainOn = false
let bgMusicPausedForRain = false
let tenseEl = null
let tenseOn = false
let bgMusicPausedForTense = false

/** 中奖播报：奖品名 → 音频 */
const PRIZE_ANNOUNCE = {
  '兰蔻超修小黑瓶精华': lankouUrl,
  '老庙黄金项链': huangjinUrl,
}

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

/* ---------- 音乐控制 ---------- */
/**
 * 用户首次交互时调用：解锁音频并开始播放
 */
export async function unlockMusic() {
  const c = ensureCtx()
  if (!c) return false
  if (musicOn && audioEl && !audioEl.paused) return true

  try {
    if (!audioEl) {
      audioEl = new Audio(bgmUrl)
      audioEl.loop = true
      audioEl.preload = 'auto'
      audioEl.volume = 0.55
      // iOS / 微信内置浏览器
      audioEl.playsInline = true
      audioEl.setAttribute('playsinline', 'true')
      audioEl.setAttribute('webkit-playsinline', 'true')
    }
    await audioEl.play()
    musicOn = true
    return true
  } catch (e) {
    musicOn = false
    return false
  }
}

export function stopMusic() {
  musicOn = false
  rainOn = false
  tenseOn = false
  bgMusicPausedForRain = false
  bgMusicPausedForTense = false
  if (announceEl) {
    announceEl.pause()
    announceEl = null
  }
  if (rainEl) {
    rainEl.pause()
    rainEl = null
  }
  if (tenseEl) {
    tenseEl.pause()
    tenseEl = null
  }
  if (audioEl) {
    audioEl.pause()
    audioEl = null
  }
}

/**
 * 核心奖品中奖播报。会暂时暂停抽奖曲/主 BGM，播完后优先恢复抽奖曲。
 * @returns {boolean} 是否有对应播报
 */
export function playPrizeAnnounce(prizeName) {
  const url = PRIZE_ANNOUNCE[prizeName]
  if (!url) return false
  ensureCtx()

  if (announceEl) {
    announceEl.pause()
    announceEl = null
  }
  if (tenseEl && !tenseEl.paused) {
    tenseEl.pause()
  }
  if (audioEl && !audioEl.paused) {
    audioEl.pause()
  }

  const resumeAfter = () => {
    if (tenseOn && tenseEl) {
      tenseEl.play().catch(() => {})
      return
    }
    resumeBgMusic()
  }

  announceEl = new Audio(url)
  announceEl.volume = 0.9
  announceEl.addEventListener('ended', () => {
    announceEl = null
    resumeAfter()
  })
  announceEl.play().catch(() => {
    announceEl = null
    resumeAfter()
  })
  return true
}

export function resumeBgMusic() {
  if (musicOn && audioEl && !tenseOn && !rainOn) {
    audioEl.play().catch(() => {})
  }
}

export function isMusicOn() {
  return musicOn
}

/** 进入红包雨：暂停主 BGM，循环播放 hbyu.mp3 */
export function startRedRainMusic() {
  ensureCtx()

  if (rainOn && rainEl) {
    if (rainEl.paused) rainEl.play().catch(() => {})
    return
  }
  rainOn = true

  if (announceEl) {
    announceEl.pause()
    announceEl = null
  }
  if (audioEl && !audioEl.paused) {
    audioEl.pause()
    bgMusicPausedForRain = true
  }

  try {
    rainEl = new Audio(hbyuUrl)
    rainEl.loop = true
    rainEl.preload = 'auto'
    rainEl.volume = 0.6
    rainEl.playsInline = true
    rainEl.setAttribute('playsinline', 'true')
    rainEl.setAttribute('webkit-playsinline', 'true')
    rainEl.play().catch(() => {})
  } catch (e) {
    /* 忽略 */
  }
}

/** 离开红包雨：停 hbyu，恢复主 BGM */
export function stopRedRainMusic({ resume = true } = {}) {
  rainOn = false
  if (rainEl) {
    rainEl.pause()
    rainEl = null
  }
  if (resume && bgMusicPausedForRain && musicOn && audioEl && !tenseOn) {
    bgMusicPausedForRain = false
    audioEl.play().catch(() => {})
  } else {
    bgMusicPausedForRain = false
  }
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

/* ---------- 抽奖 BGM：choujiang.mp3 ---------- */

/** 抽奖开始：暂停背景音乐，循环播放 choujiang.mp3 */
export function startTenseMusic() {
  ensureCtx()

  if (tenseOn && tenseEl) {
    if (tenseEl.paused) tenseEl.play().catch(() => {})
    return
  }
  tenseOn = true

  if (announceEl) {
    announceEl.pause()
    announceEl = null
  }
  if (audioEl && !audioEl.paused) {
    audioEl.pause()
    bgMusicPausedForTense = true
  }

  try {
    tenseEl = new Audio(choujiangUrl)
    tenseEl.loop = true
    tenseEl.preload = 'auto'
    tenseEl.volume = 0.65
    tenseEl.playsInline = true
    tenseEl.setAttribute('playsinline', 'true')
    tenseEl.setAttribute('webkit-playsinline', 'true')
    tenseEl.play().catch(() => {})
  } catch (e) {
    /* 忽略 */
  }
}

/** 抽奖结束：停抽奖曲；默认恢复背景音乐 */
export function stopTenseMusic({ resume = true } = {}) {
  tenseOn = false
  if (tenseEl) {
    tenseEl.pause()
    tenseEl = null
  }
  if (resume && bgMusicPausedForTense && musicOn && audioEl && !rainOn) {
    bgMusicPausedForTense = false
    audioEl.play().catch(() => {})
  } else {
    bgMusicPausedForTense = false
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
