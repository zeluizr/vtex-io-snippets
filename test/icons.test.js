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
const { mixHex, markShape, BG, DEEP_MIX } = require('../scripts/build-icon-theme')

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

/**
 * Dois arquivos disputando o mesmo nome não dão erro: o segundo simplesmente
 * sobrescreve o primeiro em `fileNames` e o ícone do primeiro vira órfão — que
 * o teste seguinte pega, mas sem dizer o motivo. Este diz.
 */
for (const lista of ['files', 'folders']) {
  test(`nenhum nome de ${lista} é reivindicado por duas entradas`, () => {
    const dono = new Map()
    const brigas = []
    for (const entry of MAP[lista]) {
      for (const nome of entry.names || []) {
        const chave = nome.toLowerCase()
        const antes = dono.get(chave)
        if (antes && antes !== entry.id) brigas.push(`${nome}: ${antes} e ${entry.id}`)
        dono.set(chave, entry.id)
      }
    }
    assert.deepEqual(brigas, [], 'nome disputado — o último a ser escrito ganha, em silêncio')
  })
}

test('toda cor dos SVGs pertence a roles ou rolesDeep e nenhum currentColor sobrou', () => {
  const permitidas = new Set(
    [...Object.values(MAP.roles), ...Object.values(MAP.rolesDeep)].map((/** @type {any} */ c) =>
      String(c).toUpperCase(),
    ),
  )
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
  assert.deepEqual([...foraDaPaleta], [], 'cor fora de roles/rolesDeep de data/icons.json')
})

/**
 * Relação de contraste WCAG entre dois hex de 6 dígitos.
 * Duplicada de test/theme.test.js de propósito: cada suíte carrega a sua régua
 * e nenhuma das duas importa a outra.
 */
function contraste(a, b) {
  const lum = (/** @type {string} */ hex) => {
    const c = [0, 1, 2].map((i) => {
      const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  }
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

test('rolesDeep é exatamente a mistura declarada, papel por papel', () => {
  assert.deepEqual(
    Object.keys(MAP.rolesDeep),
    Object.keys(MAP.roles),
    'rolesDeep tem que cobrir os mesmos papéis de roles, na mesma ordem',
  )
  for (const [papel, hex] of Object.entries(MAP.roles)) {
    assert.equal(
      MAP.rolesDeep[papel],
      mixHex(String(hex), BG, DEEP_MIX),
      `rolesDeep.${papel} não é ${papel} misturado a ${DEEP_MIX} com ${BG} — editado à mão?`,
    )
  }
})

/**
 * O piso de contraste marca/placa: 3:1, o mínimo para elemento gráfico. Com a
 * mistura de 0.7 nenhum papel reprova — o pior caso é `punct` a 3.17:1. Com a
 * mistura de 0.6, que valia antes, cinco papéis ficavam abaixo disso.
 */
const PISO_CONTRASTE = 3.0

test('a marca escura se separa da placa em todos os papéis', () => {
  const fracos = []
  for (const papel of Object.keys(MAP.roles)) {
    const r = contraste(MAP.roles[papel], MAP.rolesDeep[papel])
    if (r < PISO_CONTRASTE) fracos.push(`${papel}: ${r.toFixed(2)}:1`)
  }
  assert.deepEqual(fracos, [], `abaixo do piso de ${PISO_CONTRASTE}:1 entre placa e marca`)
})

/** ΔE76 entre dois hex — mesma métrica que test/theme.test.js usa na paleta. */
function deltaE76(a, b) {
  const lab = (/** @type {string} */ hex) => {
    const [r, g, b2] = [0, 1, 2].map((i) => {
      const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    const X = (0.4124 * r + 0.3576 * g + 0.1805 * b2) / 0.95047
    const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b2
    const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b2) / 1.08883
    const f = (/** @type {number} */ t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
    return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]
  }
  const [A, B] = [lab(a), lab(b)]
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2])
}

/**
 * A trava que faltava, e a que teria pegado o problema mais antigo da paleta:
 * `comment` e `punct` conviveram por meses a ΔE76 6.1 — a olho nu, a pasta
 * `docs` e a pasta `dist` eram exatamente a mesma cor. O tema de cor já cobrava
 * esse piso; a paleta de ícones não cobrava.
 */
test('nenhum par de papéis abaixo de ΔE76 10', () => {
  const papeis = Object.entries(MAP.roles)
  const perto = []
  for (let i = 0; i < papeis.length; i++) {
    for (let j = i + 1; j < papeis.length; j++) {
      const d = deltaE76(String(papeis[i][1]), String(papeis[j][1]))
      if (d < 10) perto.push(`${papeis[i][0]} e ${papeis[j][0]}: ΔE76 ${d.toFixed(1)}`)
    }
  }
  assert.deepEqual(perto, [], 'dois papéis que dividem a árvore são a mesma cor a olho nu')
})

/**
 * Uma cor por família. O papel não é escolhido caso a caso — é a família a que
 * a entrada pertence, e é isso que faz a árvore ler como bloco em vez de
 * mosaico. A tabela vive aqui de propósito: é regra de design, não dado de
 * geração, e uma atribuição solta em data/icons.json tem que falhar.
 *
 * A exceção declarada são as marcas de terceiro, que levam o papel mais próximo
 * da cor da própria marca.
 */
const FAMILIAS_PASTA = {
  purple: ['store', 'blocks', 'templates', 'messages', 'pixel', 'admin', 'checkout', 'masterdata', 'sitemap'],
  lavender: ['home', 'product', 'search', 'landing', 'header', 'footer', 'cart', 'account'],
  pink: ['react', 'components'],
  green: ['node', 'graphql', 'clients', 'hooks'],
  cyan: ['src', 'types', 'schemas', 'snippets', 'data', 'utils'],
  aqua: ['scripts'],
  yellow: ['styles'],
  orange: ['assets', 'images', 'fonts', 'iconpacks', 'claude'],
  parchment: ['docs'],
  mint: ['test'],
  dim: ['dist', 'modules', 'config', 'github'],
}

const FAMILIAS_ARQUIVO = {
  purple: ['manifest', 'routes', 'blocks', 'style', 'eslint'],
  pink: ['tsx', 'html', 'npm'],
  mint: ['vue', 'svelte', 'test', 'nodeversion'],
  green: ['javascript', 'jsx', 'graphql', 'shell', 'python'],
  cyan: ['json', 'jsonc', 'typescript', 'prisma', 'sql', 'yaml', 'toml', 'tsconfig', 'xml', 'yarn', 'docker'],
  yellow: ['css', 'sass', 'prettier'],
  orange: ['image', 'vector', 'font', 'archive', 'video', 'audio', 'claude', 'git'],
  parchment: ['markdown', 'readme', 'changelog', 'license', 'text', 'pdf'],
  aqua: ['buildconfig', 'editorconfig', 'config'],
  dim: ['ignore', 'lock', 'env'],
}

for (const [lista, tabela] of [['folders', FAMILIAS_PASTA], ['files', FAMILIAS_ARQUIVO]]) {
  test(`toda entrada de ${lista} usa o papel da sua família`, () => {
    /** @type {Record<string, string>} */
    const esperado = {}
    for (const [papel, ids] of Object.entries(tabela)) for (const id of ids) esperado[id] = papel
    const fora = []
    const semFamilia = []
    for (const entry of MAP[lista]) {
      if (!(entry.id in esperado)) semFamilia.push(entry.id)
      else if (entry.role !== esperado[entry.id]) fora.push(`${entry.id}: ${entry.role} (família diz ${esperado[entry.id]})`)
    }
    assert.deepEqual(semFamilia, [], 'entrada sem família declarada na tabela deste teste')
    assert.deepEqual(fora, [], 'papel escolhido caso a caso em vez de pela família')
    const orfas = Object.keys(esperado).filter((id) => !MAP[lista].some((/** @type {any} */ e) => e.id === id))
    assert.deepEqual(orfas, [], 'a tabela cita id que não existe mais em data/icons.json')
  })
}

/**
 * A placa é objeto gráfico, não texto: o piso é 3:1, não 4.5:1. O papel `dim`
 * — o que recua de propósito, das pastas geradas e de infraestrutura — sai a
 * 3.74:1 e é o pior caso. Subir esse piso obrigaria `dist` e `node_modules` a
 * ter a mesma presença de `store`, que é o contrário do que eles significam.
 */
test('toda placa passa 3:1 sobre o fundo do editor', () => {
  const fracas = []
  for (const [papel, hex] of Object.entries(MAP.roles)) {
    const r = contraste(String(hex), BG)
    if (r < 3) fracas.push(`${papel}: ${r.toFixed(2)}:1`)
  }
  assert.deepEqual(fracas, [], 'papel que não separa da própria árvore')
})

test('todo SVG é placa preenchida mais marca traçada — nunca traço na raiz', () => {
  const papeis = new Set(Object.values(MAP.roles).map((/** @type {any} */ c) => String(c)))
  const fundos = new Set(Object.values(MAP.rolesDeep).map((/** @type {any} */ c) => String(c)))
  for (const arquivo of listarSvgs(ICONS_DIR)) {
    const raw = fs.readFileSync(path.join(ICONS_DIR, arquivo), 'utf8')
    const raiz = raw.match(/<svg([^>]*)>/)[1]
    const fill = (raiz.match(/\sfill="([^"]+)"/) || [])[1]
    assert.ok(papeis.has(String(fill)), `${arquivo}: raiz sem fill de um papel (veio "${fill}")`)
    assert.match(raiz, /\sstroke="none"/, `${arquivo}: a raiz ainda traça — a era do monoline acabou`)

    const marcas = raw.match(/<g\b[^>]*>/g) || []
    assert.ok(marcas.length <= 1, `${arquivo}: mais de uma camada de marca`)
    for (const g of marcas) {
      const stroke = (g.match(/\sstroke="([^"]+)"/) || [])[1]
      assert.ok(fundos.has(String(stroke)), `${arquivo}: marca fora de rolesDeep (veio "${stroke}")`)
      assert.match(g, /\sfill="none"/, `${arquivo}: marca preenchida — marca é traço`)
    }
  }
})

/**
 * O teto de elementos por marca. Na placa e dentro da pasta a marca sai com
 * ~8px de lado; a partir do terceiro elemento o desenho vira uma mancha e duas
 * marcas vizinhas na árvore deixam de se distinguir. Ver docs/traco-puelche.md.
 */
const TETO_ELEMENTOS = 2

test('nenhuma marca passa de 2 elementos', () => {
  const gordas = []
  const conta = (/** @type {string} */ markup) =>
    (markup.match(/<(path|rect|circle|ellipse|line|polygon|polyline)\b/g) || []).length
  const marcas = new Map()
  for (const entry of MAP.files) marcas.set(entry.shape, markShape(entry.shape, 'Mark'))
  for (const entry of MAP.folders) marcas.set(`${entry.shape}Badge`, markShape(entry.shape, 'Badge'))
  for (const [nome, markup] of marcas) {
    const n = conta(markup)
    if (n > TETO_ELEMENTOS) gordas.push(`${nome}: ${n}`)
  }
  assert.deepEqual(gordas, [], 'marca com elementos demais para os ~8px em que ela é desenhada')
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
 * Escolhe a subtabela cmap format 4 (BMP) e devolve os offsets dos seus
 * arrays paralelos. Nossos codepoints ficam na PUA (U+E900+), então basta.
 * @param {Buffer} cmap
 */
function subtabelaCmap(cmap) {
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
  const segCount = cmap.readUInt16BE(escolhida + 6) / 2
  const endBase = escolhida + 14
  const startBase = endBase + segCount * 2 + 2
  const deltaBase = startBase + segCount * 2
  return { segCount, endBase, startBase, deltaBase, rangeBase: deltaBase + segCount * 2 }
}

/**
 * Todos os codepoints com glifo declarado no cmap, sem o sentinela 0xFFFF.
 * @param {Buffer} cmap
 * @returns {Set<number>}
 */
function codepointsDoCmap(cmap) {
  const { segCount, endBase, startBase } = subtabelaCmap(cmap)
  const glifo = lookupCmap(cmap)
  const fora = new Set()
  for (let i = 0; i < segCount; i++) {
    const inicio = cmap.readUInt16BE(startBase + i * 2)
    const fim = cmap.readUInt16BE(endBase + i * 2)
    if (inicio === 0xffff) continue
    for (let cp = inicio; cp <= fim && cp !== 0xffff; cp++) if (glifo(cp) !== 0) fora.add(cp)
  }
  return fora
}

/**
 * Escolhe a subtabela cmap format 4 (BMP) e devolve uma função de lookup.
 * Nossos codepoints ficam na PUA (U+E900+), então format 4 basta.
 * @param {Buffer} cmap
 * @returns {(cp: number) => number}
 */
function lookupCmap(cmap) {
  const { segCount, endBase, startBase, deltaBase, rangeBase } = subtabelaCmap(cmap)
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

// ---------------------------------------------------------------------------
// Apelidos do codicon, alocação de codepoints e integridade da fonte
// ---------------------------------------------------------------------------

const CODEPOINTS_PATH = path.join(ROOT, 'data', 'product-codepoints.json')
const MAPPING_PATH = path.join(
  ROOT, 'node_modules', '@vscode', 'codicons', 'src', 'template', 'mapping.json',
)

/** Lê a alocação append-only de codepoints, ou null se ainda não existe. */
function lerCodepoints() {
  if (!fs.existsSync(CODEPOINTS_PATH)) return null
  return JSON.parse(fs.readFileSync(CODEPOINTS_PATH, 'utf8')).codepoints
}

/** Grupos do codicon: nome -> todos os nomes que dividem o mesmo codepoint. */
function gruposDoCodicon() {
  if (!fs.existsSync(MAPPING_PATH)) return null
  const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'))
  /** @type {Map<string, string[]>} */
  const grupos = new Map()
  for (const nomes of Object.values(mapping)) {
    for (const nome of nomes) grupos.set(nome, nomes)
  }
  return grupos
}

test('todo apelido do codicon do mesmo desenho está no manifest', (t) => {
  const tema = lerTemaDeProduto()
  if (!tema) return t.skip('themes/puelche-product-icons.json ainda não existe')
  const grupos = gruposDoCodicon()
  if (!grupos) return t.skip('@vscode/codicons não instalado (a suíte roda sem npm install)')
  const defs = tema.iconDefinitions
  const desconhecidos = []
  const faltando = []
  const divergentes = []
  for (const id of Object.keys(defs)) {
    const grupo = grupos.get(id)
    if (!grupo) {
      desconhecidos.push(id)
      continue
    }
    for (const apelido of grupo) {
      // sem o apelido, o VS Code cai no codicon nativo e mistura os dois estilos
      if (!defs[apelido]) faltando.push(`${id} coberto mas falta o apelido "${apelido}"`)
      else if (defs[apelido].fontCharacter !== defs[id].fontCharacter) {
        divergentes.push(`"${id}" e "${apelido}" são o mesmo desenho mas têm fontCharacter diferente`)
      }
    }
  }
  assert.deepEqual(desconhecidos, [], 'ids que não existem no codicon (entrada morta no manifest)')
  assert.deepEqual(faltando, [], 'apelidos do codicon não cobertos')
  assert.deepEqual(divergentes, [], 'apelidos do mesmo desenho apontando para glifos diferentes')
})

test('o manifest bate exatamente com data/product-codepoints.json', (t) => {
  const tema = lerTemaDeProduto()
  const alocados = lerCodepoints()
  if (!tema || !alocados) return t.skip('tema de produto ou alocação de codepoints ainda não existem')
  const defs = tema.iconDefinitions

  // o arquivo é a fonte de verdade: todo id alocado aparece no manifest com o
  // codepoint dele, e o manifest não inventa codepoint fora da lista
  const divergentes = []
  for (const [id, cp] of Object.entries(alocados)) {
    if (!defs[id]) divergentes.push(`"${id}" está alocado mas não está no manifest`)
    else if (codepointDe(defs[id].fontCharacter) !== parseInt(String(cp), 16)) {
      divergentes.push(`"${id}": manifest ${defs[id].fontCharacter}, alocação ${cp}`)
    }
  }
  assert.deepEqual(divergentes, [], 'manifest e alocação de codepoints não batem')

  const doArquivo = new Set(Object.values(alocados).map((/** @type {any} */ v) => parseInt(String(v), 16)))
  const doManifest = new Set(Object.values(defs).map((/** @type {any} */ d) => codepointDe(d.fontCharacter)))
  const inventados = [...doManifest].filter((cp) => !doArquivo.has(cp))
  assert.deepEqual(
    inventados.map((cp) => 'U+' + cp.toString(16).toUpperCase()),
    [],
    'codepoints no manifest que não passaram pela alocação append-only',
  )
})

test('a alocação de codepoints é append-only', (t) => {
  const alocados = lerCodepoints()
  if (!alocados) return t.skip('data/product-codepoints.json ainda não existe')
  const entradas = Object.entries(alocados)
  const valores = entradas.map(([, v]) => parseInt(String(v), 16))

  assert.equal(new Set(valores).size, valores.length, 'codepoint reaproveitado por dois ids')
  // append-only: cada id novo pega o próximo livre a partir de 0xE900, então a
  // ordem do arquivo é a ordem de alocação e não há buracos
  valores.forEach((cp, i) => {
    assert.equal(
      cp,
      0xe900 + i,
      `"${entradas[i][0]}" está em U+${cp.toString(16).toUpperCase()}, fora da sequência a partir de E900`,
    )
  })

  // e nenhum id já commitado pode ter mudado de número
  let anterior = null
  try {
    const raw = execFileSync('git', ['show', 'HEAD:data/product-codepoints.json'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    anterior = JSON.parse(raw).codepoints
  } catch {
    anterior = null
  }
  if (!anterior) return t.diagnostic('sem versão em HEAD: só a estrutura foi conferida')
  const renumerados = []
  for (const [id, cp] of Object.entries(anterior)) {
    if (!(id in alocados)) renumerados.push(`"${id}" sumiu da alocação (o número seria reaproveitado)`)
    else if (String(alocados[id]) !== String(cp)) {
      renumerados.push(`"${id}" mudou de ${cp} para ${alocados[id]}`)
    }
  }
  assert.deepEqual(renumerados, [], 'a alocação não é mais append-only: o .woff inteiro seria reescrito')
})

test('nenhum glifo órfão: todo codepoint do cmap é usado pelo manifest', (t) => {
  const tema = lerTemaDeProduto()
  if (!tema) return t.skip('themes/puelche-product-icons.json ainda não existe')
  const fontePath = path.resolve(path.dirname(PRODUCT_THEME_PATH), tema.fonts[0].src[0].path)
  if (!fs.existsSync(fontePath)) return t.skip('o .woff referenciado ainda não existe')
  const tabelas = lerWoff(fs.readFileSync(fontePath))
  const usados = new Set(
    Object.values(tema.iconDefinitions).map((/** @type {any} */ d) => codepointDe(d.fontCharacter)),
  )
  const orfaos = [...codepointsDoCmap(tabelas.cmap)].filter((cp) => !usados.has(cp))
  assert.deepEqual(
    orfaos.map((cp) => 'U+' + cp.toString(16).toUpperCase()),
    [],
    'glifos na fonte que nenhum id referencia (peso morto no .woff)',
  )
})

test('nenhum glifo do .woff é vazio', (t) => {
  const tema = lerTemaDeProduto()
  if (!tema) return t.skip('themes/puelche-product-icons.json ainda não existe')
  const fontePath = path.resolve(path.dirname(PRODUCT_THEME_PATH), tema.fonts[0].src[0].path)
  if (!fs.existsSync(fontePath)) return t.skip('o .woff referenciado ainda não existe')
  const tabelas = lerWoff(fs.readFileSync(fontePath))
  assert.ok(tabelas.loca && tabelas.glyf && tabelas.head, 'o .woff não tem loca/glyf/head')
  // loca dá o intervalo de cada glifo dentro de glyf; comprimento 0 = sem
  // contorno nenhum, que é o que um <path> com stroke produz — ícone some da UI
  const longo = tabelas.head.readInt16BE(50) === 1
  const loca = (/** @type {number} */ i) =>
    longo ? tabelas.loca.readUInt32BE(i * 4) : tabelas.loca.readUInt16BE(i * 2) * 2
  const glifo = lookupCmap(tabelas.cmap)
  const vazios = []
  for (const [id, def] of Object.entries(tema.iconDefinitions)) {
    const cp = codepointDe(/** @type {any} */ (def).fontCharacter)
    const g = glifo(cp)
    if (loca(g + 1) - loca(g) === 0) vazios.push(`${id} (U+${cp.toString(16).toUpperCase()})`)
  }
  assert.deepEqual(vazios, [], 'glifos sem contorno na fonte')
})

// ---------------------------------------------------------------------------
// Geometria das formas de produto (lint de fonte + tinta)
// ---------------------------------------------------------------------------

/** Carrega os dois conjuntos de formas, ou null se nenhum existe ainda. */
function lerFormasDeProduto() {
  /** @type {Record<string, { arquivo: string, markup: string }>} */
  const formas = {}
  const repetidos = []
  let achou = false
  for (const arquivo of ['product-shapes-a.js', 'product-shapes-b.js']) {
    const abs = path.join(ROOT, 'scripts', arquivo)
    if (!fs.existsSync(abs)) continue
    achou = true
    const mod = require(abs)
    assert.ok(mod && mod.PRODUCT_SHAPES, `${arquivo} não exporta PRODUCT_SHAPES`)
    for (const [id, markup] of Object.entries(mod.PRODUCT_SHAPES)) {
      if (formas[id]) repetidos.push(`"${id}" está em ${formas[id].arquivo} e em ${arquivo}`)
      formas[id] = { arquivo, markup: String(markup) }
    }
  }
  return achou ? { formas, repetidos } : null
}

/** Números de um trecho de path. */
function numerosDe(texto) {
  return (texto.match(/-?\d*\.?\d+/g) || []).map(Number)
}

/**
 * Pontos de um arco elíptico A, do ponto atual até (x2,y2).
 * Conversão endpoint -> centro do apêndice F.6.5 da spec de SVG, amostrada.
 */
function pontosDoArco(x1, y1, rx, ry, rot, laf, sf, x2, y2) {
  if (!rx || !ry) return [[x2, y2]]
  const phi = (rot * Math.PI) / 180
  const cp = Math.cos(phi)
  const sp = Math.sin(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const x1p = cp * dx + sp * dy
  const y1p = -sp * dx + cp * dy
  rx = Math.abs(rx)
  ry = Math.abs(ry)
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lam > 1) {
    const s = Math.sqrt(lam)
    rx *= s
    ry *= s
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
  let co = Math.sqrt(Math.max(0, num / den))
  if (laf === sf) co = -co
  const cxp = (co * rx * y1p) / ry
  const cyp = (-co * ry * x1p) / rx
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2
  const cy = sp * cxp + cp * cyp + (y1 + y2) / 2
  const ang = (ux, uy, vx, vy) => {
    const d = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy))
    const a = Math.acos(Math.min(1, Math.max(-1, d)))
    return ux * vy - uy * vx < 0 ? -a : a
  }
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!sf && dt > 0) dt -= 2 * Math.PI
  else if (sf && dt < 0) dt += 2 * Math.PI
  const pontos = []
  const n = 24
  for (let i = 1; i <= n; i++) {
    const t = t1 + (dt * i) / n
    pontos.push([
      cp * rx * Math.cos(t) - sp * ry * Math.sin(t) + cx,
      sp * rx * Math.cos(t) + cp * ry * Math.sin(t) + cy,
    ])
  }
  return pontos
}

/**
 * Achata um atributo `d` (só comandos absolutos M/L/Q/A/Z) em polígonos.
 * @param {string} d
 * @returns {number[][][]}
 */
function subcaminhos(d) {
  const saida = []
  let atual = null
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  const fecha = () => {
    if (atual && atual.length > 2) saida.push(atual)
    atual = null
  }
  for (const m of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    const c = m[1]
    const p = numerosDe(m[2])
    if (c === 'M') {
      fecha()
      atual = [[p[0], p[1]]]
      x = sx = p[0]
      y = sy = p[1]
      for (let i = 2; i + 1 < p.length; i += 2) {
        atual.push([p[i], p[i + 1]])
        x = p[i]
        y = p[i + 1]
      }
    } else if (c === 'L') {
      for (let i = 0; i + 1 < p.length; i += 2) {
        atual.push([p[i], p[i + 1]])
        x = p[i]
        y = p[i + 1]
      }
    } else if (c === 'Q') {
      for (let i = 0; i + 3 < p.length; i += 4) {
        for (let k = 1; k <= 8; k++) {
          const t = k / 8
          const u = 1 - t
          atual.push([
            u * u * x + 2 * u * t * p[i] + t * t * p[i + 2],
            u * u * y + 2 * u * t * p[i + 1] + t * t * p[i + 3],
          ])
        }
        x = p[i + 2]
        y = p[i + 3]
      }
    } else if (c === 'A') {
      for (let i = 0; i + 6 < p.length; i += 7) {
        atual.push(...pontosDoArco(x, y, p[i], p[i + 1], p[i + 2], p[i + 3], p[i + 4], p[i + 5], p[i + 6]))
        x = p[i + 5]
        y = p[i + 6]
      }
    } else if (c === 'Z' || c === 'z') {
      fecha()
      x = sx
      y = sy
    }
  }
  fecha()
  return saida
}

/** Área com sinal (shoelace). O sinal é o sentido de rotação do contorno. */
function areaDe(poligono) {
  let a = 0
  for (let i = 0; i < poligono.length; i++) {
    const [x1, y1] = poligono[i]
    const [x2, y2] = poligono[(i + 1) % poligono.length]
    a += x1 * y2 - x2 * y1
  }
  return a / 2
}

/** Número de voltas em (px,py) com TODOS os subcaminhos fundidos — o que a fonte faz. */
function voltas(px, py, poligonos) {
  let w = 0
  for (const poly of poligonos) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i]
      const [x2, y2] = poly[(i + 1) % poly.length]
      const lado = (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1)
      if (y1 <= py) {
        if (y2 > py && lado > 0) w++
      } else if (y2 <= py && lado < 0) w--
    }
  }
  return w
}

/** Todos os `d` de uma forma. */
function atributosD(markup) {
  return [...markup.matchAll(/\bd="([^"]*)"/g)].map((m) => m[1])
}

const ATRIBUTOS_PROIBIDOS = [
  'transform', 'style', 'fill-rule', 'clip-rule', 'clip-path', 'mask', 'opacity', 'fill-opacity',
]

test('as formas de produto passam o lint de fonte', (t) => {
  const carga = lerFormasDeProduto()
  if (!carga) return t.skip('scripts/product-shapes-{a,b}.js ainda não existem')
  const { formas, repetidos } = carga
  assert.deepEqual(repetidos, [], 'id de forma duplicado entre os dois arquivos')
  assert.ok(Object.keys(formas).length > 0, 'nenhuma forma exportada')

  const erros = []
  for (const [id, { markup }] of Object.entries(formas)) {
    const reclama = (msg) => erros.push(`"${id}": ${msg}`)
    if (!markup.trim()) reclama('markup vazio')
    if (/<\//.test(markup)) reclama('tag de fechamento (use só <path .../> auto-fechado)')
    const solto = markup.replace(/<[^>]*>/g, '').trim()
    if (solto) reclama(`texto solto fora de tag: ${JSON.stringify(solto.slice(0, 30))}`)
    const tags = markup.match(/<[a-zA-Z][^>]*>/g) || []
    if (!tags.length) reclama('nenhum elemento')
    for (const tag of tags) {
      const nome = (tag.match(/^<([a-zA-Z][\w:-]*)/) || [])[1]
      // <circle>/<g> e afins não sobrevivem à conversão para glifo
      if (nome !== 'path') reclama(`elemento <${nome}> não permitido (só <path>)`)
      /** @type {Record<string, string>} */
      const attrs = {}
      const re = /([a-zA-Z][\w:-]*)\s*=\s*"([^"]*)"/g
      let m
      while ((m = re.exec(tag)) !== null) attrs[m[1]] = m[2]
      if (!attrs.d || !attrs.d.trim()) reclama('<path> sem d')
      for (const chave of Object.keys(attrs)) {
        // stroke não existe em fonte: o contorno tem que ser forma fechada
        if (chave.startsWith('stroke')) reclama(`atributo "${chave}" — a fonte não tem traço`)
        if (ATRIBUTOS_PROIBIDOS.includes(chave)) reclama(`atributo "${chave}" não permitido`)
      }
      if (attrs.fill === 'none') reclama('fill="none" vira glifo vazio na fonte')
    }
    for (const d of atributosD(markup)) {
      // só comandos absolutos: relativo muda de sentido quando os subcaminhos
      // são fundidos e é o que quebraria a leitura de geometria abaixo
      const comandos = (d.match(/[A-Za-z]/g) || []).join('')
      const proibidos = [...new Set(comandos.split('').filter((c) => !'MLQAZ'.includes(c)))]
      if (proibidos.length) reclama(`comandos não permitidos em d: ${proibidos.join(', ')}`)
      for (const poly of subcaminhos(d)) {
        if (Math.abs(areaDe(poly)) < 0.01) reclama('subcaminho com área ~0 (contorno degenerado)')
        for (const [x, y] of poly) {
          if (x < -0.001 || x > 16.001 || y < -0.001 || y > 16.001) {
            reclama(`coordenada fora da grade 0..16: ${x.toFixed(2)},${y.toFixed(2)}`)
          }
        }
      }
    }
  }
  assert.deepEqual(erros, [], 'formas reprovadas no lint de fonte')
})

test('nenhuma forma fica sem tinta quando os subcaminhos são fundidos', (t) => {
  const carga = lerFormasDeProduto()
  if (!carga) return t.skip('scripts/product-shapes-{a,b}.js ainda não existem')
  // a fonte funde TODOS os <path> num contorno só com winding nonzero: um furo
  // rebobinado errado ou um traço aberto some da UI sem erro nenhum.
  const semTinta = []
  for (const [id, { markup }] of Object.entries(carga.formas)) {
    const poligonos = atributosD(markup).flatMap((d) => subcaminhos(d))
    let pintados = 0
    for (let i = 0; i < 64; i++) {
      for (let j = 0; j < 64; j++) {
        if (voltas((i + 0.5) / 4, (j + 0.5) / 4, poligonos) !== 0) pintados++
      }
    }
    // o menor glifo do conjunto pinta ~9% da caixa; 2% já é desenho perdido
    if (pintados < 0.02 * 4096) semTinta.push(`${id}: ${((pintados / 4096) * 100).toFixed(1)}% da caixa`)
  }
  assert.deepEqual(semTinta, [], 'formas que a fonte renderiza vazias ou quase vazias')
})

test('toda forma desenhada tem um id no manifest do tema de produto', (t) => {
  const carga = lerFormasDeProduto()
  const tema = lerTemaDeProduto()
  if (!carga || !tema) return t.skip('formas ou manifest do tema de produto ainda não existem')
  const desenhos = new Set(
    Object.values(tema.iconDefinitions).map((/** @type {any} */ d) => codepointDe(d.fontCharacter)),
  )
  assert.equal(
    Object.keys(carga.formas).length,
    desenhos.size,
    'a quantidade de formas desenhadas difere da quantidade de glifos usados pelo manifest',
  )
})
