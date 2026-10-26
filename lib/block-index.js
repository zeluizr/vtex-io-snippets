// @ts-check
'use strict'

/**
 * VTEX IO IntelliSense — índice de blocos por arquivo (lógica pura).
 *
 * O índice antigo era um só para o workspace inteiro e era jogado fora a cada
 * tecla digitada num arquivo de tema: a próxima consulta (hover, completion,
 * Go to Definition) reabria TODOS os arquivos de store/** com
 * `openTextDocument`. Aqui cada arquivo tem a sua entrada, com as posições já
 * calculadas em linha/coluna; quando um arquivo muda, só ele é varrido de novo e
 * o mapa id -> { defs, refs } é remontado a partir das entradas guardadas.
 */

const { scanOccurrences } = require('./blocks')

/**
 * @typedef {Object} Occurrence
 * @property {string} id
 * @property {boolean} isDef
 * @property {number} line       linha (0-based) do primeiro caractere do id
 * @property {number} character  coluna (0-based) do primeiro caractere do id
 */

/**
 * Offsets de início de cada linha. Conta só `\n`, então `\r\n` funciona igual
 * (o `\r` fica no fim da linha anterior, como no VS Code).
 * @param {string} text
 * @returns {number[]}
 */
function lineStarts(text) {
  const starts = [0]
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) starts.push(i + 1)
  }
  return starts
}

/**
 * Converte offset em { line, character } por busca binária em `starts`.
 * @param {number[]} starts
 * @param {number} offset
 */
function positionAt(starts, offset) {
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return { line: lo, character: offset - starts[lo] }
}

/**
 * Varre o texto de um arquivo e devolve as ocorrências com posição.
 * Remove o BOM inicial, como o VS Code faz ao abrir o documento, para as
 * colunas da primeira linha baterem com as do editor.
 * @param {string} text
 * @returns {Occurrence[]}
 */
function scanFile(text) {
  if (typeof text !== 'string' || text.length === 0) return []
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const starts = lineStarts(clean)
  return scanOccurrences(clean).map(({ id, isDef, index }) => {
    const pos = positionAt(starts, index + 1) // dentro das aspas
    return { id, isDef, line: pos.line, character: pos.character }
  })
}

/**
 * Junta as entradas por arquivo num mapa id -> { defs, refs }. `T` é o que o
 * chamador guarda por arquivo (no `extension.js`, a Uri); cada ocorrência vem
 * acompanhada dele.
 *
 * @template T
 * @param {Iterable<{ file: T, occurrences: Occurrence[] }>} files
 * @returns {Map<string, { defs: Array<Occurrence & { file: T }>, refs: Array<Occurrence & { file: T }> }>}
 */
function mergeIndex(files) {
  /** @type {Map<string, { defs: Array<Occurrence & { file: T }>, refs: Array<Occurrence & { file: T }> }>} */
  const index = new Map()
  for (const { file, occurrences } of files) {
    for (const occ of occurrences) {
      let entry = index.get(occ.id)
      if (!entry) {
        entry = { defs: [], refs: [] }
        index.set(occ.id, entry)
      }
      ;(occ.isDef ? entry.defs : entry.refs).push({ ...occ, file })
    }
  }
  return index
}

module.exports = {
  lineStarts,
  positionAt,
  scanFile,
  mergeIndex,
}
