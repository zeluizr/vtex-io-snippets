// @ts-check
'use strict'

/**
 * VTEX IO IntelliSense — lógica pura (sem dependência de `vscode`).
 *
 * Tudo que dá para testar isoladamente vive aqui: classificação de
 * definição × referência de blocos, filtro de arquivos de tema e detecção de
 * chaves estruturais. O `extension.js` consome estas funções e só adiciona a
 * camada `vscode` (Location/Range/positionAt) por cima.
 */

// Arquivos sob store/ que NAO declaram blocos — ignorados na indexacao para
// nao gerar definicoes/refs falsas (ex.: chaves de interfaces.json).
const NON_BLOCK_FILES = new Set([
  'interfaces.json', 'routes.json', 'manifest.json', 'widgets.json',
  'content-types.json', 'content-schemas.json', 'sender.json', 'plugins.json',
])

// Token de um id de bloco (sem aspas): rich-text, flex-layout.row#hero-banner, store.home...
const TOKEN_RE = /[A-Za-z0-9_][A-Za-z0-9_.#-]*/
// Todos os strings JSON "simples" (que poderiam ser id de bloco) num arquivo.
// `g` para uso com exec(); quem usa deve resetar lastIndex.
const QUOTED_RE = /"([A-Za-z0-9_][A-Za-z0-9_.#-]*)"/g

// Chaves estruturais que nao sao blocos — ignoradas para nao poluir o indice.
const STRUCTURAL_KEYS = new Set([
  'props', 'children', 'blocks', 'before', 'after', 'around',
  'title', 'then', 'else', 'component', 'context', 'content',
])

/** @param {string} id */
function isStructuralKey(id) {
  return STRUCTURAL_KEYS.has(id)
}

/**
 * Um arquivo é arquivo de tema (indexável) se está sob `store/` e não está na
 * denylist de arquivos que não declaram blocos.
 * @param {string} path caminho POSIX (ex.: uri.path)
 */
function isThemeBlockFilePath(path) {
  if (typeof path !== 'string' || !path.includes('/store/')) return false
  const base = path.slice(path.lastIndexOf('/') + 1)
  return !NON_BLOCK_FILES.has(base)
}

/**
 * Varre o texto de um arquivo e devolve as ocorrências de ids de bloco,
 * classificando cada uma como definição (`"id": { ... }`) ou referência
 * (id citado dentro de children/blocks/before/...). Chaves estruturais são
 * descartadas. `index` é o offset da aspa de abertura no texto original.
 *
 * @param {string} text
 * @returns {Array<{ id: string, isDef: boolean, index: number }>}
 *   `index` aponta para a aspa de abertura; o id começa em `index + 1`.
 */
function scanOccurrences(text) {
  /** @type {Array<{ id: string, isDef: boolean, index: number }>} */
  const out = []
  if (typeof text !== 'string' || text.length === 0) return out
  QUOTED_RE.lastIndex = 0
  let m
  while ((m = QUOTED_RE.exec(text)) !== null) {
    const id = m[1]
    if (STRUCTURAL_KEYS.has(id)) continue
    // posicao apos a aspa de fechamento -> proximo char nao-branco decide def x ref
    let j = m.index + m[0].length
    while (j < text.length && (text[j] === ' ' || text[j] === '\t' || text[j] === '\n' || text[j] === '\r')) j++
    const isDef = text[j] === ':'
    out.push({ id, isDef, index: m.index })
  }
  return out
}

module.exports = {
  NON_BLOCK_FILES,
  STRUCTURAL_KEYS,
  TOKEN_RE,
  QUOTED_RE,
  isStructuralKey,
  isThemeBlockFilePath,
  scanOccurrences,
}
