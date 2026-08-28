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

const fs = require('fs')
const path = require('path')
const vscode = require('vscode')
const {
  TOKEN_RE,
  isStructuralKey,
  isThemeBlockFilePath,
  scanOccurrences,
} = require('./lib/blocks')
const { completionContext } = require('./lib/context')
const { loadSnippets } = require('./lib/snippets')
const { generateTokens } = require('./lib/tokens')
const comfort = require('./lib/comfort')

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

/**
 * Extrai o id de bloco sob o cursor com o range do TOKEN COMPLETO, ou null.
 * Importante: o range vem de TOKEN_RE (que inclui `.`, `#`, `-`), não do
 * word-range padrao do editor — que quebra em `.`/`#`/`-` e faria o link de
 * Go to Definition / o hover cobrirem só um pedaco do id (ex.: so "context"
 * em "list-context.image-list#hero-banner").
 */
function blockIdAt(document, position) {
  const range = document.getWordRangeAtPosition(position, TOKEN_RE)
  if (!range) return null
  const id = document.getText(range)
  if (!id || isStructuralKey(id)) return null
  return { id, range }
}

const definitionProvider = {
  async provideDefinition(document, position) {
    const hit = blockIdAt(document, position)
    if (!hit) return undefined
    const entry = (await getIndex()).get(hit.id)
    if (!entry || entry.defs.length === 0) return undefined
    // LocationLink com originSelectionRange = token inteiro -> o realce/clique
    // do Cmd+hover cobre o id completo, não só a sub-palavra sob o cursor.
    return entry.defs.map((loc) => ({
      originSelectionRange: hit.range,
      targetUri: loc.uri,
      targetRange: loc.range,
      targetSelectionRange: loc.range,
    }))
  },
}

const referenceProvider = {
  async provideReferences(document, position, context) {
    const hit = blockIdAt(document, position)
    if (!hit) return undefined
    const entry = (await getIndex()).get(hit.id)
    if (!entry) return undefined
    const out = entry.refs.slice()
    if (context && context.includeDeclaration) out.push(...entry.defs)
    return out
  },
}

const hoverProvider = {
  async provideHover(document, position) {
    const hit = blockIdAt(document, position)
    if (!hit) return undefined
    const entry = (await getIndex()).get(hit.id)
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
    md.appendMarkdown(`**Bloco** \`${hit.id}\` — definido em:\n${lines.join('\n')}`)
    const refCount = entry.refs.length
    if (refCount > 0) md.appendMarkdown(`\n\n${refCount} referência${refCount > 1 ? 's' : ''} no tema.`)
    // range = token inteiro -> a area de hover cobre o id completo.
    return new vscode.Hover(md, hit.range)
  },
}

/** @type {import('./lib/snippets').BlockSnippet[] | null} */
let snippetCache = null

function getSnippets() {
  if (!snippetCache) {
    snippetCache = loadSnippets(path.join(__dirname, 'snippets', 'vtex-io.code-snippets'))
  }
  return snippetCache
}

/**
 * Range que a sugestao substitui. Dentro de uma string, precisa cobrir as ASPAS
 * inteiras: o corpo do snippet ja comeca com `"` e, sem isso, aceitar a sugestao
 * produziria `""rich-text#id": {`.
 */
function replaceRange(document, position, ctx) {
  if (ctx.inString) {
    const text = document.getText()
    let end = document.offsetAt(position)
    while (end < text.length && text[end] !== '"' && text[end] !== '\n') end++
    if (text[end] === '"') end++
    return new vscode.Range(document.positionAt(ctx.stringStart), document.positionAt(end))
  }
  return document.getWordRangeAtPosition(position, TOKEN_RE) || new vscode.Range(position, position)
}

/** Preview do corpo sem os placeholders (`${1:id}` -> `id`). */
function previewOf(body) {
  return body.replace(/\$\{\d+\|([^|}]*)[^}]*\}/g, '$1').replace(/\$\{\d+:?([^}]*)\}/g, '$1')
}

const completionProvider = {
  async provideCompletionItems(document, position) {
    if (!isThemeBlockFilePath(document.uri.path)) return undefined

    const text = document.getText()
    const ctx = completionContext(text, document.offsetAt(position))
    if (ctx.kind === 'none') return undefined

    const range = replaceRange(document, position, ctx)
    const quoted = ctx.inString ? '"' : ''

    if (ctx.kind === 'block-reference') {
      // Dentro de children/blocks/before/... so cabe o ID de um bloco JA
      // definido no tema — nao o corpo do bloco.
      const index = await getIndex()
      /** @type {import('vscode').CompletionItem[]} */
      const items = []
      for (const [id, entry] of index) {
        if (entry.defs.length === 0) continue
        const item = new vscode.CompletionItem(id, vscode.CompletionItemKind.Reference)
        item.insertText = `${quoted}${id}${quoted}`
        item.filterText = `${quoted}${id}`
        item.range = range
        item.detail = vscode.workspace.asRelativePath(entry.defs[0].uri)
        items.push(item)
      }
      return items
    }

    return getSnippets().map((snip) => {
      const item = new vscode.CompletionItem(snip.name, vscode.CompletionItemKind.Snippet)
      item.insertText = new vscode.SnippetString(snip.body)
      // o texto digitado inclui a aspa de abertura quando o range comeca nela;
      // sem isso o filtro do VS Code nao casa e a lista aparece vazia.
      item.filterText = `${quoted}${snip.name}`
      item.range = range
      item.detail = snip.description
      const md = new vscode.MarkdownString()
      if (snip.description) md.appendMarkdown(`${snip.description}\n\n`)
      md.appendCodeblock(previewOf(snip.body), 'jsonc')
      item.documentation = md
      return item
    })
  },
}

// --- CSS custom properties a partir do JSON de tokens VTEX Style -------------
//
// A VTEX expõe os tokens do `style.json` como custom properties CSS em runtime
// (`var(--emphasis)`, `var(--spacing-2)`...). Aqui geramos essa lista com o
// mesmo `generateTokens` e servimos como autocomplete em arquivos de estilo.

// Default embutido: usado quando o workspace não tem um tokens.json próprio.
const DEFAULT_TOKENS_PATH = path.join(__dirname, 'assets', 'tokens.json')

/** @type {{ tokens: import('./lib/tokens').Token[], sourcePath: string | null }} */
let tokenState = { tokens: [], sourcePath: null }

/**
 * Origem do JSON de tokens, por prioridade: primeiro o do workspace
 * (`styles/configs/tokens.json`, depois `tokens.json` na raiz) e, se não houver,
 * o asset embutido na extensão.
 * @returns {string}
 */
function resolveTokensSource() {
  const folders = vscode.workspace.workspaceFolders || []
  for (const folder of folders) {
    const candidates = [
      path.join(folder.uri.fsPath, 'styles', 'configs', 'tokens.json'),
      path.join(folder.uri.fsPath, 'tokens.json'),
    ]
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate
    }
  }
  return DEFAULT_TOKENS_PATH
}

/** Lê e gera os tokens de um caminho. Lança em erro de leitura/parse. */
function loadTokensFrom(src) {
  return generateTokens(JSON.parse(fs.readFileSync(src, 'utf8')))
}

/**
 * (Re)carrega os tokens da origem prioritária. Um parse inválido nunca derruba
 * a extensão nem apaga os tokens anteriores: mantém o último estado bom e só
 * cai para o default embutido se ainda não tivermos nenhum token.
 */
function reloadTokens() {
  const src = resolveTokensSource()
  try {
    tokenState = { tokens: loadTokensFrom(src), sourcePath: src }
    return
  } catch (_) {
    // origem escolhida ilegível/inválida — segue para os fallbacks abaixo.
  }
  if (tokenState.tokens.length === 0 && src !== DEFAULT_TOKENS_PATH) {
    try {
      tokenState = { tokens: loadTokensFrom(DEFAULT_TOKENS_PATH), sourcePath: DEFAULT_TOKENS_PATH }
      return
    } catch (_) {
      // sem default legível também — mantém o estado atual (vazio).
    }
  }
  // caso normal de falha: preserva os tokens já carregados.
}

/**
 * Diz se o cursor já está dentro de um `var( ` ainda aberto na mesma linha.
 * Nesse caso a sugestão insere só o nome; senão insere `var(--nome)` inteiro.
 * @param {string} linePrefix texto da linha até o cursor
 */
function insideVar(linePrefix) {
  const at = linePrefix.lastIndexOf('var(')
  if (at === -1) return false
  return !linePrefix.slice(at + 4).includes(')')
}

const cssTokenProvider = {
  provideCompletionItems(document, position) {
    if (tokenState.tokens.length === 0) return undefined

    const linePrefix = document.lineAt(position).text.slice(0, position.character)
    const within = insideVar(linePrefix)
    // Range que a sugestão substitui: o pedaço de `--nome` já digitado (inclui
    // os `-`), para não duplicar as barras quando o usuário já escreveu `--ty`.
    const range = document.getWordRangeAtPosition(position, /[-\w]+/)

    return tokenState.tokens.map((tok) => {
      const kind = tok.isColor
        ? vscode.CompletionItemKind.Color
        : vscode.CompletionItemKind.Variable
      const item = new vscode.CompletionItem(tok.name, kind)
      item.detail = tok.value
      // Para kind Color, o VS Code lê o swatch de uma cor em detail/documentation.
      item.documentation = tok.value
      item.filterText = tok.name
      item.insertText = within ? tok.name : `var(${tok.name})`
      if (range) item.range = range
      return item
    })
  },
}

/**
 * Comando "VTEX: Gerar tokens.css": reusa o MESMO gerador para exportar um
 * `:root { ... }` com todas as variáveis, gravado ao lado do JSON de origem.
 */
async function generateTokensCss() {
  const src = tokenState.sourcePath || resolveTokensSource()
  let tokens
  try {
    tokens = loadTokensFrom(src)
  } catch (e) {
    vscode.window.showErrorMessage(`VTEX: não foi possível ler ${src}: ${e && e.message}`)
    return
  }
  const body = tokens.map((t) => `  ${t.name}: ${t.value};`).join('\n')
  const css = `:root {\n${body}\n}\n`
  const outPath = path.join(path.dirname(src), 'tokens.css')
  try {
    fs.writeFileSync(outPath, css, 'utf8')
  } catch (e) {
    vscode.window.showErrorMessage(`VTEX: falha ao gravar ${outPath}: ${e && e.message}`)
    return
  }
  const doc = await vscode.workspace.openTextDocument(outPath)
  await vscode.window.showTextDocument(doc)
  vscode.window.showInformationMessage(
    `VTEX: ${tokens.length} variáveis geradas em ${vscode.workspace.asRelativePath(outPath)}`,
  )
}

/**
 * Pastas de fonte do sistema, por plataforma. Só leitura: o comando de conforto
 * precisa saber se a Victor Mono existe antes de mandar o editor usá-la — uma
 * `fontFamily` que aponta para fonte inexistente cai no fallback em silêncio e
 * o usuário acha que o comando não fez nada.
 */
function pastasDeFonte() {
  const home = require('os').homedir()
  if (process.platform === 'darwin') {
    return [path.join(home, 'Library', 'Fonts'), '/Library/Fonts', '/System/Library/Fonts']
  }
  if (process.platform === 'win32') {
    return [path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts')]
  }
  return [path.join(home, '.local', 'share', 'fonts'), path.join(home, '.fonts'), '/usr/share/fonts']
}

/** Nomes de arquivo de todas as pastas de fonte, ignorando as que não existem. */
function arquivosDeFonte() {
  const nomes = []
  for (const dir of pastasDeFonte()) {
    try {
      nomes.push(...fs.readdirSync(dir))
    } catch {
      // pasta ausente ou sem permissão: não é erro, é só uma pasta a menos
    }
  }
  return nomes
}

const CHAVE_DESFAZER = 'puelche.conforto.anterior'

/** Valor que o USUÁRIO gravou na configuração global, não o valor efetivo. */
function valorGlobal(chave) {
  const secao = chave.slice(0, chave.lastIndexOf('.'))
  const folha = chave.slice(chave.lastIndexOf('.') + 1)
  const info = vscode.workspace.getConfiguration(secao).inspect(folha)
  return info ? info.globalValue : undefined
}

async function escrever(chave, valor) {
  const secao = chave.slice(0, chave.lastIndexOf('.'))
  const folha = chave.slice(chave.lastIndexOf('.') + 1)
  await vscode.workspace.getConfiguration(secao).update(folha, valor, vscode.ConfigurationTarget.Global)
}

/** Comando "VTEX: Aplicar ajustes de conforto do Puelche". */
async function applyComfort(context) {
  const temFonte = comfort.fonteInstalada(arquivosDeFonte())
  if (!temFonte) {
    const brew = `brew install --cask ${comfort.FONTE.cask}`
    const escolha = await vscode.window.showWarningMessage(
      `VTEX: a fonte ${comfort.FONTE.nome} não está instalada. Sem ela o editor cai no fallback e o preset parece não ter feito nada.`,
      { modal: true },
      'Copiar comando de instalação',
      'Aplicar mesmo assim',
    )
    if (escolha === 'Copiar comando de instalação') {
      await vscode.env.clipboard.writeText(brew)
      vscode.window.showInformationMessage(`VTEX: \`${brew}\` copiado. Rode, reinicie o VS Code e chame o comando de novo.`)
      return
    }
    if (escolha !== 'Aplicar mesmo assim') return
  }

  /** @type {Record<string, unknown>} */
  const atual = {}
  for (const chave of Object.keys(comfort.AJUSTES)) atual[chave] = valorGlobal(chave)
  const mudancas = comfort.planejar(atual)

  if (mudancas.length === 0) {
    vscode.window.showInformationMessage('VTEX: os ajustes de conforto do Puelche já estão aplicados.')
    return
  }

  const ok = await vscode.window.showInformationMessage(
    `VTEX: aplicar ${mudancas.length} ajuste(s) nas suas configurações de usuário?`,
    { modal: true, detail: mudancas.map(comfort.descrever).join('\n') },
    'Aplicar',
  )
  if (ok !== 'Aplicar') return

  for (const m of mudancas) await escrever(m.chave, m.para)
  await context.globalState.update(
    CHAVE_DESFAZER,
    mudancas.map((m) => ({ chave: m.chave, de: m.de })),
  )
  vscode.window.showInformationMessage(
    `VTEX: ${mudancas.length} ajuste(s) aplicados. "VTEX: Desfazer ajustes de conforto" volta atrás.`,
  )
}

/** Comando "VTEX: Desfazer ajustes de conforto". */
async function undoComfort(context) {
  const salvo = context.globalState.get(CHAVE_DESFAZER)
  if (!salvo || salvo.length === 0) {
    vscode.window.showInformationMessage('VTEX: não há ajustes de conforto para desfazer.')
    return
  }
  for (const { chave, para } of comfort.restaurar(salvo)) await escrever(chave, para)
  await context.globalState.update(CHAVE_DESFAZER, undefined)
  vscode.window.showInformationMessage(`VTEX: ${salvo.length} ajuste(s) restaurados ao valor anterior.`)
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
    vscode.languages.registerCompletionItemProvider(selector, completionProvider, '"'),
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

  // --- CSS custom properties (tokens do VTEX Style) -------------------------
  reloadTokens()

  const cssSelector = ['css', 'scss', 'less', 'postcss'].map((language) => ({
    language,
    scheme: 'file',
  }))
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(cssSelector, cssTokenProvider, '-', '('),
  )

  // Recarrega os tokens quando qualquer tokens.json muda no workspace.
  const tokensWatcher = vscode.workspace.createFileSystemWatcher('**/tokens.json')
  tokensWatcher.onDidCreate(reloadTokens)
  tokensWatcher.onDidChange(reloadTokens)
  tokensWatcher.onDidDelete(reloadTokens)
  context.subscriptions.push(tokensWatcher)

  context.subscriptions.push(
    vscode.commands.registerCommand('vtex-io-intellisense.generateTokensCss', generateTokensCss),
    vscode.commands.registerCommand('vtex-io-intellisense.applyComfort', () => applyComfort(context)),
    vscode.commands.registerCommand('vtex-io-intellisense.undoComfort', () => undoComfort(context)),
  )
}

function deactivate() {}

module.exports = { activate, deactivate }
