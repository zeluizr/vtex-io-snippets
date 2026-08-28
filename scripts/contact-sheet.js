#!/usr/bin/env node
// @ts-check
'use strict'

/**
 * Folhas de contato para inspeção visual do conjunto de ícones.
 *
 * Não é build de artefato publicado: é ferramenta de diagnóstico. Renderiza
 * todos os SVGs em vários tamanhos sobre o fundo do tema para que dê para ver
 * o que só falha "no olho" — canto duro, traço fino demais, forma que some a
 * 16px, densidade desigual entre vizinhos.
 *
 * Uso:
 *   node scripts/contact-sheet.js [diretorio-de-saida]   (padrão: $TMPDIR/puelche-contact)
 *
 * Saída (3 PNGs):
 *   contact-icons.png    icons/*.svg          em 16 / 24 / 32 px
 *   contact-product.png  icons/product/*.svg  em 16 / 20 / 32 px
 *   contact-lucide.png   nossos ícones x o equivalente Lucide, lado a lado
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..')
// Saída fora do repositório por padrão: isto é diagnóstico, não artefato.
const OUT_DIR = process.argv[2] || path.join(require('os').tmpdir(), 'puelche-contact')

const BG = '#17162A' // editor.background do tema Puelche
const GRID_LINE = '#2A2732'
const LABEL = '#8A8496'
const TITLE = '#D6D2DF'
const PRODUCT_FG = '#D6D2DF' // os glifos da UI não trazem cor própria

/** Extrai o miolo do SVG e os atributos de apresentação da raiz. */
function readSvg(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const m = raw.match(/<svg([^>]*)>/)
  const attrs = m[1]
    .replace(/xmlns="[^"]*"/, '')
    .replace(/\s(width|height|viewBox)="[^"]*"/g, '')
  const inner = raw.replace(/^[\s\S]*?>/, '').replace(/<\/svg>\s*$/, '')
  const grid = /viewBox="0 0 16 16"/.test(raw) ? 16 : 24
  return { attrs, inner, grid }
}

/** Coloca um SVG lido numa posição/tamanho. `cor` sobrescreve o fill. */
function place(svg, x, y, size, cor) {
  const fill = cor ? ` fill="${cor}"` : ''
  const s = (size / svg.grid).toFixed(6)
  return `<g transform="translate(${x} ${y}) scale(${s})"${svg.attrs}${fill}>${svg.inner}</g>`
}

/** Desenha um path Lucide cru numa grade 24x24. */
function lucide(d, x, y, size, cor) {
  const s = (size / 24).toFixed(6)
  return (
    `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${cor}"` +
    ` stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</g>`
  )
}

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function text(x, y, t, cor, size, anchor) {
  return (
    `<text x="${x}" y="${y}" fill="${cor}" font-family="Menlo, DejaVu Sans Mono, monospace"` +
    ` font-size="${size}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(t)}</text>`
  )
}

async function render(svg, w, h, out) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svg}</svg>`
  await sharp(Buffer.from(doc), { density: 144 }).png().toFile(out)
  console.log(out)
}

// ---------------------------------------------------------------- folha 1 + 2

/**
 * Grade genérica: cada célula mostra o mesmo ícone em N tamanhos alinhados pela
 * base, com o nome embaixo.
 */
async function sheet(files, sizes, cols, titulo, out, cor) {
  const CELL_W = 210
  const CELL_H = 96
  const PAD = 28
  const TOP = 72
  const maior = Math.max(...sizes)
  const rows = Math.ceil(files.length / cols)
  const W = PAD * 2 + cols * CELL_W
  const H = TOP + rows * CELL_H + PAD

  const parts = [`<rect width="${W}" height="${H}" fill="${BG}"/>`]
  parts.push(text(PAD, 38, titulo, TITLE, 18))
  parts.push(text(PAD, 58, `${files.length} ícones — ${sizes.join(' / ')} px — fundo ${BG}`, LABEL, 12))

  files.forEach((file, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    const x0 = PAD + c * CELL_W
    const y0 = TOP + r * CELL_H
    parts.push(
      `<rect x="${x0}" y="${y0}" width="${CELL_W - 8}" height="${CELL_H - 8}" fill="none" stroke="${GRID_LINE}"/>`
    )
    const svg = readSvg(file)
    const base = y0 + 16 + maior // linha de base comum
    let x = x0 + 16
    for (const s of sizes) {
      parts.push(place(svg, x, base - s, s, cor))
      x += s + 16
    }
    const nome = path.basename(file, '.svg')
    parts.push(text(x0 + 16, y0 + CELL_H - 22, nome, LABEL, 11))
  })

  await render(parts.join(''), W, H, out)
}

// ---------------------------------------------------------------- folha 3

/**
 * Pares nosso x Lucide. Os `d` do Lucide estão embutidos (são os paths oficiais
 * do pacote lucide-static, grade 24x24, stroke 2, cantos arredondados).
 */
const PARES = [
  ['file', 'file', '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>'],
  ['folder', 'folder', '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'],
  ['folder-open', 'folder-open', '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>'],
  ['image', 'image', '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'],
  ['config', 'settings', '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'],
  ['lock', 'lock', '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'],
  ['package', 'package', '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'],
  ['sql', 'database', '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>'],
  ['shell', 'terminal', '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>'],
  ['blocks', 'layers', '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'],
  ['json', 'braces', '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>'],
  ['git', 'git-branch', '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>'],
]

async function lucideSheet(out) {
  const CELL_W = 300
  const CELL_H = 150
  const PAD = 28
  const TOP = 84
  const cols = 3
  const rows = Math.ceil(PARES.length / cols)
  const W = PAD * 2 + cols * CELL_W
  const H = TOP + rows * CELL_H + PAD

  const parts = [`<rect width="${W}" height="${H}" fill="${BG}"/>`]
  parts.push(text(PAD, 38, 'Puelche x Lucide', TITLE, 18))
  parts.push(
    text(
      PAD,
      58,
      'esquerda = nosso (placa cheia + marca) / direita = Lucide monoline — 48 e 16 px. ' +
        'Compara a MARCA, não a placa: a silhueta sólida é escolha nossa.',
      LABEL,
      12,
    ),
  )

  PARES.forEach(([meu, nomeLucide, d], i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    const x0 = PAD + c * CELL_W
    const y0 = TOP + r * CELL_H
    parts.push(
      `<rect x="${x0}" y="${y0}" width="${CELL_W - 10}" height="${CELL_H - 10}" fill="none" stroke="${GRID_LINE}"/>`
    )
    const svg = readSvg(path.join(ROOT, 'icons', `${meu}.svg`))
    // a cor do nosso vem do `fill` da raiz desde que o conjunto virou placa
    // sólida; o `stroke` da raiz é "none" e serviria só para pintar de nada.
    const cor = (svg.attrs.match(/fill="([^"]+)"/) || [])[1] || TITLE

    // nosso: 48 e 16
    parts.push(place(svg, x0 + 18, y0 + 16, 48))
    parts.push(place(svg, x0 + 76, y0 + 48, 16))
    // Lucide: 48 e 16, na cor do nosso para comparar só a forma
    parts.push(lucide(d, x0 + 150, y0 + 16, 48, cor))
    parts.push(lucide(d, x0 + 208, y0 + 48, 16, cor))

    parts.push(text(x0 + 18, y0 + CELL_H - 34, meu, LABEL, 11))
    parts.push(text(x0 + 150, y0 + CELL_H - 34, `lucide/${nomeLucide}`, LABEL, 11))
  })

  await render(parts.join(''), W, H, out)
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const iconDir = path.join(ROOT, 'icons')
  const arquivos = fs
    .readdirSync(iconDir)
    .filter((f) => f.endsWith('.svg'))
    .sort()
    .map((f) => path.join(iconDir, f))

  const prodDir = path.join(iconDir, 'product')
  const produtos = fs.existsSync(prodDir)
    ? fs.readdirSync(prodDir).filter((f) => f.endsWith('.svg')).sort().map((f) => path.join(prodDir, f))
    : []

  await sheet(arquivos, [16, 24, 32], 5, 'Puelche — ícones de arquivo e pasta', path.join(OUT_DIR, 'contact-icons.png'))
  if (produtos.length) {
    await sheet(produtos, [16, 20, 32], 5, 'Puelche — product icons (UI)', path.join(OUT_DIR, 'contact-product.png'), PRODUCT_FG)
  } else {
    console.error('icons/product/ vazio — rode `npm run product:build` antes')
  }
  await lucideSheet(path.join(OUT_DIR, 'contact-lucide.png'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
