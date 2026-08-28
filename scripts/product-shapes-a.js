// @ts-check
'use strict'

/**
 * Conjunto A da geometria do product icon theme: os 29 codicons de chrome do
 * VS Code (barra de atividade, layout, barra de status, árvore e explorer).
 *
 * Cada valor continua sendo markup interno de SVG numa grade 16x16 — a mesma
 * caixa em que o VS Code renderiza um codicon, então 1 unidade = 1 pixel. O que
 * mudou é COMO esse markup nasce: nada aqui é contorno traçado à mão. Cada
 * desenho é declarado em primitivas de TRAÇO (linha, arco, anel, retângulo) e
 * `scripts/stroke-outline.js` converte em contorno preenchido com winding
 * correto — que é o que dá ponta e junção redondas de graça, no idioma Lucide
 * fechado em `docs/traco-puelche.md`.
 *
 * Constantes da spec, sem negociação: espessura 1.35, raio de canto 1.35, caixa
 * de conteúdo de 1.5 a 14.5 (a tinta chega a ~0.83 e ~15.18), e teto de três
 * elementos visuais por glifo — a 16px nada além disso lê.
 *
 * Preenchimento sólido só onde a forma É sólida: aqui, o ponto de `warning`
 * (raio 0.675, exatamente a meia-espessura, como o `h.01` do Lucide).
 *
 * Os ids são TRAVA: `data/product-codepoints.json` é append-only e amarra id a
 * codepoint. Redesenhar o desenho de um id é seguro; renomear, remover ou
 * acrescentar id não é.
 */

const { outline } = require('./stroke-outline')

/** Espessura do traço na grade 16 (spec do traço Puelche). */
const W = 1.35
/** Raio de canto padrão — igual à espessura, por regra da spec. */
const R = 1.35

/**
 * @typedef {Record<string, any>} Prim primitiva aceita por `outline`
 */

/**
 * Converte primitivas de traço no markup de UM `<path>` preenchido.
 * @param {Prim[]} prims
 * @returns {string}
 */
const p = (prims) => `<path d="${outline(prims, { w: W })}"/>`

/** Graus a partir de um vetor (0 = leste, horário na tela). @param {number} x @param {number} y */
const grau = (x, y) => (Math.atan2(y, x) * 180) / Math.PI

/**
 * Ponto do círculo no ângulo dado, em graus.
 * @param {number} cx @param {number} cy @param {number} r @param {number} a
 * @returns {[number, number]}
 */
const pol = (cx, cy, r, a) => [
  cx + r * Math.cos((a * Math.PI) / 180),
  cy + r * Math.sin((a * Math.PI) / 180),
]

/**
 * Polilinha de cantos ARREDONDADOS: devolve as primitivas (retas aparadas +
 * arcos de canto) que `outline` entende. Vale para qualquer ângulo, não só 90°,
 * e é o que substitui a quina viva de toda caixa do conjunto anterior.
 *
 * O raio pedido é aparado quando a aresta é curta demais para acomodá-lo: sem
 * isso um lado curto viraria segmento invertido e a fonte ganharia contorno
 * degenerado (que o lint reprova e o olho não vê).
 *
 * @param {Array<[number, number]>} pts vértices, em ordem
 * @param {number} [r] raio de canto (default R)
 * @param {boolean} [close] fecha o polígono
 * @returns {Prim[]}
 */
function rounded(pts, r, close) {
  const raio = typeof r === 'number' ? r : R
  const n = pts.length
  const nseg = close ? n : n - 1
  /** @type {Array<{ a: [number, number], b: [number, number], ux: number, uy: number, len: number }>} */
  const seg = []
  for (let i = 0; i < nseg; i += 1) {
    const a = pts[i]
    const b = pts[(i + 1) % n]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    seg.push({ a, b, ux: (b[0] - a[0]) / len, uy: (b[1] - a[1]) / len, len })
  }
  /** Quanto cada ponta de cada segmento cede para o arco de canto. */
  const corte = seg.map(() => [0, 0])
  /** @type {Prim[]} */
  const arcos = []
  const primeiro = close ? 0 : 1
  const ultimo = close ? n - 1 : n - 2
  for (let i = primeiro; i <= ultimo; i += 1) {
    const ent = seg[(i - 1 + nseg) % nseg]
    const sai = seg[i]
    // vetor de volta pela aresta que chega e vetor da aresta que sai
    const ax = -ent.ux
    const ay = -ent.uy
    const bx = sai.ux
    const by = sai.uy
    const cos = Math.max(-1, Math.min(1, ax * bx + ay * by))
    const phi = Math.acos(cos)
    if (phi > Math.PI - 1e-6 || phi < 1e-6) continue
    const meia = phi / 2
    const t = Math.min(raio / Math.tan(meia), 0.49 * ent.len, 0.49 * sai.len)
    if (t <= 1e-6) continue
    const rr = t * Math.tan(meia)
    const v = pts[i]
    const axp = v[0] + ax * t
    const ayp = v[1] + ay * t
    const bxp = v[0] + bx * t
    const byp = v[1] + by * t
    let mx = ax + bx
    let my = ay + by
    const ml = Math.hypot(mx, my)
    mx /= ml
    my /= ml
    const d = rr / Math.sin(meia)
    const cx = v[0] + mx * d
    const cy = v[1] + my * d
    const a0 = grau(axp - cx, ayp - cy)
    let delta = grau(bxp - cx, byp - cy) - a0
    while (delta > 180) delta -= 360
    while (delta <= -180) delta += 360
    arcos.push({ arc: { cx, cy, r: rr, from: a0, to: a0 + delta } })
    corte[(i - 1 + nseg) % nseg][1] = t
    corte[i][0] = t
  }
  /** @type {Prim[]} */
  const retas = []
  seg.forEach((s, i) => {
    const x1 = s.a[0] + s.ux * corte[i][0]
    const y1 = s.a[1] + s.uy * corte[i][0]
    const x2 = s.b[0] - s.ux * corte[i][1]
    const y2 = s.b[1] - s.uy * corte[i][1]
    if (Math.hypot(x2 - x1, y2 - y1) > 1e-6) retas.push({ line: [x1, y1, x2, y2] })
  })
  return retas.concat(arcos)
}

/**
 * Ponta de seta ABERTA (dois barbes com junção redonda na ponta) — o jeito
 * Lucide. Nada de triângulo sólido: sólido só onde a forma é sólida.
 * @param {[number, number]} ponta
 * @param {number} dir direção do movimento na ponta, em graus
 * @param {number} [len] comprimento do barbe
 * @param {number} [abertura] meio-ângulo do barbe, em graus
 * @returns {Prim}
 */
function seta(ponta, dir, len, abertura) {
  const L = typeof len === 'number' ? len : 2.1
  const g = typeof abertura === 'number' ? abertura : 40
  const a = pol(ponta[0], ponta[1], L, dir + 180 - g)
  const b = pol(ponta[0], ponta[1], L, dir + 180 + g)
  return { line: [a[0], a[1], ponta[0], ponta[1], b[0], b[1]] }
}

/**
 * Direção do movimento na ponta de um arco percorrido no sentido horário.
 * @param {number} a ângulo do ponto, em graus
 */
const tangente = (a) => a + 90

// ---------------------------------------------------------------------------
// Vocabulário compartilhado
// ---------------------------------------------------------------------------

/**
 * A pasta. Mesmas proporções do ícone de pasta do file icon theme
 * (`icons/folder.svg`, grade 24) divididas por 1.5 — é o que faz as duas pastas
 * da mesma janela serem a MESMA pasta, que era a queixa.
 * @type {Array<[number, number]>}
 */
const PASTA = [
  [1.6, 2.4],
  [5.9, 2.4],
  [7.75, 4.5],
  [14.35, 4.5],
  [14.35, 13.6],
  [1.6, 13.6],
]

/**
 * A página: retângulo com o canto superior direito cortado pela dobra.
 * @type {Array<[number, number]>}
 */
const PAGINA = [
  [3.4, 1.6],
  [9.2, 1.6],
  [12.8, 5.2],
  [12.8, 14.4],
  [3.4, 14.4],
]

/** A dobra da página, desenhada por cima do corte. @type {Array<[number, number]>} */
const DOBRA = [
  [9.2, 1.6],
  [9.2, 5.2],
  [12.8, 5.2],
]

/** Moldura do editor usada pelos três glifos de layout. @type {Prim} */
const MOLDURA = { rect: { x: 1.8, y: 2.5, w: 12.4, h: 11.0, r: R } }

/**
 * Cruz de "novo": duas retas de ponta redonda.
 * @param {number} cx @param {number} cy @param {number} braco
 * @returns {Prim[]}
 */
const mais = (cx, cy, braco) => [
  { line: [cx - braco, cy, cx + braco, cy] },
  { line: [cx, cy - braco, cx, cy + braco] },
]

/** As três barras do hambúrguer — `menu` e `three-bars` são o mesmo desenho. */
const BARRAS = [
  { line: [2.6, 4.2, 13.4, 4.2] },
  { line: [2.6, 8.0, 13.4, 8.0] },
  { line: [2.6, 11.8, 13.4, 11.8] },
]

/**
 * Um sino: cúpula em arco, laterais abertas em flare e a barra da boca.
 * @param {number} cx centro horizontal
 * @param {number} cy linha onde a cúpula encontra as laterais
 * @param {number} r raio da cúpula
 * @param {number} base y da barra da boca
 * @param {number} flare quanto a lateral abre até a base
 * @returns {Prim[]}
 */
const sino = (cx, cy, r, base, flare) => [
  { arc: { cx, cy, r, from: 180, to: 360 } },
  { line: [cx - r, cy, cx - r - flare, base] },
  { line: [cx + r, cy, cx + r + flare, base] },
  { line: [cx - r - flare - 0.9, base, cx + r + flare + 0.9, base] },
]

// ---------------------------------------------------------------------------
// Os 29 desenhos
// ---------------------------------------------------------------------------

/** @type {Record<string, string>} */
const PRODUCT_SHAPES = {
  // --- barra de atividade ---

  // duas folhas sobrepostas, à la lucide/copy: a de trás é um L que morre na
  // borda da folha da frente, então não há canto vivo nem linha escondida
  files: p([
    { rect: { x: 5.6, y: 5.6, w: 8.9, h: 8.9, r: R } },
    ...rounded([
      [5.6, 10.4],
      [1.5, 10.4],
      [1.5, 1.5],
      [10.4, 1.5],
      [10.4, 5.6],
    ]),
  ]),

  search: p([
    { ring: { cx: 6.9, cy: 6.9, r: 3.9 } },
    { line: [9.66, 9.66, 13.6, 13.6] },
  ]),

  // três nós e um garfo: o tronco liga os dois nós da esquerda, o ramo sai do
  // meio do tronco para o nó da direita
  'source-control': p([
    { ring: { cx: 4.4, cy: 3.4, r: 1.8 } },
    { ring: { cx: 4.4, cy: 12.6, r: 1.8 } },
    { ring: { cx: 11.7, cy: 7.0, r: 1.8 } },
    { line: [4.4, 5.2, 4.4, 10.8] },
    { line: [4.4, 7.0, 9.9, 7.0] },
  ]),

  // o bicho: corpo em cápsula (nada de caixa), antenas e quatro patas
  'debug-alt': p([
    { rect: { x: 5.1, y: 5.0, w: 5.8, h: 8.5, r: 2.9 } },
    { line: [6.4, 4.5, 5.3, 2.9] },
    { line: [9.6, 4.5, 10.7, 2.9] },
    { line: [5.0, 7.8, 2.5, 6.7] },
    { line: [5.0, 11.3, 2.5, 12.4] },
    { line: [11.0, 7.8, 13.5, 6.7] },
    { line: [11.0, 11.3, 13.5, 12.4] },
  ]),

  // três blocos e a peça solta: o gesto 2x2 do codicon, agora com raio
  extensions: p([
    { rect: { x: 1.6, y: 1.6, w: 5.4, h: 5.4, r: R } },
    { rect: { x: 1.6, y: 9.0, w: 5.4, h: 5.4, r: R } },
    { rect: { x: 9.0, y: 9.0, w: 5.4, h: 5.4, r: R } },
    ...rounded(
      [
        [11.7, 1.6],
        [14.4, 4.3],
        [11.7, 7.0],
        [9.0, 4.3],
      ],
      0.9,
      true,
    ),
  ]),

  // --- layout e título ---

  // moldura + divisória: as três variantes só mudam onde a divisória cai, que
  // é o mesmo contrato do lucide (panel-left / panel-right / panel-bottom)
  'layout-sidebar-left': p([MOLDURA, { line: [5.6, 2.5, 5.6, 13.5] }]),
  'layout-sidebar-right': p([MOLDURA, { line: [10.4, 2.5, 10.4, 13.5] }]),
  'layout-panel': p([MOLDURA, { line: [1.8, 10.2, 14.2, 10.2] }]),

  menu: p(BARRAS),
  // mesmo glifo de `menu`: nos codicons os dois ids são o mesmo desenho
  'three-bars': p(BARRAS),

  // --- barra de status ---

  // os dois bicos do "><": junção redonda no ápice, senão vira agulha
  remote: p([
    { line: [3.2, 4.5, 6.0, 8.0, 3.2, 11.5] },
    { line: [12.8, 4.5, 10.0, 8.0, 12.8, 11.5] },
  ]),

  // lucide/git-branch: dois nós, o tronco e o arco que desvia
  'git-branch': p([
    { ring: { cx: 12.0, cy: 4.0, r: 2.0 } },
    { ring: { cx: 4.0, cy: 12.0, r: 2.0 } },
    { line: [4.0, 2.0, 4.0, 10.0] },
    { arc: { cx: 6.0, cy: 6.0, r: 6.0, from: 0, to: 90 } },
  ]),

  // dois arcos girando no mesmo sentido, cada um com ponta de seta aberta
  sync: p([
    { arc: { cx: 8, cy: 8, r: 5.0, from: 200, to: 335 } },
    seta(pol(8, 8, 5.0, 335), tangente(335)),
    { arc: { cx: 8, cy: 8, r: 5.0, from: 20, to: 155 } },
    seta(pol(8, 8, 5.0, 155), tangente(155)),
  ]),

  bell: p([...sino(8, 7.6, 3.5, 10.5, 1.0), { arc: { cx: 8, cy: 11.6, r: 1.6, from: 25, to: 155 } }]),

  // o sino sai do centro e encolhe para o badge caber sem encostar
  'bell-dot': p([
    ...sino(6.9, 8.4, 3.2, 11.0, 0.8),
    { arc: { cx: 6.9, cy: 12.1, r: 1.4, from: 25, to: 155 } },
    { ring: { cx: 12.6, cy: 3.6, r: 1.75 } },
  ]),

  error: p([
    { ring: { cx: 8, cy: 8, r: 5.0 } },
    { line: [5.6, 5.6, 10.4, 10.4] },
    { line: [10.4, 5.6, 5.6, 10.4] },
  ]),

  warning: p([
    ...rounded(
      [
        [8.0, 2.3],
        [14.3, 13.4],
        [1.7, 13.4],
      ],
      R,
      true,
    ),
    { line: [8, 6.4, 8, 9.7] },
    // ponto sólido de raio = meia-espessura: é o `h.01` do lucide, não decoração
    { dot: { cx: 8, cy: 11.6, r: W / 2 } },
  ]),

  // --- árvore e explorer ---

  'chevron-right': p([{ line: [6.0, 3.6, 10.4, 8.0, 6.0, 12.4] }]),
  'chevron-down': p([{ line: [3.6, 6.0, 8.0, 10.4, 12.4, 6.0] }]),

  file: p([...rounded(PAGINA, R, true), ...rounded(DOBRA)]),

  folder: p(rounded(PASTA, R, true)),

  // pasta de trás em L aberto + a aba da frente em trapézio
  'folder-opened': p([
    ...rounded([
      [11.6, 8.2],
      [11.6, 4.5],
      [7.75, 4.5],
      [5.9, 2.4],
      [1.6, 2.4],
      [1.6, 12.7],
    ]),
    ...rounded(
      [
        [1.7, 12.7],
        [4.1, 7.9],
        [14.2, 7.9],
        [11.8, 12.7],
      ],
      R,
      true,
    ),
  ]),

  'new-file': p([...rounded(PAGINA, R, true), ...rounded(DOBRA), ...mais(8.1, 10.0, 2.0)]),

  'new-folder': p([...rounded(PASTA, R, true), ...mais(8.0, 9.1, 2.0)]),

  // espelho de `files` (a caixa da frente sobe para a esquerda) com o menos
  // dentro, que é o que separa os dois glifos a 16px
  'collapse-all': p([
    { rect: { x: 1.6, y: 1.6, w: 8.9, h: 8.9, r: R } },
    ...rounded([
      [10.5, 5.6],
      [14.4, 5.6],
      [14.4, 14.4],
      [5.6, 14.4],
      [5.6, 10.5],
    ]),
    { line: [4.2, 6.05, 7.9, 6.05] },
  ]),

  // volta quase completa com a boca à direita e a seta no alto
  refresh: p([
    { arc: { cx: 8, cy: 8, r: 5.2, from: 40, to: 320 } },
    seta(pol(8, 8, 5.2, 320), tangente(320), 2.8, 45),
  ]),

  // livro aberto: duas páginas fechadas que compartilham a lombada
  book: p([
    ...rounded(
      [
        [8.0, 4.4],
        [5.2, 2.9],
        [1.8, 2.9],
        [1.8, 11.5],
        [5.2, 11.5],
        [8.0, 13.1],
      ],
      R,
      true,
    ),
    ...rounded(
      [
        [8.0, 4.4],
        [10.8, 2.9],
        [14.2, 2.9],
        [14.2, 11.5],
        [10.8, 11.5],
        [8.0, 13.1],
      ],
      R,
      true,
    ),
  ]),

  check: p([{ line: [2.9, 8.2, 6.2, 11.5, 13.1, 4.5] }]),

  info: p([
    { ring: { cx: 8, cy: 8, r: 5.0 } },
    { dot: { cx: 8, cy: 5.2, r: W / 2 } },
    { line: [8, 7.5, 8, 11.0] },
  ]),
}

module.exports = { PRODUCT_SHAPES }
