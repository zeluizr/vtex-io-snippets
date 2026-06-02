#!/usr/bin/env node
/**
 * Gera images/demo.gif — mockup animado (estilo VS Code) dos recursos da extensão.
 * Três cenas, sem captura de tela (frames em SVG -> raster via sharp -> GIF via gifenc):
 *   1. Autocomplete ANINHADO  — props que são objetos (slider-layout > itemsPerPage).
 *   2. Navegação entre blocos  — Cmd+clique numa referência vai até a definição (hover).
 *   3. Cobertura do blog        — props de blog-latest-posts-preview.
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { GIFEncoder, quantize, applyPalette } = require('gifenc')

const W = 900, H = 470
const C = {
  bg: '#1e1e1e', title: '#323233', gutter: '#858585', text: '#d4d4d4',
  key: '#9cdcfe', str: '#ce9178', punct: '#808080', comment: '#6a9955', num: '#b5cea8',
  panel: '#252526', border: '#454545', sel: '#062f4a', selBorder: '#F71963',
  icon: '#b180d7', vicon: '#ce9178', detail: '#1e1e1e', detailBorder: '#454545',
  muted: '#9d9d9d', pink: '#F71963', defHi: '#2d2418', defBorder: '#665a2e',
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const FONT = `font-family="Menlo, Monaco, Consolas, 'Courier New', monospace"`
const FS = 16, LH = 26, GUTTER = 54, X0 = 70, Y0 = 92, CW = 9.6
const charX = (col) => X0 + col * CW
const lineY = (i) => Y0 + i * LH

function tspans(tokens, x, y) {
  let out = `<text x="${x}" y="${y}" ${FONT} font-size="${FS}" xml:space="preserve">`
  let dx = 0
  for (const [t, color] of tokens) {
    out += `<tspan x="${x + dx}" fill="${color}">${esc(t)}</tspan>`
    dx += t.length * CW
  }
  return out + '</text>'
}

// Dropdown de autocomplete genérico, ancorado em (x,y). items: [nome, tag, detalhe?]
function dropdown({ x, y, items, hi = 0, kind = 'prop', width = 280 }) {
  const dy = y + 8, rowH = 26, w = width, h = items.length * rowH + 10
  let s = `<rect x="${x}" y="${dy}" width="${w}" height="${h}" rx="6" fill="${C.panel}" stroke="${C.border}"/>`
  items.forEach((it, i) => {
    const ry = dy + 5 + i * rowH
    if (i === hi) s += `<rect x="${x + 3}" y="${ry}" width="${w - 6}" height="${rowH}" rx="4" fill="${C.sel}" stroke="${C.selBorder}" stroke-width="1"/>`
    const ic = kind === 'value' ? C.vicon : C.icon
    if (kind === 'value') s += `<rect x="${x + 12}" y="${ry + 7}" width="12" height="12" rx="2" fill="${ic}"/>`
    else s += `<rect x="${x + 12}" y="${ry + 6}" width="14" height="14" rx="3" fill="${ic}"/>`
    s += `<text x="${x + 34}" y="${ry + 18}" ${FONT} font-size="14" fill="${i === hi ? '#ffffff' : C.text}">${esc(it[0])}</text>`
    if (it[1]) s += `<text x="${x + w - 14}" y="${ry + 18}" ${FONT} font-size="11" fill="${C.muted}" text-anchor="end">${esc(it[1])}</text>`
  })
  const det = items[hi]
  if (det && det[2]) {
    const px = x + w + 8, pw = 250
    s += `<rect x="${px}" y="${dy}" width="${pw}" height="50" rx="6" fill="${C.detail}" stroke="${C.detailBorder}"/>`
    s += `<text x="${px + 12}" y="${dy + 20}" ${FONT} font-size="12" fill="${C.text}">${esc(det[0])}${det[1] ? ': ' + esc(det[1]) : ''}</text>`
    s += `<text x="${px + 12}" y="${dy + 39}" ${FONT} font-size="12" fill="${C.pink}">${esc(det[2])}</text>`
  }
  return s
}

// Tooltip de hover (navegação): linhas de texto num popup arredondado.
function tooltip({ x, y, lines }) {
  const pad = 12, lh = 19
  const wch = Math.max(...lines.map((l) => l.text.length))
  const w = Math.max(220, wch * 8.2 + pad * 2), h = lines.length * lh + pad * 2 - 4
  let s = `<rect x="${x}" y="${y + 8}" width="${w}" height="${h}" rx="6" fill="${C.panel}" stroke="${C.border}"/>`
  lines.forEach((l, i) => {
    s += `<text x="${x + pad}" y="${y + 8 + pad + 6 + i * lh}" ${FONT} font-size="${l.size || 12}" fill="${l.fill || C.text}">${esc(l.text)}</text>`
  })
  return s
}

function frameSVG(state) {
  const { lines, title, legend } = state
  let body = ''
  body += `<rect width="${W}" height="${H}" fill="${C.bg}"/>`
  body += `<rect width="${W}" height="36" fill="${C.title}"/>`
  body += `<circle cx="22" cy="18" r="6" fill="#ff5f56"/><circle cx="42" cy="18" r="6" fill="#ffbd2e"/><circle cx="62" cy="18" r="6" fill="#27c93f"/>`
  body += `<text x="${W / 2}" y="23" ${FONT} font-size="13" fill="${C.muted}" text-anchor="middle">${esc(title)}</text>`
  // realce da linha de definição (cena 2)
  if (state.highlightLine != null) {
    const hy = lineY(state.highlightLine) - 18
    body += `<rect x="${GUTTER + 8}" y="${hy}" width="${W - GUTTER - 24}" height="${LH}" rx="4" fill="${C.defHi}" stroke="${C.defBorder}"/>`
  }
  for (let i = 0; i < lines.length; i++) {
    const y = lineY(i)
    body += `<text x="${GUTTER}" y="${y}" ${FONT} font-size="${FS}" fill="${C.gutter}" text-anchor="end">${i + 1}</text>`
    body += tspans(lines[i], X0, y)
  }
  // sublinhado de referência (cena 2)
  if (state.underline) {
    const { line, colStart, colEnd } = state.underline
    const ux = charX(colStart), uw = (colEnd - colStart) * CW
    body += `<rect x="${ux}" y="${lineY(line) + 4}" width="${uw}" height="1.5" fill="${C.pink}"/>`
  }
  if (state.cursor) {
    const cx = charX(state.cursor.col)
    body += `<rect x="${cx}" y="${lineY(state.cursor.line) - 14}" width="2" height="18" fill="${C.text}"/>`
  }
  if (state.cursorIcon) {
    const cx = charX(state.cursorIcon.col), cy = lineY(state.cursorIcon.line) + 6
    body += `<path d="M${cx} ${cy} l0 14 l4 -4 l3 6 l3 -1 l-3 -6 l5 0 z" fill="#ffffff" stroke="#000" stroke-width="0.6"/>`
  }
  if (state.dropdown) body += dropdown(state.dropdown)
  if (state.tooltip) body += tooltip(state.tooltip)
  body += `<text x="${W - 16}" y="${H - 14}" ${FONT} font-size="12" fill="${C.muted}" text-anchor="end">${esc(legend)}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`
}

// ---------------------------------------------------------------- cenas
const K = C.key, P = C.punct, S = C.str, T = C.text, N = C.num

// Cena 1 — autocomplete aninhado em slider-layout > itemsPerPage (objeto)
const S1 = {
  title: 'store/home.jsonc — VTEX IO',
  legend: 'Autocompletado anidado → props que son objetos',
  lines: [
    [['{', P]],
    [['  "slider-layout#shelf"', K], [': {', P]],
    [['    "props"', K], [': {', P]],
    [['      "itemsPerPage"', K], [': {', P]],
    [['        ', T]],
    [['      }', P]],
    [['    }', P]],
    [['  }', P]],
    [['}', P]],
  ],
  drop: {
    x: charX(8), y: lineY(4),
    items: [
      ['desktop', 'number', 'Ítems por página en escritorio.'],
      ['tablet', 'number', 'Ítems por página en tablet.'],
      ['phone', 'number', 'Ítems por página en teléfono.'],
    ],
  },
  cursor: { line: 4, col: 8 },
}

// Cena 2 — navegação entre blocos (Go to Definition / hover)
const S2 = {
  title: 'store/home.jsonc — VTEX IO',
  legend: 'Cmd+clic → va a la definición del bloque',
  lines: [
    [['{', P]],
    [['  "store.home"', K], [': {', P]],
    [['    "blocks"', K], [': [', P], ['"flex-layout.row#hero"', S], [']', P]],
    [['  },', P]],
    [['  "flex-layout.row#hero"', K], [': {', P]],
    [['    "props"', K], [': { ', P], ['"blockClass"', K], [': ', P], ['"hero"', S], [' }', P]],
    [['  }', P]],
    [['}', P]],
  ],
  refUnderline: { line: 2, colStart: 16, colEnd: 38 }, // "flex-layout.row#hero" (com aspas)
  defLine: 4,
  tip: {
    x: charX(16), y: lineY(2),
    lines: [
      { text: 'flex-layout.row#hero', fill: C.pink, size: 13 },
      { text: 'Definido en store/home.jsonc:5', fill: C.text },
      { text: '1 referencia en el tema', fill: C.muted },
    ],
  },
  cursorIcon: { line: 2, col: 26 },
}

// Cena 3 — cobertura do blog: props de blog-latest-posts-preview
const S3 = {
  title: 'store/home.jsonc — VTEX IO',
  legend: 'Blog: blog-latest-posts-preview + 14 bloques nuevos',
  lines: [
    [['{', P]],
    [['  "blog-latest-posts-preview#home"', K], [': {', P]],
    [['    "props"', K], [': {', P]],
    [['      "show', K]],
    [['    }', P]],
    [['  }', P]],
    [['}', P]],
  ],
  drop: {
    x: charX(11), y: lineY(3), width: 220,
    items: [
      ['showCategories', 'boolean', 'Muestra la categoría del post.'],
      ['showDates', 'boolean', 'Muestra la fecha de publicación.'],
      ['showAuthors', 'boolean', 'Muestra el autor del post.'],
      ['showExcerpts', 'boolean', 'Muestra el resumen del post.'],
    ],
  },
  cursor: { line: 3, col: 11 },
}

// -------------------------------------------------------------- roteiro
const frames = []
const push = (state, delay) => frames.push({ state, delay })
const base = (sc) => ({ title: sc.title, legend: sc.legend, lines: sc.lines })

// Cena 1
push({ ...base(S1), cursor: S1.cursor }, 650)
for (let i = 0; i < S1.drop.items.length; i++) push({ ...base(S1), dropdown: { ...S1.drop, hi: i } }, 800)
push({ ...base(S1), dropdown: { ...S1.drop, hi: 0 } }, 500)

// Cena 2
push({ ...base(S2) }, 450)
push({ ...base(S2), underline: S2.refUnderline, cursorIcon: S2.cursorIcon }, 750)
push({ ...base(S2), underline: S2.refUnderline, cursorIcon: S2.cursorIcon, highlightLine: S2.defLine, tooltip: S2.tip }, 1700)

// Cena 3
push({ ...base(S3), cursor: S3.cursor }, 600)
for (let i = 0; i < S3.drop.items.length; i++) push({ ...base(S3), dropdown: { ...S3.drop, hi: i } }, 750)
push({ ...base(S3), dropdown: { ...S3.drop, hi: 0 } }, 1500)

;(async () => {
  const enc = GIFEncoder()
  for (const f of frames) {
    const svg = frameSVG(f.state)
    const { data } = await sharp(Buffer.from(svg)).resize(W, H).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const rgba = new Uint8Array(data)
    const palette = quantize(rgba, 256, { format: 'rgba4444' })
    const index = applyPalette(rgba, palette, 'rgba4444')
    enc.writeFrame(index, W, H, { palette, delay: f.delay })
  }
  enc.finish()
  const out = path.resolve(__dirname, '..', 'images', 'demo.gif')
  fs.writeFileSync(out, enc.bytes())
  console.log(`demo.gif gerado: ${(enc.bytes().length / 1024).toFixed(0)} KB, ${frames.length} frames, ${W}x${H}`)

  // QA opcional: DEMO_PNG=<n> escreve o frame n como PNG para inspeção visual.
  if (process.env.DEMO_PNG != null) {
    const n = Math.max(0, Math.min(frames.length - 1, Number(process.env.DEMO_PNG) || 0))
    const png = path.resolve(__dirname, '..', 'images', `demo-frame-${n}.png`)
    await sharp(Buffer.from(frameSVG(frames[n].state))).png().toFile(png)
    console.log(`QA: frame ${n} -> ${png}`)
  }
})().catch((e) => { console.error(e); process.exit(1) })
