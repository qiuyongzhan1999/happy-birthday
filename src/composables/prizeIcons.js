/**
 * 奖品图标工具：真实商品图（prize.image，本地资源）优先；
 * 无图时兜底绘制「名称卡」，保证转盘与奖励列表始终有内容可显示。
 */

const SIZE = 256

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawNameCard(ctx, prize) {
  const g = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  g.addColorStop(0, '#fff5f8')
  g.addColorStop(1, prize.color || '#ffc4d6')
  ctx.fillStyle = g
  roundRect(ctx, 8, 8, SIZE - 16, SIZE - 16, 36)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 4
  ctx.stroke()
  // 无图时的占位圆点
  ctx.fillStyle = 'rgba(255,123,172,0.85)'
  ctx.beginPath()
  ctx.arc(SIZE / 2, SIZE / 2 - 18, 34, 0, Math.PI * 2)
  ctx.fill()
  // 底部名称条
  ctx.fillStyle = 'rgba(58, 24, 48, 0.72)'
  roundRect(ctx, 24, 200, SIZE - 48, 36, 12)
  ctx.fill()
  ctx.fillStyle = '#fff7fb'
  ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(prize.name, SIZE / 2, 218)
}

const cache = new Map()

/**
 * 获取奖品图标 URL：有真实商品图直接返回该 URL；
 * 无图时绘制名称卡（dataURL）并缓存。
 */
export function getPrizeIconUrl(prize) {
  if (prize.image) return prize.image
  const key = prize.name
  if (cache.has(key)) return cache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  drawNameCard(ctx, prize)
  const url = canvas.toDataURL('image/png')
  cache.set(key, url)
  return url
}
