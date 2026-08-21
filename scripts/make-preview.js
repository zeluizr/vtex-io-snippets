#!/usr/bin/env node
// @ts-check
'use strict'

/**
 * Gera images/preview.png — a imagem que o README e a página do Marketplace usam
 * para mostrar o tema Puelche em uso.
 *
 * Monta uma janela do VS Code a partir dos artefatos REAIS: os SVGs de
 * `icons/` no explorer, os de `icons/product/` na barra de atividade, e as cores
 * lidas de `themes/puelche-color-theme.json`. Nada de hex digitado à mão aqui —
 * se a paleta mudar, a imagem acompanha no próximo build.
 *
 * O código de exemplo é tokenizado à mão (linha a linha, papel a papel) porque
 * não há gramática TextMate disponível fora do editor; os papéis usados são os
 * mesmos que o tema declara para JSON.
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..')
const THEME = JSON.parse(fs.readFileSync(path.join(ROOT, 'themes', 'puelche-color-theme.json'), 'utf8'))
const OUT = path.join(ROOT, 'images', 'preview.png')

const C = THEME.colors
const BG = C['editor.background']
const DEEP = C['sideBar.background']
const LIFT = C['editorWidget.background']
const SEL = C['list.activeSelectionBackground']
const ACCENT = C['editorCursor.foreground']
const FG = C['editor.foreground']
const FAINT = C['editorLineNumber.foreground']
const MUTED = C['sideBarTitle.foreground']
const PUNCT = C['tab.inactiveForeground']

// papéis de sintaxe, lidos das próprias regras do tema
const role = (nome) => THEME.tokenColors.find((r) => r.name === nome).settings.foreground
const KEY = role('Tipos, classes e propriedades')
const STR = role('Strings e valores textuais')
const NUM = role('Números, constantes, unidades e escapes')
const CMT = role('Comentários')

const W = 1280
const H = 720
const ACT = 52 // largura da barra de atividade
const SIDE = 300 // onde termina a sidebar
const TAB = 38 // altura da faixa de abas
const STATUS = 24

/** Inlina um SVG preservando os atributos de apresentação da raiz (o traço é herdado). */
function inline(file, x, y, size, corFixa) {
  const raw = fs.readFileSync(file, 'utf8')
  const m = raw.match(/<svg([^>]*)>/)
  const attrs = m[1]
    .replace(/xmlns="[^"]*"/, '')
    .replace(/\s(width|height|viewBox)="[^"]*"/g, '')
  const inner = raw.replace(/^[\s\S]*?>/, '').replace(/<\/svg>\s*$/, '')
  const grid = raw.includes('0 0 16 16') ? 16 : 24
  const fill = corFixa ? ` fill="${corFixa}"` : ''
  return `<g transform="translate(${x} ${y}) scale(${size / grid})"${attrs}${fill}>${inner}</g>`
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Linha de código: lista de [texto, cor, italico?] em monoespaçada. */
function code(x, y, partes) {
  const spans = partes
    .map(([t, c, it]) => `<tspan fill="${c}"${it ? ' font-style="italic"' : ''}>${esc(t)}</tspan>`)
    .join('')
  return `<text x="${x}" y="${y}" font-family="Menlo, monospace" font-size="13" xml:space="preserve">${spans}</text>`
}

const LINHAS = [
  [['{', PUNCT]],
  [['  ', PUNCT], ['"store.home"', KEY], [': {', PUNCT]],
  [['    ', PUNCT], ['"blocks"', KEY], [': [', PUNCT], ['"flex-layout.row#hero"', STR], [', ', PUNCT], ['"shelf#home"', STR], [']', PUNCT]],
  [['  },', PUNCT]],
  [],
  [['  // Banner principal — trocado pelo Site Editor', CMT, true]],
  [['  ', PUNCT], ['"flex-layout.row#hero"', KEY], [': {', PUNCT]],
  [['    ', PUNCT], ['"children"', KEY], [': [', PUNCT], ['"image#banner"', STR], ['],', PUNCT]],
  [['    ', PUNCT], ['"props"', KEY], [': {', PUNCT]],
  [['      ', PUNCT], ['"blockClass"', KEY], [': ', PUNCT], ['"hero"', STR], [',', PUNCT]],
  [['      ', PUNCT], ['"fullWidth"', KEY], [': ', PUNCT], ['true', NUM], [',', PUNCT]],
  [['      ', PUNCT], ['"preserveLayoutOnMobile"', KEY], [': ', PUNCT], ['false', NUM]],
  [['    }', PUNCT]],
  [['  },', PUNCT]],
  [],
  [['  ', PUNCT], ['"image#banner"', KEY], [': {', PUNCT]],
  [['    ', PUNCT], ['"props"', KEY], [': {', PUNCT]],
  [['      ', PUNCT], ['"src"', KEY], [': ', PUNCT], ['"assets/hero.png"', STR], [',', PUNCT]],
  [['      ', PUNCT], ['"maxWidth"', KEY], [': ', PUNCT], ['1440', NUM], [',', PUNCT]],
  [['      ', PUNCT], ['"link"', KEY], [': { ', PUNCT], ['"url"', KEY], [': ', PUNCT], ['"/promo"', STR], [' }', PUNCT]],
  [['    }', PUNCT]],
  [['  }', PUNCT]],
  [['}', PUNCT]],
]

const ARVORE = [
  { nome: 'store', icone: 'folder-store.svg', nivel: 0, seta: '▾' },
  { nome: 'home.jsonc', icone: 'jsonc.svg', nivel: 1, ativo: true },
  { nome: 'blocks.jsonc', icone: 'jsonc.svg', nivel: 1 },
  { nome: 'interfaces.json', icone: 'blocks.svg', nivel: 1 },
  { nome: 'react', icone: 'folder-react.svg', nivel: 0, seta: '▾' },
  { nome: 'Hero.tsx', icone: 'tsx.svg', nivel: 1 },
  { nome: 'styles', icone: 'folder-styles.svg', nivel: 0, seta: '▸' },
  { nome: 'graphql', icone: 'folder-graphql.svg', nivel: 0, seta: '▸' },
  { nome: 'messages', icone: 'folder-messages.svg', nivel: 0, seta: '▸' },
  { nome: 'manifest.json', icone: 'manifest.svg', nivel: 0 },
  { nome: 'package.json', icone: 'package.svg', nivel: 0 },
  { nome: '.env', icone: 'env.svg', nivel: 0 },
  { nome: 'README.md', icone: 'markdown.svg', nivel: 0 },
]

const ATIVIDADE = ['files', 'search', 'source-control', 'debug-alt', 'extensions']

function main() {
  const ico = (f) => path.join(ROOT, 'icons', f)
  const prod = (f) => path.join(ROOT, 'icons', 'product', `${f}.svg`)
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`

  s += `<rect width="${W}" height="${H}" fill="${BG}"/>`
  s += `<rect width="${SIDE}" height="${H}" fill="${DEEP}"/>`
  s += `<rect x="${SIDE}" width="${W - SIDE}" height="${TAB}" fill="${DEEP}"/>`
  s += `<rect y="${H - STATUS}" width="${W}" height="${STATUS}" fill="${DEEP}"/>`
  s += `<rect x="${SIDE}" y="0" width="1" height="${H}" fill="${C['sideBar.border']}"/>`

  // barra de atividade
  ATIVIDADE.forEach((id, i) => {
    const y = 22 + i * 46
    const ativo = i === 0
    if (ativo) s += `<rect x="0" y="${y - 12}" width="2" height="40" fill="${ACCENT}"/>`
    s += inline(prod(id), (ACT - 20) / 2, y, 20, ativo ? FG : PUNCT)
  })

  // explorer
  s += `<text x="${ACT + 16}" y="${TAB - 12}" font-family="-apple-system, Helvetica" font-size="11" letter-spacing="0.6" fill="${MUTED}">EXPLORER</text>`
  ARVORE.forEach((n, i) => {
    const y = TAB + 14 + i * 26
    const x = ACT + 12 + n.nivel * 14
    if (n.ativo) s += `<rect x="${ACT}" y="${y}" width="${SIDE - ACT}" height="26" fill="${SEL}"/>`
    if (n.seta) s += `<text x="${x}" y="${y + 18}" font-family="Menlo, monospace" font-size="9" fill="${PUNCT}">${n.seta}</text>`
    s += inline(ico(n.icone), x + 12, y + 5, 16)
    s += `<text x="${x + 34}" y="${y + 18}" font-family="-apple-system, Helvetica" font-size="12.5" fill="${n.ativo ? FG : C['sideBar.foreground']}">${esc(n.nome)}</text>`
  })

  // aba ativa
  const tabW = 150
  s += `<rect x="${SIDE + 1}" width="${tabW}" height="${TAB}" fill="${BG}"/>`
  s += `<rect x="${SIDE + 1}" width="${tabW}" height="2" fill="${ACCENT}"/>`
  s += inline(ico('jsonc.svg'), SIDE + 14, 11, 15)
  s += `<text x="${SIDE + 36}" y="${TAB - 13}" font-family="-apple-system, Helvetica" font-size="12.5" fill="${FG}">home.jsonc</text>`

  // código
  LINHAS.forEach((partes, i) => {
    const y = TAB + 34 + i * 24
    s += `<text x="${SIDE + 30}" y="${y}" font-family="Menlo, monospace" font-size="12" fill="${FAINT}" text-anchor="end">${i + 1}</text>`
    if (partes.length) s += code(SIDE + 52, y, partes)
  })
  // cursor ancorado no fim de uma linha real (largura de avanço da Menlo a 13px)
  const CUR_LINHA = 9
  const CUR_COL = 27
  s += `<rect x="${SIDE + 52 + 7.82 * CUR_COL}" y="${TAB + 34 + CUR_LINHA * 24 - 13}" width="2" height="17" fill="${ACCENT}"/>`

  // barra de status
  const st = H - STATUS + 16
  s += inline(prod('remote'), ACT / 2 - 6, H - STATUS + 6, 13, PUNCT)
  s += `<text x="${ACT + 4}" y="${st}" font-family="-apple-system, Helvetica" font-size="11" fill="${PUNCT}">construplaza-theme</text>`
  s += inline(prod('git-branch'), 168, H - STATUS + 6, 13, PUNCT)
  s += `<text x="186" y="${st}" font-family="-apple-system, Helvetica" font-size="11" fill="${PUNCT}">main</text>`
  s += inline(prod('error'), 236, H - STATUS + 6, 13, PUNCT)
  s += `<text x="252" y="${st}" font-family="-apple-system, Helvetica" font-size="11" fill="${PUNCT}">0</text>`
  s += inline(prod('warning'), 268, H - STATUS + 6, 13, PUNCT)
  s += `<text x="284" y="${st}" font-family="-apple-system, Helvetica" font-size="11" fill="${PUNCT}">0</text>`
  s += `<text x="${W - 20}" y="${st}" font-family="-apple-system, Helvetica" font-size="11" fill="${PUNCT}" text-anchor="end">Puelche</text>`

  s += '</svg>'

  return sharp(Buffer.from(s))
    .png({ compressionLevel: 9 })
    .toFile(OUT)
    .then((m) => console.log(`OK: images/preview.png ${m.width}x${m.height}, ${(m.size / 1024).toFixed(0)} kB`))
}

module.exports = { main, OUT }

if (require.main === module) main()
