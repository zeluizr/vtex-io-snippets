// @ts-check
'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')

const { completionContext, scanContext } = require('../lib/context')
const { stripJsonComments, normalize } = require('../lib/snippets')

/**
 * Devolve o texto com o marcador `|` removido e o offset onde ele estava —
 * assim cada caso lê como o arquivo real com o cursor visível.
 * @param {string} withCursor
 */
function at(withCursor) {
  const offset = withCursor.indexOf('|')
  assert.notEqual(offset, -1, 'o caso de teste precisa marcar o cursor com "|"')
  return { text: withCursor.slice(0, offset) + withCursor.slice(offset + 1), offset }
}

/** @param {string} withCursor */
function kindAt(withCursor) {
  const { text, offset } = at(withCursor)
  return completionContext(text, offset).kind
}

// --- o bug que originou este módulo -----------------------------------------

test('dentro de props NÃO sugere bloco (regressão: catálogo inteiro em props)', () => {
  assert.equal(
    kindAt(`{
  "flex-layout#hero-banner": {
    "props": {
      "blockClass": "hero-banner",
      |
    }
  }
}`),
    'none',
  )
})

test('dentro de props, em posição de valor, também não sugere bloco', () => {
  assert.equal(kindAt('{\n  "rich-text#x": {\n    "props": { "text": |\n'), 'none')
})

test('string sendo digitada dentro de props não sugere bloco', () => {
  assert.equal(kindAt('{\n  "rich-text#x": {\n    "props": {\n      "acce|\n'), 'none')
})

// --- onde bloco realmente cabe ----------------------------------------------

test('na raiz do arquivo sugere a definição do bloco', () => {
  assert.equal(kindAt('{\n  |\n}'), 'block-definition')
})

test('na raiz, string aberta ainda é definição de bloco', () => {
  assert.equal(kindAt('{\n  "rich-|\n}'), 'block-definition')
})

test('na raiz, depois de uma definição fechada, volta a ser definição', () => {
  assert.equal(
    kindAt(`{
  "store.home": { "blocks": ["flex-layout#hero"] },
  |
}`),
    'block-definition',
  )
})

test('no corpo de um bloco (irmão de props/children) não sugere bloco', () => {
  assert.equal(kindAt('{\n  "flex-layout#hero": {\n    |\n  }\n}'), 'none')
})

// --- referências -------------------------------------------------------------

test('dentro de children sugere referência a bloco', () => {
  assert.equal(kindAt('{\n  "flex-layout#hero": {\n    "children": [|]\n  }\n}'), 'block-reference')
})

test('dentro de blocks sugere referência a bloco', () => {
  assert.equal(kindAt('{\n  "store.home": {\n    "blocks": ["rich-|"]\n  }\n}'), 'block-reference')
})

test('array comum (não children/blocks/...) não sugere bloco', () => {
  assert.equal(kindAt('{\n  "x#y": {\n    "props": { "images": [|] }\n  }\n}'), 'none')
})

// --- detalhes do scanner ------------------------------------------------------

test('scanContext: reporta string aberta e onde ela começa', () => {
  const { text, offset } = at('{\n  "rich-te|')
  const ctx = scanContext(text, offset)
  assert.equal(ctx.inString, true)
  assert.equal(text[ctx.stringStart], '"')
})

test('scanContext: chave já fechada vira posição de valor', () => {
  const { text, offset } = at('{\n  "a#b": { "props": { "blockClass": |')
  assert.equal(scanContext(text, offset).pendingKey, 'blockClass')
})

test('scanContext: vírgula devolve o cursor para posição de chave', () => {
  const { text, offset } = at('{\n  "a#b": { "props": { "blockClass": "hero", |')
  assert.equal(scanContext(text, offset).pendingKey, null)
})

test('comentários // e /* */ não confundem a pilha', () => {
  assert.equal(
    kindAt(`{
  // um comentário com { chaves } e "aspas"
  /* outro { com } props */
  |
}`),
    'block-definition',
  )
})

test('chave escapada não quebra a varredura', () => {
  assert.equal(kindAt('{\n  "a\\"b#c": { "props": { |'), 'none')
})

// --- catálogo -----------------------------------------------------------------

test('stripJsonComments preserva // e /* dentro de strings', () => {
  const parsed = JSON.parse(stripJsonComments('{ "url": "https://x.com/a", /* c */ "b": 1 } // fim'))
  assert.equal(parsed.url, 'https://x.com/a')
  assert.equal(parsed.b, 1)
})

test('o catálogo real carrega e traz corpo + prefixos', () => {
  const { loadSnippets } = require('../lib/snippets')
  const list = loadSnippets(require('path').join(__dirname, '..', 'snippets', 'vtex-io.code-snippets'))
  assert.ok(list.length > 300, `esperava >300 blocos, veio ${list.length}`)
  const richText = list.find((s) => s.name === 'rich-text')
  assert.ok(richText, 'rich-text deve estar no catálogo')
  assert.ok(richText.body.includes('rich-text#'))
  assert.ok(richText.prefixes.includes('rich-text'))
})

test('normalize ignora entradas sem corpo', () => {
  assert.equal(normalize({ vazio: { prefix: 'x' } }).length, 0)
})
