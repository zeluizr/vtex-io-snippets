#!/usr/bin/env node
// @ts-check
'use strict'

/**
 * Gera icons/*.svg e themes/puelche-icon-theme.json a partir de data/icons.json
 * e da geometria em scripts/icon-shapes.js.
 *
 * Por que gerar em vez de escrever à mão: são ~90 desenhos, 136 definições de
 * ícone (pasta tem dois estados) e ~294 mapeamentos.
 * Com um mapa único, a espessura de traço, o arredondamento e as cores saem
 * iguais em todos, e o CI consegue provar que o manifest commitado é exatamente
 * o que o gerador produz (`git diff --exit-code`).
 *
 * Determinístico: mesma entrada -> mesmos bytes de saída.
 *
 * DUAS CAMADAS (docs/traco-puelche.md). Todo ícone é:
 *
 *   placa   silhueta fechada, `fill` na cor do papel — a pasta ou a página
 *   marca   o símbolo inscrito, traçado no tom escuro do mesmo papel
 *
 * A 16px do Explorer o traço de 1.33px some; mancha sólida não. É a mesma
 * escolha do Material Icon Theme e é o que substituiu o monoline de antes.
 *
 * Escape de marca, por lado da árvore:
 *   pasta   `SHAPES[nome + 'Badge']` se existir, senão `SHAPES[nome]`
 *   arquivo `SHAPES[nome + 'Mark']`  se existir, senão `SHAPES[nome]`
 * São dois porque a mesma forma quer coisas diferentes nos dois lugares: a
 * pasta de `docs` quer um livro, o arquivo `.md` sobre uma placa de página não
 * pode ser outra página. Ver markShape().
 */
const fs = require('fs')
const path = require('path')
const { SHAPES } = require('./icon-shapes')

const ROOT = path.resolve(__dirname, '..')
const MAP = path.join(ROOT, 'data', 'icons.json')
const ICONS_DIR = path.join(ROOT, 'icons')
const THEME_OUT = path.join(ROOT, 'themes', 'puelche-icon-theme.json')

const round = (n) => Math.round(n * 100) / 100

const STROKE = 2

/** Fundo do editor no Puelche — o outro extremo da mistura que dá o tom escuro. */
const BG = '#1A181F'

/**
 * Quanto do fundo entra no tom escuro da marca. Mais que isso vira buraco
 * preto; menos, a marca some dentro da placa.
 *
 * Foi 0.6 e não bastava: cinco papéis ficavam abaixo do piso de 3:1 para
 * elemento gráfico, com `punct` a 2.67:1 — e `punct` é o papel mais frequente
 * da árvore. A 0.7 o pior caso sobe para 3.17:1 e nenhum papel reprova mais.
 * O piso está travado em test/icons.test.js.
 */
const DEEP_MIX = 0.7

const canal = (/** @type {string} */ hex, /** @type {number} */ i) =>
  parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)

/** Mistura dois hex de 6 dígitos. `t` é quanto de `b` entra. Determinístico. */
function mixHex(a, b, t) {
  let out = '#'
  for (let i = 0; i < 3; i++) {
    const v = Math.round(canal(a, i) * (1 - t) + canal(b, i) * t)
    out += v.toString(16).toUpperCase().padStart(2, '0')
  }
  return out
}

/**
 * Vão de conteúdo das formas na grade 24: o desenho vive entre 2 e 22 (spec do
 * traço). É o número que converte "quanta tinta eu quero de altura" em escala.
 *
 * Foi 18 enquanto as formas viviam entre 3 e 21. Passar para 20 derruba a escala
 * ~10% sem mudar a altura de tinta pedida abaixo — e é o que devolve a margem
 * entre a marca e a parede da pasta. Medido a 16px reais, ampliado 8x, numa
 * varredura de 0.44 / 0.47 / 0.50 / 0.53: a partir de 0.50 a tinta da marca
 * encosta na moldura e a silhueta de pasta some — deixa de ser "pasta com
 * marca" e vira "caixa cheia". 0.47 é o teto com a pasta ainda lendo como pasta.
 */
const MARK_SPAN = 20

/**
 * Escala que faz a tinta da marca ocupar `altura` unidades da grade 24.
 * A tinta é o vão de conteúdo escalado MAIS o traço, que é sempre STROKE
 * (a compensação `STROKE / scale` devolve a espessura aparente do conjunto).
 */
const fit = (altura) => round((altura - STROKE) / MARK_SPAN)

/** Posição do `translate` para a marca ficar centrada em (cx, cy). */
const anchor = (cx, cy, scale) => ({ x: round(cx - 12 * scale), y: round(cy - 12 * scale), scale })

/**
 * Marca inscrita: escala e posição por destino.
 *
 * Calibrado a 16px REAIS — que é onde o Explorer desenha —, não a 24. A 16px
 * cada unidade da grade vale 0.67px e a diferença entre "lê" e "borrão" cabe em
 * meia unidade. O que a folha de contato ampliada mostrou:
 *
 * - a marca precisa PREENCHER a altura livre do corpo. Folga bonita a 24px é
 *   pixel roubado a 16px: com 1u de folga o conjunto inteiro vira o mesmo
 *   borrão e distinguir dist/docs/scripts deixa de ser possível.
 * - passar disso não compra nada: acima do teto a tinta da marca encosta na
 *   parede da placa e a silhueta some — vira uma mancha cheia.
 *
 * CLOSED: o corpo da pasta tem 5.4..22 em y livres — 16.6u. A marca preenche
 * essa altura menos ~1.85u de cada lado e fica centrada no corpo, não na caixa
 * de 24.
 *
 * OPEN: a faixa inclinada deixa menos altura livre. Aqui a marca sangra um
 * pouco sobre as bordas da faixa de propósito: perder um pedaço da borda custa
 * menos que perder o desenho inteiro.
 *
 * PLATE: o corpo da página tem 3..21 em x e 0.5..23.5 em y, menos a orelha no
 * canto superior direito. A marca desce para (12, 14.8) para passar por baixo
 * dela. A escala é irmã da da pasta de propósito — uma marca que sobrevive
 * dentro da pasta sobrevive na placa, e as duas usam a mesma biblioteca.
 */
const CLOSED = anchor(12, 13.7, fit(12.9))
const OPEN = anchor(12.6, 16.3, fit(10.2))
const PLATE = anchor(12, 14.8, fit(13.4))

/**
 * Embrulha as camadas num SVG completo, já colorido.
 *
 * A raiz carrega `fill` da cor do papel e `stroke="none"`: a placa herda e não
 * precisa declarar pintura. Quem tem pintura própria é só a orelha da página
 * (token `@d`, o tom escuro) e a camada de marca.
 */
function svg(inner, color) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" ' +
    `fill="${color}" stroke="none">` +
    inner +
    '</svg>\n'
  )
}

/** Camada de placa: `@c` é a cor do papel, `@d` o tom escuro (a orelha). */
function plateLayer(markup, color, deep) {
  return markup.replace(/@c/g, color).replace(/@d/g, deep)
}

/**
 * Camada de marca: escalada, posicionada e traçada no tom escuro.
 * O `<g>` reinjeta `stroke-width = STROKE / scale` para a espessura aparente
 * sair 2 depois da escala. Dentro dela `@c` é a cor da camada — o tom escuro.
 */
function markLayer(markup, pos, deep) {
  const { x, y, scale } = pos
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${deep}" ` +
    `stroke-width="${round(STROKE / scale)}" stroke-linecap="round" stroke-linejoin="round">` +
    markup.replace(/@c/g, deep) +
    '</g>'
  )
}

/**
 * Marca inscrita, com o escape por destino.
 *
 * `destino` é 'Badge' (pasta) ou 'Mark' (arquivo). A pasta de `docs` quer um
 * livro; o arquivo `.md`, que já É uma página, não pode ter outra página
 * dentro. Por isso os dois apelidos convivem e `data/icons.json` não muda: os
 * dois lados continuam apontando para a mesma forma base.
 */
function markShape(name, destino) {
  const mark = SHAPES[`${name}${destino}`] || SHAPES[name]
  if (!mark) throw new Error(`forma desconhecida na marca: ${name}`)
  return mark
}

/** Pasta sólida com a marca do papel inscrita. */
function folderSvg(shapeName, color, deep, expanded) {
  const base = plateLayer(expanded ? SHAPES.folderOpen : SHAPES.folder, color, deep)
  if (!shapeName) return svg(base, color)
  const mark = markShape(shapeName, 'Badge')
  return svg(base + markLayer(mark, expanded ? OPEN : CLOSED, deep), color)
}

/** Placa de página com a marca do tipo inscrita. `shapeName` nulo = sem marca. */
function fileSvg(shapeName, color, deep) {
  const base = plateLayer(SHAPES.plate, color, deep)
  if (!shapeName) return svg(base, color)
  const mark = markShape(shapeName, 'Mark')
  return svg(base + markLayer(mark, PLATE, deep), color)
}

function main() {
  const map = JSON.parse(fs.readFileSync(MAP, 'utf8'))
  /** @param {string} role */
  const color = (role) => {
    const c = map.roles[role]
    if (!c) throw new Error(`papel de cor desconhecido: ${role}`)
    return c
  }
  /** @param {string} role */
  const deep = (role) => {
    const c = map.rolesDeep[role]
    if (!c) throw new Error(`papel sem tom escuro em rolesDeep: ${role}`)
    const esperado = mixHex(color(role), BG, DEEP_MIX)
    if (c !== esperado) {
      throw new Error(`rolesDeep.${role} é ${c} e a mistura de ${DEEP_MIX} dá ${esperado}`)
    }
    return c
  }

  // remove só os SVGs que ESTE gerador é dono, no nível de cima. Um rmSync na
  // pasta inteira levaria junto icons/product/, que é insumo do gerador da fonte
  // — e aí a ordem de execução dos dois builds passaria a importar.
  fs.mkdirSync(ICONS_DIR, { recursive: true })
  for (const f of fs.readdirSync(ICONS_DIR)) {
    if (f.endsWith(".svg")) fs.rmSync(path.join(ICONS_DIR, f))
  }

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

  // padrões — placa e pasta sem marca: aqui a cor do papel é a única informação
  write('file.svg', fileSvg(null, color(map.defaults.file.role), deep(map.defaults.file.role)))
  define('_file', 'file.svg')
  write('folder.svg', folderSvg(null, color(map.defaults.folder.role), deep(map.defaults.folder.role), false))
  define('_folder', 'folder.svg')
  write('folder-open.svg', folderSvg(null, color(map.defaults.folder.role), deep(map.defaults.folder.role), true))
  define('_folder-open', 'folder-open.svg')

  // arquivos
  for (const entry of map.files) {
    const file = `${entry.id}.svg`
    write(file, fileSvg(entry.shape, color(entry.role), deep(entry.role)))
    const key = `_${entry.id}`
    define(key, file)
    for (const ext of entry.ext || []) fileExtensions[ext.toLowerCase()] = key
    for (const name of entry.names || []) fileNames[name.toLowerCase()] = key
    for (const lang of entry.langs || []) languageIds[lang] = key
  }

  // pastas
  for (const entry of map.folders) {
    const c = color(entry.role)
    const d = deep(entry.role)
    write(`folder-${entry.id}.svg`, folderSvg(entry.shape, c, d, false))
    write(`folder-${entry.id}-open.svg`, folderSvg(entry.shape, c, d, true))
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

module.exports = {
  main,
  svg,
  fileSvg,
  folderSvg,
  markShape,
  mixHex,
  BG,
  DEEP_MIX,
  STROKE,
  CLOSED,
  OPEN,
  PLATE,
  THEME_OUT,
  ICONS_DIR,
}

if (require.main === module) main()
