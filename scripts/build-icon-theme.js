#!/usr/bin/env node
// @ts-check
'use strict'

/**
 * Gera icons/*.svg e themes/puelche-icon-theme.json a partir de data/icons.json
 * e da geometria em scripts/icon-shapes.js.
 *
 * Por que gerar em vez de escrever à mão: são 72 desenhos, 100 definições de
 * ícone (pasta tem dois estados) e ~247 mapeamentos.
 * Com um mapa único, a espessura de traço, o arredondamento e as cores saem
 * iguais em todos, e o CI consegue provar que o manifest commitado é exatamente
 * o que o gerador produz (`git diff --exit-code`).
 *
 * Determinístico: mesma entrada -> mesmos bytes de saída.
 */
const fs = require('fs')
const path = require('path')
const { SHAPES } = require('./icon-shapes')

const ROOT = path.resolve(__dirname, '..')
const MAP = path.join(ROOT, 'data', 'icons.json')
const ICONS_DIR = path.join(ROOT, 'icons')
const THEME_OUT = path.join(ROOT, 'themes', 'puelche-icon-theme.json')

const STROKE = 1.8
// Marca dentro da pasta: escala e posição por estado. O traço da marca é
// dividido pela escala para sair com a MESMA espessura do resto do conjunto.
const CLOSED = { x: 6.6, y: 8.4, scale: 0.46 }
const OPEN = { x: 8.6, y: 9.9, scale: 0.38 }

/** Embrulha markup de forma num SVG completo, já colorido. */
function svg(inner, color) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" ' +
    `fill="none" stroke="${color}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">` +
    inner.replace(/@c/g, color) +
    '</svg>\n'
  )
}

/** Pasta com a marca do papel dentro dela. */
function folderSvg(shapeName, color, expanded) {
  const base = expanded ? SHAPES.folderOpen : SHAPES.folder
  if (!shapeName) return svg(base, color)
  const { x, y, scale } = expanded ? OPEN : CLOSED
  const mark = SHAPES[shapeName]
  const inner =
    base +
    `<g transform="translate(${x} ${y}) scale(${scale})" stroke-width="${round(STROKE / scale)}">${mark}</g>`
  return svg(inner, color)
}

const round = (n) => Math.round(n * 100) / 100

function main() {
  const map = JSON.parse(fs.readFileSync(MAP, 'utf8'))
  /** @param {string} role */
  const color = (role) => {
    const c = map.roles[role]
    if (!c) throw new Error(`papel de cor desconhecido: ${role}`)
    return c
  }
  /** @param {string} name */
  const shape = (name) => {
    const s = SHAPES[name]
    if (!s) throw new Error(`forma desconhecida: ${name}`)
    return s
  }

  fs.rmSync(ICONS_DIR, { recursive: true, force: true })
  fs.mkdirSync(ICONS_DIR, { recursive: true })

  /** @type {Record<string, { iconPath: string }>} */
  const iconDefinitions = {}
  /** @type {Record<string, string>} */
  const fileExtensions = {}
  /** @type {Record<string, string>} */
  const fileNames = {}
  /** @type {Record<string, string>} */
  const languageIds = {}
  /** @type {Record<string, string>} */
  const folderNames = {}
  /** @type {Record<string, string>} */
  const folderNamesExpanded = {}

  const write = (file, content) => fs.writeFileSync(path.join(ICONS_DIR, file), content)
  const define = (key, file) => {
    iconDefinitions[key] = { iconPath: `../icons/${file}` }
  }

  // padrões
  write('file.svg', svg(shape(map.defaults.file.shape), color(map.defaults.file.role)))
  define('_file', 'file.svg')
  write('folder.svg', folderSvg(null, color(map.defaults.folder.role), false))
  define('_folder', 'folder.svg')
  write('folder-open.svg', folderSvg(null, color(map.defaults.folder.role), true))
  define('_folder-open', 'folder-open.svg')

  // arquivos
  for (const entry of map.files) {
    const file = `${entry.id}.svg`
    write(file, svg(shape(entry.shape), color(entry.role)))
    const key = `_${entry.id}`
    define(key, file)
    for (const ext of entry.ext || []) fileExtensions[ext.toLowerCase()] = key
    for (const name of entry.names || []) fileNames[name.toLowerCase()] = key
    for (const lang of entry.langs || []) languageIds[lang] = key
  }

  // pastas
  for (const entry of map.folders) {
    const c = color(entry.role)
    write(`folder-${entry.id}.svg`, folderSvg(entry.shape, c, false))
    write(`folder-${entry.id}-open.svg`, folderSvg(entry.shape, c, true))
    define(`_folder-${entry.id}`, `folder-${entry.id}.svg`)
    define(`_folder-${entry.id}-open`, `folder-${entry.id}-open.svg`)
    for (const name of entry.names) {
      folderNames[name.toLowerCase()] = `_folder-${entry.id}`
      folderNamesExpanded[name.toLowerCase()] = `_folder-${entry.id}-open`
    }
  }

  const theme = {
    hidesExplorerArrows: false,
    // sem isto o VS Code completa as linguagens não cobertas com a arte que
    // CADA extensão de linguagem contribuiu — estilos alheios no meio do conjunto.
    showLanguageModeIcons: false,
    iconDefinitions,
    file: '_file',
    folder: '_folder',
    folderExpanded: '_folder-open',
    folderNames,
    folderNamesExpanded,
    fileExtensions,
    fileNames,
    languageIds,
  }
  fs.mkdirSync(path.dirname(THEME_OUT), { recursive: true })
  fs.writeFileSync(THEME_OUT, JSON.stringify(theme, null, 2) + '\n')

  // trava: todo iconPath tem que resolver a partir da pasta do manifest
  for (const [key, def] of Object.entries(iconDefinitions)) {
    const abs = path.resolve(path.dirname(THEME_OUT), def.iconPath)
    if (!fs.existsSync(abs)) throw new Error(`iconPath quebrado em ${key}: ${def.iconPath}`)
  }

  console.log(
    `OK: ${Object.keys(iconDefinitions).length} ícones -> ` +
      `${Object.keys(fileExtensions).length} extensões, ${Object.keys(fileNames).length} nomes, ` +
      `${Object.keys(languageIds).length} linguagens, ${Object.keys(folderNames).length} pastas`,
  )
}

module.exports = { main, svg, folderSvg, THEME_OUT, ICONS_DIR }

if (require.main === module) main()
