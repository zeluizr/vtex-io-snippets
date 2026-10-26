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
// `contentSchemas.json` é o nome que a VTEX usa (store/contentSchemas.json);
// `content-schemas.json` fica por compatibilidade.
const NON_BLOCK_FILES = new Set([
  'interfaces.json', 'routes.json', 'manifest.json', 'widgets.json',
  'content-types.json', 'content-schemas.json', 'contentSchemas.json', 'sender.json', 'plugins.json',
])

const { BLOCK_ARRAY_KEYS, walkJson } = require('./context')

// Token de um id de bloco (sem aspas): rich-text, flex-layout.row#hero-banner, store.home...
const TOKEN_RE = /[A-Za-z0-9_][A-Za-z0-9_.#-]*/
// Todos os strings JSON "simples" (que poderiam ser id de bloco) num arquivo.
// `g` para uso com exec(); quem usa deve resetar lastIndex.
const QUOTED_RE = /"([A-Za-z0-9_][A-Za-z0-9_.#-]*)"/g
// O conteúdo inteiro de uma string tem a forma de um id de bloco.
const BLOCK_ID_RE = /^[A-Za-z0-9_][A-Za-z0-9_.#-]*$/
// Slot: prop em PascalCase cujo valor é um bloco (`"props": { "Icon": "icon-cart#x" }`).
const SLOT_KEY_RE = /^[A-Z]/

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
 * classificando cada uma pela POSIÇÃO no JSON, não só pela forma da string:
 *  - definição: chave na raiz do arquivo (`{ "rich-text#x": { ... } }`);
 *  - referência: item de children/blocks/before/after/around, ou valor de um
 *    slot (prop em PascalCase dentro de `props`, como `"Icon": "icon-cart#x"`).
 * Chaves de props (`blockClass`), valores de props (`"hero"`) e chaves
 * estruturais ficam de fora — antes entravam como blocos e apareciam no
 * autocomplete de `children` e no Go to Definition.
 *
 * @param {string} text
 * @returns {Array<{ id: string, isDef: boolean, index: number }>}
 *   `index` aponta para a aspa de abertura; o id começa em `index + 1`.
 */
function scanOccurrences(text) {
  /** @type {Array<{ id: string, isDef: boolean, index: number }>} */
  const out = []
  if (typeof text !== 'string' || text.length === 0) return out
  walkJson(text, text.length, ({ value, start, isKey, stack, pendingKey }) => {
    if (!BLOCK_ID_RE.test(value) || STRUCTURAL_KEYS.has(value)) return
    const top = stack[stack.length - 1]
    if (!top) return
    if (isKey) {
      if (stack.length === 1) out.push({ id: value, isDef: true, index: start })
      return
    }
    const isRef =
      (top.type === 'array' && BLOCK_ARRAY_KEYS.has(String(top.key))) ||
      (top.type === 'object' && top.key === 'props' && pendingKey !== null && SLOT_KEY_RE.test(pendingKey))
    if (isRef) out.push({ id: value, isDef: false, index: start })
  })
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
