// @ts-check
'use strict'

/**
 * Gera images/preview.png (1280x720): a imagem do README com a extensão em uso.
 * Monta uma janela do VS Code em SVG e rasteriza com o `sharp` (devDependency).
 *
 * O que a imagem mostra, em ordem de importância:
 *   1. o suggest aberto dentro de um `"children": [` com ids de bloco do tema —
 *      é a razão de existir da extensão;
 *   2. a linha atual;
 *   3. um squiggle de erro na prop com typo, que a validação contra o schema dos
 *      blocos aponta, e a mesma mensagem no painel de Problemas.
 *
 * Os blocos do suggest existem em data/blocks.json (o script falha se algum sumir).
 * As cores são as do Dark Modern, o tema padrão do VS Code: a extensão não traz
 * tema. O código é tokenizado à mão, porque não há gramática fora do editor.
 *
 *   node scripts/gerar-preview.js
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const SAIDA = path.join(RAIZ, 'images', 'preview.png')
const BLOCOS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'blocks.json'), 'utf8'))

// --- paleta (Dark Modern) -----------------------------------------------------

const COR = {
  fundo: '#1F1F1F',
  lateral: '#181818',
  borda: '#2B2B2B',
  abaRealce: '#0078D4',
  texto: '#CCCCCC',
  textoFraco: '#9D9D9D',
  numero: '#6E7681',
  linhaAtual: '#282828',
  selecaoArvore: '#37373D',
  sugestaoFundo: '#202020',
  sugestaoBorda: '#454545',
  sugestaoSel: '#04395E',
  sugestaoRealce: '#2AAAFF',
  erro: '#F85149',
  badge: '#616161',
  pasta: '#C09553',
  // arquivos: azul-claro da marca (nada de cor de plataforma)
  arquivo: '#7FBBD8',
  chave: '#9CDCFE',
  str: '#CE9178',
  num: '#B5CEA8',
  cmt: '#6A9955',
  pont: '#CCCCCC',
}

// --- geometria ----------------------------------------------------------------

const W = 1280
const H = 720
const ACT = 48
const SIDE = 290
const TAB = 36
const STATUS = 22
const PANEL = 92
const PANEL_Y = H - STATUS - PANEL
const EDX = SIDE + 1
const GUT = 46
const CODE_X = EDX + GUT + 14
const CODE_Y = TAB + 24
const LH = 22
const FS = 13
const CH = 7.83
const UI = '-apple-system, Helvetica, Arial, sans-serif'
const MONO = 'Menlo, DejaVu Sans Mono, monospace'

const linhaY = (n) => CODE_Y + (n - 1) * LH
const colX = (col) => CODE_X + col * CH
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`
const ui = (x, y, s, cor, size = 12.5, extra = '') =>
  `<text x="${x}" y="${y}" font-family="${UI}" font-size="${size}" fill="${cor}"${extra}>${esc(s)}</text>`

function codigo(x, y, partes) {
  const spans = partes.map(([t, cor]) => `<tspan fill="${cor}">${esc(t)}</tspan>`).join('')
  return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${FS}" xml:space="preserve">${spans}</text>`
}

function rabisco(x, y, largura, cor) {
  let d = `M${x.toFixed(1)} ${y.toFixed(1)}`
  for (let i = 0; i * 4 < largura; i++) d += ` q 2 ${i % 2 === 0 ? -1.7 : 1.7} 4 0`
  return `<path d="${d}" fill="none" stroke="${cor}" stroke-width="1.1" stroke-linecap="round"/>`
}

// --- conteúdo: store/blocks/home.jsonc de um tema VTEX IO -----------------------

const C = COR
const LINHAS = [
  [['{', C.pont]],
  [['  ', C.pont], ['"store.home"', C.chave], [': {', C.pont]],
  [['    ', C.pont], ['"blocks"', C.chave], [': [', C.pont], ['"slider-layout#home"', C.str], [', ', C.pont], ['"flex-layout.row#shelf"', C.str], [']', C.pont]],
  [['  },', C.pont]],
  [],
  [['  // Vitrina del home: el id del hijo viene del autocompletado', C.cmt]],
  [['  ', C.pont], ['"flex-layout.row#shelf"', C.chave], [': {', C.pont]],
  [['    ', C.pont], ['"children"', C.chave], [': [', C.pont]],
  [['      ', C.pont], ['"prod', C.str]],
  [['    ],', C.pont]],
  [['    ', C.pont], ['"props"', C.chave], [': { ', C.pont], ['"blockClass"', C.chave], [': ', C.pont], ['"shelf"', C.str], [' }', C.pont]],
  [['  },', C.pont]],
  [],
  [['  ', C.pont], ['"product-summary.shelf#home"', C.chave], [': {', C.pont]],
  [['    ', C.pont], ['"props"', C.chave], [': { ', C.pont], ['"maxItems"', C.chave], [': ', C.pont], ['3', C.num], [' }', C.pont]],
  [['  },', C.pont]],
  [],
  [['  ', C.pont], ['"rich-text#promo"', C.chave], [': {', C.pont]],
  [['    ', C.pont], ['"props"', C.chave], [': {', C.pont]],
  [['      ', C.pont], ['"text"', C.chave], [': ', C.pont], ['"Envío gratis sobre $49.990"', C.str], [',', C.pont]],
  [['      ', C.pont], ['"textAlingment"', C.chave], [': ', C.pont], ['"CENTER"', C.str]],
  [['    }', C.pont]],
  [['  }', C.pont]],
  [['}', C.pont]],
]
const textoDaLinha = (n) => (LINHAS[n - 1] || []).map(([t]) => t).join('')

const CURSOR = 9
const DIGITADO = 'prod'
const ERRO_LINHA = 21
const ERRO_TRECHO = '"textAlingment"'
// A mensagem que o VS Code dá quando o JSON Schema proíbe a propriedade.
const ERRO_MENSAGEM = 'Property textAlingment is not allowed.'

// O suggest: ids de bloco que o tema já define, com o arquivo de cada um — é o
// que o completion provider põe em itens de CompletionItemKind.Reference.
const SUGESTOES = [
  ['product-summary.shelf#home', 'store/blocks/home.jsonc'],
  ['product-summary.shelf#pdp', 'store/blocks/product.jsonc'],
  ['product-price#shelf', 'store/blocks/product.jsonc'],
  ['product-rating-inline', 'store/blocks/product.jsonc'],
  ['product-images#pdp', 'store/blocks/product.jsonc'],
  ['product-list#minicart', 'store/blocks/minicart.jsonc'],
]
const nomes = new Set(BLOCOS.map((b) => b.blockName))
for (const [id] of SUGESTOES) {
  const tipo = id.split('#')[0]
  if (!nomes.has(tipo)) throw new Error(`bloco ${tipo} não está em data/blocks.json`)
}
if (!textoDaLinha(ERRO_LINHA).includes(ERRO_TRECHO)) throw new Error('o trecho do erro não está na linha')

// --- desenho ------------------------------------------------------------------

function janela() {
  let s = rect(0, 0, W, H, COR.fundo)
  s += rect(0, 0, ACT, H - STATUS, COR.lateral)
  s += rect(ACT, 0, 1, H - STATUS, COR.borda)
  ;[24, 72, 120, 168].forEach((y, i) => {
    const cor = i === 0 ? COR.texto : COR.textoFraco
    s += `<rect x="${ACT / 2 - 10}" y="${y - 10}" width="20" height="20" rx="3" fill="none" stroke="${cor}" stroke-width="1.6"/>`
  })
  s += rect(0, 14, 2, 20, COR.texto)
  return s
}

function lateral() {
  let s = rect(ACT + 1, 0, SIDE - ACT - 1, H - STATUS, COR.lateral)
  s += rect(SIDE, 0, 1, H - STATUS, COR.borda)
  s += ui(ACT + 20, 24, 'EXPLORADOR', COR.textoFraco, 11, ' letter-spacing="0.5"')
  s += ui(ACT + 14, 52, '⌄  STORE-THEME', COR.texto, 11, ' font-weight="600" letter-spacing="0.4"')
  const arvore = [
    [0, 'store', true, true],
    [1, 'blocks', true, true],
    [2, 'home.jsonc', false, true],
    [2, 'product.jsonc', false],
    [2, 'minicart.jsonc', false],
    [1, 'interfaces.json', false],
    [1, 'routes.json', false],
    [0, 'react', true],
    [0, 'styles', true],
    [0, 'messages', true],
    [0, 'manifest.json', false],
    [0, 'package.json', false],
  ]
  arvore.forEach(([nivel, nome, pasta, marca], i) => {
    const y = 76 + i * 22
    if (!pasta && marca) s += rect(ACT + 1, y - 15, SIDE - ACT - 1, 22, COR.selecaoArvore)
    const x = ACT + 22 + nivel * 16
    if (pasta) s += ui(x, y, marca ? '⌄' : '›', COR.textoFraco, 12)
    s += rect(x + 14, y - 10, 10, 10, pasta ? COR.pasta : COR.arquivo, ' rx="2"')
    s += ui(x + 30, y, nome, COR.texto, 12.5)
  })
  return s
}

function abas() {
  let s = rect(EDX, 0, W - EDX, TAB, COR.lateral)
  s += rect(EDX, TAB - 1, W - EDX, 1, COR.borda)
  let x = EDX
  for (const [nome, ativa] of [['home.jsonc', true], ['product.jsonc', false], ['manifest.json', false]]) {
    const larg = 40 + nome.length * 7.2
    if (ativa) s += rect(x, 0, larg, TAB, COR.fundo) + rect(x, 0, larg, 2, COR.abaRealce)
    s += rect(x + 12, 13, 10, 10, COR.arquivo, ' rx="2"')
    s += ui(x + 28, 23, nome, ativa ? COR.texto : COR.textoFraco, 12.5)
    s += rect(x + larg, 0, 1, TAB, COR.borda)
    x += larg + 1
  }
  return s
}

function editor() {
  let s = rect(EDX, TAB, W - EDX, PANEL_Y - TAB, COR.fundo)
  s += rect(EDX, linhaY(CURSOR) - 16, W - EDX, LH, COR.linhaAtual)
  LINHAS.forEach((partes, i) => {
    const n = i + 1
    const y = linhaY(n)
    if (y > PANEL_Y - 6) return
    s += `<text x="${EDX + GUT}" y="${y}" font-family="${MONO}" font-size="12" fill="${n === CURSOR ? COR.texto : COR.numero}" text-anchor="end">${n}</text>`
    if (partes.length) s += codigo(CODE_X, y, partes)
  })
  s += rect(colX(textoDaLinha(CURSOR).length) + 1, linhaY(CURSOR) - 14, 2, 18, '#AEAFAD')
  const col = textoDaLinha(ERRO_LINHA).indexOf(ERRO_TRECHO)
  s += rabisco(colX(col), linhaY(ERRO_LINHA) + 4, ERRO_TRECHO.length * CH, COR.erro)
  return s
}

function sugestoes() {
  const x = colX(textoDaLinha(CURSOR).indexOf(`"${DIGITADO}`))
  const y = linhaY(CURSOR) + 8
  const LARG = 500
  const RH = 24
  const alt = SUGESTOES.length * RH + 8
  let s = ''
  for (let d = 6; d >= 1; d--) s += rect(x - d + 3, y - d + 4, LARG + 2 * d, alt + 2 * d, 'rgba(0,0,0,0.12)', ' rx="4"')
  s += rect(x, y, LARG, alt, COR.sugestaoFundo, ' rx="3"')
  s += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${LARG - 1}" height="${alt - 1}" rx="3" fill="none" stroke="${COR.sugestaoBorda}"/>`
  SUGESTOES.forEach(([id, arquivo], i) => {
    const ry = y + 4 + i * RH
    if (i === 0) s += rect(x + 1, ry, LARG - 2, RH, COR.sugestaoSel)
    // ícone de referência: seta saindo de uma folha
    s += `<rect x="${x + 10}" y="${ry + 6}" width="11" height="13" rx="1.5" fill="none" stroke="${COR.texto}" stroke-width="1.2"/>`
    s += `<path d="M${x + 15} ${ry + 15} l5 -5 m-3 0 h3 v3" fill="none" stroke="${COR.texto}" stroke-width="1.2" stroke-linecap="round"/>`
    s +=
      `<text x="${x + 32}" y="${ry + 17}" font-family="${MONO}" font-size="13" xml:space="preserve">` +
      `<tspan fill="${COR.sugestaoRealce}" font-weight="600">${esc(DIGITADO)}</tspan>` +
      `<tspan fill="${COR.texto}">${esc(id.slice(DIGITADO.length))}</tspan></text>`
    s += ui(x + LARG - 12, ry + 17, arquivo, COR.textoFraco, 11.5, ' text-anchor="end"')
  })
  return s
}

function painel() {
  let s = rect(EDX, PANEL_Y, W - EDX, PANEL, COR.fundo)
  s += rect(EDX, PANEL_Y, W - EDX, 1, COR.borda)
  s += ui(EDX + 18, PANEL_Y + 22, 'PROBLEMAS', COR.texto, 11, ' letter-spacing="0.5"')
  s += rect(EDX + 98, PANEL_Y + 11, 17, 14, COR.badge, ' rx="7"')
  s += ui(EDX + 106.5, PANEL_Y + 22, '1', '#FFFFFF', 10, ' text-anchor="middle"')
  s += rect(EDX + 16, PANEL_Y + 30, 102, 1, COR.texto)
  s += ui(EDX + 142, PANEL_Y + 22, 'SALIDA', COR.textoFraco, 11, ' letter-spacing="0.5"')
  s += ui(EDX + 208, PANEL_Y + 22, 'TERMINAL', COR.textoFraco, 11, ' letter-spacing="0.5"')
  s += ui(EDX + 24, PANEL_Y + 52, '⌄', COR.textoFraco, 12)
  s += rect(EDX + 40, PANEL_Y + 42, 10, 10, COR.arquivo, ' rx="2"')
  s += ui(EDX + 56, PANEL_Y + 52, 'home.jsonc', COR.texto, 12.5)
  s += ui(EDX + 136, PANEL_Y + 52, 'store/blocks', COR.textoFraco, 12)
  s += `<circle cx="${EDX + 50}" cy="${PANEL_Y + 72}" r="6" fill="${COR.erro}"/>`
  s += ui(EDX + 47.3, PANEL_Y + 75.8, '×', '#FFFFFF', 10)
  s += ui(EDX + 64, PANEL_Y + 76, ERRO_MENSAGEM, COR.texto, 12.5)
  const col = textoDaLinha(ERRO_LINHA).indexOf(ERRO_TRECHO) + 1
  s += ui(W - 24, PANEL_Y + 76, `json  [Ln ${ERRO_LINHA}, Col ${col}]`, COR.textoFraco, 12, ' text-anchor="end"')
  return s
}

function barraDeStatus() {
  let s = rect(0, H - STATUS, W, STATUS, COR.lateral)
  s += rect(0, H - STATUS, W, 1, COR.borda)
  s += ui(14, H - 7, 'dev', COR.textoFraco, 11.5)
  s += `<circle cx="52" cy="${H - 11}" r="5" fill="none" stroke="${COR.erro}" stroke-width="1.2"/>`
  s += ui(62, H - 7, '1', COR.textoFraco, 11.5)
  s += ui(W - 14, H - 7, 'JSON with Comments    VTEX IO Snippets', COR.textoFraco, 11.5, ' text-anchor="end"')
  return s
}

const svg = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
  janela() + lateral() + abas() + editor() + painel() + barraDeStatus() + sugestoes() +
  '</svg>'

fs.mkdirSync(path.dirname(SAIDA), { recursive: true })
sharp(Buffer.from(svg()))
  .png({ compressionLevel: 9 })
  .toFile(SAIDA)
  .then((m) => console.log(`images/preview.png ${m.width}x${m.height}, ${(m.size / 1024).toFixed(0)} kB`))
  .catch((erro) => {
    console.error(erro.message)
    process.exit(1)
  })
