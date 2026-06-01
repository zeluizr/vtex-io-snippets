#!/usr/bin/env node
/**
 * Verifica se data/blocks.json cobre TODOS os blocos nativos do VTEX Store Framework.
 *
 * Ground-truth: o store/interfaces.json de cada app VTEX (as chaves = IDs de blocos).
 * Estratégia: seed de apps -> auto-descoberta 1 nível via manifest.json ->
 * filtra os que têm interfaces.json -> diff contra nossa base.
 *
 * Saídas: docs/coverage-report.md (humano) e data/coverage.json (máquina).
 * Determinístico, sem IA. Usa fetch nativo (Node >=18).
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DATA = path.join(ROOT, 'data', 'blocks.json')
const REPORT_MD = path.join(ROOT, 'docs', 'coverage-report.md')
const REPORT_JSON = path.join(ROOT, 'data', 'coverage.json')

const RAW = (app, branch, file) =>
  `https://raw.githubusercontent.com/vtex-apps/${app.replace(/^vtex\./, '')}/${branch}/${file}`

// Extras confirmados como apps que shipam blocos (podem não estar no seed)
const EXTRA_APPS = [
  'vtex.overlay-layout', 'vtex.product-gifts', 'vtex.product-highlights',
  'vtex.store-video', 'vtex.product-details', 'vtex.product-list-context',
  'vtex.search-page-context', 'vtex.store-theme',
]

// Apps de contexto / sem UI — listados à parte, não exigidos
const CONTEXT_APPS = new Set([
  'vtex.product-context', 'vtex.search-page-context', 'vtex.product-list-context',
  'vtex.product-summary-context', 'vtex.store-resources', 'vtex.format-currency',
  'vtex.css-handles', 'vtex.styleguide', 'vtex.device-detector', 'vtex.use-svg',
  'vtex.render-runtime', 'vtex.pixel-manager', 'vtex.pixel-interfaces',
])

// Blocos deprecados conhecidos — listados à parte, não exigidos
const DEPRECATED_BLOCKS = new Set([
  'carousel', 'newsletter', 'shelf', 'category-menu', 'product-price',
  'price', 'productImages', 'productDescription', 'productName',
])

const okStatus = (s) => s >= 200 && s < 300

async function fetchText(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'vtex-coverage-check' } })
    if (!okStatus(r.status)) return null
    return await r.text()
  } catch {
    return null
  }
}

// tenta master, depois main
async function fetchFile(app, file) {
  for (const branch of ['master', 'main']) {
    const txt = await fetchText(RAW(app, branch, file))
    if (txt != null) return { txt, branch }
  }
  return null
}

function parseJsonLoose(txt) {
  try {
    // remove comentários // e /* */ (alguns manifests/interfaces usam jsonc)
    const noComments = txt
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
    return JSON.parse(noComments)
  } catch {
    try { return JSON.parse(txt) } catch { return null }
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'))
  const coveredBlocks = new Set(data.map((b) => b.blockName))
  const coveredApps = new Set(data.map((b) => b.appName))

  // ---- 1. Seed de apps ----
  const seed = new Set([...coveredApps, ...EXTRA_APPS])

  // store-theme deps
  const st = await fetchFile('vtex.store-theme', 'manifest.json')
  if (st) {
    const m = parseJsonLoose(st.txt)
    if (m && m.dependencies) {
      for (const dep of Object.keys(m.dependencies)) if (dep.startsWith('vtex.')) seed.add(dep)
    }
  }
  console.log(`Seed: ${seed.size} apps`)

  // ---- 2. Auto-descoberta 1 nível via manifests ----
  const candidates = new Set(seed)
  const seedArr = [...seed]
  await Promise.all(
    seedArr.map(async (app) => {
      const f = await fetchFile(app, 'manifest.json')
      if (!f) return
      const m = parseJsonLoose(f.txt)
      if (!m) return
      for (const k of ['dependencies', 'peerDependencies']) {
        if (m[k]) for (const dep of Object.keys(m[k])) if (dep.startsWith('vtex.')) candidates.add(dep)
      }
    })
  )
  console.log(`Candidatos após auto-descoberta: ${candidates.size} apps`)

  // ---- 3. Filtro: só apps com interfaces.json (shipam blocos) ----
  const apps = {} // app -> { branch, blocks: [ids] }
  const noInterfaces = []
  await Promise.all(
    [...candidates].map(async (app) => {
      const f = await fetchFile(app, 'store/interfaces.json')
      if (!f) { noInterfaces.push(app); return }
      const j = parseJsonLoose(f.txt)
      if (!j || typeof j !== 'object') { noInterfaces.push(app); return }
      apps[app] = { branch: f.branch, blocks: Object.keys(j), raw: j }
    })
  )
  console.log(`Apps com interfaces.json (shipam blocos): ${Object.keys(apps).length}`)

  // ---- 4. Diff ----
  const allGroundTruth = new Set()
  const perApp = []
  let totReq = 0, totCovReq = 0

  const isAbstractId = (id) =>
    /^unstable--/.test(id) ||
    /^__fold__/.test(id) ||
    /Wrapper$/.test(id) ||
    id === '_' || id === 'theme' || id === 'store' ||
    id === 'base-store-component' || id === 'highlight-overlay' ||
    /^challenge/.test(id)

  let totAbstract = 0
  for (const app of Object.keys(apps).sort()) {
    const { branch, blocks, raw } = apps[app]
    const required = [], deprecated = [], context = [], abstract = [], covered = [], missing = []

    for (const id of blocks) {
      allGroundTruth.add(id)
      const def = raw[id] || {}
      const isContext = CONTEXT_APPS.has(app) || (def && def.context && !def.component)
      const isDeprecated = DEPRECATED_BLOCKS.has(id) ||
        (typeof def.component === 'string' && /deprecated/i.test(def.component))
      if (isAbstractId(id)) { abstract.push(id); continue }
      if (isContext) { context.push(id); continue }
      if (isDeprecated) { deprecated.push(id); continue }
      required.push(id)
      if (coveredBlocks.has(id)) covered.push(id); else missing.push(id)
    }

    totReq += required.length
    totCovReq += covered.length
    totAbstract += abstract.length
    perApp.push({
      app, branch,
      total: blocks.length,
      required: required.length,
      covered: covered.length,
      missing,
      deprecated,
      context,
      abstract,
      pct: required.length ? Math.round((covered.length / required.length) * 100) : 100,
    })
  }

  // apps inteiramente ausentes (interfaces 200 mas 0 cobertos e tinha required)
  const missingApps = perApp.filter((a) => a.covered === 0 && a.required > 0).map((a) => a.app)

  // blocos órfãos: temos mas não existem em nenhum interfaces.json
  const orphans = [...coveredBlocks].filter((id) => !allGroundTruth.has(id)).sort()

  const globalPct = totReq ? Math.round((totCovReq / totReq) * 100) : 100

  // ---- 5. Relatório ----
  const machine = {
    generatedFrom: 'store/interfaces.json (raw.githubusercontent.com/vtex-apps)',
    summary: {
      appsAnalyzed: Object.keys(apps).length,
      requiredBlocks: totReq,
      coveredRequired: totCovReq,
      coveragePct: globalPct,
      missingApps: missingApps.length,
      orphanBlocks: orphans.length,
    },
    perApp,
    missingApps,
    orphans,
    appsWithoutInterfaces: noInterfaces.sort(),
  }
  fs.writeFileSync(REPORT_JSON, JSON.stringify(machine, null, 2))

  const totalMissing = perApp.reduce((n, a) => n + a.missing.length, 0)
  const totalDeprecated = perApp.reduce((n, a) => n + a.deprecated.length, 0)
  const totalContext = perApp.reduce((n, a) => n + a.context.length, 0)

  let md = ''
  md += `# Relatório de cobertura — blocos nativos VTEX Store Framework\n\n`
  md += `> Ground-truth: \`store/interfaces.json\` de cada app (raw GitHub vtex-apps). Diff determinístico contra \`data/blocks.json\`.\n\n`
  md += `## Resumo\n\n`
  md += `| Métrica | Valor |\n|---|---|\n`
  md += `| Apps analisados (com interfaces.json) | **${Object.keys(apps).length}** |\n`
  md += `| Blocos exigidos (sem deprecados/contexto) | **${totReq}** |\n`
  md += `| Blocos exigidos cobertos | **${totCovReq}** |\n`
  md += `| **Cobertura global** | **${globalPct}%** |\n`
  md += `| Blocos faltantes | ${totalMissing} |\n`
  md += `| Apps totalmente ausentes | ${missingApps.length} |\n`
  md += `| Blocos órfãos (temos mas não existem) | ${orphans.length} |\n`
  md += `| Deprecados (não exigidos) | ${totalDeprecated} |\n`
  md += `| Contexto/sem-UI (não exigidos) | ${totalContext} |\n`
  md += `| Abstratos/internos (unstable--, __fold__, wrappers) | ${totAbstract} |\n\n`

  if (missingApps.length) {
    md += `## ⚠️ Apps totalmente ausentes (shipam blocos, 0% cobertos)\n\n`
    for (const app of missingApps) {
      const a = perApp.find((x) => x.app === app)
      md += `- **${app}** (${a.required} blocos): ${a.missing.join(', ')}\n`
    }
    md += `\n`
  }

  md += `## Cobertura por app\n\n`
  md += `| App | Cobertos / Exigidos | % | Faltantes |\n|---|---|---|---|\n`
  for (const a of perApp.sort((x, y) => x.pct - y.pct || x.app.localeCompare(y.app))) {
    const miss = a.missing.length ? a.missing.join(', ') : '—'
    md += `| ${a.app} | ${a.covered}/${a.required} | ${a.pct}% | ${miss} |\n`
  }
  md += `\n`

  if (orphans.length) {
    md += `## 🔎 Blocos órfãos (na nossa base, ausentes em todo interfaces.json)\n\n`
    md += `Possível rename, bloco deprecado/removido, ou erro de extração por doc. Revisar:\n\n`
    md += orphans.map((o) => `- \`${o}\``).join('\n') + '\n\n'
    md += `> Nota: \`login\`/\`login-content\` podem ser **falsos órfãos** — o \`vtex.login\` não expôs \`store/interfaces.json\` em master/main, então seus blocos não entraram no ground-truth.\n\n`
  }

  md += `## Deprecados / Contexto (listados à parte, não exigidos)\n\n`
  for (const a of perApp) {
    if (a.deprecated.length || a.context.length) {
      md += `- **${a.app}** — `
      if (a.deprecated.length) md += `deprecados: ${a.deprecated.join(', ')}; `
      if (a.context.length) md += `contexto: ${a.context.join(', ')}`
      md += `\n`
    }
  }
  md += `\n`

  md += `## Apps verificados sem \`store/interfaces.json\` (não shipam blocos de storefront)\n\n`
  md += noInterfaces.sort().map((a) => `\`${a}\``).join(', ') + '\n\n'

  md += `---\n_Gerado por \`scripts/check-coverage.js\`. Caveats: branch master/main; \`master\` reflete o major mais recente; interfaces.json pode conter blocos abstratos._\n`

  fs.writeFileSync(REPORT_MD, md)

  console.log('\n=== RESUMO ===')
  console.log(`Apps analisados: ${Object.keys(apps).length}`)
  console.log(`Cobertura global (exigidos): ${totCovReq}/${totReq} = ${globalPct}%`)
  console.log(`Faltantes: ${totalMissing} | Apps ausentes: ${missingApps.length} | Órfãos: ${orphans.length}`)
  console.log(`Relatório: ${path.relative(ROOT, REPORT_MD)}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
