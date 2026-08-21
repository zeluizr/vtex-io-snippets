// @ts-check
'use strict'

/**
 * Travas do file icon theme e do product icon theme Puelche.
 *
 * Quase toda falha de icon theme é silenciosa: o VS Code não avisa quando um
 * iconPath não resolve, quando uma chave de fileExtensions vem com ponto ou
 * quando o glifo simplesmente não existe no .woff — só aparece o ícone padrão.
 * Cada regra que só falharia "visualmente" vira asserção aqui.
 *
 * O tema de produto ainda pode não existir: os testes dele pulam com graça.
 */

const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const zlib = require('zlib')
const { execFileSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const MAP_PATH = path.join(ROOT, 'data', 'icons.json')
const THEME_PATH = path.join(ROOT, 'themes', 'puelche-icon-theme.json')
const ICONS_DIR = path.join(ROOT, 'icons')
const PRODUCT_THEME_PATH = path.join(ROOT, 'themes', 'puelche-product-icons.json')
const VSCODEIGNORE = path.join(ROOT, '.vscodeignore')

const MAP = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'))
const THEME_RAW = fs.readFileSync(THEME_PATH, 'utf8')
const THEME = JSON.parse(THEME_RAW)
const THEME_DIR = path.dirname(THEME_PATH)

/** Associações id -> ícone, na ordem de precedência do VS Code. */
const MAPAS = ['fileExtensions', 'fileNames', 'languageIds', 'folderNames', 'folderNamesExpanded']
/** Associações de valor único. */
const RAIZES = ['file', 'folder', 'folderExpanded']

/** Todos os ids de ícone citados por alguma associação do manifest. */
function idsReferenciados(theme) {
  const ids = new Set()
  for (const k of RAIZES) if (theme[k]) ids.add(theme[k])
  for (const k of MAPAS) for (const id of Object.values(theme[k] || {})) ids.add(String(id))
  return ids
}

/** Lista os .svg do diretório de ícones, ordenada. */
function listarSvgs(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()
}

// ---------------------------------------------------------------------------
// Manifest do file icon theme
// ---------------------------------------------------------------------------

test('todo iconPath resolve a partir do diretório do arquivo de tema', () => {
  const entradas = Object.entries(THEME.iconDefinitions)
  assert.ok(entradas.length > 0, 'iconDefinitions vazio')
  for (const [id, def] of entradas) {
    assert.ok(def && typeof def.iconPath === 'string', `"${id}" sem iconPath`)
    assert.ok(!path.isAbsolute(def.iconPath), `"${id}" usa caminho absoluto`)
    const abs = path.resolve(THEME_DIR, def.iconPath)
    assert.ok(fs.existsSync(abs), `"${id}" aponta para ${def.iconPath}, que não existe a partir de themes/`)
  }
})

test('toda associação cita um id existente em iconDefinitions', () => {
  const definidos = new Set(Object.keys(THEME.iconDefinitions))
  for (const k of RAIZES) {
    assert.ok(THEME[k], `manifest sem "${k}"`)
    assert.ok(definidos.has(THEME[k]), `"${k}" cita "${THEME[k]}", que não está em iconDefinitions`)
  }
  for (const mapa of MAPAS) {
    for (const [chave, id] of Object.entries(THEME[mapa] || {})) {
      assert.ok(definidos.has(String(id)), `${mapa}["${chave}"] cita "${id}", que não está em iconDefinitions`)
    }
  }
})

test('nenhum ícone órfão: todo id definido é usado por alguma associação', () => {
  const usados = idsReferenciados(THEME)
  const orfaos = Object.keys(THEME.iconDefinitions).filter((id) => !usados.has(id))
  assert.deepEqual(orfaos, [], 'ids definidos mas nunca associados (peso morto no pacote)')
})

test('nenhuma chave de fileExtensions começa com ponto', () => {
  const comPonto = Object.keys(THEME.fileExtensions || {}).filter((k) => k.startsWith('.'))
  assert.deepEqual(comPonto, [], 'extensão com ponto vira seletor que nunca casa')
})

test('nome que começa com ponto fica em fileNames, nunca em fileExtensions', () => {
  const exts = new Set(Object.keys(THEME.fileExtensions || {}))
  const nomes = new Set(Object.keys(THEME.fileNames || {}))
  const doMapa = MAP.files.flatMap((/** @type {any} */ e) => e.names || []).map((/** @type {string} */ n) => n.toLowerCase())
  for (const nome of doMapa.filter((/** @type {string} */ n) => n.startsWith('.'))) {
    assert.ok(nomes.has(nome), `"${nome}" está no mapa mas não chegou em fileNames`)
    assert.ok(!exts.has(nome), `"${nome}" foi parar em fileExtensions`)
  }
  // e nenhum dotfile escapou para o mapa de extensões pelo caminho inverso
  for (const ext of exts) assert.ok(!ext.startsWith('.'), `"${ext}" em fileExtensions parece um dotfile`)
})

test('todas as chaves de associação estão em minúsculas', () => {
  for (const mapa of MAPAS) {
    for (const chave of Object.keys(THEME[mapa] || {})) {
      assert.equal(chave, chave.toLowerCase(), `${mapa}["${chave}"] não está em minúsculas`)
    }
  }
})

test('showLanguageModeIcons é false (sem arte de terceiros no conjunto)', () => {
  assert.equal(THEME.showLanguageModeIcons, false)
})

test('o mapa de origem não tem ids repetidos dentro da mesma lista', () => {
  for (const lista of ['files', 'folders']) {
    const ids = MAP[lista].map((/** @type {any} */ e) => e.id)
    assert.equal(new Set(ids).size, ids.length, `ids repetidos em ${lista} de data/icons.json`)
  }
})

// ---------------------------------------------------------------------------
// SVGs gerados
// ---------------------------------------------------------------------------

test('toda cor dos SVGs pertence ao bloco roles e nenhum currentColor sobrou', () => {
  const permitidas = new Set(Object.values(MAP.roles).map((/** @type {any} */ c) => String(c).toUpperCase()))
  const foraDaPaleta = new Set()
  const comCurrentColor = []
  for (const arquivo of listarSvgs(ICONS_DIR)) {
    const raw = fs.readFileSync(path.join(ICONS_DIR, arquivo), 'utf8')
    if (/currentColor/i.test(raw)) comCurrentColor.push(arquivo)
    for (const hex of raw.match(/#[0-9A-Fa-f]{3,8}/g) || []) {
      if (!permitidas.has(hex.toUpperCase())) foraDaPaleta.add(`${arquivo}: ${hex}`)
    }
  }
  assert.deepEqual([...comCurrentColor], [], 'currentColor sobrou (substituição de cor falhou)')
  assert.deepEqual([...foraDaPaleta], [], 'cor fora do bloco roles de data/icons.json')
})

test('todo SVG tem viewBox 0 0 24 24 e tags balanceadas', () => {
  const arquivos = listarSvgs(ICONS_DIR)
  assert.ok(arquivos.length > 0, 'nenhum SVG em icons/')
  for (const arquivo of arquivos) {
    const raw = fs.readFileSync(path.join(ICONS_DIR, arquivo), 'utf8')
    assert.match(raw, /<svg\b[^>]*\sviewBox="0 0 24 24"/, `${arquivo} sem viewBox 0 0 24 24`)
    /** @type {string[]} */
    const pilha = []
    const tags = raw.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)
    for (const [, fecha, nome, , autoFecha] of tags) {
      if (fecha) {
        assert.equal(pilha.pop(), nome, `${arquivo}: </${nome}> sem abertura correspondente`)
      } else if (!autoFecha) {
        pilha.push(nome)
      }
    }
    assert.deepEqual(pilha, [], `${arquivo}: tags abertas sem fechar`)
    assert.match(raw.trim(), /^<svg\b[\s\S]*<\/svg>$/, `${arquivo} não é um <svg> completo`)
  }
})

// ---------------------------------------------------------------------------
// Determinismo do gerador
// ---------------------------------------------------------------------------

test('rodar o gerador de novo produz exatamente os mesmos bytes', () => {
  // Roda numa cópia em /tmp: o gerador apaga e reescreve icons/, então rodá-lo
  // aqui deixaria o repo sujo se a saída divergisse.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'puelche-icons-'))
  try {
    fs.mkdirSync(path.join(tmp, 'scripts'), { recursive: true })
    fs.mkdirSync(path.join(tmp, 'data'), { recursive: true })
    fs.copyFileSync(path.join(ROOT, 'scripts', 'build-icon-theme.js'), path.join(tmp, 'scripts', 'build-icon-theme.js'))
    fs.copyFileSync(path.join(ROOT, 'scripts', 'icon-shapes.js'), path.join(tmp, 'scripts', 'icon-shapes.js'))
    fs.copyFileSync(MAP_PATH, path.join(tmp, 'data', 'icons.json'))

    execFileSync(process.execPath, [path.join(tmp, 'scripts', 'build-icon-theme.js')], { stdio: 'pipe' })

    const manifestNovo = fs.readFileSync(path.join(tmp, 'themes', 'puelche-icon-theme.json'), 'utf8')
    assert.equal(manifestNovo, THEME_RAW, 'o manifest commitado não é o que o gerador produz')

    const novos = listarSvgs(path.join(tmp, 'icons'))
    assert.deepEqual(novos, listarSvgs(ICONS_DIR), 'a lista de SVGs commitada difere da gerada')
    for (const arquivo of novos) {
      const a = fs.readFileSync(path.join(tmp, 'icons', arquivo))
      const b = fs.readFileSync(path.join(ICONS_DIR, arquivo))
      assert.ok(a.equals(b), `${arquivo} commitado difere do gerado`)
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Parser de WOFF (sem dependência: só zlib nativo)
// ---------------------------------------------------------------------------

/**
 * Lê o header e o table directory de um WOFF, devolvendo as tabelas já
 * descomprimidas. Header: 44 bytes, magic "wOFF" e numTables em 12.
 * Cada entrada do directory tem 20 bytes: tag, offset, compLength, origLength,
 * checksum. compLength < origLength significa tabela comprimida com zlib.
 * @param {Buffer} buf
 * @returns {Record<string, Buffer>}
 */
function lerWoff(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'wOFF', 'assinatura wOFF ausente')
  const numTables = buf.readUInt16BE(12)
  assert.ok(numTables > 0 && numTables < 512, `numTables improvável: ${numTables}`)
  /** @type {Record<string, Buffer>} */
  const tabelas = {}
  for (let i = 0; i < numTables; i++) {
    const p = 44 + i * 20
    const tag = buf.toString('ascii', p, p + 4)
    const offset = buf.readUInt32BE(p + 4)
    const compLength = buf.readUInt32BE(p + 8)
    const origLength = buf.readUInt32BE(p + 12)
    const bruto = buf.subarray(offset, offset + compLength)
    tabelas[tag] = compLength < origLength ? zlib.inflateSync(bruto) : bruto
  }
  return tabelas
}

/**
 * Escolhe a subtabela cmap format 4 (BMP) e devolve uma função de lookup.
 * Nossos codepoints ficam na PUA (U+E900+), então format 4 basta.
 * @param {Buffer} cmap
 * @returns {(cp: number) => number}
 */
function lookupCmap(cmap) {
  const n = cmap.readUInt16BE(2)
  let escolhida = -1
  for (let i = 0; i < n; i++) {
    const p = 4 + i * 8
    const plataforma = cmap.readUInt16BE(p)
    const encoding = cmap.readUInt16BE(p + 2)
    const offset = cmap.readUInt32BE(p + 4)
    if (cmap.readUInt16BE(offset) !== 4) continue
    // preferência: Windows/BMP (3,1); qualquer format 4 serve de reserva
    if (escolhida < 0 || (plataforma === 3 && encoding === 1)) escolhida = offset
  }
  assert.ok(escolhida >= 0, 'nenhuma subtabela cmap format 4 no .woff')
  const base = escolhida
  const segCount = cmap.readUInt16BE(base + 6) / 2
  const endBase = base + 14
  const startBase = endBase + segCount * 2 + 2
  const deltaBase = startBase + segCount * 2
  const rangeBase = deltaBase + segCount * 2
  return (cp) => {
    for (let i = 0; i < segCount; i++) {
      const fim = cmap.readUInt16BE(endBase + i * 2)
      if (fim < cp) continue
      const inicio = cmap.readUInt16BE(startBase + i * 2)
      if (inicio > cp) return 0
      const delta = cmap.readInt16BE(deltaBase + i * 2)
      const rangeOffset = cmap.readUInt16BE(rangeBase + i * 2)
      if (rangeOffset === 0) return (cp + delta) & 0xffff
      const pos = rangeBase + i * 2 + rangeOffset + (cp - inicio) * 2
      if (pos + 1 >= cmap.length) return 0
      const g = cmap.readUInt16BE(pos)
      return g === 0 ? 0 : (g + delta) & 0xffff
    }
    return 0
  }
}

/** Converte um fontCharacter do manifest ("\\e900" ou "") em codepoint. */
function codepointDe(fontCharacter) {
  const s = String(fontCharacter)
  if (s.startsWith('\\')) return parseInt(s.slice(1).replace(/^u/i, ''), 16)
  const cp = s.codePointAt(0)
  return typeof cp === 'number' ? cp : NaN
}

/** Carrega o manifest do tema de produto, ou null se ainda não existe. */
function lerTemaDeProduto() {
  if (!fs.existsSync(PRODUCT_THEME_PATH)) return null
  return JSON.parse(fs.readFileSync(PRODUCT_THEME_PATH, 'utf8'))
}

// ---------------------------------------------------------------------------
// Product icon theme
// ---------------------------------------------------------------------------

test('a fonte do tema de produto resolve a partir do diretório do tema e é woff', (t) => {
  const tema = lerTemaDeProduto()
  if (!tema) return t.skip('themes/puelche-product-icons.json ainda não existe')
  assert.ok(Array.isArray(tema.fonts) && tema.fonts.length > 0, 'manifest sem fonts[]')
  const fonte = tema.fonts[0]
  assert.ok(fonte.id, 'fonts[0] sem id')
  assert.ok(Array.isArray(fonte.src) && fonte.src.length > 0, 'fonts[0] sem src[]')
  assert.equal(fonte.src[0].format, 'woff')
  const abs = path.resolve(path.dirname(PRODUCT_THEME_PATH), fonte.src[0].path)
  assert.ok(fs.existsSync(abs), `fonts[0].src[0].path não resolve a partir de themes/: ${fonte.src[0].path}`)
})

test('nenhum fontCharacter duplicado apontando para desenhos diferentes', (t) => {
  const tema = lerTemaDeProduto()
  if (!tema) return t.skip('themes/puelche-product-icons.json ainda não existe')
  const definicoes = Object.entries(tema.iconDefinitions || {})
  assert.ok(definicoes.length > 0, 'iconDefinitions vazio')
  const idPadrao = (tema.fonts && tema.fonts[0] && tema.fonts[0].id) || ''
  /** @type {Map<number, { fontId: string, id: string }>} */
  const vistos = new Map()
  for (const [id, def] of definicoes) {
    assert.ok(def && def.fontCharacter, `"${id}" sem fontCharacter`)
    const cp = codepointDe(def.fontCharacter)
    assert.ok(Number.isFinite(cp), `"${id}" com fontCharacter ilegível: ${def.fontCharacter}`)
    const fontId = def.fontId || idPadrao
    const anterior = vistos.get(cp)
    if (anterior) {
      // mesmo codepoint em fontes diferentes = dois desenhos disputando o mesmo id
      assert.equal(
        fontId,
        anterior.fontId,
        `"${id}" e "${anterior.id}" usam U+${cp.toString(16).toUpperCase()} em fontes diferentes`,
      )
    } else {
      vistos.set(cp, { fontId, id })
    }
  }
})

test('todo fontCharacter do manifest tem glifo real no .woff', (t) => {
  const tema = lerTemaDeProduto()
  if (!tema) return t.skip('themes/puelche-product-icons.json ainda não existe')
  const fontePath = path.resolve(path.dirname(PRODUCT_THEME_PATH), tema.fonts[0].src[0].path)
  if (!fs.existsSync(fontePath)) return t.skip('o .woff referenciado ainda não existe')
  const tabelas = lerWoff(fs.readFileSync(fontePath))
  assert.ok(tabelas.cmap, 'o .woff não tem tabela cmap')
  const glifo = lookupCmap(tabelas.cmap)
  const semGlifo = []
  for (const [id, def] of Object.entries(tema.iconDefinitions || {})) {
    const cp = codepointDe(def.fontCharacter)
    if (glifo(cp) === 0) semGlifo.push(`${id} (U+${cp.toString(16).toUpperCase()})`)
  }
  assert.deepEqual(semGlifo, [], 'ids do manifest sem glifo na fonte (aparecem em branco na UI)')
})

test('as métricas da fonte mantêm o ícone alinhado à baseline', (t) => {
  const tema = lerTemaDeProduto()
  if (!tema) return t.skip('themes/puelche-product-icons.json ainda não existe')
  const fontePath = path.resolve(path.dirname(PRODUCT_THEME_PATH), tema.fonts[0].src[0].path)
  if (!fs.existsSync(fontePath)) return t.skip('o .woff referenciado ainda não existe')
  const tabelas = lerWoff(fs.readFileSync(fontePath))
  assert.ok(tabelas.head && tabelas.hhea, 'o .woff não tem head/hhea')
  // y_fonte = (altura - descent) - y_svg: descent != 0 empurra tudo para baixo.
  assert.equal(tabelas.head.readUInt16BE(18), 1000, 'head.unitsPerEm deveria ser 1000')
  assert.equal(tabelas.hhea.readInt16BE(4), 1000, 'hhea.ascender deveria ser 1000')
  assert.equal(tabelas.hhea.readInt16BE(6), 0, 'hhea.descender deveria ser 0')
})

// ---------------------------------------------------------------------------
// package.json e empacotamento
// ---------------------------------------------------------------------------

test('os temas de ícone estão registrados no package.json com ids únicos', (t) => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
  const entradas = [
    ...((pkg.contributes && pkg.contributes.iconThemes) || []),
    ...((pkg.contributes && pkg.contributes.productIconThemes) || []),
  ]
  if (entradas.length === 0) return t.skip('contributes.iconThemes/productIconThemes ainda não existem')
  const ids = entradas.map((/** @type {any} */ e) => e.id)
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos entre os temas de ícone')
  for (const entrada of entradas) {
    assert.ok(entrada.id, 'entrada de tema de ícone sem id')
    assert.ok(entrada.label, `tema "${entrada.id}" sem label`)
    assert.ok(fs.existsSync(path.join(ROOT, entrada.path)), `tema "${entrada.id}" aponta para ${entrada.path}, que não existe`)
  }
})

/** Converte uma linha do .vscodeignore em RegExp de caminho relativo à raiz. */
function globParaRegex(padrao) {
  let re = ''
  for (let i = 0; i < padrao.length; i++) {
    const c = padrao[i]
    if (c === '*') {
      if (padrao[i + 1] === '*') {
        i++
        if (padrao[i + 1] === '/') {
          i++
          re += '(?:.*/)?'
        } else {
          re += '.*'
        }
      } else {
        re += '[^/]*'
      }
    } else if (c === '?') {
      re += '[^/]'
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    }
  }
  return new RegExp(`^${re}$`)
}

test('nenhum caminho usado pelos temas casa com uma regra do .vscodeignore', () => {
  const regras = fs
    .readFileSync(VSCODEIGNORE, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('!'))
    .map((l) => ({ padrao: l, re: globParaRegex(l) }))

  /** @type {string[]} */
  const caminhos = [path.relative(ROOT, THEME_PATH)]
  for (const def of Object.values(THEME.iconDefinitions)) {
    caminhos.push(path.relative(ROOT, path.resolve(THEME_DIR, /** @type {any} */ (def).iconPath)))
  }
  const produto = lerTemaDeProduto()
  if (produto) {
    caminhos.push(path.relative(ROOT, PRODUCT_THEME_PATH))
    for (const fonte of produto.fonts || []) {
      for (const src of fonte.src || []) {
        caminhos.push(path.relative(ROOT, path.resolve(path.dirname(PRODUCT_THEME_PATH), src.path)))
      }
    }
  }

  const ignorados = []
  for (const caminho of new Set(caminhos.map((c) => c.split(path.sep).join('/')))) {
    for (const { padrao, re } of regras) {
      if (re.test(caminho)) ignorados.push(`${caminho} casa com "${padrao}"`)
    }
  }
  assert.deepEqual(ignorados, [], 'o .vsix sairia sem esses arquivos')
})
