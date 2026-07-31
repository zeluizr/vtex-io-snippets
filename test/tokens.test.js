// @ts-check
'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const fs = require('fs')

const { generateTokens, opacityName } = require('../lib/tokens')

/** Constrói um mapa nome -> token para asserções por nome. */
function byName(tokens) {
  const map = new Map()
  for (const t of tokens) map.set(t.name, t)
  return map
}

// --- escalas em rem ----------------------------------------------------------

test('typeScale usa índice+1 e sufixo rem', () => {
  const m = byName(generateTokens({ typeScale: [3, 2.25, 1] }))
  assert.deepEqual(m.get('--type-scale-1'), { name: '--type-scale-1', value: '3rem', isColor: false })
  assert.equal(m.get('--type-scale-2').value, '2.25rem')
  assert.equal(m.get('--type-scale-3').value, '1rem')
  assert.equal(m.has('--type-scale-0'), false)
})

test('spacing usa o índice cru (começa em 0)', () => {
  const m = byName(generateTokens({ spacing: [0, 0.25, 0.5, 1] }))
  assert.equal(m.get('--spacing-0').value, '0rem')
  assert.equal(m.get('--spacing-3').value, '1rem')
})

test('borderWidths/borderRadius: índice cru e 0 vira "0" (sem rem)', () => {
  const m = byName(generateTokens({ borderWidths: [0, 0.125, 1], borderRadius: [0, 0.25] }))
  assert.equal(m.get('--border-width-0').value, '0')
  assert.equal(m.get('--border-width-1').value, '0.125rem')
  assert.equal(m.get('--border-width-2').value, '1rem')
  assert.equal(m.get('--border-radius-0').value, '0')
  assert.equal(m.get('--border-radius-1').value, '0.25rem')
})

test('widths/maxWidths/heights usam índice+1', () => {
  const m = byName(generateTokens({ widths: [1, 2], maxWidths: [1, 32], heights: [4] }))
  assert.equal(m.get('--width-1').value, '1rem')
  assert.equal(m.get('--width-2').value, '2rem')
  assert.equal(m.get('--max-width-2').value, '32rem')
  assert.equal(m.get('--height-1').value, '4rem')
})

test('sizes usa o name do item, não o índice', () => {
  const m = byName(generateTokens({ sizes: [{ name: 'small', value: 1 }, { name: 'large', value: 4 }] }))
  assert.equal(m.get('--size-small').value, '1rem')
  assert.equal(m.get('--size-large').value, '4rem')
})

// --- opacidade ---------------------------------------------------------------

test('opacityName cobre os casos da spec', () => {
  assert.equal(opacityName(1), '100')
  assert.equal(opacityName(0), '0')
  assert.equal(opacityName(0.9), '90')
  assert.equal(opacityName(0.05), '05')
  assert.equal(opacityName(0.025), '025')
  assert.equal(opacityName(0.5), '50')
  assert.equal(opacityName(0.1), '10')
})

test('opacity: nome vem do valor e valor fica sem rem', () => {
  const m = byName(generateTokens({ opacity: [1, 0.9, 0.05, 0.025, 0] }))
  assert.equal(m.get('--opacity-100').value, '1')
  assert.equal(m.get('--opacity-90').value, '0.9')
  assert.equal(m.get('--opacity-05').value, '0.05')
  assert.equal(m.get('--opacity-025').value, '0.025')
  assert.equal(m.get('--opacity-0').value, '0')
})

test('opacity também aceita objeto (usa os valores)', () => {
  const m = byName(generateTokens({ opacity: { max: 1, faded: 0.9 } }))
  assert.equal(m.get('--opacity-100').value, '1')
  assert.equal(m.get('--opacity-90').value, '0.9')
})

// --- measure -----------------------------------------------------------------

test('typography.measure vira --measure / -wide / -narrow em em', () => {
  const m = byName(generateTokens({ typography: { measure: [30, 34, 20] } }))
  assert.equal(m.get('--measure').value, '30em')
  assert.equal(m.get('--measure-wide').value, '34em')
  assert.equal(m.get('--measure-narrow').value, '20em')
})

// --- cores -------------------------------------------------------------------

test('colors vira --{chave} com isColor=true', () => {
  const m = byName(generateTokens({ colors: { emphasis: '#F71963', 'action-primary': '#134CD8' } }))
  assert.deepEqual(m.get('--emphasis'), { name: '--emphasis', value: '#F71963', isColor: true })
  assert.equal(m.get('--action-primary').isColor, true)
})

test('colors preserva modificadores --faded / --inverted na chave', () => {
  const m = byName(generateTokens({ colors: { 'success--faded': '#EAFCE3', 'base--inverted': '#131011' } }))
  assert.equal(m.get('--success--faded').value, '#EAFCE3')
  assert.equal(m.get('--base--inverted').value, '#131011')
  assert.equal(m.get('--success--faded').isColor, true)
})

test('semanticColors vira --{grupo}-{chave} com isColor=true', () => {
  const m = byName(
    generateTokens({
      semanticColors: {
        background: { base: '#FFFFFF', 'action-primary': '#134CD8' },
        'hover-background': { 'action-primary': '#0C389F' },
        on: { emphasis: '#FFFFFF' },
      },
    }),
  )
  assert.deepEqual(m.get('--background-base'), { name: '--background-base', value: '#FFFFFF', isColor: true })
  assert.equal(m.get('--background-action-primary').value, '#134CD8')
  assert.equal(m.get('--hover-background-action-primary').value, '#0C389F')
  assert.equal(m.get('--on-emphasis').value, '#FFFFFF')
})

test('semanticColors preserva --faded / --inverted na chave', () => {
  const m = byName(
    generateTokens({
      semanticColors: {
        text: { 'action-primary--faded': '#9CB8F0' },
        background: { 'base--inverted': '#131011' },
      },
    }),
  )
  assert.equal(m.get('--text-action-primary--faded').value, '#9CB8F0')
  assert.equal(m.get('--background-base--inverted').value, '#131011')
})

// --- robustez ----------------------------------------------------------------

test('entrada vazia / inválida devolve lista vazia sem lançar', () => {
  assert.deepEqual(generateTokens(null), [])
  assert.deepEqual(generateTokens(undefined), [])
  assert.deepEqual(generateTokens('x'), [])
  assert.deepEqual(generateTokens({}), [])
})

test('seções ausentes são ignoradas; as presentes ainda geram', () => {
  const tokens = generateTokens({ spacing: [0, 1] })
  assert.equal(tokens.length, 2)
  assert.equal(tokens.every((t) => t.name.startsWith('--spacing-')), true)
})

// --- o asset embutido carrega e gera algo coerente ---------------------------

test('o assets/tokens.json embutido gera cores e escalas', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'tokens.json'), 'utf8'))
  const tokens = generateTokens(raw)
  const m = byName(tokens)
  assert.ok(tokens.length > 40, `esperava vários tokens, veio ${tokens.length}`)
  assert.equal(m.get('--emphasis').value, '#F71963')
  assert.equal(m.get('--emphasis').isColor, true)
  assert.equal(m.get('--type-scale-1').value, '3rem')
  assert.equal(m.get('--opacity-100').value, '1')
  // nenhum nome duplicado
  assert.equal(new Set(tokens.map((t) => t.name)).size, tokens.length)
})
