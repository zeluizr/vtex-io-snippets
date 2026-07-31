# CLAUDE.md

Guia para trabalhar neste repositório. É a extensão de VS Code **"VTEX IO Store
Framework Snippets"** (publisher `commenteme`, id `commenteme.vtex-io-intellisense`).

## O que a extensão faz

Autocomplete/IntelliSense para temas VTEX IO Store Framework:

1. **Snippets de blocos + navegação** em arquivos de tema (`store/**/*.{json,jsonc}`):
   Go to Definition, Find All References, Hover e completion sensível ao contexto
   (bloco inteiro só na raiz; id de bloco em `children`/`blocks`/`before`/`after`/
   `around`; dentro de `props` manda o JSON Schema).
2. **Validação de JSON** dos blocos via `schemas/vtex-blocks.schema.json`.
3. **CSS custom properties do VTEX Style**: completion de `var(--...)` em
   `css`/`scss`/`less`/`postcss` a partir de um JSON de tokens.

## Convenções (importante — siga à risca)

- **JavaScript puro, não TypeScript.** Sem `src/`, sem build step. O `main` é
  `./extension.js` na raiz. Tipagem via JSDoc + `// @ts-check`.
- Todo arquivo começa com `// @ts-check` e `'use strict'`.
- CommonJS (`require` / `module.exports`).
- Estilo: 2 espaços, **sem ponto-e-vírgula**, aspas simples.
- Comentários e mensagens em português (o CHANGELOG/README estão em espanhol —
  mantenha o idioma do arquivo que estiver editando).
- **`lib/*.js` é lógica pura e livre de `vscode`** (só usa `fs`/`path` quando
  preciso), para ser testável com `node:test`. Os *providers* e a fiação que
  depende de `vscode` ficam em `extension.js`.

## Estrutura

```
extension.js          activate()/deactivate() + todos os providers e comandos
lib/blocks.js         regex/heurística de ids de bloco e arquivos de tema (puro)
lib/context.js        contexto JSON sob o cursor: define/referencia/none (puro)
lib/snippets.js       leitura do catálogo .code-snippets (puro, usa fs)
lib/tokens.js         gerador de CSS custom properties do VTEX Style (puro)
assets/tokens.json    JSON de tokens VTEX Style default (embutido, fallback)
snippets/             catálogo de blocos (.code-snippets) — fonte única
schemas/              JSON Schema dos blocos (gerado por scripts/)
data/, scripts/       geração de schema/cobertura (fora do pacote publicado)
test/*.test.js        testes com node:test
```

`.vscodeignore` mantém fora do pacote: `test/`, `scripts/`, `data/`, `docs/`,
`.github/`, `.claude/`. **`assets/` e `lib/` SÃO publicados** (o default de tokens
e o código precisam ir junto).

## Feature de tokens CSS (lib/tokens.js + extension.js)

- `generateTokens(rawJson)` → `[{ name, value, isColor }]`. **Função pura**; as
  regras de nome batem 1:1 com o que a VTEX gera (`typeScale[0]`→`--type-scale-1`,
  `spacing[i]`→`--spacing-{i}`, `borderWidths`/`borderRadius` com `0`→`"0"`,
  `opacity` nomeada pelo valor via `opacityName`, `semanticColors[g][k]`→
  `--{g}-{k}`, `colors[k]`→`--{k}` com `isColor:true`). Alterou regra de nome?
  Atualize `test/tokens.test.js`.
- Carregamento com prioridade em `extension.js` (`resolveTokensSource`):
  `styles/configs/tokens.json` → `tokens.json` (raiz) → `assets/tokens.json`.
  `FileSystemWatcher('**/tokens.json')` recarrega. Parse inválido **não** derruba
  a extensão nem apaga os tokens anteriores (`reloadTokens`).
- Provider `cssTokenProvider`: linguagens `css/scss/less/postcss`, triggers `-` e
  `(`. Dentro de `var(` insere só o nome; senão `var(--nome)`. Cor →
  `CompletionItemKind.Color` (swatch via `detail`/`documentation`).
- Comando `vtex-io-intellisense.generateTokensCss` ("VTEX: Gerar tokens.css")
  reusa `generateTokens` para exportar `:root { ... }` ao lado do JSON de origem.

## Comandos úteis

```bash
npm test                                   # node:test (todos os *.test.js)
node --check extension.js                  # sanity de sintaxe
npx --yes @vscode/vsce package --no-dependencies   # gera o .vsix
```

Publicar no Marketplace (`vsce publish`) exige o PAT do publisher `commenteme` —
é ação externa; não publique sem pedido explícito do usuário.

## Ao adicionar features

- Coloque a lógica testável em `lib/` (sem `vscode`) e registre o provider/comando
  em `activate()` via `context.subscriptions.push(...)`.
- Atualize `package.json` (`activationEvents`, `contributes.*`) sem remover o que
  já existe, `CHANGELOG.md`, `README.md`, e bump de versão (SemVer).
- Sem novas dependências de runtime: só a API `vscode` e `fs`/`path` do Node.
