// @ts-check
'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')

const pkg = require('../package.json')

test('jsonValidation só vale para arquivos de tema dentro de store/', () => {
  const matches = pkg.contributes.jsonValidation.map((v) => v.fileMatch)
  assert.ok(matches.length > 0)
  for (const m of matches) {
    // um nome solto (ex.: "blocks.json") casa com qualquer blocks.json do
    // workspace, inclusive os que não são tema VTEX, e mostra erros falsos.
    assert.ok(String(m).includes('/store/'), `fileMatch "${m}" deveria estar restrito a store/`)
  }
  assert.ok(matches.includes('**/store/blocks.json'))
  assert.ok(matches.includes('**/store/blocks.jsonc'))
})
