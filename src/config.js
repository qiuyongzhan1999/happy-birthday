/**
 * 小桐生日 · 可配置项
 * 想改女朋友的名字 / 生日日期 / 照片 / 题目 / 密码 / 礼物，只改这个文件即可。
 * 想让程序真正播放《生日快乐歌》：
 *   1. 把音频 mp3 文件放进 public/music/ 目录，命名为 happy-birthday.mp3
 *   2. 或把音频地址填到 musicUrl（填了之后优先使用它）
 *   3. 都没有时，程序会播放内置的 Web Audio 合成生日快乐歌旋律兜底
 */
export const CONFIG = {
  // 女朋友的称呼
  name: '宝贝',
  // 生日日期展示文案
  date: '2026.09.28',
  // 照片地址：可填 /photo.jpg（放 public 目录）或任意图片 URL；留空则显示默认的星光头像装饰
  photoUrl: '',

  // —— 背景音乐（生日快乐歌）——
  // 音频地址，留空则尝试读取 /music/happy-birthday.mp3，再兜底用 Web Audio 合成生日快乐歌旋律
  musicUrl: '',

  // —— 闯关数据 ——
  // 三关依次得到的数字，按顺序拼成开箱密码
  codeParts: ['5', '2', '0'],

  // 小测验：每题 3 个选项，correct 为正确选项下标
  quiz: [
    {
      q: '我们的第一次见面，是在哪里？',
      options: ['图书馆', '朋友聚会', '教室'],
      correct: 1,
      hint: '那天你穿了件很显眼的衣服～',
    },
    {
      q: '我最喜欢给你买的东西是什么？',
      options: ['奶茶', '小蛋糕', '花'],
      correct: 0,
      hint: '甜甜的、喝下去会笑的那种～',
    },
    {
      q: '我们的纪念日是哪一天？',
      options: ['2月14日', '我们在一起那天', '我的生日'],
      correct: 1,
      hint: '那是我们故事开始的日子～',
    },
  ],

  // —— 大转盘奖品（12 个，cell 为 4x4 网格图中的格子序号 0-15）——
  // 红包奖品：img: 'red' 表示从 red-envelopes.jpg（3 列）裁剪，cell 为列号 0-2
  prizes: [
    { name: '口红', cell: 0, tag: '正红显白，衬你的笑' },
    { name: '香水', cell: 1, tag: '香气是藏不住的温柔' },
    { name: '眼影盘', cell: 2, tag: '大地色，日常百搭' },
    { name: '腮红', cell: 3, tag: '脸颊泛起的粉红' },
    { name: '面膜', cell: 4, tag: '好好呵护你的脸' },
    { name: '精华液', cell: 5, tag: '让肌肤喝饱水' },
    { name: '面霜', cell: 6, tag: '秋冬的温柔守护' },
    { name: '拍立得', cell: 7, tag: '记录我们每个瞬间' },
    { name: '项链', cell: 8, tag: '想亲手为你戴上' },
    { name: '188红包', cell: 0, img: 'red', tag: '188 元现金红包' },
    { name: '288红包', cell: 1, img: 'red', tag: '288 元现金红包' },
    { name: '520红包', cell: 2, img: 'red', tag: '520 元现金红包' },
  ],

  // —— 礼物 ——
  gift: {
    title: '给最爱的你',
    line1: '一支想亲手为你涂上的口红',
    line2: '一条想亲手为你戴上的项链',
    bless: '愿往后每一天，都有甜蜜与惊喜奔向你',
  },
}
