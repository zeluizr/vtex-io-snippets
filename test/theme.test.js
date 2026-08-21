// @ts-check
'use strict'

/**
 * Conformidade do tema Puelche com a especificação.
 *
 * A spec do tema é longa e cheia de regras que só falham "visualmente" — cor
 * fora da paleta, accent vazando para texto, parágrafo de Markdown colorido.
 * Em vez de um gerador de paleta (que só se paga com muitos temas), cada
 * critério de aceitação vira asserção aqui.
 */

const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')

const THEME_PATH = path.join(__dirname, '..', 'themes', 'puelche-color-theme.json')
const RAW = fs.readFileSync(THEME_PATH, 'utf8')
const THEME = JSON.parse(RAW)

// Paleta declarada na spec. Nenhum outro hex pode aparecer no arquivo.
const PALETTE = {
  bg: '#1A181F',
  'bg-deep': '#131117',
  'bg-lift': '#221F29',
  'bg-line': '#201D27',
  selection: '#2E2A3C',
  border: '#221F29',
  'border-soft': '#2A2633',
  fg: '#D6D2DF',
  'fg-param': '#C0BBCC',
  'fg-punct': '#8A8496',
  'fg-faint': '#5A5468',
  comment: '#9A91A8',
  violet: '#A78BC7',
  sage: '#7FC3AE',
  steel: '#86AECB',
  sand: '#C4A47C',
  clay: '#C08A6B',
  rose: '#C4788F',
  'rose-dim': '#B07A8C',
  accent: '#C25E86',
  error: '#C4707E',
  warning: '#C4A472',
  added: '#7FAE8E',
}

// Utilitários de interface autorizados pela spec, fora da paleta de papéis.
const UI_EXTRAS = new Set([
  '#00000000', // bordas decorativas removidas
  '#3B3549', // focusBorder e guia de indentação ativa (cinza, nunca accent)
  '#26222F', // guias de indentação
  '#A89FB6', // tags de documentação e TODO
  '#E4E0EC', // markup.bold do Markdown
  '#B0AABE', // branco do terminal
  // variantes bright do terminal: a paleta clareada em ~10%
  '#38353E', '#CA7E8B', '#8CB699', '#CAAD89', '#92B6D0', '#CA869A', '#8CC9B6', '#B8B3C5',
])

// As ÚNICAS chaves onde accent pode aparecer — todas de chrome, nenhuma de texto de código.
const ACCENT_KEYS = [
  'activityBar.activeBorder',
  'activityBarBadge.background',
  'button.background',
  'editorCursor.foreground',
  'editorSuggestWidget.highlightForeground',
  'list.highlightForeground',
  'panelTitle.activeBorder',
  'peekView.border',
  'progressBar.background',
  'tab.activeBorderTop',
  'terminalCursor.foreground',
]

// Regras autorizadas a usar itálico. A spec proíbe itálico fora desta lista.
const ITALIC_RULES = new Set([
  'Import e export em itálico',
  'Nomes de atributo HTML e JSX em itálico',
  'Parâmetros de tipo em itálico',
  'Parâmetros e argumentos em itálico',
  'self e cls do Python em itálico',
  'Comentários',
  'Tags de documentação e TODO',
  'Markdown: itálico',
])

const ALLOWED_BASE = new Set([...Object.values(PALETTE), ...UI_EXTRAS])

/** Luminância relativa da W3C. @param {string} hex */
function luminance(hex) {
  const n = parseInt(hex.slice(1, 7), 16)
  const chan = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * chan((n >> 16) & 255) + 0.7152 * chan((n >> 8) & 255) + 0.0722 * chan(n & 255)
}

/** Razão de contraste entre duas cores. */
function contrast(a, b) {
  const x = luminance(a)
  const y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** Todos os escopos citados em tokenColors, achatados. */
function allScopes() {
  return THEME.tokenColors.flatMap((r) => (Array.isArray(r.scope) ? r.scope : [r.scope]))
}

test('o tema é um JSON escuro com realce semântico ligado', () => {
  assert.equal(THEME.name, 'Puelche')
  assert.equal(THEME.type, 'dark')
  assert.equal(THEME.semanticHighlighting, true)
})

test('nenhum hex fora da paleta declarada', () => {
  const found = RAW.match(/#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?/g) || []
  const foraDaPaleta = new Set()
  for (const hex of found) {
    const up = hex.toUpperCase()
    // hex de 8 dígitos é cor da paleta + opacidade: valida só a base.
    const base = up.length === 9 ? up.slice(0, 7) : up
    if (!ALLOWED_BASE.has(base) && !ALLOWED_BASE.has(up)) foraDaPaleta.add(up)
  }
  assert.deepEqual([...foraDaPaleta], [], 'cores inventadas encontradas no arquivo')
})

test('accent só aparece nas 11 chaves de chrome declaradas', () => {
  const usando = Object.entries(THEME.colors)
    .filter(([, v]) => v === PALETTE.accent)
    .map(([k]) => k)
    .sort()
  assert.deepEqual(usando, [...ACCENT_KEYS].sort())
})

test('accent nunca colore texto de código', () => {
  for (const rule of THEME.tokenColors) {
    assert.notEqual(rule.settings.foreground, PALETTE.accent, `regra "${rule.name}" usa accent`)
  }
  for (const [, s] of Object.entries(THEME.semanticTokenColors)) {
    if (s && typeof s === 'object') assert.notEqual(s.foreground, PALETTE.accent)
  }
})

test('focusBorder é cinza, não accent (não pisca rosa a cada Tab)', () => {
  assert.equal(THEME.colors.focusBorder, '#3B3549')
})

test('os 9 papéis de sintaxe passam 4.5:1 sobre o fundo do editor', () => {
  const papeis = ['violet', 'sage', 'steel', 'sand', 'clay', 'rose', 'fg', 'fg-punct', 'comment']
  for (const papel of papeis) {
    const r = contrast(PALETTE[papel], PALETTE.bg)
    assert.ok(r >= 4.5, `${papel} tem ${r.toFixed(2)}:1, abaixo de 4.5:1`)
  }
})

test('comentários ficam acima do mínimo de acessibilidade (não são apagados)', () => {
  const r = contrast(PALETTE.comment, PALETTE.bg)
  assert.ok(r >= 5.7, `comentário tem ${r.toFixed(2)}:1`)
})

test('o corpo de texto do Markdown não recebe cor', () => {
  const corpo = ['text.html.markdown', 'meta.paragraph.markdown']
  for (const rule of THEME.tokenColors) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope]
    if (!scopes.some((s) => corpo.includes(s))) continue
    assert.equal(rule.settings.foreground, PALETTE.fg, `regra "${rule.name}" colore o parágrafo`)
    assert.ok(!rule.settings.fontStyle, `regra "${rule.name}" estiliza o parágrafo`)
  }
})

test('itálico só nas regras declaradas', () => {
  const comItalico = THEME.tokenColors
    .filter((r) => (r.settings.fontStyle || '').includes('italic'))
    .map((r) => r.name)
  for (const nome of comItalico) {
    assert.ok(ITALIC_RULES.has(nome), `regra "${nome}" usa itálico fora da lista da spec`)
  }
})

test('negrito só em títulos Markdown e tags de documentação', () => {
  const comNegrito = THEME.tokenColors
    .filter((r) => (r.settings.fontStyle || '').includes('bold'))
    .map((r) => r.name)
  const permitido = /^(Títulos Markdown|Tags de documentação|Markdown: negrito)/
  for (const nome of comNegrito) {
    assert.match(nome, permitido, `regra "${nome}" usa negrito fora da lista da spec`)
  }
})

test('cobertura explícita das 15 linguagens exigidas', () => {
  const scopes = allScopes().join(' ')
  /** @type {Record<string, RegExp>} */
  const marcadores = {
    'TypeScript/JavaScript': /entity\.name\.function\b/,
    'React/JSX': /meta\.jsx\.attribute|support\.class\.component/,
    Python: /\.python\b/,
    GraphQL: /\.graphql\b/,
    CSS: /\.css\b/,
    HTML: /entity\.other\.attribute-name\.html|punctuation\.definition\.tag/,
    Markdown: /\.markdown\b/,
    Prisma: /\.prisma\b/,
    JSON: /property-name\.json/,
    YAML: /\.yaml\b/,
    'env': /\.env\b|source\.env/,
    gitignore: /\.ignore\b|source\.gitignore/,
    Dockerfile: /\.dockerfile\b/,
    shell: /\.shell\b/,
    diff: /markup\.(inserted|deleted)|meta\.diff/,
  }
  for (const [lang, re] of Object.entries(marcadores)) {
    assert.match(scopes, re, `sem cobertura para ${lang}`)
  }
})

test('papéis semânticos obrigatórios estão definidos', () => {
  const s = THEME.semanticTokenColors
  const obrigatorios = [
    'comment', 'parameter', 'property', 'class', 'interface', 'type', 'namespace',
    'enum', 'function', 'method', 'decorator', 'macro', 'enumMember', 'builtinConstant',
    'selfParameter', 'clsParameter', 'typeParameter', 'variable.defaultLibrary', '*.deprecated',
  ]
  for (const k of obrigatorios) assert.ok(s[k], `falta o papel semântico "${k}"`)
  assert.equal(s['*.deprecated'].fontStyle, 'strikethrough')
})

test('pares de brackets ciclam na ordem declarada', () => {
  const c = THEME.colors
  assert.equal(c['editorBracketHighlight.foreground1'], PALETTE['fg-punct'])
  assert.equal(c['editorBracketHighlight.foreground2'], PALETTE.steel)
  assert.equal(c['editorBracketHighlight.foreground3'], PALETTE.violet)
  assert.equal(c['editorBracketHighlight.foreground4'], PALETTE.sage)
  assert.equal(c['editorBracketHighlight.foreground5'], PALETTE.sand)
  assert.equal(c['editorBracketHighlight.foreground6'], PALETTE.rose)
  assert.equal(c['editorBracketHighlight.unexpectedBracket.foreground'], PALETTE.error)
})

test('bordas decorativas foram removidas com transparência, não com preto', () => {
  for (const k of ['activityBar.border', 'titleBar.border', 'editorOverviewRuler.border', 'scrollbar.shadow', 'tab.activeBorder']) {
    assert.equal(THEME.colors[k], '#00000000', `${k} deveria ser transparente`)
  }
})

test('o tema está registrado no package.json', () => {
  const pkg = require('../package.json')
  const entrada = (pkg.contributes.themes || []).find((t) => t.label === 'Puelche')
  assert.ok(entrada, 'sem entrada "Puelche" em contributes.themes')
  assert.equal(entrada.uiTheme, 'vs-dark')
  assert.ok(fs.existsSync(path.join(__dirname, '..', entrada.path)))
})
