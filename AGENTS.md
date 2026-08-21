# AGENTS.md

Guia para trabalhar neste repositório. É a extensão de VS Code **"inmmerce for
VTEX"** (publisher `commenteme`, id `commenteme.vtex-io-intellisense`).

## O que a extensão faz

Autocomplete/IntelliSense para temas VTEX IO Store Framework, mais a camada de
identidade visual (tema e ícones):

1. **Snippets de blocos + navegação** em arquivos de tema (`store/**/*.{json,jsonc}`):
   Go to Definition, Find All References, Hover e completion sensível ao contexto
   (bloco inteiro só na raiz; id de bloco em `children`/`blocks`/`before`/`after`/
   `around`; dentro de `props` manda o JSON Schema).
2. **Validação de JSON** dos blocos via `schemas/vtex-blocks.schema.json`.
3. **CSS custom properties do VTEX Style**: completion de `var(--...)` em
   `css`/`scss`/`less`/`postcss` a partir de um JSON de tokens.
4. **Identidade visual `Puelche`**: tema de cores escuro, icon theme de arquivos e
   pastas (com ícones próprios da estrutura VTEX IO) e product icon theme.

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
themes/               tema de cores (à mão) + icon theme, product icon theme e
                      puelche-product.woff (gerados) — todos publicados
icons/                SVGs do icon theme (gerados, commitados, publicados);
                      icons/product/ é insumo de build (gitignored, fora do .vsix)
data/icons.json       mapa do icon theme: id → forma/papel/ext/nome/lang (fonte)
data/product-icons.json      mapa do product icon theme: id de codicon → forma
data/product-codepoints.json codepoints da PUA, append-only (trava, commitado)
scripts/icon-shapes.js       geometria dos ícones de arquivo, 24x24 (fonte)
scripts/product-shapes-{a,b}.js geometria dos glifos da UI, 16x16 (fonte)
snippets/             catálogo de blocos (.code-snippets) — fonte única
schemas/              JSON Schema dos blocos (gerado por scripts/)
data/, scripts/       geração de schema/cobertura/ícones (fora do pacote publicado)
test/*.test.js        testes com node:test
```

`.vscodeignore` mantém fora do pacote: `test/`, `scripts/`, `data/`, `docs/`,
`.github/`, `.claude/**`, `CLAUDE.md`, `AGENTS.md`, `.guilda/**`, `.DS_Store` e
`package-lock.json`. **`assets/`, `lib/`, `themes/` e `icons/` SÃO publicados** (o
default de tokens, o código e a camada de tema precisam ir junto).

## Feature de tokens CSS (lib/tokens.js + extension.js)

- `generateTokens(tokens)` → `[{ name, value, isColor }]`. Recebe o JSON **já
  parseado** (quem lê o arquivo é o `extension.js`). **Função pura**; as
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

## Camada de tema (themes/ + icons/)

- **Tema de cores `Puelche`** (`themes/puelche-color-theme.json`): escrito à mão.
  Regra central: **colorir por papel, não por linguagem** — 9 papéis semânticos e
  toda linguagem mapeia nos mesmos 9 (tag HTML, componente JSX, seletor de elemento
  CSS, decorator Python, atributo Prisma, diretiva GraphQL e título Markdown são
  todos "estrutura nomeada"). Accent (`#C25E86`) **só em chrome**, nunca em texto de
  código; corpo de Markdown sem cor; itálico no lugar de cores extras.
- **Validado por `test/theme.test.js`** — a spec virou asserção, porque essas regras
  só falham "visualmente": nenhum hex fora da paleta declarada, accent apenas nas 11
  chaves de chrome listadas, os 9 papéis ≥ 4.5:1 sobre o fundo do editor (comentário
  ≥ 5.7:1, hoje 5.85:1), corpo de Markdown sem cor nem estilo, itálico/negrito só nas
  regras da spec, e o tema registrado em `contributes.themes`. Mudou paleta ou regra?
  Atualize a spec no topo do teste.
- **Icon theme é GERADO, não editado à mão.** Fonte: `data/icons.json` (mapa
  id → forma/papel/`ext`/`names`/`langs`) + `scripts/icon-shapes.js` (geometria SVG
  numa grade 24x24, monoline, `stroke-width` 1.8, token `@c` para preenchimento).
  Saída **commitada e publicada**: `icons/*.svg` + `themes/puelche-icon-theme.json`.
- Regenerar com `npm run icons:build`; `npm run icons:check` roda o build e falha no
  `git diff` se o commitado não for exatamente o que o gerador produz. O gerador é
  determinístico: mesma entrada → mesmos bytes.
- Ícone novo: forma em `scripts/icon-shapes.js`, mapeamento em `data/icons.json`, e
  rode o build. **Nunca** edite `themes/puelche-icon-theme.json` nem os SVGs à mão.
  Precedência do VS Code: `fileNames` > `fileExtensions` > `languageIds`.
- **Product icon theme também é gerado** (`contributes.productIconThemes`, id
  `puelche-product`): 58 glifos viram 93 entradas de `iconDefinitions` (35 são apelidos
  de codicon que dividem desenho), nos codepoints `\e900`–`\e939`. Fonte:
  `data/product-icons.json` + `scripts/product-shapes-{a,b}.js`. Saída commitada e
  publicada: `themes/puelche-product-icons.json` + `themes/puelche-product.woff`
  (5616 bytes). Cadeia SVG 16x16 → `svgicons2svgfont` → `svg2ttf` → `ttf2woff`.
- `data/product-codepoints.json` é **append-only** e commitado: trava id → codepoint.
  Nunca reordene nem apague uma entrada — o número seria reaproveitado por outro
  desenho e cada usuário com a fonte em cache veria o ícone errado.
- Regenerar: `npm run product:build`; `npm run product:check` refaz e falha no
  `git diff` de `themes/` e `data/product-codepoints.json`. Determinístico até o
  sha256 (o `svg2ttf` recebe `ts` fixo; sem isso ele carimba `new Date()` no `head`).
- Métricas da fonte: `unitsPerEm` 1000, `ascender` 1000, `descender` 0 — a mesma razão
  1.0 do codicon nativo. É o que faz glifo nosso e codicon não coberto dividirem a
  linha de base na mesma barra. Não mexa nisso sem regerar tudo.
- `icons/product/**` são SVGs de trabalho: **gitignored** (derivados dos
  `product-shapes-*.js`) e fora do `.vsix` — o artefato publicado é só o `.woff`.
  A cobertura da UI é parcial de propósito: o não coberto cai no codicon nativo.

## Comandos úteis

```bash
npm test                                   # node:test (todos os *.test.js)
npm run icons:build                        # regenera icons/*.svg + icon theme
npm run icons:check                        # build + git diff --exit-code (CI)
npm run product:build                      # regenera o .woff + product icon theme
npm run product:check                      # build + git diff --exit-code (CI)
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
