// @ts-check
'use strict'

/**
 * VTEX IO IntelliSense — runtime
 *
 * Adiciona navegacao entre blocos nos arquivos de tema (store/blocks/**):
 *  - Go to Definition (Cmd/Ctrl+clique): de uma referencia de bloco
 *    ("flex-layout.row#hero-banner" dentro de children/blocks/before/...) pula
 *    para onde o bloco esta DEFINIDO ("flex-layout.row#hero-banner": { ... }).
 *  - Find All References: lista todos os usos do bloco.
 *  - Hover: mostra onde o bloco esta definido.
 *
 * Sem dependencias de runtime — usa apenas a API `vscode`. Toda a deteccao e
 * feita com um indice (id -> { defs, refs }) construido a partir dos arquivos
 * do workspace, cacheado e invalidado quando algum arquivo de tema muda.
 */

const vscode = require('vscode')
const {
  TOKEN_RE,
  isStructuralKey,
  isThemeBlockFilePath,
  scanOccurrences,
} = require('./lib/blocks')

// Arquivos onde blocos sao definidos/referenciados num tema VTEX IO.
// Cobre todo o store/** (store/blocks/**, store/home.jsonc, store/blocks.jsonc,
// subpastas...), nao so store/blocks/.
const FILE_GLOB = '**/store/**/*.{json,jsonc}'
const EXCLUDE_GLOB = '**/node_modules/**'

function isThemeBlockFile(uri) {
  return isThemeBlockFilePath(uri.path)
}

/** @type {Promise<Map<string, { defs: import('vscode').Location[], refs: import('vscode').Location[] }>> | null} */
let indexPromise = null

function getIndex() {
  if (!indexPromise) indexPromise = buildIndex()
  return indexPromise
}

function invalidateIndex() {
  indexPromise = null
}

async function buildIndex() {
  /** @type {Map<string, { defs: import('vscode').Location[], refs: import('vscode').Location[] }>} */
  const index = new Map()
  let uris = []
  try {
    uris = await vscode.workspace.findFiles(FILE_GLOB, EXCLUDE_GLOB)
  } catch (_) {
    return index
  }

  for (const uri of uris) {
    if (!isThemeBlockFile(uri)) continue
    let doc
    try {
      doc = await vscode.workspace.openTextDocument(uri)
    } catch (_) {
      continue
    }
    const text = doc.getText()
    for (const { id, isDef, index: at } of scanOccurrences(text)) {
      const start = doc.positionAt(at + 1) // dentro das aspas
      const end = doc.positionAt(at + 1 + id.length)
      const loc = new vscode.Location(uri, new vscode.Range(start, end))

      let entry = index.get(id)
      if (!entry) {
        entry = { defs: [], refs: [] }
        index.set(id, entry)
      }
      ;(isDef ? entry.defs : entry.refs).push(loc)
    }
  }
  return index
}

/** Extrai o id de bloco sob o cursor, ou null. */
function blockIdAt(document, position) {
  const range = document.getWordRangeAtPosition(position, TOKEN_RE)
  if (!range) return null
  const id = document.getText(range)
  if (!id || isStructuralKey(id)) return null
  return id
}

const definitionProvider = {
  async provideDefinition(document, position) {
    const id = blockIdAt(document, position)
    if (!id) return undefined
    const entry = (await getIndex()).get(id)
    if (!entry || entry.defs.length === 0) return undefined
    return entry.defs
  },
}

const referenceProvider = {
  async provideReferences(document, position, context) {
    const id = blockIdAt(document, position)
    if (!id) return undefined
    const entry = (await getIndex()).get(id)
    if (!entry) return undefined
    const out = entry.refs.slice()
    if (context && context.includeDeclaration) out.push(...entry.defs)
    return out
  },
}

const hoverProvider = {
  async provideHover(document, position) {
    const id = blockIdAt(document, position)
    if (!id) return undefined
    const entry = (await getIndex()).get(id)
    // exige ao menos uma referencia -> evita hover em nomes de prop (blockClass, label...)
    if (!entry || entry.defs.length === 0 || entry.refs.length === 0) return undefined

    const md = new vscode.MarkdownString()
    md.isTrusted = true
    const lines = entry.defs.map((loc) => {
      const rel = vscode.workspace.asRelativePath(loc.uri)
      const line = loc.range.start.line + 1
      const arg = encodeURIComponent(JSON.stringify([loc.uri.toString(), { selection: loc.range }]))
      return `- [\`${rel}:${line}\`](command:vscode.open?${arg})`
    })
    md.appendMarkdown(`**Bloco** \`${id}\` — definido em:\n${lines.join('\n')}`)
    const refCount = entry.refs.length
    if (refCount > 0) md.appendMarkdown(`\n\n${refCount} referência${refCount > 1 ? 's' : ''} no tema.`)
    return new vscode.Hover(md)
  },
}

function activate(context) {
  const selector = [
    { language: 'json', scheme: 'file' },
    { language: 'jsonc', scheme: 'file' },
  ]

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, definitionProvider),
    vscode.languages.registerReferenceProvider(selector, referenceProvider),
    vscode.languages.registerHoverProvider(selector, hoverProvider),
  )

  // Invalida o indice quando arquivos de tema mudam.
  const watcher = vscode.workspace.createFileSystemWatcher(FILE_GLOB)
  watcher.onDidCreate(invalidateIndex)
  watcher.onDidChange(invalidateIndex)
  watcher.onDidDelete(invalidateIndex)
  context.subscriptions.push(watcher)

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (isThemeBlockFile(e.document.uri)) invalidateIndex()
    }),
  )
}

function deactivate() {}

module.exports = { activate, deactivate }
