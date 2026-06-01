#!/usr/bin/env node
/**
 * Gera images/demo.gif — mockup animado (estilo VS Code) do autocomplete:
 * dropdown de props do bloco filter-navigator.v3, navegação e inserção de enum.
 * Frames em SVG -> raster (sharp) -> GIF animado (gifenc). Sem captura de tela.
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { GIFEncoder, quantize, applyPalette } = require('gifenc')

const W = 900, H = 470
const C = {
  bg: '#1e1e1e', title: '#323233', gutter: '#858585', text: '#d4d4d4',
  key: '#9cdcfe', str: '#ce9178', punct: '#808080', comment: '#6a9955',
  panel: '#252526', border: '#454545', sel: '#062f4a', selBorder: '#F71963',
  icon: '#b180d7', detail: '#1e1e1e', detailBorder: '#454545', muted: '#9d9d9d',
  pink: '#F71963',
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const FONT = `font-family="Menlo, Monaco, Consolas, 'Courier New', monospace"`
const FS = 16, LH = 26, GUTTER = 54, X0 = 70, Y0 = 92

// linhas de código (tokens: [texto, cor])
function codeLines(line7) {
  return [
    [['{', C.punct]],
    [['  "store.search"', C.key], [': {', C.punct]],
    [['    "blocks"', C.key], [': [', C.punct], ['"search-result-layout"', C.str], ['],', C.punct]],
    [['  },', C.punct]],
    [['  "filter-navigator.v3"', C.key], [': {', C.punct]],
    [['    "props"', C.key], [': {', C.punct]],
    line7,
    [['    }', C.punct]],
    [['  }', C.punct]],
    [['}', C.punct]],
  ]
}

function tspans(tokens, x, y) {
  let out = `<text x="${x}" y="${y}" ${FONT} font-size="${FS}" xml:space="preserve">`
  let dx = 0
  for (const [t, color] of tokens) {
    out += `<tspan x="${x + dx}" fill="${color}">${esc(t)}</tspan>`
    dx += t.length * 9.6 // largura aprox. do monospace 16px
  }
  return out + '</text>'
}

const PROPS = [
  ['layout', 'enum', 'responsive | desktop'],
  ['openFiltersMode', 'enum', 'many | one'],
  ['initiallyCollapsed', 'boolean', 'true | false'],
  ['maxItemsCategory', 'number', ''],
  ['appliedFiltersOverview', 'enum', 'show | hide'],
  ['priceRangeLayout', 'enum', 'slider | list'],
]

// caixa de autocomplete ancorada na linha 7
function dropdown({ items, hi, anchorY, typed }) {
  const dx = X0 + (6 + (typed ? typed.length : 0)) * 9.6 + 8
  const dy = anchorY + 8
  const rowH = 26, w = 268, h = items.length * rowH + 10
  let s = `<rect x="${dx}" y="${dy}" width="${w}" height="${h}" rx="6" fill="${C.panel}" stroke="${C.border}"/>`
  items.forEach((it, i) => {
    const ry = dy + 5 + i * rowH
    if (i === hi) s += `<rect x="${dx + 3}" y="${ry}" width="${w - 6}" height="${rowH}" rx="4" fill="${C.sel}" stroke="${C.selBorder}" stroke-width="1"/>`
    s += `<rect x="${dx + 12}" y="${ry + 6}" width="14" height="14" rx="3" fill="${C.icon}"/>`
    s += `<text x="${dx + 34}" y="${ry + 18}" ${FONT} font-size="14" fill="${i === hi ? '#ffffff' : C.text}">${esc(it[0])}</text>`
    s += `<text x="${dx + w - 14}" y="${ry + 18}" ${FONT} font-size="11" fill="${C.muted}" text-anchor="end">${esc(it[1])}</text>`
  })
  // popup de detalhe do item destacado (descrição/enum)
  const det = items[hi]
  if (det && det[2]) {
    const px = dx + w + 8, pw = 240
    s += `<rect x="${px}" y="${dy}" width="${pw}" height="48" rx="6" fill="${C.detail}" stroke="${C.detailBorder}"/>`
    s += `<text x="${px + 12}" y="${dy + 20}" ${FONT} font-size="12" fill="${C.text}">${esc(det[0])}: ${esc(det[1])}</text>`
    s += `<text x="${px + 12}" y="${dy + 38}" ${FONT} font-size="12" fill="${C.pink}">${esc(det[2])}</text>`
  }
  return s
}

function valueDropdown({ anchorX, anchorY, items, hi }) {
  const dx = anchorX, dy = anchorY + 8, rowH = 26, w = 150, h = items.length * rowH + 10
  let s = `<rect x="${dx}" y="${dy}" width="${w}" height="${h}" rx="6" fill="${C.panel}" stroke="${C.border}"/>`
  items.forEach((it, i) => {
    const ry = dy + 5 + i * rowH
    if (i === hi) s += `<rect x="${dx + 3}" y="${ry}" width="${w - 6}" height="${rowH}" rx="4" fill="${C.sel}" stroke="${C.selBorder}"/>`
    s += `<rect x="${dx + 12}" y="${ry + 7}" width="12" height="12" rx="2" fill="${C.str}"/>`
    s += `<text x="${dx + 32}" y="${ry + 18}" ${FONT} font-size="14" fill="${i === hi ? '#fff' : C.text}">${esc(it[0])}</text>`
  })
  return s
}

function frameSVG(state) {
  const line7 = state.line7 || [['      ', C.text]]
  const lines = codeLines(line7)
  let body = ''
  // título / janela
  body += `<rect width="${W}" height="${H}" fill="${C.bg}"/>`
  body += `<rect width="${W}" height="36" fill="${C.title}"/>`
  body += `<circle cx="22" cy="18" r="6" fill="#ff5f56"/><circle cx="42" cy="18" r="6" fill="#ffbd2e"/><circle cx="62" cy="18" r="6" fill="#27c93f"/>`
  body += `<text x="${W / 2}" y="23" ${FONT} font-size="13" fill="${C.muted}" text-anchor="middle">store/blocks/search.jsonc — VTEX IO</text>`
  // gutter + linhas
  for (let i = 0; i < lines.length; i++) {
    const y = Y0 + i * LH
    body += `<text x="${GUTTER}" y="${y}" ${FONT} font-size="${FS}" fill="${C.gutter}" text-anchor="end">${i + 1}</text>`
    body += tspans(lines[i], X0, y)
  }
  // cursor piscando na linha 7
  if (state.cursor) {
    const cx = X0 + (6 + (state.typed ? state.typed.length : 0)) * 9.6
    body += `<rect x="${cx}" y="${Y0 + 6 * LH - 14}" width="2" height="18" fill="${C.text}"/>`
  }
  if (state.dropdown) body += dropdown({ items: state.dropdown, hi: state.hi || 0, anchorY: Y0 + 6 * LH, typed: state.typed })
  if (state.valueDropdown) body += valueDropdown(state.valueDropdown)
  // legenda
  body += `<text x="${W - 16}" y="${H - 14}" ${FONT} font-size="12" fill="${C.muted}" text-anchor="end">Ctrl+Espaço → props de filter-navigator.v3</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`
}

// linha 7 helpers
const blankLine7 = (typed) => [[`      "${typed || ''}`, C.key]]
const typedLine7 = (typed) => [[`      "${typed}`, C.key]]
const insertedKey = [['      "openFiltersMode"', C.key], [': "', C.punct]]
const insertedFull = [['      "openFiltersMode"', C.key], [': ', C.punct], ['"many"', C.str], [',', C.punct]]

// roteiro de frames: [state, delayMs]
const frames = []
const push = (state, delay) => frames.push({ state, delay })

push({ cursor: true }, 700)
push({ cursor: false }, 300)
// dropdown surge, destaque desce
for (let i = 0; i < PROPS.length; i++) push({ dropdown: PROPS, hi: i }, 750)
// digita "open" -> filtra
push({ dropdown: PROPS.filter((p) => p[0].startsWith('open')), hi: 0, typed: 'open', cursor: true, line7: typedLine7('open') }, 900)
// aceita -> insere a chave, abre dropdown de valor (enum)
push({ line7: insertedKey, valueDropdown: { anchorX: X0 + 22 * 9.6, anchorY: Y0 + 6 * LH, items: [['many'], ['one']], hi: 0 } }, 800)
push({ line7: insertedKey, valueDropdown: { anchorX: X0 + 22 * 9.6, anchorY: Y0 + 6 * LH, items: [['many'], ['one']], hi: 0 } }, 600)
// valor inserido
push({ line7: insertedFull }, 1500)

;(async () => {
  const enc = GIFEncoder()
  for (const f of frames) {
    const svg = frameSVG(f.state)
    const { data } = await sharp(Buffer.from(svg)).resize(W, H).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    // RGBA -> índice de paleta
    const rgba = new Uint8Array(data)
    const palette = quantize(rgba, 256, { format: 'rgba4444' })
    const index = applyPalette(rgba, palette, 'rgba4444')
    enc.writeFrame(index, W, H, { palette, delay: f.delay })
  }
  enc.finish()
  const out = path.resolve(__dirname, '..', 'images', 'demo.gif')
  fs.writeFileSync(out, enc.bytes())
  console.log(`demo.gif gerado: ${(enc.bytes().length / 1024).toFixed(0)} KB, ${frames.length} frames, ${W}x${H}`)
})().catch((e) => { console.error(e); process.exit(1) })
