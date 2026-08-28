// @ts-check
'use strict'

/**
 * Conjunto B da geometria do product icon theme — abas/editor, paineis, acoes
 * comuns e feedback. Par do conjunto A (`product-shapes-a.js`).
 *
 * ## Como estas formas nascem
 *
 * O desenho NAO e mais tracado a mao como contorno preenchido. Ele e declarado
 * em primitivas de traco (`line`, `arc`, `ring`, `dot`, `rect`, `fill`) e
 * convertido por `scripts/stroke-outline.js`, que devolve o `d` de um unico
 * `<path>` preenchido com winding nonzero — pontas e junçoes redondas de graça.
 * O contrato do arquivo continua o mesmo: `PRODUCT_SHAPES[id]` e markup
 * `<path d="..."/>`, que e o que `scripts/build-product-font.js` consome.
 *
 * Motivo: a fonte nao tem traço. O `svgicons2svgfont` le apenas geometria e
 * descarta todo atributo de pintura — um `stroke` viraria glifo vazio e um
 * `fill="none"` viraria borrao solido. Tracar a mao o contorno de uma polyline
 * com ponta redonda e inviavel; por isso o motor.
 *
 * ## Constantes (docs/traco-puelche.md, grade de produto)
 *
 * - grade 16x16 (1 unidade = 1 pixel na caixa de codicon do VS Code)
 * - espessura do traço 1.35 e raio de canto 1.35 (raio = espessura, sempre)
 * - caixa de conteudo 1.5 a 14.5; com o traço centrado a tinta chega a ~0.83 e
 *   ~15.18, que e o que o lint de `test/icons.test.js` aceita
 * - teto de 3 elementos visuais por glifo: a 16px nada alem disso le
 * - preenchimento solido so onde a forma E solida (o triangulo de `play` e de
 *   `run-all`, o disco de `circle-filled`)
 *
 * ## O que ainda e markup cru
 *
 * Os 11 glifos aprovados na auditoria de traço (`gear`, `settings-gear`,
 * `account`, `lightbulb`, `loading`, `history`, `eye`, `ellipsis`,
 * `kebab-vertical`, `circle-filled`, `add`) ficaram com a geometria intocada:
 * ja estao na espessura 1.35 e redesenha-los so introduziria risco. Eles seguem
 * como string literal, com o winding escrito a mao (contorno horario, furo
 * anti-horario, no MESMO `d`).
 *
 * ## Regra de estabilidade
 *
 * Nao renomeie, nao remova e nao acrescente id. `data/product-codepoints.json`
 * e append-only e trava id -> codepoint: um id novo consome numero novo e um id
 * sumido quebra `data/product-icons.json`. Redesenhar o desenho de um id
 * existente e seguro.
 */

const { outline } = require('./stroke-outline')

/** Espessura do traço na grade de produto. */
const W = 1.35
/** Raio de canto: igual a espessura, por regra da spec. */
const R = 1.35

/**
 * Converte primitivas de traço no markup final de um glifo.
 * @param {import('./stroke-outline').Primitive[]} prims
 * @returns {string}
 */
const p = (prims) => `<path d="${outline(prims, { w: W })}"/>`

/**
 * Triangulo apontando para a direita, SOLIDO e de cantos arredondados: o
 * contorno tracado (junçoes redondas) unido ao miolo preenchido. O miolo vai
 * como `fill` cru e precisa sair no sentido HORARIO na tela — winding nonzero
 * nao perdoa o contrario.
 * @param {number} x  ponta esquerda (x)
 * @param {number} yTop
 * @param {number} yBottom
 * @param {number} tip x da ponta direita
 * @returns {import('./stroke-outline').Primitive[]}
 */
function solidTriangle(x, yTop, yBottom, tip) {
  const yMid = (yTop + yBottom) / 2
  return [
    { line: [x, yTop, tip, yMid, x, yBottom], close: true },
    { fill: `M ${x} ${yTop} L ${tip} ${yMid} L ${x} ${yBottom} Z` }
  ]
}

/** @type {Record<string, string>} */
const PRODUCT_SHAPES = {
  // --- abas e editor ---

  // X: duas retas cruzadas; a interseçao se funde sozinha (tudo horario)
  close: p([{ line: [4.2, 4.2, 11.8, 11.8] }, { line: [11.8, 4.2, 4.2, 11.8] }]),

  // disco solido (aba suja) — aprovado na auditoria, geometria intocada
  'circle-filled': '<path d="M3.7 8A4.3 4.3 0 1 1 12.3 8A4.3 4.3 0 1 1 3.7 8Z"/>',

  // janela com divisoria vertical no centro: dois paineis iguais.
  // A moldura e a MESMA de `layout-panel` e `layout-sidebar-*` (conjunto A):
  // os quatro sao a familia "layout do editor" e o que os distingue e ONDE a
  // divisoria cai — centro aqui, coluna estreita nos sidebars, faixa baixa no
  // panel. Moldura diferente entre irmaos seria inconsistencia, nao distincao.
  'split-horizontal': p([
    { rect: { x: 1.8, y: 2.5, w: 12.4, h: 11, r: R } },
    { line: [8, 2.5, 8, 13.5] }
  ]),

  // Preview ao lado: a MESMA moldura e divisoria central de `split-horizontal`,
  // mais uma linha de CONTEUDO no painel da direita. E o conteudo que separa os
  // dois — `split-horizontal` abre dois paineis vazios, `preview` mostra algo
  // num deles. Sem essa linha os dois sao o mesmo desenho, e com a barra de
  // titulo que estava aqui antes ele lia como mais um seletor de layout.
  preview: p([
    { rect: { x: 1.8, y: 2.5, w: 12.4, h: 11, r: R } },
    { line: [8, 2.5, 8, 13.5] },
    { line: [9.9, 8, 12.3, 8] }
  ]),

  // pagina de canto cortado + seta que ATRAVESSA a borda direita. A seta
  // precisa desse comprimento: encurtada para dentro da pagina, a 16px ela
  // virava um tracinho gordo sem cabeca
  'go-to-file': p([
    { line: [2.6, 1.8, 7.4, 1.8, 10.4, 4.8, 10.4, 14.2, 2.6, 14.2], close: true },
    { line: [5.8, 9.5, 13.8, 9.5] },
    { line: [11.5, 7.2, 13.8, 9.5, 11.5, 11.8] }
  ]),

  // disquete: moldura + obturador (U para cima) + etiqueta (U para baixo)
  save: p([
    { rect: { x: 2, y: 2, w: 12, h: 12, r: R } },
    { line: [5.4, 2, 5.4, 5.6, 10.6, 5.6, 10.6, 2] },
    { line: [4.6, 14, 4.6, 9.4, 11.4, 9.4, 11.4, 14] }
  ]),

  // disquete com a folha de tras insinuada por um L
  'save-all': p([
    { line: [5, 1.8, 14.2, 1.8, 14.2, 11] },
    { rect: { x: 1.6, y: 4.4, w: 10, h: 10, r: R } },
    { line: [3.8, 14.4, 3.8, 10.6, 9.4, 10.6, 9.4, 14.4] }
  ]),

  // --- paineis ---

  // prompt sem moldura: chevron + underscore (silhueta solta, ao contrario dos
  // dois vizinhos deste grupo, que sao janelas)
  terminal: p([
    { line: [3.2, 4, 7, 8, 3.2, 12] },
    { line: [8.6, 12, 13.4, 12] }
  ]),

  // painel deitado com duas linhas de log
  output: p([
    { rect: { x: 1.6, y: 3.4, w: 12.8, h: 9.2, r: R } },
    { line: [4.2, 6.6, 11.8, 6.6] },
    { line: [4.2, 9.4, 9, 9.4] }
  ]),

  // painel deitado com prompt: chevron + underscore
  'debug-console': p([
    { rect: { x: 1.6, y: 3.4, w: 12.8, h: 9.2, r: R } },
    { line: [4.3, 5.8, 6.4, 8, 4.3, 10.2] },
    { line: [8.2, 10.2, 11.6, 10.2] }
  ]),

  // play solido + lista (duas linhas; a terceira caiu pelo teto de 3 elementos)
  'run-all': p([
    ...solidTriangle(3, 3.4, 12.6, 7.2),
    { line: [9.6, 5.4, 14, 5.4] },
    { line: [9.6, 10.6, 14, 10.6] }
  ]),

  // --- acoes comuns ---

  // cruz — aprovado na auditoria, geometria intocada
  add:
    '<path d="M3.3 7.3L12.7 7.3A0.7 0.7 0 0 1 13.4 8L13.4 8A0.7 0.7 0 0 1 12.7 8.7' +
    'L3.3 8.7A0.7 0.7 0 0 1 2.6 8L2.6 8A0.7 0.7 0 0 1 3.3 7.3Z' +
    'M8 2.6L8 2.6A0.7 0.7 0 0 1 8.7 3.3L8.7 12.7A0.7 0.7 0 0 1 8 13.4L8 13.4A0.7 0.7 0 0 1 7.3 12.7' +
    'L7.3 3.3A0.7 0.7 0 0 1 8 2.6Z"/>',
  // tres pontos na horizontal — aprovado na auditoria, geometria intocada
  ellipsis:
    '<path d="M2.35 8A1.15 1.15 0 1 1 4.65 8A1.15 1.15 0 1 1 2.35 8Z' +
    'M6.85 8A1.15 1.15 0 1 1 9.15 8A1.15 1.15 0 1 1 6.85 8Z' +
    'M11.35 8A1.15 1.15 0 1 1 13.65 8A1.15 1.15 0 1 1 11.35 8Z"/>',
  // tres pontos na vertical — aprovado na auditoria, geometria intocada
  'kebab-vertical':
    '<path d="M6.85 3.5A1.15 1.15 0 1 1 9.15 3.5A1.15 1.15 0 1 1 6.85 3.5Z' +
    'M6.85 8A1.15 1.15 0 1 1 9.15 8A1.15 1.15 0 1 1 6.85 8Z' +
    'M6.85 12.5A1.15 1.15 0 1 1 9.15 12.5A1.15 1.15 0 1 1 6.85 12.5Z"/>',
  // engrenagem de 8 dentes, miolo grande — aprovado na auditoria
  'settings-gear':
    '<path d="M14.94 7.07A7 7 0 0 1 14.94 8.93L12.55 9.17A4.7 4.7 0 0 1 12.05 10.39' +
    'L13.56 12.25A7 7 0 0 1 12.25 13.56L10.39 12.05A4.7 4.7 0 0 1 9.17 12.55' +
    'L8.93 14.94A7 7 0 0 1 7.07 14.94L6.83 12.55A4.7 4.7 0 0 1 5.61 12.05' +
    'L3.75 13.56A7 7 0 0 1 2.44 12.25L3.95 10.39A4.7 4.7 0 0 1 3.45 9.17' +
    'L1.06 8.93A7 7 0 0 1 1.06 7.07L3.45 6.83A4.7 4.7 0 0 1 3.95 5.61L2.44 3.75A7 7 0 0 1 3.75 2.44' +
    'L5.61 3.95A4.7 4.7 0 0 1 6.83 3.45L7.07 1.06A7 7 0 0 1 8.93 1.06' +
    'L9.17 3.45A4.7 4.7 0 0 1 10.39 3.95L12.25 2.44A7 7 0 0 1 13.56 3.75' +
    'L12.05 5.61A4.7 4.7 0 0 1 12.55 6.83ZM5 8A3 3 0 1 0 11 8A3 3 0 1 0 5 8Z"/>',
  // engrenagem de 6 dentes, miolo pequeno — aprovado na auditoria
  gear:
    '<path d="M14.2 6.88A6.3 6.3 0 0 1 14.2 9.12L12.06 9.41A4.3 4.3 0 0 1 11.26 10.81' +
    'L12.07 12.81A6.3 6.3 0 0 1 10.13 13.93L8.81 12.22A4.3 4.3 0 0 1 7.19 12.22' +
    'L5.87 13.93A6.3 6.3 0 0 1 3.93 12.81L4.74 10.81A4.3 4.3 0 0 1 3.94 9.41' +
    'L1.8 9.12A6.3 6.3 0 0 1 1.8 6.88L3.94 6.59A4.3 4.3 0 0 1 4.74 5.19' +
    'L3.93 3.19A6.3 6.3 0 0 1 5.87 2.07L7.19 3.78A4.3 4.3 0 0 1 8.81 3.78' +
    'L10.13 2.07A6.3 6.3 0 0 1 12.07 3.19L11.26 5.19A4.3 4.3 0 0 1 12.06 6.59Z' +
    'M6 8A2 2 0 1 0 10 8A2 2 0 1 0 6 8Z"/>',
  // anel com cabeca e ombros — aprovado na auditoria, geometria intocada
  account:
    '<path d="M1.4 8A6.6 6.6 0 1 1 14.6 8A6.6 6.6 0 1 1 1.4 8Z' +
    'M2.75 8A5.25 5.25 0 1 0 13.25 8A5.25 5.25 0 1 0 2.75 8Z' +
    'M6.05 6.1A1.95 1.95 0 1 1 9.95 6.1A1.95 1.95 0 1 1 6.05 6.1Z' +
    'M11 12.31L10.55 12.59L10.07 12.82L9.57 13.01L9.06 13.14L8.53 13.22L8 13.25L7.47 13.22L6.94 13.14' +
    'L6.43 13.01L5.93 12.82L5.45 12.59L5 12.31L4.58 11.98L4.87 11.43L5.24 10.93L5.69 10.51L6.21 10.16' +
    'L6.78 9.91L7.38 9.75L8 9.7L8.62 9.75L9.22 9.91L9.79 10.16L10.31 10.51L10.76 10.93L11.13 11.43' +
    'L11.42 11.98Z"/>',

  // lapis vazado na diagonal + virola
  edit: p([
    { line: [9.26, 3.77, 12.23, 6.74, 6.15, 12.82, 2.9, 13.1, 3.18, 9.85], close: true },
    { line: [7.43, 5.6, 10.4, 8.57] }
  ]),

  // lixeira: tampa, alca e cesto de fundo arredondado (os riscos internos
  // caíram: a 16px viravam ruido dentro do cesto)
  trash: p([
    { line: [2.2, 4.6, 13.8, 4.6] },
    { line: [5.4, 4.6, 5.4, 2.6, 10.6, 2.6, 10.6, 4.6] },
    { line: [4.2, 4.6, 4.2, 12.4, 5.4, 13.6, 10.6, 13.6, 11.8, 12.4, 11.8, 4.6] }
  ]),

  // funil vazado; a ponta do cone sai arredondada em w/2, sem virar agulha
  filter: p([
    {
      line: [2.2, 3.2, 13.8, 3.2, 9.4, 8.4, 9.4, 13.6, 6.6, 11.9, 6.6, 8.4],
      close: true
    }
  ]),

  // barras centradas com queda forte: a silhueta e um triangulo para baixo, e
  // nao mais "tres linhas horizontais" como `menu` e `three-bars`
  'list-filter': p([
    { line: [2.6, 4, 13.4, 4] },
    { line: [4.8, 8, 11.2, 8] },
    { line: [7, 12, 9, 12] }
  ]),

  // haste + chevron
  'arrow-left': p([
    { line: [3, 8, 13, 8] },
    { line: [7.6, 3.4, 3, 8, 7.6, 12.6] }
  ]),
  'arrow-right': p([
    { line: [3, 8, 13, 8] },
    { line: [8.4, 3.4, 13, 8, 8.4, 12.6] }
  ]),

  // --- feedback ---

  // bulbo anelado + duas barras de base — aprovado na auditoria
  lightbulb:
    '<path d="M3.5 6.3A4.5 4.5 0 1 1 12.5 6.3A4.5 4.5 0 1 1 3.5 6.3Z' +
    'M4.85 6.3A3.15 3.15 0 1 0 11.15 6.3A3.15 3.15 0 1 0 4.85 6.3Z' +
    'M6.55 11.1L9.45 11.1A0.65 0.65 0 0 1 10.1 11.75L10.1 11.75A0.65 0.65 0 0 1 9.45 12.4' +
    'L6.55 12.4A0.65 0.65 0 0 1 5.9 11.75L5.9 11.75A0.65 0.65 0 0 1 6.55 11.1Z' +
    'M7.25 13.2L8.75 13.2A0.65 0.65 0 0 1 9.4 13.85L9.4 13.85A0.65 0.65 0 0 1 8.75 14.5' +
    'L7.25 14.5A0.65 0.65 0 0 1 6.6 13.85L6.6 13.85A0.65 0.65 0 0 1 7.25 13.2Z"/>',
  // amendoa anelada (curvas Q) + pupila solida — aprovado na auditoria
  eye:
    '<path d="M1.2 8Q8 2.4 14.8 8Q8 13.6 1.2 8ZM3.15 8Q8 11.7 12.85 8Q8 4.3 3.15 8Z' +
    'M6.25 8A1.75 1.75 0 1 1 9.75 8A1.75 1.75 0 1 1 6.25 8Z"/>',

  // triangulo solido de cantos arredondados (forma solida por natureza)
  play: p(solidTriangle(4.3, 2.8, 13.2, 13)),

  // faixa anelar com folga no quadrante superior direito — aprovado na auditoria
  loading: '<path d="M13.46 4.85A6.3 6.3 0 1 1 8 1.7L8 3.05A4.95 4.95 0 1 0 12.29 5.52Z"/>',

  // dois baloes sobrepostos na diagonal, o da frente com rabicho longo. Duas
  // travas de leitura a 16px: (1) as caixas sao DEITADAS (9.2 x 5.2), senao o
  // glifo vira o mesmo "dois quadrados sobrepostos" de `files` e `collapse-all`
  // do conjunto A; (2) o deslocamento poe os quatro tracos para se CRUZAREM em
  // vez de encostarem — traco encostando em traco vira borrao
  'comment-discussion': p([
    { rect: { x: 1.6, y: 1.6, w: 9.2, h: 5.2, r: R } },
    { rect: { x: 5.2, y: 5, w: 9.2, h: 5.2, r: R } },
    { line: [7, 10.2, 6.2, 13.4, 9.6, 10.2] }
  ]),

  // seta circular + ponteiros de relogio — aprovado na auditoria
  history:
    '<path d="M6.71 2.24A6.2 6.2 0 1 1 1.89 7.22L3.22 7.46A4.85 4.85 0 1 0 6.99 3.56Z' +
    'M4.41 3.44L6.81 0.78L7.68 4.89Z' +
    'M8 4.9L8 4.9A0.65 0.65 0 0 1 8.65 5.55L8.65 8.25A0.65 0.65 0 0 1 8 8.9' +
    'L8 8.9A0.65 0.65 0 0 1 7.35 8.25L7.35 5.55A0.65 0.65 0 0 1 8 4.9Z' +
    'M8 7.65L10.6 7.65A0.65 0.65 0 0 1 11.25 8.3L11.25 8.3A0.65 0.65 0 0 1 10.6 8.95' +
    'L8 8.95A0.65 0.65 0 0 1 7.35 8.3L7.35 8.3A0.65 0.65 0 0 1 8 7.65Z"/>',
}

module.exports = { PRODUCT_SHAPES }
