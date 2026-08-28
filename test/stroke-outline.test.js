// @ts-check
'use strict'

/**
 * Travas do conversor traço -> contorno preenchido (`scripts/stroke-outline.js`).
 *
 * Testar a string do `d` não prova quase nada: um `sweep-flag` trocado, um furo
 * rebobinado no sentido errado ou um cap virado para dentro geram um `d`
 * perfeitamente bem-formado e um desenho errado. Como a fonte preenche com
 * winding nonzero, o erro clássico ("o miolo do anel virou disco sólido") só
 * aparece depois de RASTERIZAR.
 *
 * Então é isso que se faz aqui: cada caso vira um SVG 16x16 renderizado em 64x64
 * com o `sharp` (1 unidade da grade = 4 pixels) e as asserções olham pixel.
 */

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { outline, strokedSvg } = require('../scripts/stroke-outline')

let sharp = null
try {
  sharp = require('sharp')
} catch (_) {
  sharp = null
}

/** Lado da caixa do ícone (a mesma grade 16x16 do product icon theme). */
const BOX = 16
/** Fator de amostragem: 16 -> 64 px, 1 unidade = 4 px. */
const SCALE = 4
const SIDE = BOX * SCALE

/** Preto = coberto pelo preenchimento. */
const LIMIAR = 128

/**
 * Rasteriza o `d` como path preenchido preto sobre branco.
 * @param {string} d
 * @returns {Promise<{ at: (x: number, y: number) => number, preto: (x: number, y: number) => boolean }>}
 */
async function render(d) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIDE}" height="${SIDE}"` +
    ` viewBox="0 0 ${BOX} ${BOX}">` +
    `<rect x="0" y="0" width="${BOX}" height="${BOX}" fill="#ffffff"/>` +
    `<path d="${d}" fill="#000000"/></svg>`
  const { data } = await sharp(Buffer.from(svg))
    .flatten({ background: '#ffffff' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const at = (x, y) => data[y * SIDE + x]
  return { at, preto: (x, y) => at(x, y) < LIMIAR }
}

/** Converte coordenada da grade 16x16 no índice do pixel que a contém. */
function px(u) {
  return Math.floor(u * SCALE)
}

/** Conta pixels pretos de uma coluna inteira. */
function alturaDaColuna(r, x) {
  let total = 0
  for (let y = 0; y < SIDE; y += 1) if (r.preto(x, y)) total += 1
  return total
}

const temSharp = sharp !== null
const pular = { skip: temSharp ? false : 'sharp indisponível' }

// ---------------------------------------------------------------------------
// 1. Linha com cap redondo
// ---------------------------------------------------------------------------

test('linha horizontal: banda com a espessura pedida e pontas ARREDONDADAS', pular, async () => {
  const d = outline([{ line: [2, 8, 14, 8] }], { w: 1.5 })
  const r = await render(d)

  // No meio do traço a banda tem 1.5 unidades = 6 px.
  assert.ok(r.preto(px(8), px(8)), 'centro do traço deveria ser preto')
  const altura = alturaDaColuna(r, px(8))
  assert.ok(altura >= 5 && altura <= 7, `espessura fora do esperado: ${altura} px (esperado ~6)`)

  // Fora da banda, acima e abaixo: branco.
  assert.ok(!r.preto(px(8), px(8) - 5), 'acima da banda deveria ser branco')
  assert.ok(!r.preto(px(8), px(8) + 5), 'abaixo da banda deveria ser branco')

  // Ponta esquerda: o cap é um semicírculo de raio 0.75 centrado em (2, 8).
  // O CANTO do bounding box da ponta (1.25, 7.25) fica FORA do círculo.
  assert.ok(!r.preto(5, 29), 'canto do bounding box da ponta deveria ser branco (cap redondo)')
  // O MEIO da ponta, na mesma coluna, está dentro do círculo.
  assert.ok(r.preto(5, 32), 'meio da ponta deveria ser preto')

  // Mesma coisa do lado direito.
  assert.ok(!r.preto(SIDE - 6, 29), 'canto direito deveria ser branco')
  assert.ok(r.preto(SIDE - 6, 32), 'meio da ponta direita deveria ser preto')
})

// ---------------------------------------------------------------------------
// 2. Cap reto
// ---------------------------------------------------------------------------

test("cap 'butt': a ponta é reta, o canto do bounding box é PRETO", pular, async () => {
  const d = outline([{ line: [2, 8, 14, 8], cap: 'butt' }], { w: 1.5 })
  const r = await render(d)

  // A ponta agora é um canto vivo em (2, 7.25) -> pixel (8, 29).
  assert.ok(r.preto(9, 30), 'canto da ponta reta deveria ser preto')
  // E o bojo do cap redondo sumiu: nada à esquerda de x = 2.
  assert.ok(!r.preto(5, 32), 'não deveria sobrar bojo à esquerda com cap butt')

  // A espessura continua a mesma.
  const altura = alturaDaColuna(r, px(8))
  assert.ok(altura >= 5 && altura <= 7, `espessura fora do esperado: ${altura} px`)
})

// ---------------------------------------------------------------------------
// 3. Anel — o teste mais importante do arquivo
// ---------------------------------------------------------------------------

test('ring: o miolo é FURO (rebobinagem correta), não disco sólido', pular, async () => {
  const d = outline([{ ring: { cx: 8, cy: 8, r: 5 } }], { w: 1.5 })
  const r = await render(d)

  // Se a subpath interna saísse no mesmo sentido da externa, o nonzero
  // preencheria tudo e este pixel seria preto.
  assert.ok(!r.preto(px(8), px(8)), 'o centro do anel deveria ser BRANCO')

  // A borda existe nos quatro pontos cardeais (linha de centro em r = 5).
  assert.ok(r.preto(px(8), px(3)), 'borda norte deveria ser preta')
  assert.ok(r.preto(px(8), px(13)), 'borda sul deveria ser preta')
  assert.ok(r.preto(px(3), px(8)), 'borda oeste deveria ser preta')
  assert.ok(r.preto(px(13), px(8)), 'borda leste deveria ser preta')

  // Entre o furo e a borda: branco (raio 2 está bem dentro do miolo).
  assert.ok(!r.preto(px(8), px(6)), 'miolo perto da borda deveria ser branco')

  // Fora do anel: branco.
  assert.ok(!r.preto(px(8), 1), 'fora do anel deveria ser branco')
})

test('ring com traço mais grosso que o raio vira disco cheio', pular, async () => {
  const d = outline([{ ring: { cx: 8, cy: 8, r: 1 } }], { w: 3 })
  const r = await render(d)
  assert.ok(r.preto(px(8), px(8)), 'sem miolo possível, o centro deveria ser preto')
})

// ---------------------------------------------------------------------------
// 4. Retângulo traçado
// ---------------------------------------------------------------------------

test('rect traçado: miolo branco, borda preta e canto externo ARREDONDADO', pular, async () => {
  const d = outline([{ rect: { x: 3, y: 3, w: 10, h: 10, r: 2 }, stroke: 1.5 }], {})
  const r = await render(d)

  assert.ok(!r.preto(px(8), px(8)), 'o miolo do retângulo deveria ser BRANCO')
  assert.ok(r.preto(px(8), px(3)), 'borda de cima deveria ser preta')
  assert.ok(r.preto(px(8), px(13)), 'borda de baixo deveria ser preta')
  assert.ok(r.preto(px(3), px(8)), 'borda esquerda deveria ser preta')
  assert.ok(r.preto(px(13), px(8)), 'borda direita deveria ser preta')

  // Canto externo do bounding box: fora do arco de raio 2.75 centrado em (5,5).
  assert.ok(!r.preto(9, 9), 'canto externo do bounding box deveria ser branco')
  // Já o canto arredondado em si (na diagonal, sobre a linha de centro) é preto.
  assert.ok(r.preto(px(5 - 2 * Math.SQRT1_2), px(5 - 2 * Math.SQRT1_2)), 'o canto arredondado deveria ser preto')
})

test('rect com r = 0 usa a decomposição e ainda arredonda as junções', pular, async () => {
  const d = outline([{ rect: { x: 4, y: 4, w: 8, h: 8, r: 0 }, stroke: 1.5 }], {})
  const r = await render(d)

  assert.ok(!r.preto(px(8), px(8)), 'miolo deveria ser branco')
  assert.ok(r.preto(px(8), px(4)), 'borda de cima deveria ser preta')
  // Junção redonda: o canto (4,4) tem bojo circular de raio 0.75, não canto vivo.
  assert.ok(r.preto(px(4 - 0.5 * Math.SQRT1_2), px(4 - 0.5 * Math.SQRT1_2)), 'a junção deveria ser sólida')
  assert.ok(!r.preto(px(4 - 0.74), px(4 - 0.74)), 'o canto vivo (miter) não deveria existir')
})

// ---------------------------------------------------------------------------
// 5. Polyline em L: junção sólida, sem entalhe
// ---------------------------------------------------------------------------

test('polyline em L: a junção é sólida e sem entalhe', pular, async () => {
  const d = outline([{ line: [3, 3, 3, 13, 13, 13] }], { w: 1.5 })
  const r = await render(d)

  // Cotovelo.
  assert.ok(r.preto(px(3), px(13)), 'o pixel do cotovelo deveria ser preto')

  // O ponto onde um entalhe apareceria: a 0.5 unidade do cotovelo, na diagonal
  // externa. Dois estádios com cap reto deixariam esta quina vazia; com cap
  // redondo ela está dentro do círculo de raio 0.75.
  assert.ok(r.preto(10, 53), 'a junção externa deveria ser sólida (sem entalhe)')

  // A diagonal interna também é sólida.
  assert.ok(r.preto(px(3.4), px(12.6)), 'a junção interna deveria ser sólida')

  // Os dois braços existem.
  assert.ok(r.preto(px(3), px(6)), 'braço vertical deveria ser preto')
  assert.ok(r.preto(px(10), px(13)), 'braço horizontal deveria ser preto')
  // E o quadrante vazio do L continua vazio.
  assert.ok(!r.preto(px(9), px(6)), 'o interior do L deveria ser branco')
})

test('polyline fechada: polígono com junções redondas e miolo vazado', pular, async () => {
  const d = outline([{ line: [4, 4, 12, 4, 12, 12, 4, 12], close: true }], { w: 1.5 })
  const r = await render(d)
  assert.ok(!r.preto(px(8), px(8)), 'o miolo do polígono fechado deveria ser branco')
  assert.ok(r.preto(px(8), px(4)), 'lado de cima deveria ser preto')
  assert.ok(r.preto(px(4), px(8)), 'lado esquerdo deveria ser preto')
  // O vértice de fechamento (4,4) também recebe junção redonda.
  assert.ok(r.preto(px(4 - 0.5 * Math.SQRT1_2), px(4 - 0.5 * Math.SQRT1_2)), 'vértice de fechamento sólido')
})

// ---------------------------------------------------------------------------
// 6. Arco
// ---------------------------------------------------------------------------

test('arc de 90°: cobre o quadrante certo e NÃO cobre o oposto', pular, async () => {
  // 180° = oeste, 270° = norte; horário passa por 225° (canto superior esquerdo).
  const d = outline([{ arc: { cx: 8, cy: 8, r: 5, from: 180, to: 270 } }], { w: 1.5 })
  const r = await render(d)

  const p225 = [8 + 5 * Math.cos(Math.PI * 1.25), 8 + 5 * Math.sin(Math.PI * 1.25)]
  const p45 = [8 + 5 * Math.cos(Math.PI * 0.25), 8 + 5 * Math.sin(Math.PI * 0.25)]

  assert.ok(r.preto(px(p225[0]), px(p225[1])), 'o quadrante superior esquerdo deveria estar coberto')
  assert.ok(!r.preto(px(p45[0]), px(p45[1])), 'o quadrante oposto NÃO deveria estar coberto')

  // Pontas: 180° (oeste) e 270° (norte) estão cobertas; 90° (sul) não.
  assert.ok(r.preto(px(3), px(8)), 'ponta oeste deveria ser preta')
  assert.ok(r.preto(px(8), px(3)), 'ponta norte deveria ser preta')
  assert.ok(!r.preto(px(8), px(13)), 'o sul não deveria ser coberto')

  // O centro continua vazio: o arco é traço, não setor.
  assert.ok(!r.preto(px(8), px(8)), 'o centro deveria ser branco')
})

test('arc de 270° usa large-arc e cobre três quadrantes', pular, async () => {
  const d = outline([{ arc: { cx: 8, cy: 8, r: 5, from: 0, to: 270 } }], { w: 1.5 })
  const r = await render(d)
  assert.ok(r.preto(px(13), px(8)), 'leste (0°) coberto')
  assert.ok(r.preto(px(8), px(13)), 'sul (90°) coberto')
  assert.ok(r.preto(px(3), px(8)), 'oeste (180°) coberto')
  assert.ok(r.preto(px(8), px(3)), 'norte (270°) coberto')
  // O trecho de 315° (nordeste) é o único fora do arco.
  const p315 = [8 + 5 * Math.cos(-Math.PI * 0.25), 8 + 5 * Math.sin(-Math.PI * 0.25)]
  assert.ok(!r.preto(px(p315[0]), px(p315[1])), 'o nordeste NÃO deveria estar coberto')
  assert.ok(!r.preto(px(8), px(8)), 'o centro deveria ser branco')
})

test('arc com from > to desenha o mesmo traço (o sentido é normalizado)', () => {
  const a = outline([{ arc: { cx: 8, cy: 8, r: 5, from: 180, to: 270 } }], { w: 1.5 })
  const b = outline([{ arc: { cx: 8, cy: 8, r: 5, from: 270, to: 180 } }], { w: 1.5 })
  assert.equal(a, b)
})

// ---------------------------------------------------------------------------
// 7. Determinismo e higiene da string
// ---------------------------------------------------------------------------

/** Amostra representativa de todas as primitivas. */
const AMOSTRA = [
  { line: [2, 8, 14, 8] },
  { line: [3, 3, 3, 13, 13, 13], cap: 'butt' },
  { line: [4, 4, 12, 4, 12, 12], close: true, w: 2 },
  { arc: { cx: 8, cy: 8, r: 5, from: 180, to: 270 } },
  { arc: { cx: 8, cy: 8, r: 4, from: 0, to: 300 } },
  { ring: { cx: 8, cy: 8, r: 5 } },
  { dot: { cx: 8, cy: 8, r: 1.5 } },
  { rect: { x: 3, y: 3, w: 10, h: 10, r: 2 }, stroke: 1.5 },
  { rect: { x: 3, y: 3, w: 10, h: 10, r: 0 }, stroke: 1.5 },
  { fill: 'M 6 5 L 11 8 L 6 11 Z' }
]

test('determinístico: mesma entrada, string idêntica', () => {
  const a = outline(AMOSTRA, { w: 1.5 })
  const b = outline(AMOSTRA, { w: 1.5 })
  assert.equal(a, b)
  assert.ok(a.length > 0)
})

test('a saída nunca contém NaN, Infinity nem notação científica', () => {
  const d = outline(AMOSTRA, { w: 1.5 })
  assert.ok(!d.includes('NaN'), 'apareceu NaN na saída')
  assert.ok(!d.includes('Infinity'), 'apareceu Infinity na saída')
  assert.ok(!/e[+-]\d/i.test(d), 'apareceu notação científica na saída')
  assert.ok(!d.includes('undefined'), 'apareceu undefined na saída')
})

test('a saída usa só comandos absolutos M L Q A Z (lint de fonte)', () => {
  for (const prim of AMOSTRA) {
    const d = outline([prim], { w: 1.5 })
    assert.ok(d.length > 0, `primitiva não gerou nada: ${JSON.stringify(prim)}`)
    assert.match(d, /^[MLQAZ0-9\s.,-]+$/, `comando proibido em: ${d}`)
  }
  const todos = outline(AMOSTRA, { w: 1.5 })
  assert.match(todos, /^[MLQAZ0-9\s.,-]+$/)
  // Sem markup: o retorno é só o `d`.
  assert.ok(!todos.includes('<'), 'a saída não deveria conter markup')
  assert.ok(!/transform|stroke|fill=/.test(todos), 'a saída não deveria conter atributos')
})

test('toda coordenada sai com no máximo 2 casas decimais', () => {
  const d = outline(AMOSTRA, { w: 1.5 })
  for (const num of d.match(/-?\d+(?:\.\d+)?/g) || []) {
    const frac = num.split('.')[1]
    assert.ok(!frac || frac.length <= 2, `coordenada com mais de 2 casas: ${num}`)
  }
})

test('todo subcaminho é fechado com Z e começa com M', () => {
  const d = outline(AMOSTRA, { w: 1.5 })
  for (const sub of d.split('M').slice(1)) {
    assert.match(sub.trim(), /Z$/, `subcaminho sem Z: M${sub}`)
  }
  assert.match(d.trim(), /^M/)
})

// ---------------------------------------------------------------------------
// 8. Disco
// ---------------------------------------------------------------------------

test('dot: disco cheio', pular, async () => {
  const d = outline([{ dot: { cx: 8, cy: 8, r: 3 } }], { w: 1.5 })
  const r = await render(d)
  assert.ok(r.preto(px(8), px(8)), 'o centro do disco deveria ser preto')
  assert.ok(r.preto(px(8), px(6)), 'dentro do raio deveria ser preto')
  assert.ok(!r.preto(px(8), px(3)), 'fora do raio deveria ser branco')
})

// ---------------------------------------------------------------------------
// Extras: espessura, união e o helper de inspeção
// ---------------------------------------------------------------------------

test('a espessura da primitiva sobrescreve a global', pular, async () => {
  const fino = await render(outline([{ line: [2, 8, 14, 8] }], { w: 1 }))
  const grosso = await render(outline([{ line: [2, 8, 14, 8], w: 3 }], { w: 1 }))
  const a = alturaDaColuna(fino, px(8))
  const b = alturaDaColuna(grosso, px(8))
  assert.ok(a >= 3 && a <= 5, `w global não aplicada: ${a} px`)
  assert.ok(b >= 11 && b <= 13, `w da primitiva não aplicada: ${b} px`)
})

test('`stroke` tem precedência sobre `w` na mesma primitiva', () => {
  const a = outline([{ line: [2, 8, 14, 8], w: 9, stroke: 1.5 }], { w: 4 })
  const b = outline([{ line: [2, 8, 14, 8] }], { w: 1.5 })
  assert.equal(a, b)
})

test('primitivas sobrepostas se unem (mesmo sentido, winding nonzero)', pular, async () => {
  // Dois traços cruzados: a interseção não pode virar furo.
  const d = outline([{ line: [2, 8, 14, 8] }, { line: [8, 2, 8, 14] }], { w: 1.5 })
  const r = await render(d)
  assert.ok(r.preto(px(8), px(8)), 'a interseção de dois traços deveria ser sólida')
  assert.ok(r.preto(px(4), px(8)), 'braço horizontal preto')
  assert.ok(r.preto(px(8), px(4)), 'braço vertical preto')
})

test('`fill` passa direto, sem tocar na geometria', () => {
  const bruto = 'M 6 5 L 11 8 L 6 11 Z'
  assert.equal(outline([{ fill: bruto }], { w: 1.5 }), bruto)
})

test('entradas degeneradas não geram lixo nem quebram', () => {
  assert.equal(outline([], {}), '')
  assert.equal(outline(/** @type {any} */ (null), {}), '')
  assert.equal(outline([/** @type {any} */ (null), /** @type {any} */ (42)], {}), '')
  assert.equal(outline([{ line: [] }], {}), '')
  assert.equal(outline([{ line: [5, 5] }], { w: 0 }), '')
  // Ponto único com cap redondo vira o disco do cap.
  const ponto = outline([{ line: [8, 8] }], { w: 2 })
  assert.ok(ponto.startsWith('M'))
  assert.ok(!ponto.includes('NaN'))
})

test('outline() e strokedSvg() não são afetados por chamadas anteriores', () => {
  const antes = outline(AMOSTRA, { w: 1.5 })
  strokedSvg(AMOSTRA, { w: 1.5 })
  outline(AMOSTRA, { w: 3 })
  assert.equal(outline(AMOSTRA, { w: 1.5 }), antes)
})

test('strokedSvg: markup 16x16 com traço de verdade, para conferir a olho', () => {
  const svg = strokedSvg(AMOSTRA, { w: 1.5 })
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="16" height="16" viewBox="0 0 16 16">/)
  assert.match(svg, /<\/svg>$/)
  assert.match(svg, /stroke-linecap="round"/)
  assert.match(svg, /stroke-linecap="butt"/)
  assert.match(svg, /stroke-linejoin="round"/)
  assert.match(svg, /stroke-width="1\.5"/)
  assert.ok(!svg.includes('NaN'))
  // Uma <path> por primitiva da amostra.
  assert.equal((svg.match(/<path /g) || []).length, AMOSTRA.length)
  // O helper é só inspeção: nada de <rect>/<circle>/<g>/transform.
  assert.ok(!/<(rect|circle|g)\b|transform=/.test(svg), 'strokedSvg deveria usar só <path>')
  assert.equal(svg, strokedSvg(AMOSTRA, { w: 1.5 }), 'strokedSvg deveria ser determinístico')
})

test('strokedSvg desenha o mesmo miolo vazado que outline (comparação visual)', pular, async () => {
  // Rasteriza o preview traçado e confere que o anel também tem furo lá.
  const svg = strokedSvg([{ ring: { cx: 8, cy: 8, r: 5 } }], { w: 1.5 })
  const pintado = svg.replace('<svg ', '<svg color="#000000" ').replace('width="16" height="16"', `width="${SIDE}" height="${SIDE}"`)
  const { data } = await sharp(Buffer.from(pintado))
    .flatten({ background: '#ffffff' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const at = (x, y) => data[y * SIDE + x]
  assert.ok(at(px(8), px(8)) >= LIMIAR, 'o preview traçado também deveria ter o miolo branco')
  assert.ok(at(px(8), px(3)) < LIMIAR, 'o preview traçado deveria ter borda')
})
