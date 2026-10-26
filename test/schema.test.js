// @ts-check
'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  PROP_OVERRIDES,
  RUNTIME_INJECTED_PROPS,
  SCHEMA_OUT,
} = require('../scripts/generate-schema')

/** Acha a entrada do schema para um blockName exato (pattern `^name(#.*)?$`). */
function blockEntry(schema, blockName) {
  const esc = blockName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const key = `^${esc}(#.*)?$`
  return schema.patternProperties[key]
}

function propsOf(entry) {
  return entry && entry.properties && entry.properties.props && entry.properties.props.properties
}

test('schema gerado existe e é JSON válido', () => {
  assert.ok(fs.existsSync(SCHEMA_OUT), `schema não encontrado em ${SCHEMA_OUT}`)
  const schema = JSON.parse(fs.readFileSync(SCHEMA_OUT, 'utf8'))
  assert.equal(schema.type, 'object')
  assert.ok(schema.patternProperties && Object.keys(schema.patternProperties).length > 0)
})

test('cada override de PROP_OVERRIDES produz properties/items no schema', () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_OUT, 'utf8'))
  for (const blockName of Object.keys(PROP_OVERRIDES)) {
    const entry = blockEntry(schema, blockName)
    assert.ok(entry, `bloco "${blockName}" ausente no schema`)
    const props = propsOf(entry)
    assert.ok(props, `bloco "${blockName}" sem props no schema`)
    for (const propName of Object.keys(PROP_OVERRIDES[blockName])) {
      const node = props[propName]
      assert.ok(node, `prop "${propName}" de "${blockName}" ausente`)
      assert.ok(
        node.properties || node.items,
        `prop "${propName}" de "${blockName}" deveria ter properties ou items (autocomplete aninhado)`,
      )
      // prop que virou objeto/array não deve carregar default string herdado da doc plana
      assert.equal(node.default, undefined, `prop "${propName}" de "${blockName}" não deveria ter default`)
    }
  }
})

test('nenhum override é aplicado a prop injetada em runtime (não-autoral)', () => {
  for (const blockName of Object.keys(PROP_OVERRIDES)) {
    for (const propName of Object.keys(PROP_OVERRIDES[blockName])) {
      assert.ok(
        !RUNTIME_INJECTED_PROPS.has(propName),
        `prop não-autoral "${propName}" não deveria receber override (bloco "${blockName}")`,
      )
    }
  }
})

test('snippets gerados existem e são JSON-like (sem header quebrado)', () => {
  const snippetsPath = path.join(path.dirname(SCHEMA_OUT), '..', 'snippets', 'vtex-io.code-snippets')
  assert.ok(fs.existsSync(snippetsPath), 'arquivo de snippets ausente')
})

const { choicesWithDefault, numberPlaceholder, SNIPPETS_OUT } = require('../scripts/generate-schema')
const { loadSnippets } = require('../lib/snippets')

test('choicesWithDefault põe o default da doc como primeira opção', () => {
  assert.deepEqual(choicesWithDefault({ enumValues: ['box', 'select'], default: 'select' }), ['select', 'box'])
  assert.deepEqual(choicesWithDefault({ enumValues: ['true', 'false'], default: '`false`' }), ['false', 'true'])
  // default ausente ou fora do enum: ordem da doc
  assert.deepEqual(choicesWithDefault({ enumValues: ['a', 'b'] }), ['a', 'b'])
  assert.deepEqual(choicesWithDefault({ enumValues: ['a', 'b'], default: 'c' }), ['a', 'b'])
})

test('numberPlaceholder usa o default numérico da doc, senão 0', () => {
  assert.equal(numberPlaceholder({ default: '600' }), 600)
  assert.equal(numberPlaceholder({ default: 'undefined' }), 0)
  assert.equal(numberPlaceholder({}), 0)
})

test('snippet de back-to-top-button já traz displayThreshold 600 (default da doc)', () => {
  const snip = loadSnippets(SNIPPETS_OUT).find((s) => s.name === 'back-to-top-button')
  assert.ok(snip)
  assert.match(snip.body, /"displayThreshold": \$\{\d+:600\}/)
  assert.match(snip.body, /"display": "\$\{\d+\|button,caret-icon\|\}"/)
})
