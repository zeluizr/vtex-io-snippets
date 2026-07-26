// @ts-check
'use strict'

/**
 * VTEX IO IntelliSense — contexto JSON sob o cursor (lógica pura).
 *
 * Por que isto existe: `contributes.snippets` do VS Code não tem noção de
 * contexto — um snippet declarado para `json`/`jsonc` é oferecido em QUALQUER
 * ponto do arquivo. Resultado: dentro de `"props": { ... }` o editor sugeria os
 * 385 blocos inteiros, onde só cabem propriedades. Como não há API para filtrar
 * a contribuição estática, os blocos passaram a vir de um CompletionItemProvider
 * — e este módulo é quem decide se o cursor está num lugar onde bloco faz
 * sentido.
 *
 * Num arquivo de tema VTEX IO:
 *  - blocos são DEFINIDOS só na raiz do arquivo (`{ "flex-layout#x": { ... } }`);
 *  - blocos são REFERENCIADOS como string dentro de children/blocks/before/...;
 *  - dentro de `props` só existem propriedades (quem completa é o JSON Schema).
 */

// Arrays cujos itens são referências a blocos (strings com o id do bloco).
const BLOCK_ARRAY_KEYS = new Set(['children', 'blocks', 'before', 'after', 'around'])

/** @param {string} ch */
function isWhitespace(ch) {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'
}

/**
 * Varre `text` de 0 até `offset` mantendo a pilha de containers JSON abertos.
 * Tolera JSON incompleto/inválido depois do cursor (é o caso normal: o usuário
 * está no meio da digitação) porque nunca lê além de `offset`.
 *
 * @param {string} text
 * @param {number} offset posição do cursor
 * @returns {{
 *   stack: Array<{ type: 'object' | 'array', key: string | null }>,
 *   pendingKey: string | null,
 *   inString: boolean,
 *   stringStart: number,
 * }}
 *   `pendingKey` é a chave já digitada no nível atual quando o cursor está em
 *   posição de VALOR (`"blockClass": <cursor>`); `null` em posição de CHAVE.
 *   `stringStart` é o offset da aspa de abertura quando `inString`.
 */
function scanContext(text, offset) {
  /** @type {Array<{ type: 'object' | 'array', key: string | null }>} */
  const stack = []
  /** @type {string | null} */
  let pendingKey = null
  let i = 0
  const end = Math.min(offset, text.length)

  while (i < end) {
    const ch = text[i]

    if (ch === '"') {
      const start = i
      i++
      let closed = false
      while (i < end) {
        if (text[i] === '\\') {
          i += 2
          continue
        }
        if (text[i] === '"') {
          closed = true
          i++
          break
        }
        // quebra de linha dentro de string = string aberta/quebrada; o cursor
        // não está nela, então segue a varredura do ponto seguinte.
        if (text[i] === '\n') break
        i++
      }
      if (!closed) {
        if (i >= end) return { stack, pendingKey, inString: true, stringStart: start }
        continue
      }
      const value = text.slice(start + 1, i - 1)
      // olha adiante (pode passar de `offset`, só para saber se é chave) —
      // `"algo":` é chave; `"algo",` ou `"algo"]` é valor.
      let j = i
      while (j < text.length && isWhitespace(text[j])) j++
      const top = stack[stack.length - 1]
      if (text[j] === ':' && top && top.type === 'object') pendingKey = value
      continue
    }

    if (ch === '/' && (text[i + 1] === '/' || text[i + 1] === '*')) {
      if (text[i + 1] === '/') {
        while (i < end && text[i] !== '\n') i++
      } else {
        i += 2
        while (i < end && !(text[i] === '*' && text[i + 1] === '/')) i++
        i += 2
      }
      continue
    }

    if (ch === '{' || ch === '[') {
      stack.push({ type: ch === '{' ? 'object' : 'array', key: pendingKey })
      pendingKey = null
      i++
      continue
    }

    if (ch === '}' || ch === ']') {
      stack.pop()
      pendingKey = null
      i++
      continue
    }

    if (ch === ',') {
      pendingKey = null
      i++
      continue
    }

    i++
  }

  return { stack, pendingKey, inString: false, stringStart: -1 }
}

/**
 * Decide o que faz sentido sugerir na posição do cursor.
 *
 * @param {string} text
 * @param {number} offset
 * @returns {{
 *   kind: 'block-definition' | 'block-reference' | 'none',
 *   inString: boolean,
 *   stringStart: number,
 * }}
 *   - `block-definition`: raiz do arquivo, em posição de chave -> snippet do
 *     bloco inteiro (`"rich-text#id": { "props": {...} }`).
 *   - `block-reference`: dentro de children/blocks/before/after/around -> só o
 *     id do bloco entre aspas.
 *   - `none`: qualquer outro lugar (props, valores, arrays comuns) -> quem
 *     completa é o JSON Schema.
 */
function completionContext(text, offset) {
  const { stack, pendingKey, inString, stringStart } = scanContext(text, offset)
  const top = stack[stack.length - 1]
  const none = /** @type {const} */ ({ kind: 'none', inString, stringStart })

  if (!top) return none

  if (top.type === 'array') {
    if (!BLOCK_ARRAY_KEYS.has(String(top.key))) return none
    return { kind: 'block-reference', inString, stringStart }
  }

  // objeto: só a raiz define blocos, e só em posição de chave.
  if (stack.length !== 1) return none
  if (pendingKey !== null) return none
  return { kind: 'block-definition', inString, stringStart }
}

module.exports = {
  BLOCK_ARRAY_KEYS,
  scanContext,
  completionContext,
}
