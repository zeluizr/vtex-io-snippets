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
// A paleta é **da casa**. A anterior vinha pronta de um tema de terceiro, e
// isso era dependência de identidade num produto que é da inmmerce — o motivo
// da troca não foi estético, foi esse. A base são cinco cores dadas, com hex
// intocado:
//
//   #FF6E61  #FFB84D  #FCE2A1  #4EB7AC  #3C9CD7
//
// Cinco não cobrem o sistema: são 9 papéis de sintaxe mais 5 auxiliares, todos
// com piso de ΔE76 10 entre si. As cinco âncoras deixam DOIS ARCOS DE MATIZ
// vazios — 96° de verde (creme 90° → teal 186°) e 136° de roxo/rosa (azul 257°
// → coral 33°). O que falta é derivado ali dentro, em LCh, com L* e croma na
// faixa das próprias âncoras (L* 61–91, croma 33–65). Cada derivada tem
// coordenada; nenhuma foi escolhida a olho.
//
// O fundo também é derivado: o azul #3C9CD7 levado a croma baixo e L* baixo
// (h 262, C 8–11). Um azul-noite próprio, no lugar do índigo-noite #17162A que
// vinha da marca. Sobre ele as cinco âncoras entregam de 5.52:1 (azul) a
// 13.17:1 (creme) — todas com folga sobre o piso de 4.5:1.
const PALETTE = {
  // Superfícies: o azul da paleta em croma baixo. É uma família só, do fundo
  // mais fundo até a seleção, e é o que faz o chrome recuar sem virar cinza.
  bg: '#131F29',
  'bg-deep': '#09141E',
  'bg-lift': '#1E2934',
  'bg-line': '#26313D',
  selection: '#334150',
  border: '#1E2934',
  'border-soft': '#2B3642',
  // Neutros de texto no matiz quente do creme (h 90): o branco do editor fica
  // do lado da paleta, não neutro puro.
  fg: '#F4F0E9',
  'fg-param': '#D6D1C8',
  'fg-punct': '#9C9890',
  // Só chrome: desabilitado, número de linha, ghost text. Não entra nos 9 —
  // 3.2:1 sobre o fundo é pouco para texto que se lê.
  'fg-faint': '#616E7D',
  // Comentário tem piso próprio de 5.7:1 nesta casa, pela razão de sempre: um
  // comentário que não se lê é um comentário que não se escreve. Dá 6.43:1.
  comment: '#91A3B1',
  // As cinco âncoras, hex intocado.
  coral: '#FF6E61', // palavras-chave e controle
  ambar: '#FFB84D', // estrutura nomeada
  creme: '#FCE2A1', // strings e valores textuais
  teal: '#4EB7AC', // funções, métodos, campos e handles
  azul: '#3C9CD7', // tipos, classes e propriedades
  // Derivadas, no arco roxo/rosa que as âncoras deixaram vazio.
  lilas: '#AA91E0', // L65 C45 h305 — números, constantes, unidades, escapes
  // `indigo` marca onde um nome NASCE; `mint`, o que vem de fora (import). Os
  // dois existem por uma razão medida: num .tsx real, 16 identificadores — o
  // vocabulário inteiro do arquivo — saíam do mesmo branco. O USO continua no
  // fg: é o contraste entre declaração e uso que faz a leitura.
  indigo: '#8C98E9', // L65 C45 h290 — declaração
  // Derivadas, no arco verde.
  mint: '#4EC59A', // L70 C50 h165 — o nome importado
  verde: '#7DBB69', // L70 C50 h135 — diff adicionado
  // O dourado da inmmerce. É identidade de chrome e NUNCA pinta código. Ele
  // sobrevive à troca de paleta porque é marca, não sintaxe — e sobrevive à
  // vizinhança quente do âmbar, que é o risco óbvio: os dois estão a ΔE76 19.9.
  //
  // Ele também aposentou o `accent-lift`. Aquele token existia por um motivo
  // só: o accent rosa reprovava a 3.46:1 sobre a linha focada da lista, e o
  // realce de match precisava sobreviver ali. O dourado dá 6.61:1 no fundo
  // novo, então as 12 chaves de chrome usam o acento puro.
  accent: '#F6C92D',
  // O vermelho de erro é separado do coral porque o CORAL virou palavra-chave,
  // e erro não pode empatar com `if`. Está a ΔE76 15.5 dele. Vermelhos mais
  // óbvios (#E63656, #EE4262) reprovavam o piso de 4.5:1 sobre o fundo novo;
  // este é onde as duas contas fecham ao mesmo tempo — 4.62:1.
  red: '#F44454', // L56 C74 h25 — inválido, obsoleto, diff removido
}

// Os nomes de papel são o nome da matiz. Com a paleta própria eles voltaram a
// ser verdade: `coral` guarda um coral. Os nomes anteriores descreviam a paleta
// emprestada (pink/green/cyan/yellow/purple/orange, mais lavender e aqua) e o
// mapeamento foi: pink→coral, green→teal, cyan→azul, yellow→creme,
// purple→lilas, orange→ambar, lavender→indigo, aqua→mint, mint→verde.

// Utilitários de interface autorizados pela spec, fora da paleta de papéis.
const UI_EXTRAS = new Set([
  '#00000000', // bordas decorativas removidas
  '#3B4856', // focusBorder e guia ativa — o slate da casa, nunca o accent
  '#FFFFFF', // markup.bold do Markdown e branco forte do terminal
  // Variantes bright do terminal. Não são escolhidas: cada uma é a base
  // misturada 22% em direção ao fg. As duas pontas saem da paleta —
  // ansiBrightBlack é o fg-faint e ansiBrightWhite é o branco puro.
  '#F46A75', '#97C785', '#FAE5B1', '#64AEDB', '#FD8B7F', '#73C4B9',
])

// As 12 chaves de chrome que carregam a identidade accent — nenhuma de texto de
// código. Foram dez mais duas enquanto o accent era rosa: as duas do realce de
// match precisavam do `accent-lift`, porque o rosa puro reprovava a 3.46:1
// sobre a linha focada da lista. O dourado da inmmerce dá 7.85:1 no mesmo
// fundo, então as doze usam o acento puro e o token clareado deixou de existir.
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
  'editorSuggestWidget.highlightForeground',
  'list.highlightForeground',
]

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

test('accent só aparece nas 12 chaves de chrome declaradas', () => {
  const usando = Object.entries(THEME.colors)
    .filter(([, v]) => v === PALETTE.accent)
    .map(([k]) => k)
    .sort()
  assert.deepEqual(usando, [...ACCENT_KEYS].sort())
})

test('a identidade accent cobre 12 chaves de chrome, nenhuma de texto', () => {
  assert.equal(ACCENT_KEYS.length, 12)
})

test('accent nunca colore texto de código', () => {
  for (const cor of [PALETTE.accent]) {
    for (const rule of THEME.tokenColors) {
      assert.notEqual(rule.settings.foreground, cor, `regra "${rule.name}" usa ${cor}`)
    }
    for (const [, s] of Object.entries(THEME.semanticTokenColors)) {
      if (s && typeof s === 'object') assert.notEqual(s.foreground, cor)
    }
  }
})

test('focusBorder é neutro, não accent (não pisca dourado a cada Tab)', () => {
  assert.equal(THEME.colors.focusBorder, '#3B4856')
})

test('os 9 papéis de sintaxe passam 4.5:1 sobre o fundo do editor', () => {
  const papeis = ['coral', 'teal', 'azul', 'creme', 'lilas', 'ambar', 'fg', 'fg-punct', 'comment']
  for (const papel of papeis) {
    const r = contrast(PALETTE[papel], PALETTE.bg)
    assert.ok(r >= 4.5, `${papel} tem ${r.toFixed(2)}:1, abaixo de 4.5:1`)
  }
})

test('comentários ficam acima do mínimo de acessibilidade (não são apagados)', () => {
  const r = contrast(PALETTE.comment, PALETTE.bg)
  assert.ok(r >= 5.7, `comentário tem ${r.toFixed(2)}:1`)
})

test('o realce de match é legível nos dois fundos onde ele cai', () => {
  // Este teste é o que aposentou o `accent-lift`. O realce aparece sobre a
  // linha focada da lista (selection) e sobre o fundo do suggest widget
  // (bg-lift). O accent rosa dava 3.46:1 e 4.04:1 e por isso precisava de uma
  // variante clareada; o dourado passa nos dois sem ajuda.
  const sobreSelecao = contrast(PALETTE.accent, PALETTE.selection)
  const sobreWidget = contrast(PALETTE.accent, PALETTE['bg-lift'])
  assert.ok(sobreSelecao >= 4.5, `o realce na linha focada tem ${sobreSelecao.toFixed(2)}:1`)
  assert.ok(sobreWidget >= 4.5, `o realce no suggest widget tem ${sobreWidget.toFixed(2)}:1`)
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
    'coral', 'teal', 'azul', 'creme', 'lilas', 'ambar', 'red', 'verde', 'indigo', 'mint',
    'accent', 'fg', 'fg-param', 'fg-punct', 'comment', 'fg-faint',
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
  assert.equal(THEME.colors['symbolIcon.classForeground'], PALETTE.azul)
  assert.equal(THEME.colors['symbolIcon.functionForeground'], PALETTE.teal)
  assert.equal(THEME.colors['symbolIcon.keywordForeground'], PALETTE.coral)
  assert.equal(THEME.colors['symbolIcon.stringForeground'], PALETTE.creme)
  assert.equal(THEME.colors['symbolIcon.numberForeground'], PALETTE.lilas)
})

test('os três tipos de completion que ESTA extensão emite se distinguem', () => {
  // `extension.js` só produz quatro CompletionItemKind: Reference (id de bloco),
  // Snippet (bloco inteiro), Variable e Color (tokens CSS). São as únicas cores
  // de symbolIcon que o usuário desta extensão chega a ver — se elas forem
  // iguais entre si, as outras 30 chaves são enfeite e o autocomplete de blocos
  // fica cinza. Violeta é o papel da identidade VTEX no conjunto de ícones
  // (manifest, routes, blocks), então id de bloco herda violeta.
  const emitidas = {
    'symbolIcon.referenceForeground': PALETTE.coral,
    'symbolIcon.snippetForeground': PALETTE.teal,
    'symbolIcon.variableForeground': PALETTE.azul,
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
  assert.equal(componente, PALETTE.azul, 'componente é tipo: cor de tipo')
  assert.equal(tag, PALETTE.ambar, 'tag é estrutura nomeada')
})

test('React: a chave que abre JavaScript no markup é visível', () => {
  const chave = corDe('punctuation.section.embedded.begin.tsx')
  assert.equal(chave, PALETTE.coral, 'o { do JSX tem que marcar a fronteira')
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
  assert.equal([...cores][0], PALETTE.lilas, 'é valor da linguagem, não palavra-chave')
  assert.notEqual([...cores][0], corDe('keyword.control'), 'this não é palavra-chave')
})

test('async e await se separam do resto das palavras-chave pelo itálico', () => {
  const r = THEME.tokenColors.find((x) => x.name === 'A fronteira assíncrona em itálico')
  assert.ok(r, 'regra ausente')
  assert.equal(r.settings.foreground, PALETTE.coral, 'continua sendo palavra-chave na cor')
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
  assert.equal(decl, PALETTE.indigo)
  assert.equal(uso, PALETTE.fg)
})

test('o parâmetro é âmbar, não um branco de segunda', () => {
  const p = THEME.semanticTokenColors.parameter
  assert.equal(p.foreground, PALETTE.ambar, 'era #D2D2CC, quase indistinguível do texto comum')
  assert.match(p.fontStyle || '', /italic/)
})

test('o nome importado se separa do nome local', () => {
  const r = THEME.tokenColors.find((x) => x.name === 'O que vem de fora: o nome importado')
  assert.ok(r, 'regra ausente')
  assert.equal(r.settings.foreground, PALETTE.mint)
  assert.notEqual(r.settings.foreground, PALETTE.fg, 'o bloco de import voltaria a ser branco')
  assert.notEqual(r.settings.foreground, PALETTE.azul, 'e não pode empatar com tipo')
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
  assert.equal(c['editorBracketHighlight.foreground2'], PALETTE.azul)
  assert.equal(c['editorBracketHighlight.foreground3'], PALETTE.coral)
  assert.equal(c['editorBracketHighlight.foreground4'], PALETTE.teal)
  assert.equal(c['editorBracketHighlight.foreground5'], PALETTE.creme)
  assert.equal(c['editorBracketHighlight.foreground6'], PALETTE.ambar)
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
