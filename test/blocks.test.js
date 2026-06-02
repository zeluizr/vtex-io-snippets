// @ts-check
'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')

const {
  isStructuralKey,
  isThemeBlockFilePath,
  scanOccurrences,
  STRUCTURAL_KEYS,
  NON_BLOCK_FILES,
} = require('../lib/blocks')

// Exemplo realista de arquivo de tema (store/home.jsonc): uma definição de
// bloco com props e children referenciando outros blocos.
const HOME = `{
  "store.home": {
    "blocks": ["flex-layout.row#hero-banner"]
  },
  "flex-layout.row#hero-banner": {
    "children": [
      "rich-text#title",
      "image#banner"
    ],
    "props": {
      "blockClass": "hero",
      "link": "https://example.com/promo"
    }
  },
  "rich-text#title": {
    "props": { "text": "Olá" }
  }
}`

test('scanOccurrences: classifica definições (chave seguida de ":")', () => {
  const occ = scanOccurrences(HOME)
  const defs = occ.filter((o) => o.isDef).map((o) => o.id)
  assert.ok(defs.includes('store.home'))
  assert.ok(defs.includes('flex-layout.row#hero-banner'))
  assert.ok(defs.includes('rich-text#title'))
})

test('scanOccurrences: classifica referências (dentro de children/blocks)', () => {
  const occ = scanOccurrences(HOME)
  const refs = occ.filter((o) => !o.isDef).map((o) => o.id)
  // hero-banner é referenciado em store.home.blocks
  assert.ok(refs.includes('flex-layout.row#hero-banner'))
  // children
  assert.ok(refs.includes('rich-text#title'))
  assert.ok(refs.includes('image#banner'))
})

test('scanOccurrences: hero-banner aparece como def E como ref', () => {
  const occ = scanOccurrences(HOME).filter((o) => o.id === 'flex-layout.row#hero-banner')
  assert.equal(occ.filter((o) => o.isDef).length, 1)
  assert.equal(occ.filter((o) => !o.isDef).length, 1)
})

test('scanOccurrences: chaves estruturais são ignoradas', () => {
  const ids = scanOccurrences(HOME).map((o) => o.id)
  for (const k of ['props', 'children', 'blocks']) {
    assert.ok(!ids.includes(k), `não deveria indexar a chave estrutural "${k}"`)
  }
})

test('scanOccurrences: URLs e strings com "/" não viram id de bloco', () => {
  const ids = scanOccurrences(HOME).map((o) => o.id)
  assert.ok(!ids.includes('https://example.com/promo'))
  // valores de props comuns (não contêm "/", então o regex pega "hero"/"Olá");
  // o importante é que a URL com barra não entra.
  assert.ok(!ids.some((id) => id.includes('/')))
})

test('scanOccurrences: entrada vazia ou não-string devolve []', () => {
  assert.deepEqual(scanOccurrences(''), [])
  // @ts-expect-error teste defensivo
  assert.deepEqual(scanOccurrences(null), [])
  // @ts-expect-error teste defensivo
  assert.deepEqual(scanOccurrences(undefined), [])
})

test('scanOccurrences: index aponta para a aspa de abertura', () => {
  const text = '{ "rich-text#x": {} }'
  const occ = scanOccurrences(text)
  const o = occ.find((x) => x.id === 'rich-text#x')
  assert.ok(o)
  // text[index] deve ser a aspa de abertura; id começa em index+1
  assert.equal(text[o.index], '"')
  assert.equal(text.slice(o.index + 1, o.index + 1 + o.id.length), 'rich-text#x')
})

test('isStructuralKey: reconhece as chaves estruturais conhecidas', () => {
  for (const k of STRUCTURAL_KEYS) assert.equal(isStructuralKey(k), true)
  assert.equal(isStructuralKey('flex-layout.row'), false)
  assert.equal(isStructuralKey('rich-text'), false)
})

test('isThemeBlockFilePath: indexa arquivos sob store/**', () => {
  assert.equal(isThemeBlockFilePath('/proj/store/home.jsonc'), true)
  assert.equal(isThemeBlockFilePath('/proj/store/blocks.jsonc'), true)
  assert.equal(isThemeBlockFilePath('/proj/store/blocks/home/_hero.jsonc'), true)
  assert.equal(isThemeBlockFilePath('/proj/store/blocks.json'), true)
})

test('isThemeBlockFilePath: ignora arquivos da denylist (não declaram blocos)', () => {
  assert.equal(isThemeBlockFilePath('/proj/store/interfaces.json'), false)
  assert.equal(isThemeBlockFilePath('/proj/store/routes.json'), false)
  assert.equal(isThemeBlockFilePath('/proj/store/manifest.json'), false)
  for (const f of NON_BLOCK_FILES) {
    assert.equal(isThemeBlockFilePath(`/proj/store/${f}`), false)
  }
})

test('isThemeBlockFilePath: ignora arquivos fora de store/', () => {
  assert.equal(isThemeBlockFilePath('/proj/src/index.js'), false)
  assert.equal(isThemeBlockFilePath('/proj/package.json'), false)
  assert.equal(isThemeBlockFilePath('/proj/react/MyStore.jsx'), false)
  // entrada inválida
  // @ts-expect-error teste defensivo
  assert.equal(isThemeBlockFilePath(null), false)
})
