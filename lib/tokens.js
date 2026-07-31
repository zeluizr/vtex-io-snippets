// @ts-check
'use strict'

/**
 * VTEX IO IntelliSense — gerador de CSS custom properties (lógica pura).
 *
 * Recebe o JSON de tokens no formato nativo do VTEX Style (o mesmo
 * `styles/configs/style.json`) e devolve a lista de custom properties CSS que a
 * plataforma expõe em runtime (`var(--type-scale-1)`, `var(--emphasis)`, ...).
 *
 * As regras de nome batem 1:1 com o que a VTEX gera: `typeScale[0]` vira
 * `--type-scale-1`, `spacing[2]` vira `--spacing-2`, cores viram `--{chave}` etc.
 * Sem dependência de `vscode` nem de `fs` — é só transformação de dados, para
 * poder testar o mapa de nomes isoladamente (ver `test/tokens.test.js`).
 */

/**
 * @typedef {Object} Token
 * @property {string} name    nome da custom property, com `--` (ex.: "--spacing-2")
 * @property {string} value   valor CSS já formatado (ex.: "0.5rem", "#F71963")
 * @property {boolean} isColor true quando o valor é uma cor (habilita o swatch)
 */

/**
 * Nome da escala de opacidade a partir do VALOR (não do índice):
 *   1 -> "100", 0 -> "0", 0.9 -> "90", 0.05 -> "05", 0.025 -> "025".
 * Regra: usa os dígitos depois de "0."; se sobrar 1 dígito, completa com "0".
 * @param {number} v
 */
function opacityName(v) {
  if (v === 1) return '100'
  if (v === 0) return '0'
  const frac = String(v).split('.')[1] || ''
  return frac.length === 1 ? frac + '0' : frac
}

/** Valor em rem, com o caso especial `0 -> "0"` de borderWidths/borderRadius. */
function remOrZero(v) {
  return v === 0 ? '0' : `${v}rem`
}

/**
 * Converte o JSON de tokens VTEX Style na lista de custom properties.
 * Nunca lança: seções ausentes ou com formato inesperado são ignoradas, então
 * um JSON parcial ainda gera o que dá para gerar.
 * @param {unknown} raw
 * @returns {Token[]}
 */
function generateTokens(raw) {
  /** @type {Token[]} */
  const out = []
  if (!raw || typeof raw !== 'object') return out
  const data = /** @type {any} */ (raw)

  const push = (name, value, isColor = false) => out.push({ name, value, isColor })

  // typeScale[i] -> --type-scale-{i+1}
  if (Array.isArray(data.typeScale)) {
    data.typeScale.forEach((v, i) => push(`--type-scale-${i + 1}`, `${v}rem`))
  }

  // spacing[i] -> --spacing-{i}
  if (Array.isArray(data.spacing)) {
    data.spacing.forEach((v, i) => push(`--spacing-${i}`, `${v}rem`))
  }

  // borderWidths[i] -> --border-width-{i}  (0 -> "0")
  if (Array.isArray(data.borderWidths)) {
    data.borderWidths.forEach((v, i) => push(`--border-width-${i}`, remOrZero(v)))
  }

  // borderRadius[i] -> --border-radius-{i}  (0 -> "0")
  if (Array.isArray(data.borderRadius)) {
    data.borderRadius.forEach((v, i) => push(`--border-radius-${i}`, remOrZero(v)))
  }

  // widths[i] -> --width-{i+1}
  if (Array.isArray(data.widths)) {
    data.widths.forEach((v, i) => push(`--width-${i + 1}`, `${v}rem`))
  }

  // maxWidths[i] -> --max-width-{i+1}
  if (Array.isArray(data.maxWidths)) {
    data.maxWidths.forEach((v, i) => push(`--max-width-${i + 1}`, `${v}rem`))
  }

  // heights[i] -> --height-{i+1}
  if (Array.isArray(data.heights)) {
    data.heights.forEach((v, i) => push(`--height-${i + 1}`, `${v}rem`))
  }

  // sizes[].{name,value} -> --size-{name}
  if (Array.isArray(data.sizes)) {
    for (const s of data.sizes) {
      if (!s || typeof s !== 'object' || s.name == null) continue
      push(`--size-${s.name}`, `${s.value}rem`)
    }
  }

  // opacity -> --opacity-{n}, com n derivado do valor (ver opacityName).
  // Aceita array ([1, 0.9, ...]) ou objeto ({ ... }); o nome vem do valor.
  const opacity = data.opacity
  const opacityValues = Array.isArray(opacity)
    ? opacity
    : opacity && typeof opacity === 'object'
      ? Object.values(opacity)
      : []
  for (const v of opacityValues) {
    if (typeof v !== 'number') continue
    push(`--opacity-${opacityName(v)}`, `${v}`)
  }

  // typography.measure = [a,b,c] -> --measure, --measure-wide, --measure-narrow
  const measure = data.typography && data.typography.measure
  if (Array.isArray(measure)) {
    const suffix = ['', '-wide', '-narrow']
    measure.slice(0, 3).forEach((v, i) => push(`--measure${suffix[i]}`, `${v}em`))
  }

  // colors[key] -> --{key}
  if (data.colors && typeof data.colors === 'object') {
    for (const [key, value] of Object.entries(data.colors)) {
      push(`--${key}`, String(value), true)
    }
  }

  // semanticColors[grupo][chave] -> --{grupo}-{chave}
  // O nome é concatenado literalmente, então modificadores como "--faded" /
  // "--inverted" na chave passam intactos (ex.: --text-action-primary--faded).
  if (data.semanticColors && typeof data.semanticColors === 'object') {
    for (const [group, entries] of Object.entries(data.semanticColors)) {
      if (!entries || typeof entries !== 'object') continue
      for (const [key, value] of Object.entries(entries)) {
        push(`--${group}-${key}`, String(value), true)
      }
    }
  }

  return out
}

module.exports = {
  opacityName,
  generateTokens,
}
