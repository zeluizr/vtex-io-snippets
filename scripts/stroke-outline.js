// @ts-check
'use strict'

/**
 * Conversor de TRAÇO para CONTORNO PREENCHIDO (lógica pura, sem `vscode`, sem I/O).
 *
 * ## Por que isto existe
 *
 * A fonte do product icon theme é montada por `svgicons2svgfont`, que lê APENAS
 * geometria e descarta todo atributo de pintura: `stroke`, `stroke-width`,
 * `stroke-linecap` e `fill="none"` somem. Um ícone desenhado como linha vira
 * glifo vazio; um `fill="none"` vira borrão sólido. Por isso todo desenho tem de
 * chegar na fonte já como forma FECHADA e preenchida.
 *
 * Traçar à mão o contorno preenchido de uma polyline com ponta redonda é
 * inviável. Este módulo faz isso: recebe primitivas em linguagem de traço
 * (linha, arco, círculo, retângulo) e devolve o `d` de UM ÚNICO `<path>`
 * preenchido, no idioma Lucide — monoline, pontas e junções arredondadas.
 *
 * ## A regra que faz tudo funcionar: winding NONZERO
 *
 * A fonte preenche com winding nonzero (não even-odd). Consequências:
 *
 * - Toda subpath ADITIVA sai no MESMO sentido: **horário na tela**, com y para
 *   baixo. Formas sobrepostas no mesmo sentido se unem sozinhas. É daí que sai a
 *   junção redonda de graça: uma polyline é a UNIÃO de um "estádio" (retângulo
 *   com semicírculos nas pontas) por segmento, todos horários, e o cap redondo
 *   de um segmento preenche exatamente a junção com o vizinho.
 * - Todo FURO (miolo de um `ring`, interior de um `rect` traçado) é uma subpath
 *   rebobinada no sentido CONTRÁRIO, dentro do MESMO `d`.
 *
 * Convenção de sentido: com y para baixo, ângulo crescente a partir do leste
 * (0°) anda no sentido horário na tela, e o `sweep-flag` 1 do SVG é justamente
 * esse sentido. Portanto **sweep 1 = horário = aditivo**, **sweep 0 = furo**.
 *
 * ## Espessura: onde ela é lida (sem ambiguidade)
 *
 * A espessura NUNCA é lida de dentro do objeto de forma. Ela vem, nesta ordem:
 *
 *   1. `prim.stroke` — número, no nível da primitiva;
 *   2. `prim.w` — número, no nível da primitiva (irmão de `line`/`rect`/...);
 *   3. `options.w` — global (default 1.5).
 *
 * Logo, em `{ rect: { x, y, w, h, r } }` o `w`/`h` de DENTRO são largura e
 * altura do retângulo, e nada mais. Para não depender de leitura atenta, o
 * `rect` também aceita `rw`/`rh` como apelidos de largura/altura. E, por
 * legibilidade, prefira `stroke` para dar espessura a um `rect`:
 * `{ rect: { x: 3, y: 3, w: 10, h: 10, r: 2 }, stroke: 1.5 }`.
 *
 * ## Saída
 *
 * Só comandos de path (`M`/`L`/`A`/`Z`). Sem `transform`, sem `<g>`, sem
 * `<rect>`/`<circle>`. Toda coordenada arredondada em 2 casas. Determinístico:
 * mesma entrada → string idêntica byte a byte (nada de `Math.random`/`Date`).
 *
 * @example
 * outline([{ line: [2, 8, 14, 8] }, { ring: { cx: 8, cy: 8, r: 5 } }], { w: 1.5 })
 */

/** Espessura padrão do traço, quando `options.w` não vem. */
const DEFAULT_W = 1.5

/** Tolerância para tratar comprimento/raio como zero. */
const EPS = 1e-9

/** Passo máximo, em graus, ao achatar um arco em segmentos (caso degenerado). */
const FLATTEN_STEP = 15

/**
 * @typedef {'round'|'butt'} Cap
 *
 * @typedef {Object} ArcSpec
 * @property {number} cx   centro x
 * @property {number} cy   centro y
 * @property {number} r    raio da LINHA DE CENTRO do traço
 * @property {number} from ângulo inicial em GRAUS (0 = leste, horário na tela)
 * @property {number} to   ângulo final em GRAUS
 *
 * @typedef {Object} RingSpec
 * @property {number} cx
 * @property {number} cy
 * @property {number} r    raio da linha de centro
 *
 * @typedef {Object} DotSpec
 * @property {number} cx
 * @property {number} cy
 * @property {number} r    raio do disco cheio
 *
 * @typedef {Object} RectSpec
 * @property {number} x
 * @property {number} y
 * @property {number} [w]  LARGURA (não é espessura — ver o bloco de doc acima)
 * @property {number} [h]  ALTURA
 * @property {number} [rw] apelido de `w` (largura)
 * @property {number} [rh] apelido de `h` (altura)
 * @property {number} [r]  raio dos cantos (default 0)
 *
 * @typedef {Object} Primitive
 * @property {number[]} [line]  polyline: [x1,y1,x2,y2,...]
 * @property {Cap} [cap]        ponta da polyline aberta (default 'round')
 * @property {boolean} [close]  fecha a polyline (vira polígono; junções redondas)
 * @property {ArcSpec} [arc]
 * @property {RingSpec} [ring]
 * @property {DotSpec} [dot]
 * @property {RectSpec} [rect]
 * @property {string} [fill]    path preenchido cru, passa direto
 * @property {number} [w]       espessura só desta primitiva
 * @property {number} [stroke]  espessura só desta primitiva (tem precedência)
 *
 * @typedef {Object} OutlineOptions
 * @property {number} [w]    espessura padrão do traço (default 1.5)
 * @property {number} [size] só para `strokedSvg`: lado da caixa (default 16)
 */

// ---------------------------------------------------------------------------
// Números e trigonometria
// ---------------------------------------------------------------------------

/**
 * Arredonda em 2 casas e serializa. Normaliza `-0` para `0` para a saída não
 * depender do sinal do zero (senão o mesmo desenho geraria bytes diferentes).
 * @param {number} v
 * @returns {string}
 */
function n(v) {
  const r = Math.round(v * 100) / 100
  return String(Object.is(r, -0) ? 0 : r)
}

/** Graus para radianos. @param {number} deg */
function rad(deg) {
  return (deg * Math.PI) / 180
}

/**
 * Ponto do círculo no ângulo dado. 0° = leste; com y para baixo, ângulo
 * crescente anda no sentido horário na tela.
 * @param {number} cx @param {number} cy @param {number} r @param {number} deg
 * @returns {[number, number]}
 */
function polar(cx, cy, r, deg) {
  return [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))]
}

/**
 * Comando de arco elíptico circular.
 * @param {number} r @param {0|1} large @param {0|1} sweep
 * @param {number} x @param {number} y
 */
function arcTo(r, large, sweep, x, y) {
  return `A ${n(r)} ${n(r)} 0 ${large} ${sweep} ${n(x)} ${n(y)}`
}

// ---------------------------------------------------------------------------
// Blocos elementares — todos devolvem UMA subpath fechada
// ---------------------------------------------------------------------------

/**
 * Circunferência completa como subpath fechada, em dois arcos de 180°.
 * @param {number} cx @param {number} cy @param {number} r
 * @param {0|1} sweep 1 = horário (aditivo), 0 = anti-horário (furo)
 */
function circlePath(cx, cy, r, sweep) {
  if (r <= EPS) return ''
  const [ex, ey] = [cx + r, cy]
  const [wx, wy] = [cx - r, cy]
  return `M ${n(ex)} ${n(ey)} ${arcTo(r, 0, sweep, wx, wy)} ${arcTo(r, 0, sweep, ex, ey)} Z`
}

/**
 * "Estádio": o contorno preenchido de UM segmento de reta traçado. Sempre
 * horário na tela: começa na borda esquerda de P1, vai até P2, contorna a ponta
 * e volta pela borda direita.
 * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
 * @param {number} h meia-espessura
 * @param {Cap} capStart @param {Cap} capEnd
 */
function stadium(x1, y1, x2, y2, h, capStart, capEnd) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len <= EPS) {
    // Segmento degenerado: vira ponto. Só sobra desenho se a ponta for redonda.
    return capStart === 'round' || capEnd === 'round' ? circlePath(x1, y1, h, 1) : ''
  }
  if (h <= EPS) return ''
  const ux = dx / len
  const uy = dy / len
  // Normal "esquerda" na tela (y para baixo): girar a direção 90° anti-horário.
  const nx = uy
  const ny = -ux
  const ax = x1 + h * nx
  const ay = y1 + h * ny
  const bx = x2 + h * nx
  const by = y2 + h * ny
  const cx = x2 - h * nx
  const cy = y2 - h * ny
  const ex = x1 - h * nx
  const ey = y1 - h * ny
  const capB = capEnd === 'round' ? arcTo(h, 0, 1, cx, cy) : `L ${n(cx)} ${n(cy)}`
  const capA = capStart === 'round' ? arcTo(h, 0, 1, ax, ay) : `L ${n(ax)} ${n(ay)}`
  return `M ${n(ax)} ${n(ay)} L ${n(bx)} ${n(by)} ${capB} L ${n(ex)} ${n(ey)} ${capA} Z`
}

/**
 * Retângulo de cantos arredondados como subpath fechada.
 * @param {number} x @param {number} y @param {number} w largura @param {number} h altura
 * @param {number} r raio dos cantos (é clampado em [0, min(w,h)/2])
 * @param {0|1} sweep 1 = horário (aditivo), 0 = anti-horário (furo)
 */
function roundedRectPath(x, y, w, h, r, sweep) {
  if (w <= EPS || h <= EPS) return ''
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2))
  const right = x + w
  const bottom = y + h
  if (rr <= EPS) {
    return sweep === 1
      ? `M ${n(x)} ${n(y)} L ${n(right)} ${n(y)} L ${n(right)} ${n(bottom)} L ${n(x)} ${n(bottom)} Z`
      : `M ${n(x)} ${n(y)} L ${n(x)} ${n(bottom)} L ${n(right)} ${n(bottom)} L ${n(right)} ${n(y)} Z`
  }
  const a = (px, py) => arcTo(rr, 0, sweep, px, py)
  const start = `M ${n(x + rr)} ${n(y)}`
  if (sweep === 1) {
    return [
      start,
      `L ${n(right - rr)} ${n(y)}`,
      a(right, y + rr),
      `L ${n(right)} ${n(bottom - rr)}`,
      a(right - rr, bottom),
      `L ${n(x + rr)} ${n(bottom)}`,
      a(x, bottom - rr),
      `L ${n(x)} ${n(y + rr)}`,
      a(x + rr, y),
      'Z'
    ].join(' ')
  }
  return [
    start,
    a(x, y + rr),
    `L ${n(x)} ${n(bottom - rr)}`,
    a(x + rr, bottom),
    `L ${n(right - rr)} ${n(bottom)}`,
    a(right, bottom - rr),
    `L ${n(right)} ${n(y + rr)}`,
    a(right - rr, y),
    'Z'
  ].join(' ')
}

// ---------------------------------------------------------------------------
// Primitivas
// ---------------------------------------------------------------------------

/**
 * Normaliza os pares [x,y] de uma polyline, descartando pontos repetidos
 * consecutivos (que só gerariam estádios degenerados).
 * @param {number[]} coords
 * @returns {Array<[number, number]>}
 */
function toPoints(coords) {
  /** @type {Array<[number, number]>} */
  const pts = []
  for (let i = 0; i + 1 < coords.length; i += 2) {
    const x = Number(coords[i])
    const y = Number(coords[i + 1])
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    const last = pts[pts.length - 1]
    if (last && Math.abs(last[0] - x) <= EPS && Math.abs(last[1] - y) <= EPS) continue
    pts.push([x, y])
  }
  return pts
}

/**
 * União de estádios ao longo de uma polyline. As junções internas SEMPRE usam
 * cap redondo — é o cap de um segmento que preenche a junção com o vizinho.
 * O `cap` pedido vale só nas duas pontas livres; num caminho fechado não há
 * ponta livre, então tudo é redondo.
 * @param {Array<[number, number]>} pts
 * @param {number} h meia-espessura
 * @param {Cap} cap
 * @param {boolean} close
 */
function polylineOutline(pts, h, cap, close) {
  let list = pts
  if (close && list.length > 1) {
    const first = list[0]
    const last = list[list.length - 1]
    if (Math.abs(first[0] - last[0]) > EPS || Math.abs(first[1] - last[1]) > EPS) {
      list = list.concat([[first[0], first[1]]])
    }
  }
  if (list.length === 0) return ''
  if (list.length === 1) return cap === 'round' || close ? circlePath(list[0][0], list[0][1], h, 1) : ''
  const parts = []
  for (let i = 0; i + 1 < list.length; i += 1) {
    const isFirst = i === 0
    const isLast = i === list.length - 2
    const capStart = !close && isFirst ? cap : 'round'
    const capEnd = !close && isLast ? cap : 'round'
    const seg = stadium(list[i][0], list[i][1], list[i + 1][0], list[i + 1][1], h, capStart, capEnd)
    if (seg) parts.push(seg)
  }
  return parts.join(' ')
}

/**
 * Circunferência traçada: círculo externo horário + círculo interno
 * anti-horário (o furo), no mesmo `d`. Se a espessura engolir o miolo
 * (r <= h), vira disco cheio.
 * @param {number} cx @param {number} cy @param {number} r @param {number} h
 */
function ringOutline(cx, cy, r, h) {
  const outer = r + h
  const inner = r - h
  if (outer <= EPS) return ''
  if (inner <= EPS) return circlePath(cx, cy, outer, 1)
  return `${circlePath(cx, cy, outer, 1)} ${circlePath(cx, cy, inner, 0)}`
}

/**
 * Achata um arco numa polyline e traça com estádios. Só é usado quando o miolo
 * do arco não existe (r <= h), caso em que o par arco externo/interno degenera.
 * @param {number} cx @param {number} cy @param {number} r
 * @param {number} a0 @param {number} a1 @param {number} h
 */
function flattenedArc(cx, cy, r, a0, a1, h) {
  const span = a1 - a0
  const steps = Math.max(2, Math.ceil(Math.abs(span) / FLATTEN_STEP))
  /** @type {Array<[number, number]>} */
  const pts = []
  for (let i = 0; i <= steps; i += 1) pts.push(polar(cx, cy, r, a0 + (span * i) / steps))
  return polylineOutline(pts, h, 'round', false)
}

/**
 * Arco traçado com ponta redonda, como UMA subpath fechada horária:
 * arco externo → cap semicircular → arco interno percorrido ao contrário → cap.
 *
 * Os ângulos são ABSOLUTOS e o arco vai literalmente de `from` a `to`; o sinal
 * de `to - from` só decide por onde. Para atravessar o 0° use valores fora de
 * 0–360 (ex.: `from: 350, to: 370`), não `from: 350, to: 10` — este último é
 * lido como os 340° do outro lado. `|to - from| >= 360` vira circunferência.
 *
 * @param {number} cx @param {number} cy @param {number} r
 * @param {number} from @param {number} to @param {number} h
 */
function arcOutline(cx, cy, r, from, to, h) {
  let a0 = from
  let a1 = to
  let span = a1 - a0
  if (Math.abs(span) <= EPS) {
    // Arco de comprimento nulo: sobra só a ponta redonda.
    const [px, py] = polar(cx, cy, r, a0)
    return circlePath(px, py, h, 1)
  }
  if (span < 0) {
    // O traço não depende do sentido do percurso: normaliza para horário.
    const t = a0
    a0 = a1
    a1 = t
    span = -span
  }
  if (span >= 360) return ringOutline(cx, cy, r, h)
  const outer = r + h
  const inner = r - h
  if (outer <= EPS) return ''
  if (inner <= EPS) return flattenedArc(cx, cy, r, a0, a1, h)
  const large = /** @type {0|1} */ (span > 180 ? 1 : 0)
  const [ox0, oy0] = polar(cx, cy, outer, a0)
  const [ox1, oy1] = polar(cx, cy, outer, a1)
  const [ix1, iy1] = polar(cx, cy, inner, a1)
  const [ix0, iy0] = polar(cx, cy, inner, a0)
  return [
    `M ${n(ox0)} ${n(oy0)}`,
    arcTo(outer, large, 1, ox1, oy1),
    // cap na ponta final: semicírculo de raio h em torno da linha de centro
    arcTo(h, 0, 1, ix1, iy1),
    // borda interna percorrida de volta (sweep invertido)
    arcTo(inner, large, 0, ix0, iy0),
    // cap na ponta inicial
    arcTo(h, 0, 1, ox0, oy0),
    'Z'
  ].join(' ')
}

/**
 * Retângulo arredondado TRAÇADO.
 *
 * Caminho preferido (mais compacto, e o que a fonte digere melhor): contorno
 * externo horário (raio r + h) + contorno interno anti-horário (raio r − h).
 * Só serve quando o raio interno não é negativo.
 *
 * Se r < h — inclusive o caso r = 0 —, o interno não existe e, pior, o externo
 * ganharia canto VIVO (miter), que é justamente o que o idioma Lucide não quer.
 * Nesse caso cai na decomposição: 4 estádios nos lados retos + 4 arcos de canto,
 * todos horários, com as junções resolvidas pelos caps redondos.
 *
 * @param {number} x @param {number} y @param {number} w largura @param {number} hh altura
 * @param {number} r raio dos cantos @param {number} h meia-espessura
 */
function rectOutline(x, y, w, hh, r, h) {
  if (w <= EPS || hh <= EPS || h <= EPS) return ''
  const rr = Math.max(0, Math.min(r, Math.min(w, hh) / 2))
  const innerW = w - 2 * h
  const innerH = hh - 2 * h
  if (innerW <= EPS || innerH <= EPS) {
    // Traço grosso demais: o miolo sumiu, sobra o retângulo externo cheio.
    return roundedRectPath(x - h, y - h, w + 2 * h, hh + 2 * h, rr + h, 1)
  }
  if (rr - h >= 0) {
    return [
      roundedRectPath(x - h, y - h, w + 2 * h, hh + 2 * h, rr + h, 1),
      roundedRectPath(x + h, y + h, innerW, innerH, rr - h, 0)
    ].join(' ')
  }
  const left = x
  const top = y
  const right = x + w
  const bottom = y + hh
  const parts = []
  if (w - 2 * rr > EPS) {
    parts.push(stadium(left + rr, top, right - rr, top, h, 'round', 'round'))
    parts.push(stadium(right - rr, bottom, left + rr, bottom, h, 'round', 'round'))
  }
  if (hh - 2 * rr > EPS) {
    parts.push(stadium(right, top + rr, right, bottom - rr, h, 'round', 'round'))
    parts.push(stadium(left, bottom - rr, left, top + rr, h, 'round', 'round'))
  }
  if (rr > EPS) {
    parts.push(arcOutline(left + rr, top + rr, rr, 180, 270, h))
    parts.push(arcOutline(right - rr, top + rr, rr, 270, 360, h))
    parts.push(arcOutline(right - rr, bottom - rr, rr, 0, 90, h))
    parts.push(arcOutline(left + rr, bottom - rr, rr, 90, 180, h))
  }
  if (parts.length === 0) parts.push(circlePath(left, top, h, 1))
  return parts.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Espessura efetiva de uma primitiva: `stroke` > `w` (nível da primitiva) >
 * `options.w`. Nunca lê nada de dentro do objeto de forma.
 * @param {Primitive} prim @param {number} fallback
 */
function strokeWidthOf(prim, fallback) {
  if (typeof prim.stroke === 'number' && Number.isFinite(prim.stroke)) return prim.stroke
  if (typeof prim.w === 'number' && Number.isFinite(prim.w)) return prim.w
  return fallback
}

/** Lê largura/altura do `rect` aceitando os apelidos `rw`/`rh`. @param {RectSpec} s */
function rectSize(s) {
  const w = typeof s.rw === 'number' ? s.rw : s.w
  const h = typeof s.rh === 'number' ? s.rh : s.h
  return [Number(w) || 0, Number(h) || 0]
}

/**
 * Converte primitivas de traço no `d` de um único `<path>` preenchido.
 * Winding nonzero: aditivas horárias, furos anti-horários, tudo no mesmo `d`.
 * @param {Primitive[]} primitives
 * @param {OutlineOptions} [options]
 * @returns {string}
 */
function outline(primitives, options) {
  const opts = options || {}
  const globalW = typeof opts.w === 'number' && Number.isFinite(opts.w) ? opts.w : DEFAULT_W
  const parts = []
  for (const prim of Array.isArray(primitives) ? primitives : []) {
    if (!prim || typeof prim !== 'object') continue
    if (typeof prim.fill === 'string') {
      const raw = prim.fill.trim()
      if (raw) parts.push(raw)
      continue
    }
    const h = strokeWidthOf(prim, globalW) / 2
    if (Array.isArray(prim.line)) {
      const cap = prim.cap === 'butt' ? 'butt' : 'round'
      parts.push(polylineOutline(toPoints(prim.line), h, cap, prim.close === true))
    } else if (prim.arc) {
      const a = prim.arc
      parts.push(arcOutline(Number(a.cx), Number(a.cy), Number(a.r), Number(a.from), Number(a.to), h))
    } else if (prim.ring) {
      const c = prim.ring
      parts.push(ringOutline(Number(c.cx), Number(c.cy), Number(c.r), h))
    } else if (prim.dot) {
      const d = prim.dot
      parts.push(circlePath(Number(d.cx), Number(d.cy), Number(d.r), 1))
    } else if (prim.rect) {
      const s = prim.rect
      const [rw, rh] = rectSize(s)
      parts.push(rectOutline(Number(s.x), Number(s.y), rw, rh, Number(s.r) || 0, h))
    }
  }
  return parts.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Helper de inspeção
// ---------------------------------------------------------------------------

/**
 * Linha de CENTRO de uma primitiva, para o preview traçado.
 * @param {Primitive} prim
 * @returns {string}
 */
function centerlineOf(prim) {
  if (Array.isArray(prim.line)) {
    const pts = toPoints(prim.line)
    if (pts.length === 0) return ''
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${n(p[0])} ${n(p[1])}`).join(' ')
    return prim.close === true ? `${d} Z` : d
  }
  if (prim.arc) {
    const a = prim.arc
    let a0 = Number(a.from)
    let a1 = Number(a.to)
    let span = a1 - a0
    if (span < 0) {
      const t = a0
      a0 = a1
      a1 = t
      span = -span
    }
    if (span >= 360) return circlePath(Number(a.cx), Number(a.cy), Number(a.r), 1)
    const [x0, y0] = polar(Number(a.cx), Number(a.cy), Number(a.r), a0)
    const [x1, y1] = polar(Number(a.cx), Number(a.cy), Number(a.r), a1)
    const large = /** @type {0|1} */ (span > 180 ? 1 : 0)
    return `M ${n(x0)} ${n(y0)} ${arcTo(Number(a.r), large, 1, x1, y1)}`
  }
  if (prim.ring) return circlePath(Number(prim.ring.cx), Number(prim.ring.cy), Number(prim.ring.r), 1)
  if (prim.rect) {
    const s = prim.rect
    const [rw, rh] = rectSize(s)
    return roundedRectPath(Number(s.x), Number(s.y), rw, rh, Number(s.r) || 0, 1)
  }
  return ''
}

/**
 * Markup `<svg>` 16x16 com as MESMAS primitivas desenhadas como traço de
 * verdade (`stroke`, cap e join redondos). Serve só para conferir a olho se o
 * contorno preenchido de `outline()` bate com o traço pretendido — este markup
 * NÃO vai para a fonte (o `svgicons2svgfont` descartaria o `stroke`).
 * @param {Primitive[]} primitives
 * @param {OutlineOptions} [options]
 * @returns {string}
 */
function strokedSvg(primitives, options) {
  const opts = options || {}
  const globalW = typeof opts.w === 'number' && Number.isFinite(opts.w) ? opts.w : DEFAULT_W
  const size = typeof opts.size === 'number' && Number.isFinite(opts.size) ? opts.size : 16
  const body = []
  for (const prim of Array.isArray(primitives) ? primitives : []) {
    if (!prim || typeof prim !== 'object') continue
    if (typeof prim.fill === 'string') {
      const raw = prim.fill.trim()
      if (raw) body.push(`<path d="${raw}" fill="currentColor"/>`)
      continue
    }
    if (prim.dot) {
      const d = circlePath(Number(prim.dot.cx), Number(prim.dot.cy), Number(prim.dot.r), 1)
      if (d) body.push(`<path d="${d}" fill="currentColor"/>`)
      continue
    }
    const d = centerlineOf(prim)
    if (!d) continue
    const cap = prim.cap === 'butt' ? 'butt' : 'round'
    const sw = strokeWidthOf(prim, globalW)
    body.push(
      `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${n(sw)}"` +
        ` stroke-linecap="${cap}" stroke-linejoin="round"/>`
    )
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"` +
    ` viewBox="0 0 ${size} ${size}">${body.join('')}</svg>`
  )
}

module.exports = { outline, strokedSvg }
