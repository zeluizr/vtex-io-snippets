// @ts-check
'use strict'

/**
 * Travas do preset de conforto (lib/comfort.js).
 *
 * O comando escreve nas configurações DO USUÁRIO e guarda o valor anterior para
 * poder voltar atrás. Os dois jeitos de isso dar errado são silenciosos: aplicar
 * duas vezes e o segundo apply gravar o próprio preset como "valor anterior", e
 * o desfazer gravar `undefined` como literal em vez de remover a chave.
 */

const { test } = require('node:test')
const assert = require('node:assert/strict')

const { AJUSTES, FONTE, fonteInstalada, planejar, restaurar, descrever } = require('../lib/comfort')

test('o preset define fonte, ligature e os três temas do Puelche', () => {
  assert.equal(AJUSTES['editor.fontLigatures'], true)
  assert.match(String(AJUSTES['editor.fontFamily']), /Google Sans Code/)
  assert.equal(AJUSTES['workbench.colorTheme'], 'Puelche')
  assert.equal(AJUSTES['workbench.iconTheme'], 'puelche-icons')
  assert.equal(AJUSTES['workbench.productIconTheme'], 'puelche-product')
})

test('a pilha de fontFamily degrada em vez de deixar o editor escolher', () => {
  const pilha = String(AJUSTES['editor.fontFamily'])
    .split(',')
    .map((f) => f.trim().replace(/^'|'$/g, ''))
  assert.equal(pilha[0], 'Google Sans Code', 'a primeira tem que ser a fonte do preset')
  assert.ok(pilha.length >= 2, 'sem fallback, sumir a fonte deixa o editor decidir sozinho')
  assert.equal(pilha[pilha.length - 1], 'monospace', 'a última tem que ser uma família genérica')
})

test('detecta a fonte pelos arquivos, em qualquer peso e extensão', () => {
  assert.equal(fonteInstalada(['GoogleSansCode-Regular.ttf']), true)
  assert.equal(fonteInstalada(['GoogleSansCode_Proportional-Italic.ttf', 'Arial.ttf']), true)
  assert.equal(fonteInstalada([]), false)
  assert.equal(fonteInstalada(['VictorMono-Regular.otf', 'MesloLGS NF Regular.ttf']), false)
  assert.equal(fonteInstalada(['GoogleSans-Regular.ttf']), false, 'não pode casar por prefixo solto')
})

test('o plano só lista chave que de fato muda de valor', () => {
  const tudoVazio = planejar({})
  assert.equal(tudoVazio.length, Object.keys(AJUSTES).length)
  assert.deepEqual(tudoVazio[0].de, undefined, 'chave não definida entra como undefined, não como null')

  const jaAplicado = planejar({ ...AJUSTES })
  assert.deepEqual(jaAplicado, [], 'aplicar em cima do preset aplicado tem que dar lista vazia')
})

test('aplicar duas vezes não sobrescreve o valor anterior guardado', () => {
  const meu = { 'editor.fontSize': 13 }
  const primeira = planejar(/** @type {any} */ (meu))
  const guardado = primeira.map(({ chave, de }) => ({ chave, de }))

  // o usuário já está com o preset: a segunda passada não devolve nada, então
  // não existe estado novo para sobrescrever o `guardado`.
  assert.deepEqual(planejar(/** @type {any} */ ({ ...AJUSTES })), [])
  const volta = restaurar(guardado)
  assert.equal(volta.find((v) => v.chave === 'editor.fontSize').para, 13)
})

test('chave que não existia antes volta a não existir', () => {
  const guardado = planejar({}).map(({ chave, de }) => ({ chave, de }))
  for (const { chave, para } of restaurar(guardado)) {
    assert.equal(para, undefined, `${chave} tinha que voltar a não estar definida`)
  }
})

test('restaurar aguenta estado ausente sem explodir', () => {
  assert.deepEqual(restaurar(/** @type {any} */ (undefined)), [])
  assert.deepEqual(restaurar([]), [])
})

test('a linha do diálogo distingue "não definido" de um valor', () => {
  assert.equal(
    descrever({ chave: 'editor.fontSize', de: undefined, para: 14 }),
    'editor.fontSize: (não definido) → 14',
  )
  assert.equal(descrever({ chave: 'editor.fontSize', de: 12, para: 14 }), 'editor.fontSize: 12 → 14')
})

test('a fonte declara como instalá-la, não só o nome', () => {
  assert.ok(FONTE.cask, 'sem o cask o aviso de fonte ausente não tem o que oferecer')
  assert.match(FONTE.url, /^https:\/\//)
})
