#!/usr/bin/env node
// @ts-check
'use strict'

/**
 * Gera images/preview.png — a imagem que o README e a página do Marketplace usam
 * para mostrar a extensão em uso.
 *
 * Monta uma janela do VS Code a partir dos artefatos REAIS:
 *
 *   - os SVGs de `icons/`, resolvidos pelo próprio `themes/puelche-icon-theme.json`
 *     com a mesma precedência do VS Code (fileNames > fileExtensions > languageIds);
 *   - os glifos de `icons/product/`, resolvidos pelo `themes/puelche-product-icons.json`
 *     (inclusive por apelido: `symbol-reference` cai no desenho de `go-to-file`);
 *   - todas as cores lidas de `themes/puelche-color-theme.json`.
 *
 * Nada de hex digitado à mão aqui — se a paleta mudar, a imagem acompanha no
 * próximo build.
 *
 * O código de exemplo é tokenizado à mão (linha a linha, papel a papel) porque
 * não há gramática TextMate disponível fora do editor; os papéis usados são os
 * mesmos que o tema declara para JSON.
 *
 * O que a imagem precisa mostrar, em ordem de importância:
 *   1. o suggest widget aberto dentro de um `"children": [` — é a razão de
 *      existir da extensão;
 *   2. a linha atual (`editor.lineHighlightBackground`);
 *   3. a árvore com pastas abertas e fechadas, para a marca inscrita aparecer;
 *   4. glifos de produto de verdade nas abas, na árvore e no painel;
 *   5. um squiggle de erro (validação de JSON contra o schema dos blocos).
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..')
const THEMES = path.join(ROOT, 'themes')
const OUT = path.join(ROOT, 'images', 'preview.png')

const lerJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const THEME = lerJson(path.join(THEMES, 'puelche-color-theme.json'))
const ICON_THEME = lerJson(path.join(THEMES, 'puelche-icon-theme.json'))
const PROD_THEME = lerJson(path.join(THEMES, 'puelche-product-icons.json'))

/** Cor do tema pela chave oficial. Erra alto se a chave sumir da paleta. */
function c(chave) {
  const v = THEME.colors[chave]
  if (!v) throw new Error(`cor ausente no tema: ${chave}`)
  return v
}

/** Papel de sintaxe, lido das próprias regras do tema. */
function role(nome) {
  const r = THEME.tokenColors.find((x) => x.name === nome)
  if (!r) throw new Error(`papel de sintaxe ausente no tema: ${nome}`)
  return r.settings.foreground
}

const KEY = role('Tipos, classes e propriedades')
const STR = role('Strings e valores textuais')
const NUM = role('Números, constantes, unidades e escapes')
const CMT = role('Comentários')
const PUNCT = role('Pontuação, operadores e andaime')

// --- geometria da janela ----------------------------------------------------

const W = 1280
const H = 720
const ACT = 52 // largura da barra de atividade
const SIDE = 300 // onde termina a sidebar
const TAB = 38 // altura da faixa de abas
const STATUS = 24
const PANEL = 96 // altura do painel inferior
const PANEL_Y = H - STATUS - PANEL
const EDX = SIDE + 1 // primeira coluna do editor

const GUT = 46 // largura da calha de números
const CODE_X = EDX + GUT + 14 // onde o código começa
const CODE_Y = TAB + 22 // baseline da linha 1
const LH = 22 // altura de linha
const FS = 13 // corpo do código
const CH = 7.83 // avanço da Menlo a 13px

const UI = '-apple-system, Helvetica, Arial, sans-serif'
const MONO = 'Menlo, DejaVu Sans Mono, monospace'

const lineY = (n) => CODE_Y + (n - 1) * LH
const colX = (col) => CODE_X + col * CH

// --- artefatos --------------------------------------------------------------

/**
 * Resolve o SVG de um glifo de produto pelo id de codicon, passando pelo
 * product icon theme — assim um apelido (`symbol-reference`) cai no desenho que
 * de fato compartilha o codepoint.
 */
function prodIcon(id) {
  const dir = path.join(ROOT, 'icons', 'product')
  const direto = path.join(dir, `${id}.svg`)
  if (fs.existsSync(direto)) return direto
  const def = PROD_THEME.iconDefinitions[id]
  if (def) {
    for (const [alias, v] of Object.entries(PROD_THEME.iconDefinitions)) {
      if (v.fontCharacter !== def.fontCharacter) continue
      const p = path.join(dir, `${alias}.svg`)
      if (fs.existsSync(p)) return p
    }
  }
  throw new Error(`glifo de produto ausente: ${id} — rode 'npm run product:build'`)
}

/**
 * Resolve o ícone de um arquivo/pasta pelo icon theme, na mesma precedência do
 * VS Code: fileNames > fileExtensions > languageIds > default.
 */
function fileIcon(nome, tipo) {
  const t = ICON_THEME
  let def
  if (tipo === 'folder') def = t.folderNames[nome] || t.folder
  else if (tipo === 'folder-open') def = t.folderNamesExpanded[nome] || t.folderExpanded
  else {
    const baixo = nome.toLowerCase()
    def = t.fileNames[baixo]
    if (!def) {
      const partes = baixo.split('.')
      for (let i = 1; i < partes.length && !def; i++) def = t.fileExtensions[partes.slice(i).join('.')]
    }
    if (!def) def = t.file
  }
  const rel = t.iconDefinitions[def]
  if (!rel) throw new Error(`definição de ícone ausente: ${def} — rode 'npm run icons:build'`)
  const p = path.resolve(THEMES, rel.iconPath)
  if (!fs.existsSync(p)) throw new Error(`SVG ausente: ${p} — rode 'npm run icons:build'`)
  return p
}

/**
 * Inlina um SVG preservando os atributos de apresentação da raiz.
 * Com `cor`, recolore: ícone traçado (grade 24) troca o `stroke`, glifo de
 * produto (grade 16, contorno preenchido) recebe `fill`.
 */
function inline(file, x, y, size, cor) {
  const raw = fs.readFileSync(file, 'utf8')
  const m = raw.match(/<svg([^>]*)>/)
  if (!m) throw new Error(`SVG inválido: ${file}`)
  const tracado = /stroke="/.test(m[1])
  let attrs = m[1]
    .replace(/xmlns="[^"]*"/, '')
    .replace(/\s(width|height|viewBox)="[^"]*"/g, '')
  if (cor && tracado) attrs = attrs.replace(/stroke="[^"]*"/, `stroke="${cor}"`)
  const inner = raw.replace(/^[\s\S]*?>/, '').replace(/<\/svg>\s*$/, '')
  const grid = raw.includes('0 0 16 16') ? 16 : 24
  const fill = cor && !tracado ? ` fill="${cor}"` : ''
  return `<g transform="translate(${x} ${y}) scale(${size / grid})"${attrs}${fill}>${inner}</g>`
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const rect = (x, y, w, h, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`

/** Texto de UI (sans). */
function ui(x, y, str, cor, size = 12.5, extra = '') {
  return `<text x="${x}" y="${y}" font-family="${UI}" font-size="${size}" fill="${cor}"${extra}>${esc(str)}</text>`
}

/** Linha de código: lista de [texto, cor, italico?] em monoespaçada. */
function code(x, y, partes) {
  const spans = partes
    .map(([t, cor, it]) => `<tspan fill="${cor}"${it ? ' font-style="italic"' : ''}>${esc(t)}</tspan>`)
    .join('')
  return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${FS}" xml:space="preserve">${spans}</text>`
}

/** Rabisco de erro: onda quadrática sob um trecho. */
function squiggle(x, y, largura, cor) {
  const passo = 4
  const amp = 1.7
  let d = `M${x.toFixed(1)} ${y.toFixed(1)}`
  for (let i = 0; i * passo < largura; i++) {
    d += ` q ${passo / 2} ${i % 2 === 0 ? -amp : amp} ${passo} 0`
  }
  return `<path d="${d}" fill="none" stroke="${cor}" stroke-width="1.1" stroke-linecap="round"/>`
}

// --- conteúdo ---------------------------------------------------------------

/**
 * store/blocks/home.jsonc de um tema VTEX IO. Blocos que existem de verdade.
 * O cursor mora na linha 9, dentro de `"children": [` — o contexto em que a
 * extensão sugere id de bloco.
 */
const LINHAS = [
  [['{', PUNCT]],
  [['  ', PUNCT], ['"store.home"', KEY], [': {', PUNCT]],
  [['    ', PUNCT], ['"blocks"', KEY], [': [', PUNCT], ['"slider-layout#home"', STR], [', ', PUNCT], ['"flex-layout.row#shelf"', STR], [']', PUNCT]],
  [['  },', PUNCT]],
  [],
  [['  // Vitrine da home — o id do filho vem do autocomplete', CMT, true]],
  [['  ', PUNCT], ['"flex-layout.row#shelf"', KEY], [': {', PUNCT]],
  [['    ', PUNCT], ['"children"', KEY], [': [', PUNCT]],
  [['      ', PUNCT], ['"prod', STR]],
  [['    ],', PUNCT]],
  [['    ', PUNCT], ['"props"', KEY], [': { ', PUNCT], ['"blockClass"', KEY], [': ', PUNCT], ['"shelf"', STR], [' }', PUNCT]],
  [['  },', PUNCT]],
  [],
  [['  ', PUNCT], ['"product-summary.shelf#home"', KEY], [': {', PUNCT]],
  [['    ', PUNCT], ['"props"', KEY], [': { ', PUNCT], ['"maxItems"', KEY], [': ', PUNCT], ['3', NUM], [' }', PUNCT]],
  [['  },', PUNCT]],
  [],
  [['  ', PUNCT], ['"rich-text#promo"', KEY], [': {', PUNCT]],
  [['    ', PUNCT], ['"props"', KEY], [': {', PUNCT]],
  [['      ', PUNCT], ['"text"', KEY], [': ', PUNCT], ['"Frete grátis acima de R$ 199"', STR], [',', PUNCT]],
  [['      ', PUNCT], ['"textAlingment"', KEY], [': ', PUNCT], ['"CENTER"', STR]],
  [['    }', PUNCT]],
  [['  }', PUNCT]],
  [['}', PUNCT]],
]

const linhaTexto = (n) => LINHAS[n - 1].map(([t]) => t).join('')

const CURSOR_LINHA = 9
const CURSOR_COL = linhaTexto(CURSOR_LINHA).length

// erro de schema: prop com typo. É o que a validação de blocos aponta de fato.
const ERRO_LINHA = 21
const ERRO_TRECHO = '"textAlingment"'
const ERRO_COL = linhaTexto(ERRO_LINHA).indexOf(ERRO_TRECHO)

/**
 * O suggest widget. `detail` de cada item é o arquivo onde o bloco está
 * definido — é exatamente o que `completionProvider` põe em items de
 * `CompletionItemKind.Reference`.
 */
const DIGITADO = 'prod'
const SUGESTOES = [
  ['product-summary.shelf#home', 'store/blocks/home.jsonc'],
  ['product-summary.shelf#pdp', 'store/blocks/product.jsonc'],
  ['product-price#shelf', 'store/blocks/product.jsonc'],
  ['product-rating-inline', 'store/blocks/product.jsonc'],
  ['product-images#pdp', 'store/blocks/product.jsonc'],
  ['product-list#minicart', 'store/blocks/minicart.jsonc'],
  ['product-identifier#pdp', 'store/blocks/product.jsonc'],
]

/** Árvore do explorer: pastas abertas e fechadas para a marca inscrita aparecer. */
const ARVORE = [
  { nome: 'store', tipo: 'folder-open', nivel: 0 },
  { nome: 'home.jsonc', tipo: 'file', nivel: 1, ativo: true },
  { nome: 'blocks.jsonc', tipo: 'file', nivel: 1 },
  { nome: 'interfaces.json', tipo: 'file', nivel: 1 },
  { nome: 'routes.json', tipo: 'file', nivel: 1 },
  { nome: 'react', tipo: 'folder-open', nivel: 0 },
  { nome: 'ProductBadge.tsx', tipo: 'file', nivel: 1 },
  { nome: 'index.ts', tipo: 'file', nivel: 1 },
  { nome: 'styles', tipo: 'folder', nivel: 0 },
  { nome: 'graphql', tipo: 'folder', nivel: 0 },
  { nome: 'messages', tipo: 'folder', nivel: 0 },
  { nome: 'node', tipo: 'folder', nivel: 0 },
  { nome: 'manifest.json', tipo: 'file', nivel: 0 },
  { nome: 'package.json', tipo: 'file', nivel: 0 },
  { nome: 'README.md', tipo: 'file', nivel: 0 },
]

const ABAS = [
  { nome: 'home.jsonc', ativa: true },
  { nome: 'blocks.jsonc', suja: true },
  { nome: 'manifest.json' },
]

const ATIVIDADE = ['files', 'search', 'source-control', 'debug-alt', 'extensions']

// --- desenho ----------------------------------------------------------------

function chrome() {
  let s = ''
  s += rect(0, 0, W, H, c('editor.background'))
  s += rect(0, 0, ACT, H, c('activityBar.background'))
  s += rect(ACT, 0, SIDE - ACT, H, c('sideBar.background'))
  s += rect(SIDE, 0, 1, H, c('sideBar.border'))
  s += rect(EDX, 0, W - EDX, TAB, c('editorGroupHeader.tabsBackground'))
  s += rect(EDX, TAB - 1, W - EDX, 1, c('editorGroupHeader.tabsBorder'))
  s += rect(0, H - STATUS, W, STATUS, c('statusBar.background'))
  s += rect(0, H - STATUS, W, 1, c('statusBar.border'))
  return s
}

function barraAtividade() {
  let s = ''
  ATIVIDADE.forEach((id, i) => {
    const y = 24 + i * 46
    const ativo = i === 0
    if (ativo) s += rect(0, y - 13, 2, 42, c('activityBar.activeBorder'))
    s += inline(prodIcon(id), (ACT - 21) / 2, y, 21, ativo ? c('activityBar.foreground') : c('activityBar.inactiveForeground'))
  })
  s += inline(prodIcon('account'), (ACT - 21) / 2, H - STATUS - 88, 21, c('activityBar.inactiveForeground'))
  s += inline(prodIcon('settings-gear'), (ACT - 21) / 2, H - STATUS - 50, 21, c('activityBar.inactiveForeground'))
  return s
}

function explorer() {
  let s = ''
  s += ui(ACT + 16, 25, 'EXPLORER', c('sideBarTitle.foreground'), 11, ' letter-spacing="0.7"')
  s += inline(prodIcon('ellipsis'), SIDE - 26, 11, 15, c('icon.foreground'))

  // cabeçalho da seção, com as ações que o VS Code mostra
  const hy = TAB
  s += rect(ACT, hy, SIDE - ACT, 26, c('sideBarSectionHeader.background'))
  s += inline(prodIcon('chevron-down'), ACT + 6, hy + 6, 14, c('icon.foreground'))
  s += ui(ACT + 24, hy + 18, 'CONSTRUPLAZA', c('sideBarSectionHeader.foreground'), 11, ' font-weight="600" letter-spacing="0.4"')
  ;['new-file', 'new-folder', 'refresh', 'collapse-all'].forEach((id, i) => {
    s += inline(prodIcon(id), SIDE - 22 - (3 - i) * 21, hy + 6, 14, c('icon.foreground'))
  })

  // árvore
  const y0 = hy + 30
  const RH = 25
  ARVORE.forEach((n, i) => {
    const y = y0 + i * RH
    const x = ACT + 8 + n.nivel * 16
    const pasta = n.tipo !== 'file'
    if (n.ativo) s += rect(ACT, y, SIDE - ACT, RH, c('list.activeSelectionBackground'))
    if (n.nivel > 0) s += rect(ACT + 14, y, 1, RH, c('tree.indentGuidesStroke'))
    if (pasta) {
      const seta = n.tipo === 'folder-open' ? 'chevron-down' : 'chevron-right'
      s += inline(prodIcon(seta), x, y + 6, 13, c('icon.foreground'))
    }
    s += inline(fileIcon(n.nome, n.tipo), x + 16, y + 4, 17, undefined)
    const cor = n.ativo ? c('list.activeSelectionForeground') : c('sideBar.foreground')
    s += ui(x + 39, y + 17, n.nome, cor, 12.5)
  })

  // seções recolhidas no rodapé da sidebar
  ;['OUTLINE', 'TIMELINE'].forEach((nome, i) => {
    const y = H - STATUS - 56 + i * 26
    s += inline(prodIcon('chevron-right'), ACT + 6, y + 6, 14, c('icon.foreground'))
    s += ui(ACT + 24, y + 18, nome, c('sideBarSectionHeader.foreground'), 11, ' font-weight="600" letter-spacing="0.4"')
  })
  return s
}

function abas() {
  let s = ''
  const LARG = 158
  ABAS.forEach((t, i) => {
    const x = EDX + i * LARG
    s += rect(x, 0, LARG, TAB, t.ativa ? c('tab.activeBackground') : c('tab.inactiveBackground'))
    s += rect(x + LARG - 1, 6, 1, TAB - 12, c('tab.border'))
    if (t.ativa) s += rect(x, 0, LARG, 2, c('tab.activeBorderTop'))
    s += inline(fileIcon(t.nome, 'file'), x + 12, 11, 16, undefined)
    s += ui(x + 34, 24, t.nome, t.ativa ? c('tab.activeForeground') : c('tab.inactiveForeground'), 12.5)
    // glifo de produto de verdade: disco de aba suja, X de fechar
    if (t.suja) s += inline(prodIcon('circle-filled'), x + LARG - 26, 12, 14, c('tab.inactiveForeground'))
    else if (t.ativa) s += inline(prodIcon('close'), x + LARG - 26, 12, 14, c('icon.foreground'))
  })
  s += inline(prodIcon('split-horizontal'), W - 62, 12, 15, c('icon.foreground'))
  s += inline(prodIcon('ellipsis'), W - 32, 12, 15, c('icon.foreground'))
  return s
}

function editor() {
  let s = ''
  // linha atual — a correção desta rodada; precisa dar para ver
  const ly = lineY(CURSOR_LINHA)
  s += rect(EDX, ly - 16, W - EDX, LH, c('editor.lineHighlightBackground'))

  // guias de indentação
  LINHAS.forEach((partes, i) => {
    if (!partes.length) return
    const bruto = linhaTexto(i + 1)
    const indent = bruto.length - bruto.trimStart().length
    for (let col = 0; col < indent; col += 2) {
      s += rect(colX(col), lineY(i + 1) - 16, 1, LH, c('editorIndentGuide.background1'))
    }
  })

  // números e código
  LINHAS.forEach((partes, i) => {
    const n = i + 1
    const y = lineY(n)
    const atual = n === CURSOR_LINHA
    s += `<text x="${EDX + GUT}" y="${y}" font-family="${MONO}" font-size="12" fill="${
      atual ? c('editorLineNumber.activeForeground') : c('editorLineNumber.foreground')
    }" text-anchor="end">${n}</text>`
    if (partes.length) s += code(CODE_X, y, partes)
  })

  // squiggle de erro sob a prop com typo
  s += squiggle(colX(ERRO_COL), lineY(ERRO_LINHA) + 4, ERRO_TRECHO.length * CH, c('editorError.foreground'))

  // cursor
  s += rect(colX(CURSOR_COL), lineY(CURSOR_LINHA) - 14, 2, 18, c('editorCursor.foreground'))
  return s
}

function suggest() {
  const x = colX(linhaTexto(CURSOR_LINHA).indexOf(`"${DIGITADO}`))
  const y = lineY(CURSOR_LINHA) + 8
  const LARG = 484
  const RH = 26
  const alt = SUGESTOES.length * RH + 8

  let s = ''
  // sombra: o tema declara uma cor translúcida; camadas sucessivas dão o esfumado
  for (let d = 6; d >= 1; d--) {
    s += rect(x - d + 3, y - d + 4, LARG + 2 * d, alt + 2 * d, c('widget.shadow'), ' rx="3"')
  }
  s += rect(x, y, LARG, alt, c('editorSuggestWidget.background'))
  s += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${LARG - 1}" height="${alt - 1}" fill="none" stroke="${c('editorSuggestWidget.border')}"/>`

  SUGESTOES.forEach(([nome, detalhe], i) => {
    const ry = y + 4 + i * RH
    const sel = i === 0
    if (sel) s += rect(x + 1, ry, LARG - 2, RH, c('editorSuggestWidget.selectedBackground'))

    // ícone do símbolo: o item é CompletionItemKind.Reference
    s += inline(prodIcon('symbol-reference'), x + 10, ry + 5, 16, c('symbolIcon.referenceForeground'))

    // nome, com o trecho já digitado em realce
    const resto = nome.slice(DIGITADO.length)
    const base = sel ? c('editorSuggestWidget.selectedForeground') : c('editorSuggestWidget.foreground')
    s +=
      `<text x="${x + 34}" y="${ry + 18}" font-family="${MONO}" font-size="13" xml:space="preserve">` +
      `<tspan fill="${c('editorSuggestWidget.highlightForeground')}">${esc(DIGITADO)}</tspan>` +
      `<tspan fill="${base}">${esc(resto)}</tspan></text>`

    s += ui(x + LARG - 14, ry + 18, detalhe, c('descriptionForeground'), 11, ' text-anchor="end"')
  })
  return s
}

function painel() {
  let s = ''
  s += rect(EDX, PANEL_Y, W - EDX, PANEL, c('panel.background'))
  s += rect(EDX, PANEL_Y, W - EDX, 1, c('panel.border'))

  const TABS = ['PROBLEMAS', 'SAÍDA', 'TERMINAL']
  const CAIXA_ALTA = 7.4 // avanço medido do rótulo de 11px com letter-spacing 0.5
  let tx = EDX + 18
  TABS.forEach((nome, i) => {
    const ativo = i === 0
    const rotulo = nome.length * CAIXA_ALTA
    const larg = rotulo + (ativo ? 26 : 0)
    s += ui(tx, PANEL_Y + 21, nome, ativo ? c('panelTitle.activeForeground') : c('panelTitle.inactiveForeground'), 11, ' letter-spacing="0.5"')
    if (ativo) {
      s += rect(tx + rotulo + 6, PANEL_Y + 10, 17, 14, c('badge.background'), ' rx="7"')
      s += ui(tx + rotulo + 14.5, PANEL_Y + 21, '1', c('badge.foreground'), 10, ' text-anchor="middle"')
      s += rect(tx - 2, PANEL_Y + 29, larg + 4, 1, c('panelTitle.activeBorder'))
    }
    tx += larg + 26
  })
  ;['ellipsis', 'close'].forEach((id, i) => {
    s += inline(prodIcon(id), W - 56 + i * 26, PANEL_Y + 8, 15, c('icon.foreground'))
  })

  // arquivo + problema
  const fy = PANEL_Y + 46
  s += inline(prodIcon('chevron-down'), EDX + 14, fy - 12, 14, c('icon.foreground'))
  s += inline(fileIcon('home.jsonc', 'file'), EDX + 32, fy - 13, 16, undefined)
  s += ui(EDX + 54, fy, 'home.jsonc', c('foreground'), 12)
  s += ui(EDX + 130, fy, 'store/blocks', c('descriptionForeground'), 11)

  const py = PANEL_Y + 72
  s += inline(prodIcon('error'), EDX + 46, py - 12, 15, c('problemsErrorIcon.foreground'))
  s += ui(EDX + 68, py, 'A propriedade "textAlingment" não é permitida em rich-text.', c('foreground'), 12)
  s += ui(EDX + 430, py, 'json  [Ln 21, Col 7]', c('descriptionForeground'), 11)
  return s
}

function status() {
  const y = H - STATUS + 16
  let s = ''
  s += rect(0, H - STATUS, 30, STATUS, c('statusBarItem.remoteBackground'))
  s += inline(prodIcon('remote'), 8, H - STATUS + 6, 13, c('statusBarItem.remoteForeground'))
  s += inline(prodIcon('git-branch'), 42, H - STATUS + 6, 13, c('statusBar.foreground'))
  s += ui(60, y, 'main', c('statusBar.foreground'), 11)
  s += inline(prodIcon('sync'), 96, H - STATUS + 6, 13, c('statusBar.foreground'))
  s += inline(prodIcon('error'), 128, H - STATUS + 6, 13, c('statusBarItem.errorForeground'))
  s += ui(144, y, '1', c('statusBarItem.errorForeground'), 11)
  s += inline(prodIcon('warning'), 158, H - STATUS + 6, 13, c('statusBarItem.warningForeground'))
  s += ui(174, y, '0', c('statusBarItem.warningForeground'), 11)
  s += ui(W - 356, y, `Ln ${CURSOR_LINHA}, Col ${CURSOR_COL + 1}`, c('statusBar.foreground'), 11)
  s += ui(W - 258, y, 'JSON with Comments', c('statusBar.foreground'), 11)
  s += ui(W - 116, y, 'Puelche', c('statusBar.foreground'), 11)
  s += inline(prodIcon('bell'), W - 26, H - STATUS + 6, 13, c('statusBar.foreground'))
  return s
}

function svg() {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    chrome() +
    barraAtividade() +
    explorer() +
    abas() +
    editor() +
    suggest() +
    painel() +
    status() +
    '</svg>'
  )
}

function main() {
  return sharp(Buffer.from(svg()))
    .png({ compressionLevel: 9 })
    .toFile(OUT)
    .then((m) => console.log(`OK: images/preview.png ${m.width}x${m.height}, ${(m.size / 1024).toFixed(0)} kB`))
}

module.exports = { main, OUT, svg }

if (require.main === module) main()
