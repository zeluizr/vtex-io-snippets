#!/usr/bin/env node
// @ts-check
'use strict'

/**
 * Gera a fonte do product icon theme (o "chrome" do VS Code: activity bar,
 * árvore, painéis, badges) a partir de data/product-icons.json e das formas
 * em scripts/product-shapes-{a,b}.js.
 *
 * Cadeia: SVG (16x16) -> svgicons2svgfont -> svg2ttf -> ttf2woff.
 *   themes/puelche-product.woff        binário da fonte
 *   themes/puelche-product-icons.json  manifest do product icon theme
 *   icons/product/*.svg                insumo de trabalho (fora do .vsix)
 *
 * Por que gerar: são 58 desenhos que viram 93 entradas depois de expandir os
 * apelidos do codicon. Escrever isso à mão erra codepoint e esquece apelido —
 * e apelido esquecido é o usuário vendo nosso ícone ao lado do nativo.
 *
 * Determinístico: mesma entrada -> mesmos bytes. `svg2ttf` recebe `ts` fixo
 * (senão carimba `new Date()` no head da fonte) e a ordem dos glifos vem do id,
 * não do glob. Assim o CI consegue provar com `git diff --exit-code` que o
 * .woff commitado é exatamente o que este script produz.
 *
 * Métrica: fontHeight 1000 + descent 0 põe o glifo em [0, 1000] acima da
 * baseline — mesma razão do codicon.ttf nativo (ascender 300 / descender 0 /
 * upm 300). A conta do svgicons2svgfont é
 *   y_fonte = (altura_escalada - descent) - y_svg
 * então com viewBox 0 0 16 16 e width/height 16 a pré-transformação é a
 * identidade e o desenho sai na escala certa sem `normalize`.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const MAP = path.join(ROOT, 'data', 'product-icons.json')
const CODEPOINTS = path.join(ROOT, 'data', 'product-codepoints.json')
const SVG_DIR = path.join(ROOT, 'icons', 'product')
const THEMES_DIR = path.join(ROOT, 'themes')
const WOFF_OUT = path.join(THEMES_DIR, 'puelche-product.woff')
const THEME_OUT = path.join(THEMES_DIR, 'puelche-product-icons.json')
const CODICON_MAPPING = path.join(
  ROOT,
  'node_modules',
  '@vscode',
  'codicons',
  'src',
  'template',
  'mapping.json',
)

const FONT_ID = 'puelche'
const FONT_NAME = 'puelche-product'
/** Início da Private Use Area. Os codepoints reais vêm do arquivo append-only. */
const FIRST_CODEPOINT = 0xe900
/** Data fixa no head da fonte — sem isto o .woff muda a cada build. */
const TIMESTAMP = 0

/** Atributos que denunciam desenho a traço ou geometria que a fonte não honra. */
const FORBIDDEN_ATTRS = [
  'transform',
  'style',
  'fill-rule',
  'clip-rule',
  'clip-path',
  'mask',
  'opacity',
  'fill-opacity',
]

/**
 * Carrega um módulo de formas que pode ainda não existir (os agentes de
 * desenho entregam em paralelo). Ausência vira `{}`; erro dentro do módulo
 * continua estourando.
 * @param {string} file
 * @returns {Record<string, string>}
 */
function loadShapes(file) {
  const abs = path.join(__dirname, file)
  if (!fs.existsSync(abs)) return {}
  const mod = require(abs)
  const shapes = mod && mod.PRODUCT_SHAPES
  if (!shapes || typeof shapes !== 'object') {
    throw new Error(`${file} não exporta PRODUCT_SHAPES`)
  }
  return shapes
}

/**
 * Valida o markup de uma forma. Só `<path>` preenchido: `fill="none"` é
 * descartado silenciosamente pelo svgicons2svgfont (glifo vazio), traço não
 * existe em fonte, e `transform`/`fill-rule` mudam o resultado de um jeito que
 * a conversão para quadráticas não reproduz.
 * @param {string} id
 * @param {string} markup
 */
function lintShape(id, markup) {
  const fail = (msg) => {
    throw new Error(`forma "${id}" reprovada no lint: ${msg}`)
  }
  if (typeof markup !== 'string' || !markup.trim()) fail('markup vazio')
  if (/<\//.test(markup)) fail('use só <path .../> auto-fechado, sem tags de fechamento')

  const outside = markup.replace(/<[^>]*>/g, '').trim()
  if (outside) fail(`texto solto fora de tag: ${JSON.stringify(outside.slice(0, 40))}`)

  const tags = markup.match(/<[a-zA-Z][^>]*>/g) || []
  if (!tags.length) fail('nenhum elemento encontrado')

  for (const tag of tags) {
    const name = (tag.match(/^<([a-zA-Z][\w:-]*)/) || [])[1]
    if (name !== 'path') fail(`elemento <${name}> não permitido (só <path>)`)

    /** @type {Record<string, string>} */
    const attrs = {}
    const re = /([a-zA-Z][\w:-]*)\s*=\s*"([^"]*)"/g
    let m
    while ((m = re.exec(tag)) !== null) attrs[m[1]] = m[2]

    if (!attrs.d || !attrs.d.trim()) fail('<path> sem atributo d')
    for (const key of Object.keys(attrs)) {
      if (key.startsWith('stroke')) fail(`atributo "${key}" — a fonte não tem traço, desenhe o contorno`)
      if (FORBIDDEN_ATTRS.includes(key)) fail(`atributo "${key}" não permitido`)
    }
    if (attrs.fill === 'none') fail('fill="none" vira glifo vazio na fonte')
  }
}

/**
 * Embrulha a forma num SVG 16x16. width/height/viewBox iguais fazem a
 * pré-transformação do svgicons2svgfont virar identidade.
 * @param {string} markup
 */
function wrapSvg(markup) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">' +
    markup +
    '</svg>\n'
  )
}

/**
 * Lê o mapping.json do @vscode/codicons (formato codepoint -> [apelidos]) e
 * devolve id-base -> lista de todos os nomes que compartilham o glifo.
 * @returns {Map<string, string[]>}
 */
function readCodiconAliases() {
  if (!fs.existsSync(CODICON_MAPPING)) {
    throw new Error(
      `@vscode/codicons não encontrado em ${CODICON_MAPPING} — rode npm install`,
    )
  }
  /** @type {Record<string, string[]>} */
  const mapping = JSON.parse(fs.readFileSync(CODICON_MAPPING, 'utf8'))
  /** @type {Map<string, string[]>} */
  const byName = new Map()
  for (const names of Object.values(mapping)) {
    for (const name of names) byName.set(name, names)
  }
  return byName
}

/** Ordenação independente de locale — `localeCompare` varia por máquina. */
const compareIds = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * Aloca codepoints de forma estável: o que já está gravado nunca muda, o que é
 * novo pega o primeiro livre a partir de 0xE900. Sem isto, adicionar um ícone
 * no meio da lista renumeraria todos os seguintes e o .woff mudaria inteiro.
 * @param {string[]} ids
 * @returns {{ table: Record<string, string>, assigned: string[] }}
 */
function allocateCodepoints(ids) {
  /** @type {{ _comment?: string[], codepoints?: Record<string, string> }} */
  const previous = fs.existsSync(CODEPOINTS)
    ? JSON.parse(fs.readFileSync(CODEPOINTS, 'utf8'))
    : {}
  /** @type {Record<string, string>} */
  const table = { ...(previous.codepoints || {}) }

  const used = new Set(Object.values(table).map((hex) => parseInt(hex, 16)))
  for (const [id, hex] of Object.entries(table)) {
    if (!/^[0-9a-f]{4,6}$/.test(hex)) {
      throw new Error(`codepoint inválido para "${id}" em product-codepoints.json: ${hex}`)
    }
  }
  if (used.size !== Object.keys(table).length) {
    throw new Error('product-codepoints.json tem codepoint repetido')
  }

  /** @type {string[]} */
  const assigned = []
  let next = FIRST_CODEPOINT
  for (const id of [...ids].sort(compareIds)) {
    if (table[id]) continue
    while (used.has(next)) next += 1
    table[id] = next.toString(16)
    used.add(next)
    assigned.push(id)
  }

  return { table, assigned }
}

/**
 * Roda a cadeia svgicons2svgfont -> svg2ttf -> ttf2woff.
 * @param {Array<{ id: string, file: string, codepoint: string }>} glyphs
 * @returns {Promise<Buffer>}
 */
async function buildWoff(glyphs) {
  // svgicons2svgfont@16 é ESM; este repo é CommonJS, daí o import dinâmico.
  const { SVGIcons2SVGFontStream } = await import('svgicons2svgfont')
  const svg2ttf = require('svg2ttf')
  const ttf2woff = require('ttf2woff')

  const svgFont = await new Promise((resolve, reject) => {
    const chunks = []
    const stream = new SVGIcons2SVGFontStream({
      fontName: FONT_NAME,
      fontId: FONT_ID,
      fontHeight: 1000,
      descent: 0,
      normalize: false,
      preserveAspectRatio: false,
      centerHorizontally: false,
      centerVertically: false,
      fixedWidth: false,
      metadata: '',
    })
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    stream.on('error', reject)

    for (const glyph of glyphs) {
      const input = fs.createReadStream(glyph.file)
      // @ts-expect-error — a API do svgicons2svgfont pede metadata no stream
      input.metadata = {
        name: glyph.id,
        unicode: [String.fromCodePoint(parseInt(glyph.codepoint, 16))],
      }
      stream.write(input)
    }
    stream.end()
  })

  const ttf = svg2ttf(svgFont, {
    ts: TIMESTAMP,
    version: '1.0',
    description: 'Puelche product icons',
    url: 'https://github.com/zeluizr/vtex-io-snippets',
    copyright: 'MIT',
  })
  return Buffer.from(ttf2woff(new Uint8Array(ttf.buffer)))
}

async function main() {
  const map = JSON.parse(fs.readFileSync(MAP, 'utf8'))
  /** @type {Array<{ id: string, shape: string, group?: string }>} */
  const icons = map.icons || []
  if (!icons.length) throw new Error('data/product-icons.json sem ícones')

  const shapes = { ...loadShapes('product-shapes-a.js'), ...loadShapes('product-shapes-b.js') }
  const aliasesByName = readCodiconAliases()

  // ---- validação da entrada ----
  const seenIds = new Set()
  for (const entry of icons) {
    if (!entry || !entry.id || !entry.shape) {
      throw new Error(`entrada inválida em product-icons.json: ${JSON.stringify(entry)}`)
    }
    if (seenIds.has(entry.id)) throw new Error(`id repetido em product-icons.json: ${entry.id}`)
    seenIds.add(entry.id)
    if (!aliasesByName.has(entry.id)) {
      throw new Error(`"${entry.id}" não é um id de codicon (confira @vscode/codicons/mapping.json)`)
    }
    if (!Object.prototype.hasOwnProperty.call(shapes, entry.shape)) {
      throw new Error(
        `forma "${entry.shape}" (ícone "${entry.id}") não existe em product-shapes-a.js nem em product-shapes-b.js`,
      )
    }
    lintShape(entry.shape, shapes[entry.shape])
  }

  const unused = Object.keys(shapes).filter((s) => !icons.some((i) => i.shape === s))
  if (unused.length) console.warn(`aviso: formas sem uso: ${unused.sort(compareIds).join(', ')}`)

  // ---- codepoints estáveis ----
  const { table, assigned } = allocateCodepoints(icons.map((i) => i.id))
  const ordered = Object.entries(table).sort((a, b) => parseInt(a[1], 16) - parseInt(b[1], 16))
  fs.writeFileSync(
    CODEPOINTS,
    JSON.stringify(
      {
        _comment: [
          'Codepoints da PUA usados pela fonte do product icon theme. APPEND-ONLY:',
          'o gerador nunca reatribui um id já listado, só acrescenta o próximo livre',
          'a partir de 0xE900. Assim incluir um ícone novo não renumera os antigos e',
          'o .woff continua estável byte a byte. Não edite nem remova entradas à mão —',
          'um id apagado daqui reaproveitaria o número em outro desenho.',
        ],
        codepoints: Object.fromEntries(ordered),
      },
      null,
      2,
    ) + '\n',
  )

  // ---- SVGs de trabalho ----
  fs.rmSync(SVG_DIR, { recursive: true, force: true })
  fs.mkdirSync(SVG_DIR, { recursive: true })

  // Ordem dos glifos ditada pelo id, não pela ordem do arquivo nem por glob.
  const sorted = [...icons].sort((a, b) => compareIds(a.id, b.id))
  /** @type {Array<{ id: string, file: string, codepoint: string }>} */
  const glyphs = []
  for (const entry of sorted) {
    const file = path.join(SVG_DIR, `${entry.id}.svg`)
    fs.writeFileSync(file, wrapSvg(shapes[entry.shape]))
    glyphs.push({ id: entry.id, file, codepoint: table[entry.id] })
  }

  // ---- fonte ----
  const woff = await buildWoff(glyphs)
  fs.mkdirSync(THEMES_DIR, { recursive: true })
  fs.writeFileSync(WOFF_OUT, woff)

  // ---- manifest ----
  /** @type {Record<string, { fontCharacter: string, fontId: string }>} */
  const iconDefinitions = {}
  for (const entry of sorted) {
    const fontCharacter = `\\${table[entry.id]}`
    for (const alias of aliasesByName.get(entry.id) || [entry.id]) {
      if (iconDefinitions[alias]) {
        throw new Error(
          `"${entry.id}" colide em "${alias}": esse apelido já veio de outro id-base. ` +
            'Dois ids do mesmo codepoint do codicon não podem estar os dois em product-icons.json.',
        )
      }
      iconDefinitions[alias] = { fontCharacter, fontId: FONT_ID }
    }
  }

  const theme = {
    fonts: [
      {
        id: FONT_ID,
        // Resolvido a partir da pasta DESTE arquivo, por isso o "./".
        src: [{ path: './puelche-product.woff', format: 'woff' }],
        weight: 'normal',
        style: 'normal',
      },
    ],
    iconDefinitions,
  }
  fs.writeFileSync(THEME_OUT, JSON.stringify(theme, null, 2) + '\n')

  console.log(
    `OK: ${icons.length} ids-base -> ${Object.keys(iconDefinitions).length} entradas ` +
      `(${Object.keys(iconDefinitions).length - icons.length} apelidos), ` +
      `${(woff.length / 1024).toFixed(1)} kB de .woff` +
      (assigned.length ? ` | codepoints novos: ${assigned.join(', ')}` : ''),
  )
}

module.exports = { main, lintShape, wrapSvg, allocateCodepoints, WOFF_OUT, THEME_OUT, SVG_DIR }

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
