// @ts-check
'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')

const { lineStarts, positionAt, scanFile, mergeIndex } = require('../lib/block-index')

test('positionAt converte offset em linha/coluna', () => {
  const text = 'ab\ncd\n\nef'
  const starts = lineStarts(text)
  assert.deepEqual(starts, [0, 3, 6, 7])
  assert.deepEqual(positionAt(starts, 0), { line: 0, character: 0 })
  assert.deepEqual(positionAt(starts, 4), { line: 1, character: 1 })
  assert.deepEqual(positionAt(starts, 6), { line: 2, character: 0 })
  assert.deepEqual(positionAt(starts, 8), { line: 3, character: 1 })
})

test('scanFile: posição aponta para o primeiro caractere do id (CRLF e BOM)', () => {
  const text = '﻿{\r\n  "rich-text#x": {\r\n    "children": ["image#y"]\r\n  }\r\n}'
  const occ = scanFile(text)
  assert.deepEqual(occ, [
    { id: 'rich-text#x', isDef: true, line: 1, character: 3 },
    { id: 'image#y', isDef: false, line: 2, character: 18 },
  ])
})

test('scanFile: entrada vazia ou inválida devolve []', () => {
  assert.deepEqual(scanFile(''), [])
  // @ts-expect-error teste defensivo
  assert.deepEqual(scanFile(null), [])
})

test('mergeIndex junta defs e refs de vários arquivos', () => {
  const a = scanFile('{ "store.home": { "blocks": ["rich-text#x"] } }')
  const b = scanFile('{ "rich-text#x": { "props": { "text": "oi" } } }')
  const index = mergeIndex([
    { file: 'a.jsonc', occurrences: a },
    { file: 'b.jsonc', occurrences: b },
  ])
  const entry = index.get('rich-text#x')
  assert.ok(entry)
  assert.deepEqual(entry.defs.map((d) => d.file), ['b.jsonc'])
  assert.deepEqual(entry.refs.map((r) => r.file), ['a.jsonc'])
  assert.ok(!index.has('text'))
})

test('mergeIndex: trocar a entrada de um arquivo atualiza só o que veio dele', () => {
  const files = new Map([
    ['a', { file: 'a', occurrences: scanFile('{ "store.home": { "blocks": ["rich-text#x"] } }') }],
    ['b', { file: 'b', occurrences: scanFile('{ "rich-text#x": {} }') }],
  ])
  files.set('b', { file: 'b', occurrences: scanFile('{ "rich-text#renomeado": {} }') })
  const index = mergeIndex(files.values())
  assert.equal(index.get('rich-text#x')?.defs.length, 0)
  assert.equal(index.get('rich-text#renomeado')?.defs.length, 1)
})
