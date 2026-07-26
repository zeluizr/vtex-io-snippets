// @ts-check
'use strict'

/**
 * VTEX IO IntelliSense — leitura do catálogo de snippets (lógica pura).
 *
 * O arquivo `snippets/vtex-io.code-snippets` continua sendo a fonte única dos
 * blocos, mas deixou de ser declarado em `contributes.snippets` (que ignora
 * contexto e poluía o autocomplete dentro de `props`). Agora ele é lido aqui e
 * servido por um CompletionItemProvider, que só oferece bloco onde bloco cabe.
 */

const fs = require('fs')

/**
 * Remove comentários `//` e comentários de bloco de um JSONC, preservando o que
 * está dentro de strings. `JSON.parse` não aceita comentários e o catálogo tem
 * um cabeçalho comentado.
 * @param {string} text
 */
function stripJsonComments(text) {
  let out = ''
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"') {
      const start = i
      i++
      while (i < text.length) {
        if (text[i] === '\\') {
          i += 2
          continue
        }
        if (text[i] === '"') {
          i++
          break
        }
        i++
      }
      out += text.slice(start, i)
      continue
    }
    if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++
      continue
    }
    if (ch === '/' && text[i + 1] === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i += 2
      continue
    }
    out += ch
    i++
  }
  return out
}

/**
 * @typedef {Object} BlockSnippet
 * @property {string} name       id do bloco (ex.: "rich-text")
 * @property {string[]} prefixes prefixos que disparam a sugestão
 * @property {string} body       corpo do snippet, com placeholders `${1:...}`
 * @property {string} description
 */

/**
 * Converte o JSON do catálogo em uma lista normalizada.
 * @param {unknown} raw
 * @returns {BlockSnippet[]}
 */
function normalize(raw) {
  if (!raw || typeof raw !== 'object') return []
  /** @type {BlockSnippet[]} */
  const out = []
  for (const [name, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object') continue
    const entry = /** @type {any} */ (value)
    const body = Array.isArray(entry.body) ? entry.body.join('\n') : String(entry.body || '')
    if (!body) continue
    const prefixes = Array.isArray(entry.prefix)
      ? entry.prefix.map(String)
      : entry.prefix
        ? [String(entry.prefix)]
        : [name]
    out.push({
      name,
      prefixes,
      body,
      description: typeof entry.description === 'string' ? entry.description : '',
    })
  }
  return out
}

/**
 * Lê e normaliza o catálogo de um arquivo `.code-snippets`.
 * Nunca lança: um catálogo ilegível degrada para "sem sugestões", não quebra a
 * extensão inteira.
 * @param {string} filePath
 * @returns {BlockSnippet[]}
 */
function loadSnippets(filePath) {
  try {
    return normalize(JSON.parse(stripJsonComments(fs.readFileSync(filePath, 'utf8'))))
  } catch (_) {
    return []
  }
}

module.exports = {
  stripJsonComments,
  normalize,
  loadSnippets,
}
