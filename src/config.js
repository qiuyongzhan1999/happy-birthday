/**
 * 小桐生日 · 可配置项
 * 想改女朋友的名字 / 照片 / 礼物文案等，只改这个文件即可。
 * date 按打开当天实时生成，无需手写。
 */
import lancomeSerum from './assets/prizes/lancome-serum.jpg'
import skiiEssence from './assets/prizes/skii-essence.jpg'
import hrCream from './assets/prizes/hr-cream.jpg'
import esteeEyecream from './assets/prizes/estee-eyecream.jpg'
import yslLipstick from './assets/prizes/ysl-lipstick.jpg'
import diorPerfume from './assets/prizes/dior-perfume.jpg'
import chanelPerfume from './assets/prizes/chanel-perfume.jpg'
import ctBlush from './assets/prizes/ct-blush.jpg'
import narsPowder from './assets/prizes/nars-powder.jpg'
import yamanDevice from './assets/prizes/yaman-device.jpg'
import goldNecklace1 from './assets/prizes/gold-necklace-1.jpg'
import cartierRing from './assets/prizes/cartier-ring.jpg'
import tiffanyNecklace from './assets/prizes/tiffany-necklace.jpg'
import airpodsImg from './assets/prizes/airpods.jpg'

function todayText() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export const CONFIG = {
  name: '桐桐',
  date: todayText(),
  photoUrl: '',

  // 默契问答（游乐园）
  chemistryQuiz: {
    q: '如果世界漆黑，下一句是？',
    options: [
      '除了我还有谁？',
      '你看不见我，我看不见你',
      '那就一起摸黑走吧',
      '打开灯不就好了',
    ],
    correct: 0,
  },

  // 回忆拼图
  puzzle: {
    timeLimit: 60,
  },

  // 红包雨
  redPacketRain: {
    duration: 30,
    bombPenalty: 1,
    // 领取超过 threshold 时，结算金额在 [minReward, maxReward] 随机
    threshold: 15,
    minReward: 450,
    maxReward: 550,
  },

  // 大转盘奖品（icon 对应 prizeIcons；展示仅用 name，不显示描述）

  prizes: [
        {
          "name": "兰蔻超修小黑瓶精华",
          "icon": "lancome-serum",
          "color": "#1a1a1a",
          "image": lancomeSerum,
          "description": "兰蔻明星单品，核心成分为10%高浓度二裂酵母发酵产物溶胞物，主打微生态修护，维稳抗老，适合各种肤质。"
        },
        {
          "name": "SK-II神仙水精华露75ml",
          "icon": "skii-essence",
          "color": "#c41e3a",
          "image": skiiEssence,
          "description": "含90%以上Pitera精华，细腻肤质、焕亮光泽，数十年畅销不衰的经典精华水。"
        },
        {
          "name": "赫莲娜黑绷带面霜50ml",
          "icon": "hr-cream",
          "color": "#2d2d2d",
          "image": hrCream,
          "description": "含30%高浓度玻色因，深层修护与抗老表现突出，质地绵密，适合熟龄肌。"
        },
        {
          "name": "雅诗兰黛小棕瓶眼霜15ml",
          "icon": "estee-eyecream",
          "color": "#8b4513",
          "image": esteeEyecream,
          "description": "抗蓝光小棕瓶眼霜，淡化细纹、提拉紧致、改善黑眼圈，熬夜党必备。"
        },
        {
          "name": "YSL圣罗兰小金条口红·1966暖棕红",
          "icon": "ysl-lipstick",
          "color": "#1a1a1a",
          "image": yslLipstick,
          "description": "无法复刻的红棕色，丝绒雾面质地不拔干，显白提气色，黑金包装高级感十足。"
        },
        {
          "name": "Dior迪奥花漾甜心淡香水50ml",
          "icon": "dior-perfume",
          "color": "#ffb6c1",
          "image": diorPerfume,
          "description": "经典少女风格花香调，清甜俏丽不做作，百搭好穿，适合日常通勤约会。"
        },
        {
          "name": "香奈儿可可小姐淡香水50ml",
          "icon": "chanel-perfume",
          "color": "#f5f5dc",
          "image": chanelPerfume,
          "description": "曾获FIFI大奖最佳女士香水，诠释独立自信与典雅，经典不过时的选择。"
        },
        {
          "name": "Charlotte Tilbury腮红高光盘",
          "icon": "ct-blush",
          "color": "#ff8fab",
          "image": ctBlush,
          "description": "Pillow Talk系列，珠光细腻，自然好气色，可腮红可高光，适合各种肤色。"
        },
        {
          "name": "NARS原生光蜜粉饼",
          "icon": "nars-powder",
          "color": "#f9e4c8",
          "image": narsPowder,
          "description": "大白饼定妆神器，粉质细腻透明，不改变妆面，控油持久，适合各种肤色。"
        },
        {
          "name": "雅萌LIFT黄金美容仪",
          "icon": "yaman-device",
          "color": "#d4af37",
          "image": yamanDevice,
          "description": "日本高端美容仪品牌，射频+微电流+LED，抗皱提拉紧致，家用美容仪口碑之选。"
        },
        {
          "name": "老庙黄金项链",
          "icon": "gold-necklace",
          "color": "#f5d76e",
          "image": goldNecklace1,
          "description": "老庙黄金经典足金O字链，简约百搭，保值实用，日常佩戴或送礼皆宜。"
        },

        {
          "name": "Cartier Trinity三色金戒指",
          "icon": "cartier-ring",
          "color": "#d4af37",
          "image": cartierRing,
          "description": "卡地亚经典三环戒指，玫瑰金、黄金、白金三色交织，象征爱情、友谊与忠诚。"
        },
        {
          "name": "Tiffany Lock玫瑰金项链",
          "icon": "tiffany-necklace",
          "color": "#ffb6c1",
          "image": tiffanyNecklace,
          "description": "蒂芙尼Lock系列，设计灵感源自古董挂锁图案，18K玫瑰金，时尚百搭。"
        },
        {
          "name": "Apple AirPods Pro 3",
          "icon": "airpods",
          "color": "#ffffff",
          "image": airpodsImg,
          "description": "H3芯片加持，降噪深度提升30%，24小时总续航，支持无损音频，通勤运动皆宜。"
        }
      ],
}
