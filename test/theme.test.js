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
//
// As cores de sintaxe são as do **Dracula**. A troca foi pedida com uma razão
// clara — "preciso entender só de olhar" — e a paleta dessaturada de antes
// falhava justamente nisso: os 9 papéis viviam entre ΔE76 10 e 15, no limite do
// piso. As 15 cores do Dracula estão TODAS acima de ΔE76 10 entre si, com folga.
//
// O fundo continua sendo o #1A181F do Puelche, mais escuro que o #282A36 do
// Dracula. Isso não é descuido: sobre ele cada cor do Dracula ganha ~24% de
// contraste a mais do que no tema de origem — verde a 12.81:1 contra 10.38:1,
// vermelho a 5.60:1 contra 4.53:1. Era o jeito de pedir mais destaque e ganhar
// mais destaque ainda.
//
// O que NÃO veio do Dracula: o `comment`. O #6272A4 original dá 3.74:1 sobre
// este fundo, abaixo do piso de 5.7:1 que este tema cobra desde sempre, pela
// razão escrita na spec — um comentário que não se lê é um comentário que não
// se escreve. Está clareado 30% em direção ao texto: #8F9ABB, 6.29:1.
const PALETTE = {
  bg: '#1A181F',
  'bg-deep': '#131117',
  'bg-lift': '#221F29',
  // linha atual: a #201D27 ficava a 1.060 de razão sobre o fundo — invisível.
  'bg-line': '#282332',
  selection: '#2E2A3C',
  border: '#221F29',
  'border-soft': '#2A2633',
  fg: '#F8F8F2',
  'fg-param': '#D2D2CC',
  'fg-punct': '#9A9A94',
  'fg-faint': '#6272A4',
  comment: '#8F9ABB',
  pink: '#FF79C6',
  green: '#50FA7B',
  cyan: '#8BE9FD',
  yellow: '#F1FA8C',
  purple: '#BD93F9',
  orange: '#FFB86C',
  // Dois brilhantes do Dracula promovidos a papel de sintaxe. Existem por uma
  // razão medida: num .tsx real, 16 identificadores — o vocabulário inteiro do
  // arquivo — saíam do mesmo branco. O tema coloria o que o token É
  // gramaticalmente e deixava sem cor todo nome que o autor escreveu.
  // `lavender` marca onde um nome NASCE; `aqua`, o que vem de fora (import).
  // O USO continua no fg: é o contraste entre declaração e uso que faz a leitura.
  lavender: '#D6ACFF',
  aqua: '#A4FFFF',
  // o accent NÃO virou o rosa do Dracula: ele é identidade de chrome e nunca
  // pinta código, e o rosa passou a ser a palavra-chave. Dois rosas com papéis
  // diferentes na mesma tela seria ruído. Ficam a ΔE76 25.1 um do outro.
  accent: '#C25E86',
  // accent puro reprova a 3.46:1 sobre a linha focada da lista: existe só para
  // o realce de match sobreviver ao fundo de seleção sem trocar de família.
  'accent-lift': '#DA84B4',
  red: '#FF5555',
  mint: '#69FF94',
}

// Saíram da paleta:
// - `warning` #C4A472 foi absorvido por `sand` (hoje `yellow`), que estavam a
//   ΔE76 5.29 — o mesmo número que a casa já recusou nos ícones.
// - `rose-dim` #B07A8C foi absorvido por `rose` (hoje `orange`): a ΔE76 9.28 a
//   "hierarquia" entre h1/h2 e h3–h6 não existia a olho nu.
// Os nomes de papel passaram a ser o nome da matiz (violet→pink, sage→green,
// steel→cyan, sand→yellow, clay→purple, rose→orange) porque com a paleta do
// Dracula os antigos viraram mentira: `clay` guardava um roxo.

// Utilitários de interface autorizados pela spec, fora da paleta de papéis.
const UI_EXTRAS = new Set([
  '#00000000', // bordas decorativas removidas
  '#3B3549', // focusBorder e guia de indentação ativa (cinza, nunca accent)
  '#26222F', // guias de indentação
  '#FFFFFF', // markup.bold do Markdown e branco forte do terminal
  '#21222C', // preto do terminal, o AnsiBlack do Dracula
  '#44475A', // preto brilhante do terminal
  // variantes bright do terminal: os valores exatos do Dracula
  '#FF6E6E', '#FFFFA5', '#FF92DF',
])

// As 12 chaves de chrome que carregam a identidade accent — nenhuma de texto de
// código. Dez usam o accent puro; duas usam `accent-lift` porque o accent puro
// reprova em contraste sobre o fundo de seleção (ver os testes de contraste).
const ACCENT_KEYS = [
  'activityBar.activeBorder',
  'activityBarBadge.background',
  'activityBarTop.activeBorder', // mesmo papel de activityBar.activeBorder
  'button.background',
  'editorCursor.foreground',
  'panelTitle.activeBorder',
  'peekView.border',
  'progressBar.background',
  'tab.activeBorderTop',
  'terminalCursor.foreground',
]

const ACCENT_LIFT_KEYS = ['editorSuggestWidget.highlightForeground', 'list.highlightForeground']

// Regras autorizadas a usar itálico. A spec proíbe itálico fora desta lista.
const ITALIC_RULES = new Set([
  'Import e export em itálico',
  'Nomes de atributo HTML e JSX em itálico',
  'Parâmetros de tipo em itálico',
  'Parâmetros e argumentos em itálico',
  'Comentários',
  'Tags de documentação e TODO',
  'Markdown: itálico',
  // Regras por linguagem. Continuam colorindo por PAPEL — o que elas fazem é dar
  // mais resolução dentro da linguagem, separando escopos que dividiam regra.
  'GraphQL: variável de operação',
  'A instância corrente em itálico',
  'A fronteira assíncrona em itálico',
  'O que vem de fora: o nome importado',
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

/** CIE L*a*b* (iluminante D65) de um hex. @param {string} hex */
function lab(hex) {
  const n = parseInt(hex.slice(1, 7), 16)
  const inv = (v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const r = inv((n >> 16) & 255)
  const g = inv((n >> 8) & 255)
  const b = inv(n & 255)
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const x = f((r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047)
  const y = f(r * 0.2126729 + g * 0.7151522 + b * 0.072175)
  const z = f((r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

/**
 * Distância de cor CIE76. É a métrica que a casa já usava informalmente — o
 * comentário de `data/icons.json` cita "ΔE 5.29" para sand/warning, que é o
 * CIE76 desse par. Manter a mesma métrica para o número continuar comparável.
 */
function deltaE76(a, b) {
  const [l1, a1, b1] = lab(a)
  const [l2, a2, b2] = lab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
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

test('accent só aparece nas 10 chaves de chrome declaradas', () => {
  const usando = Object.entries(THEME.colors)
    .filter(([, v]) => v === PALETTE.accent)
    .map(([k]) => k)
    .sort()
  assert.deepEqual(usando, [...ACCENT_KEYS].sort())
})

test('accent-lift só aparece nas 2 chaves de realce de match', () => {
  const usando = Object.entries(THEME.colors)
    .filter(([, v]) => v === PALETTE['accent-lift'])
    .map(([k]) => k)
    .sort()
  assert.deepEqual(usando, [...ACCENT_LIFT_KEYS].sort())
})

test('a identidade accent cobre 12 chaves de chrome, nenhuma de texto', () => {
  assert.equal(ACCENT_KEYS.length + ACCENT_LIFT_KEYS.length, 12)
})

test('accent nunca colore texto de código', () => {
  for (const cor of [PALETTE.accent, PALETTE['accent-lift']]) {
    for (const rule of THEME.tokenColors) {
      assert.notEqual(rule.settings.foreground, cor, `regra "${rule.name}" usa ${cor}`)
    }
    for (const [, s] of Object.entries(THEME.semanticTokenColors)) {
      if (s && typeof s === 'object') assert.notEqual(s.foreground, cor)
    }
  }
})

test('focusBorder é cinza, não accent (não pisca rosa a cada Tab)', () => {
  assert.equal(THEME.colors.focusBorder, '#3B3549')
})

test('os 9 papéis de sintaxe passam 4.5:1 sobre o fundo do editor', () => {
  const papeis = ['pink', 'green', 'cyan', 'yellow', 'purple', 'orange', 'fg', 'fg-punct', 'comment']
  for (const papel of papeis) {
    const r = contrast(PALETTE[papel], PALETTE.bg)
    assert.ok(r >= 4.5, `${papel} tem ${r.toFixed(2)}:1, abaixo de 4.5:1`)
  }
})

test('comentários ficam acima do mínimo de acessibilidade (não são apagados)', () => {
  const r = contrast(PALETTE.comment, PALETTE.bg)
  assert.ok(r >= 5.7, `comentário tem ${r.toFixed(2)}:1`)
})

test('accent-lift é legível nos dois fundos onde o realce de match cai', () => {
  // A razão de a cor existir. O realce de match aparece sobre a linha focada da
  // lista (selection) e sobre o fundo do suggest widget (bg-lift); o accent puro
  // dava 3.46:1 e 4.04:1 nesses dois fundos.
  const sobreSelecao = contrast(PALETTE['accent-lift'], PALETTE.selection)
  const sobreWidget = contrast(PALETTE['accent-lift'], PALETTE['bg-lift'])
  assert.ok(sobreSelecao >= 4.5, `accent-lift na linha focada tem ${sobreSelecao.toFixed(2)}:1`)
  assert.ok(sobreWidget >= 4.5, `accent-lift no suggest widget tem ${sobreWidget.toFixed(2)}:1`)
})

test('o rótulo dos botões e badges é legível sobre o accent', () => {
  const botao = contrast(THEME.colors['button.foreground'], THEME.colors['button.background'])
  const badge = contrast(
    THEME.colors['activityBarBadge.foreground'],
    THEME.colors['activityBarBadge.background']
  )
  assert.ok(botao >= 4.5, `button.foreground tem ${botao.toFixed(2)}:1 sobre o accent`)
  assert.ok(badge >= 4.5, `activityBarBadge.foreground tem ${badge.toFixed(2)}:1 sobre o accent`)
})

test('a linha atual é visível sem virar seleção', () => {
  const r = contrast(PALETTE['bg-line'], PALETTE.bg)
  assert.ok(r >= 1.12, `a linha atual tem razão ${r.toFixed(3)} — indistinguível do fundo`)
  assert.ok(r < contrast(PALETTE.selection, PALETTE.bg), 'a linha atual não pode competir com a seleção')
})

test('nenhum par de cores que dividem a tela abaixo de ΔE76 10', () => {
  // Critério que a casa já aplicou de fato quando separou sand/warning (ΔE76
  // 5.29): duas cores abaixo de ~10 viram a mesma cor a olho nu.
  const naTela = [
    'pink', 'green', 'cyan', 'yellow', 'purple', 'orange', 'red', 'mint', 'lavender', 'aqua',
    'accent', 'accent-lift', 'fg', 'fg-param', 'fg-punct', 'comment', 'fg-faint',
  ]
  // Isentos: pares em que o itálico — não a cor — é o que separa os dois papéis.
  // Colorir mais seria trocar uma distinção que já funciona por ruído.
  const ISENTOS = new Set(['fg|fg-param', 'comment|fg-punct'])
  for (let i = 0; i < naTela.length; i++) {
    for (let j = i + 1; j < naTela.length; j++) {
      const [a, b] = [naTela[i], naTela[j]]
      if (ISENTOS.has(`${a}|${b}`) || ISENTOS.has(`${b}|${a}`)) continue
      const d = deltaE76(PALETTE[a], PALETTE[b])
      assert.ok(d >= 10, `${a} e ${b} estão a ΔE76 ${d.toFixed(2)} — mesma cor a olho nu`)
    }
  }
})

test('os ícones do suggest widget usam a paleta, não o laranja/azul do vs-dark', () => {
  const chaves = Object.keys(THEME.colors).filter((k) => k.startsWith('symbolIcon.'))
  assert.ok(chaves.length >= 30, `só ${chaves.length} chaves symbolIcon definidas`)
  for (const k of chaves) {
    assert.ok(ALLOWED_BASE.has(THEME.colors[k].toUpperCase()), `${k} usa cor fora da paleta`)
  }
  // O ícone tem que ter a cor da palavra que ele insere.
  assert.equal(THEME.colors['symbolIcon.classForeground'], PALETTE.cyan)
  assert.equal(THEME.colors['symbolIcon.functionForeground'], PALETTE.green)
  assert.equal(THEME.colors['symbolIcon.keywordForeground'], PALETTE.pink)
  assert.equal(THEME.colors['symbolIcon.stringForeground'], PALETTE.yellow)
  assert.equal(THEME.colors['symbolIcon.numberForeground'], PALETTE.purple)
})

test('os três tipos de completion que ESTA extensão emite se distinguem', () => {
  // `extension.js` só produz quatro CompletionItemKind: Reference (id de bloco),
  // Snippet (bloco inteiro), Variable e Color (tokens CSS). São as únicas cores
  // de symbolIcon que o usuário desta extensão chega a ver — se elas forem
  // iguais entre si, as outras 30 chaves são enfeite e o autocomplete de blocos
  // fica cinza. Violeta é o papel da identidade VTEX no conjunto de ícones
  // (manifest, routes, blocks), então id de bloco herda violeta.
  const emitidas = {
    'symbolIcon.referenceForeground': PALETTE.pink,
    'symbolIcon.snippetForeground': PALETTE.green,
    'symbolIcon.variableForeground': PALETTE.cyan,
  }
  for (const [chave, esperado] of Object.entries(emitidas)) {
    assert.equal(THEME.colors[chave], esperado, `${chave} saiu do papel declarado`)
  }
  const cores = Object.values(emitidas)
  for (let i = 0; i < cores.length; i += 1) {
    for (let j = i + 1; j < cores.length; j += 1) {
      const d = deltaE76(cores[i], cores[j])
      assert.ok(d >= 10, `dois tipos emitidos a ΔE76 ${d.toFixed(2)} — indistinguíveis na lista`)
    }
  }
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

/**
 * Cor efetiva de um escopo: no VS Code a ÚLTIMA regra que casa é a que vale.
 * As regras por linguagem vivem no fim do arquivo justamente por isso.
 */
function corDe(escopo) {
  let cor
  for (const r of THEME.tokenColors) {
    const s = Array.isArray(r.scope) ? r.scope : [r.scope]
    if (s.includes(escopo)) cor = r.settings.foreground || cor
  }
  return cor
}

/**
 * As distinções por linguagem. Cada uma existe porque dois escopos que dizem
 * coisas diferentes dividiam a mesma regra e saíam da mesma cor — e isso só
 * falha visualmente, quando alguém está lendo código e não entende de relance.
 */
test('React: um componente não tem a cor de uma tag HTML', () => {
  const componente = corDe('support.class.component')
  const tag = corDe('entity.name.tag')
  assert.ok(componente, 'support.class.component sem cor')
  assert.notEqual(componente, tag, '<ProductCard> e <div> saem da mesma cor')
  assert.equal(componente, PALETTE.cyan, 'componente é tipo: cor de tipo')
  assert.equal(tag, PALETTE.orange, 'tag é estrutura nomeada')
})

test('React: a chave que abre JavaScript no markup é visível', () => {
  const chave = corDe('punctuation.section.embedded.begin.tsx')
  assert.equal(chave, PALETTE.pink, 'o { do JSX tem que marcar a fronteira')
  assert.notEqual(chave, PALETTE['fg-punct'], 'se cair na pontuação comum, some')
})

test('GraphQL: $variável não é pintada como função', () => {
  const variavel = corDe('variable.graphql')
  const funcao = corDe('entity.name.function')
  assert.notEqual(variavel, funcao, '$id saía com a cor de chamada de função')
  assert.equal(variavel, PALETTE['fg-param'], 'variável de operação é parâmetro')
})

test('a instância corrente é o mesmo papel em toda linguagem', () => {
  const alvos = ['variable.language.this', 'variable.language.super', 'variable.language.special.self.python']
  const cores = new Set(alvos.map(corDe))
  assert.equal(cores.size, 1, `this, super e self saíram de cores diferentes: ${[...cores]}`)
  assert.equal([...cores][0], PALETTE.purple, 'é valor da linguagem, não palavra-chave')
  assert.notEqual([...cores][0], corDe('keyword.control'), 'this não é palavra-chave')
})

test('async e await se separam do resto das palavras-chave pelo itálico', () => {
  const r = THEME.tokenColors.find((x) => x.name === 'A fronteira assíncrona em itálico')
  assert.ok(r, 'regra ausente')
  assert.equal(r.settings.foreground, PALETTE.pink, 'continua sendo palavra-chave na cor')
  assert.match(r.settings.fontStyle || '', /italic/, 'o que separa é o itálico, não uma cor nova')
})

test('as regras por linguagem não inventam cor fora da paleta', () => {
  const porLinguagem = THEME.tokenColors.filter((r) => /^(React|GraphQL|Regex|A instância|A fronteira)/.test(r.name))
  assert.ok(porLinguagem.length >= 6, `só ${porLinguagem.length} regras por linguagem`)
  for (const r of porLinguagem) {
    const c = r.settings.foreground
    if (c) assert.ok(ALLOWED_BASE.has(c.toUpperCase()), `${r.name} usa ${c}, fora da paleta`)
  }
})

/**
 * A leitura de um arquivo real. Medido no `index.tsx` do construplaza-theme:
 * 16 identificadores — o vocabulário inteiro do arquivo — saíam do mesmo
 * branco, porque o tema coloria o que o token É gramaticalmente e deixava sem
 * cor todo nome que o autor escreveu. Estas três travas seguram o conserto.
 */
test('declaração e uso de uma variável não saem da mesma cor', () => {
  const st = THEME.semanticTokenColors
  const decl = st['variable.declaration'] && st['variable.declaration'].foreground
  const uso = st['variable'] && st['variable'].foreground
  assert.ok(decl, 'sem regra para variable.declaration')
  assert.ok(uso, 'sem regra para variable — o uso ficaria num fallback não declarado')
  assert.notEqual(decl, uso, 'onde o nome nasce tem que se separar de onde ele é usado')
  assert.equal(decl, PALETTE.lavender)
  assert.equal(uso, PALETTE.fg)
})

test('o parâmetro é laranja, não um branco de segunda', () => {
  const p = THEME.semanticTokenColors.parameter
  assert.equal(p.foreground, PALETTE.orange, 'era #D2D2CC, quase indistinguível do texto comum')
  assert.match(p.fontStyle || '', /italic/)
})

test('o nome importado se separa do nome local', () => {
  const r = THEME.tokenColors.find((x) => x.name === 'O que vem de fora: o nome importado')
  assert.ok(r, 'regra ausente')
  assert.equal(r.settings.foreground, PALETTE.aqua)
  assert.notEqual(r.settings.foreground, PALETTE.fg, 'o bloco de import voltaria a ser branco')
  assert.notEqual(r.settings.foreground, PALETTE.cyan, 'e não pode empatar com tipo')
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
  assert.equal(c['editorBracketHighlight.foreground2'], PALETTE.cyan)
  assert.equal(c['editorBracketHighlight.foreground3'], PALETTE.pink)
  assert.equal(c['editorBracketHighlight.foreground4'], PALETTE.green)
  assert.equal(c['editorBracketHighlight.foreground5'], PALETTE.yellow)
  assert.equal(c['editorBracketHighlight.foreground6'], PALETTE.orange)
  assert.equal(c['editorBracketHighlight.unexpectedBracket.foreground'], PALETTE.red)
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
