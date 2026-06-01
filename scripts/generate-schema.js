#!/usr/bin/env node
/**
 * Gera schemas/vtex-blocks.schema.json e snippets/vtex-io.code-snippets
 * a partir de data/blocks.json (extraido da doc VTEX pelo workflow).
 *
 * Shape esperado de data/blocks.json: Array<{
 *   appName: string,
 *   blockName: string,
 *   description?: string,
 *   props: Array<{ name: string, type: string, enumValues?: string[], default?: string, description?: string }>
 * }>
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DATA = path.join(ROOT, 'data', 'blocks.json')
const SCHEMA_OUT = path.join(ROOT, 'schemas', 'vtex-blocks.schema.json')
const SNIPPETS_OUT = path.join(ROOT, 'snippets', 'vtex-io.code-snippets')

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const TYPE_MAP = {
  string: { type: 'string' },
  number: { type: 'number' },
  boolean: { type: 'boolean' },
  array: { type: 'array' },
  object: { type: 'object' },
  enum: { type: 'string' },
}

/**
 * Overrides curados de props que sao objetos/arrays aninhados.
 * A doc plana em data/blocks.json descreve essas props so com texto, entao
 * o JSON Schema gerado nao tem `properties`/`items` e o VS Code nao consegue
 * autocompletar os subcampos (ex.: dentro de "link" so aparecem snippets de
 * bloco). Aqui declaramos a forma real desses objetos para liberar o
 * autocomplete aninhado. Sem `additionalProperties: false` -> campos extras
 * nao viram erro, mantendo a politica de nao super-validar.
 */
const imageLinkSchema = {
  type: 'object',
  description: 'Hyperlink da imagem.',
  properties: {
    url: { type: 'string', description: 'URL de destino do clique.' },
    noFollow: { type: 'boolean', default: false, description: 'Adiciona rel="nofollow" ao link.' },
    openNewTab: { type: 'boolean', default: true, description: 'Abre o link em uma nova aba.' },
    title: { type: 'string', description: 'Atributo title / rotulo do link.' },
  },
}

const imageListItemSchema = {
  type: 'object',
  properties: {
    image: { type: 'string', description: 'URL da imagem (desktop).' },
    mobileImage: { type: 'string', description: 'URL da imagem para mobile.' },
    description: { type: 'string', description: 'Texto alternativo (alt) da imagem.' },
    link: imageLinkSchema,
    width: { description: 'Largura da imagem (px ou valor CSS).' },
    loading: { type: 'string', enum: ['eager', 'lazy'], description: 'Estrategia de carregamento nativa.' },
    fetchpriority: { type: 'string', enum: ['high', 'low', 'auto'], description: 'Dica de prioridade de carregamento.' },
    analyticsProperties: { type: 'string', enum: ['provided', 'none'], description: 'Envia eventos de analytics ao clicar.' },
    promotionId: { type: 'string', description: 'Identificador da promocao para analytics.' },
    promotionName: { type: 'string', description: 'Nome da promocao para analytics.' },
    promotionPosition: { type: 'string', description: 'Slot/posicao criativa para analytics.' },
    promotionProductId: { type: 'string', description: 'ID do produto associado para analytics.' },
    promotionProductName: { type: 'string', description: 'Nome do produto associado para analytics.' },
  },
}

const sliderResponsive = (desc) => ({
  type: 'object',
  description: desc,
  properties: {
    desktop: { type: 'number' },
    tablet: { type: 'number' },
    phone: { type: 'number' },
  },
})

const sliderOverrides = {
  itemsPerPage: sliderResponsive('Quantidade de itens por pagina por tipo de dispositivo.'),
  autoplay: {
    type: 'object',
    description: 'Configuracao do autoplay do slider.',
    properties: {
      timeout: { type: 'number', description: 'Intervalo entre slides, em milissegundos.' },
      stopOnHover: { type: 'boolean', description: 'Pausa o autoplay quando o mouse esta sobre o slider.' },
    },
  },
  slideTransition: {
    type: 'object',
    description: 'Animacao de transicao (CSS) entre os slides.',
    properties: {
      speed: { type: 'number', description: 'Duracao da transicao, em milissegundos.' },
      delay: { type: 'number', description: 'Atraso antes da transicao, em milissegundos.' },
      timing: { type: 'string', description: 'Funcao de easing CSS (ex.: ease, linear).' },
    },
  },
}

const PROP_OVERRIDES = {
  'list-context.image-list': { images: { type: 'array', items: imageListItemSchema } },
  'image-list': { images: { type: 'array', items: imageListItemSchema } },
  image: { link: imageLinkSchema },
  'image-new': { link: imageLinkSchema },
  'slider-layout': sliderOverrides,
}

function coerceDefault(type, raw) {
  if (raw == null || raw === '' || /^(undefined|none|n\/?a|-)$/i.test(String(raw).trim())) return undefined
  const v = String(raw).trim().replace(/^["'`]|["'`]$/g, '')
  if (type === 'boolean') {
    if (/^true$/i.test(v)) return true
    if (/^false$/i.test(v)) return false
    return undefined
  }
  if (type === 'number') {
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return v
}

function inferDefault(raw) {
  if (raw == null || raw === '' || /^(undefined|none|n\/?a|-)$/i.test(String(raw).trim())) return undefined
  const v = String(raw).trim().replace(/^["'`]|["'`]$/g, '')
  if (/^true$/i.test(v)) return true
  if (/^false$/i.test(v)) return false
  const n = Number(v)
  if (v !== '' && Number.isFinite(n)) return n
  return v
}

/**
 * Tipos derivados da doc não são 100% confiáveis, então NÃO validamos tipo
 * de escalares livres (string/number/object/array) para evitar falsos
 * "tipo incorreto" (ex.: aspectRatio "1:1" tipado como object). Mantemos:
 *  - enum  -> validação estrita (alta confiança e útil para sugestão)
 *  - boolean -> validação (confiável; sugere true/false)
 * Demais props: só nome + descrição + default (sem 'type').
 */
function buildPropSchema(p) {
  const base = {}
  if (p.enumValues && p.enumValues.length) {
    base.type = 'string'
    base.enum = Array.from(new Set(p.enumValues.map(String)))
    const def = coerceDefault('string', p.default)
    if (def !== undefined) base.default = def
  } else if (p.type === 'boolean') {
    base.type = 'boolean'
    const def = coerceDefault('boolean', p.default)
    if (def !== undefined) base.default = def
  } else {
    const def = inferDefault(p.default)
    if (def !== undefined) base.default = def
  }
  if (p.description) base.description = String(p.description).replace(/\s+/g, ' ').trim().slice(0, 280)
  return base
}

function main() {
  const raw = JSON.parse(fs.readFileSync(DATA, 'utf8'))

  // dedupe por blockName, mesclando props (ultimo vence por nome de prop)
  const byBlock = new Map()
  for (const b of raw) {
    if (!b || !b.blockName) continue
    const key = b.blockName.trim()
    if (!byBlock.has(key)) byBlock.set(key, { blockName: key, appName: b.appName, description: b.description, props: {} })
    const entry = byBlock.get(key)
    if (b.description && !entry.description) entry.description = b.description
    for (const p of b.props || []) {
      if (p && p.name) entry.props[p.name] = p
    }
  }

  const blocks = Array.from(byBlock.values()).sort((a, b) => a.blockName.localeCompare(b.blockName))

  // ---- schema ----
  const patternProperties = {}
  for (const b of blocks) {
    const propsSchema = {}
    for (const name of Object.keys(b.props)) {
      propsSchema[name] = buildPropSchema(b.props[name])
    }
    // Mescla overrides aninhados (preserva description plana se o override nao trouxer uma).
    const overrides = PROP_OVERRIDES[b.blockName]
    if (overrides) {
      for (const name of Object.keys(overrides)) {
        const merged = { ...propsSchema[name], ...overrides[name] }
        // prop que virou objeto/array nao deve carregar `default` string herdado da doc plana
        if (overrides[name].properties || overrides[name].items) delete merged.default
        propsSchema[name] = merged
      }
    }
    const regex = `^${escapeRegex(b.blockName)}(#.*)?$`
    const entry = { allOf: [{ $ref: '#/$defs/blockBase' }] }
    if (Object.keys(propsSchema).length) {
      entry.properties = { props: { type: 'object', properties: propsSchema } }
    }
    if (b.description) entry.description = String(b.description).replace(/\s+/g, ' ').trim().slice(0, 280)
    patternProperties[regex] = entry
  }

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'VTEX IO Store Framework — blocks (auto-gerado da doc oficial)',
    description: `Autocomplete e validacao de props de ${blocks.length} blocos VTEX IO.`,
    type: 'object',
    $defs: {
      blockBase: {
        type: 'object',
        properties: {
          children: { type: 'array', items: { type: 'string' }, description: 'Blocos filhos renderizados nesta ordem.' },
          blocks: { type: 'array', items: { type: 'string' }, description: 'Blocos exigidos pela interface (slots).' },
          title: { type: 'string', description: 'Titulo exibido no Site Editor.' },
          before: { type: 'array', items: { type: 'string' } },
          after: { type: 'array', items: { type: 'string' } },
          around: { type: 'array', items: { type: 'string' } },
          props: { type: 'object' },
          then: { type: 'array' },
          else: { type: 'array' },
        },
      },
    },
    patternProperties,
    additionalProperties: { $ref: '#/$defs/blockBase' },
  }

  fs.writeFileSync(SCHEMA_OUT, JSON.stringify(schema, null, 2) + '\n')

  // ---- snippets ----
  const shortPrefix = (name) =>
    'v-' + name.replace(/\./g, '-').replace(/[^a-z0-9-]/gi, '')
  const snippets = {}
  snippets['__header__'] = undefined
  for (const b of blocks) {
    const propNames = Object.keys(b.props)
    const propLines = propNames.slice(0, 6).map((n, i) => {
      const p = b.props[n]
      let val
      if (p.enumValues && p.enumValues.length) val = `\\"\${${i + 2}|${p.enumValues.join(',')}|}\\"`
      else if (p.type === 'boolean') val = `\${${i + 2}|true,false|}`
      else if (p.type === 'number') val = `\${${i + 2}:0}`
      else if (p.type === 'array') val = `[\${${i + 2}}]`
      else if (p.type === 'object') val = `{ \${${i + 2}} }`
      else val = `\\"\${${i + 2}}\\"`
      const comma = i < Math.min(propNames.length, 6) - 1 ? ',' : ''
      return `  \\"${n}\\": ${val}${comma}`
    })
    const hasHash = true
    const keyLine = `\\"${b.blockName}#\${1:id}\\": {`
    const body = [keyLine]
    if (propLines.length) {
      body.push('  \\"props\\": {')
      propLines.forEach((l) => body.push('  ' + l))
      body.push('  }')
    } else {
      body.push('  \\"props\\": {}')
    }
    body.push('}')
    snippets[b.blockName] = {
      prefix: [b.blockName, shortPrefix(b.blockName)],
      body: body.map((l) => l.replace(/\\"/g, '"')),
      description: (b.description ? b.description + ' ' : '') + `(${b.appName || 'vtex'})`,
    }
  }
  delete snippets['__header__']

  const header =
    '{\n  // ============================================================\n' +
    '  //  VTEX IO STORE FRAMEWORK — SNIPPETS (auto-gerado da doc oficial)\n' +
    `  //  ${blocks.length} blocos. Digite o nome do bloco ou o atalho \"v-\".\n` +
    '  //  Os props sao autocompletados pelo JSON Schema da extensao.\n' +
    '  // ============================================================\n'
  const bodyJson = JSON.stringify(snippets, null, 2).replace(/^{\n/, '')
  fs.writeFileSync(SNIPPETS_OUT, header + bodyJson + '\n')

  console.log(`OK: ${blocks.length} blocos -> schema (${Object.keys(patternProperties).length} patterns) + ${Object.keys(snippets).length} snippets`)
}

main()
