#!/usr/bin/env node
/**
 * Gera images/icon.png (128x128) sem dependencias externas.
 * Fundo rosa VTEX (#F71963) com glifo "</>" branco.
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const SIZE = 128
const BG = [0xf7, 0x19, 0x63] // VTEX pink
const FG = [0xff, 0xff, 0xff]

// canvas RGBA
const px = Buffer.alloc(SIZE * SIZE * 4)
for (let i = 0; i < SIZE * SIZE; i++) {
  px[i * 4 + 0] = BG[0]
  px[i * 4 + 1] = BG[1]
  px[i * 4 + 2] = BG[2]
  px[i * 4 + 3] = 0xff
}

function blend(x, y, cov) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || cov <= 0) return
  const i = (y * SIZE + x) * 4
  const a = Math.min(1, cov)
  px[i + 0] = Math.round(px[i + 0] * (1 - a) + FG[0] * a)
  px[i + 1] = Math.round(px[i + 1] * (1 - a) + FG[1] * a)
  px[i + 2] = Math.round(px[i + 2] * (1 - a) + FG[2] * a)
}

function distSeg(px_, py_, x0, y0, x1, y1) {
  const dx = x1 - x0
  const dy = y1 - y0
  const l2 = dx * dx + dy * dy
  let t = l2 === 0 ? 0 : ((px_ - x0) * dx + (py_ - y0) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  const cx = x0 + t * dx
  const cy = y0 + t * dy
  return Math.hypot(px_ - cx, py_ - cy)
}

// segmentos do glifo "</>"  (coordenadas em 128x128)
const half = 7 // metade da espessura
const segs = [
  // "<"
  [42, 32, 24, 64],
  [24, 64, 42, 96],
  // "/"
  [74, 28, 54, 100],
  // ">"
  [86, 32, 104, 64],
  [104, 64, 86, 96],
]

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let d = Infinity
    for (const s of segs) d = Math.min(d, distSeg(x + 0.5, y + 0.5, s[0], s[1], s[2], s[3]))
    // anti-alias suave: coberto se d < half, transicao de 1px
    const cov = Math.max(0, Math.min(1, half - d + 0.5))
    if (cov > 0) blend(x, y, cov)
  }
}

// ---- encode PNG ----
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // color type RGBA
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

// raw scanlines com filtro 0
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1))
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0
  px.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
}
const idat = zlib.deflateSync(raw, { level: 9 })

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const out = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])

const dest = path.resolve(__dirname, '..', 'images', 'icon.png')
fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.writeFileSync(dest, out)
console.log(`icon.png gerado: ${out.length} bytes (${SIZE}x${SIZE})`)
