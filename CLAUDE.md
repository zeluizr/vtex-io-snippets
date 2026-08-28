# CLAUDE.md

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
scripts/stroke-outline.js    traço monoline → contorno preenchido (puro, testado)
scripts/contact-sheet.js     folhas de contato dos ícones em 16/24/32px
docs/traco-puelche.md        spec de desenho: espessura, raio, caixa, badge
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
  só falham "visualmente": nenhum hex fora da paleta declarada, a identidade accent
  em 12 chaves de chrome e nenhuma de texto (10 de `accent` puro + 2 de
  `accent-lift`, que existe porque o accent puro reprova a 3.46:1 sobre a linha
  focada), os 9 papéis ≥ 4.5:1 sobre o fundo do editor (comentário ≥ 5.7:1),
  **nenhum par de cores que dividem a tela abaixo de ΔE76 10** (com as isenções
  declaradas no próprio código — `fg`/`fg-param` e `comment`/`fg-punct` são
  separados pelo itálico, não pela cor), os três `CompletionItemKind` que esta
  extensão de fato emite distinguíveis entre si, `symbolIcon.*` inteiro na paleta,
  corpo de Markdown sem cor nem estilo, itálico/negrito só nas regras da spec, e o
  tema registrado em `contributes.themes`. Mudou paleta ou regra? Atualize a spec
  no topo do teste — ela é o documento, o JSON é só o artefato.
- **`docs/traco-puelche.md` é a spec de desenho** e manda nas duas grades. Vai
  desenhar? Leia a spec antes. O resumo: espessura de marca **2** e raio de canto
  **2** na grade 24, **1.35** e **1.35** na grade 16, caixa de conteúdo 2–22 e
  1.5–14.5, ponta e junção redondas, e **no máximo 3 elementos por marca**. A
  regra que amarra: **raio de canto = espessura do traço**.
- **Arquivo e pasta são DUAS CAMADAS, não monoline.** A placa (`plate`, `folder`,
  `folderOpen`) é silhueta sólida com `fill` na cor do papel; a marca inscrita é
  traçada por cima no **tom escuro** do mesmo papel. Mancha lê a 16px do Explorer,
  traço de 1.33px não — é a mesma escolha do Material Icon Theme. Só o glifo do
  product icon theme continua monoline, porque fonte não carrega duas cores.
- **O tom escuro é derivado, não escolhido.** `data/icons.json → rolesDeep` é cada
  papel misturado a **60% com `#1A181F`**, e o gerador recusa valor diferente
  disso. Pior caso medido: `punct` a 2.67:1 entre placa e marca, travado em
  `test/icons.test.js`.
- **Icon theme é GERADO, não editado à mão.** Fonte: `data/icons.json` (mapa
  id → forma/papel/`ext`/`names`/`langs` + `roles`/`rolesDeep`) +
  `scripts/icon-shapes.js` (geometria SVG numa grade 24x24; tokens `@c` = cor da
  camada e `@d` = tom escuro dentro da placa). A pintura vive só no
  `build-icon-theme.js` — **nenhuma forma declara `stroke-width` nem `stroke`**.
  Saída **commitada e publicada**: `icons/*.svg` + `themes/puelche-icon-theme.json`.
- **Marca de terceiro é SÓLIDA** (`claude`, `npm`, `yarn`, `prettier`, `eslint`,
  `docker`, `git`, `github`, `vtex`): logo em monoline a 8px vira teia. Declara
  `fill="@c" stroke="none"` e, com furo, `fill-rule="evenodd"`, num `<path>` só.
  É a segunda exceção da spec, e por isso `CLAUDE.md` pode ter o sunburst mesmo
  sendo `.md` — quem manda é o `fileNames`.
- **A marca de arquivo não pode ter moldura** — a moldura virou a placa. Foi por
  isso que `javascript`, `typescript` e `image` perderam o retângulo de 19×19 e
  `doc`/`markdown` perderam a página.
- **Escape da marca**: `markShape()` procura `SHAPES[nome + 'Badge']` na pasta e
  `SHAPES[nome + 'Mark']` no arquivo, e cai em `SHAPES[nome]` quando não existe.
  A ~8px, forma centralmente simétrica vira bolha — o badge é a variante
  assimétrica de no máximo dois elementos. `data/icons.json` não muda em nenhum
  dos dois casos. `MARK_SPAN` é o vão de conteúdo das formas (20) e é o
  denominador da escala. **O teto é proporção, não escala**: a marca ocupa ~78%
  do vão livre do corpo; acima de ~85% a tinta encosta na parede e a pasta deixa
  de ler como pasta.
- **A placa ocupa 1..23, não a caixa de conteúdo 2..22.** A caixa é a régua do
  traço, e com o traço de 2 centrado nela a tinta ia a 1 e 23 de qualquer jeito.
  Preenchida, a silhueta ocupa direto essa extensão — mesmo tamanho de tinta que
  o contorno tinha.
- Regenerar com `npm run icons:build`; `npm run icons:check` roda o build e falha no
  `git diff` se o commitado não for exatamente o que o gerador produz. O gerador é
  determinístico: mesma entrada → mesmos bytes.
- **A cobertura segue os builders do VTEX IO**, não uma lista genérica: `store`, `react`,
  `node`, `graphql`, `messages`, `styles`, `admin`, `pixel`, `assets`, `docs`,
  `checkout-ui-custom`, `sitemap`, `masterdata` e `configuration` têm pasta própria, mais
  a estrutura de dentro do tema (`store/blocks`, `store/templates`, `styles/iconpacks`) e
  as páginas da vitrine (`home`, `product`, `search`, `header`, `footer`, `landing`,
  `cart`, `account`). Vai mexer? A referência é uma árvore de tema real, não a documentação.
- Ícone novo: forma em `scripts/icon-shapes.js`, mapeamento em `data/icons.json`, e
  rode o build. **Nunca** edite `themes/puelche-icon-theme.json` nem os SVGs à mão.
  Precedência do VS Code: `fileNames` > `fileExtensions` > `languageIds`.
- **Product icon theme também é gerado** (`contributes.productIconThemes`, id
  `puelche-product`): 58 glifos viram 93 entradas de `iconDefinitions` (35 são apelidos
  de codicon que dividem desenho), nos codepoints `\e900`–`\e939`. Fonte:
  `data/product-icons.json` + `scripts/product-shapes-{a,b}.js`. Saída commitada e
  publicada: `themes/puelche-product-icons.json` + `themes/puelche-product.woff`.
  Cadeia SVG 16x16 → `svgicons2svgfont` → `svg2ttf` → `ttf2woff`.
- **Glifo de produto não é traçado à mão.** Fonte não tem traço: o
  `svgicons2svgfont` lê só geometria e descarta pintura, então `stroke` viraria
  glifo vazio e `fill="none"` viraria borrão. Por isso o desenho é declarado em
  primitivas (`line`, `arc`, `ring`, `dot`, `rect`, `fill`) e
  `scripts/stroke-outline.js` devolve o contorno preenchido — winding nonzero,
  aditivo horário, furo anti-horário no mesmo `d`. É o que dá ponta e junção
  redondas. O contrato do arquivo não mudou: `PRODUCT_SHAPES[id]` continua markup
  `<path d="..."/>`. Teto de **3 elementos visuais por glifo** — a 16px nada além
  disso lê. Travas do lint em `test/icons.test.js`: só `M L Q A Z` **maiúsculos**,
  só `<path>`, sem `transform`, sem subcaminho de área ~0, coordenadas em 0..16.
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
npm run preview                            # regenera images/preview.png do Marketplace
node scripts/contact-sheet.js <dir>        # folhas de contato dos ícones em 16/24/32px
node --check extension.js                  # sanity de sintaxe
npx --yes @vscode/vsce package --no-dependencies   # gera o .vsix
```

**Mexeu em ícone? Olhe o resultado a 16px reais.** É o tamanho em que o Explorer
desenha, e é o único juiz — uma folha de contato a 32px aprova desenho que vira
borrão na árvore. `contact-sheet.js` mostra os três tamanhos lado a lado; para
julgar legibilidade, renderize a 16 e amplie com `kernel: 'nearest'`, sem suavizar.

Publicar no Marketplace (`vsce publish`) exige o PAT do publisher `commenteme` —
é ação externa; não publique sem pedido explícito do usuário.

## Ao adicionar features

- Coloque a lógica testável em `lib/` (sem `vscode`) e registre o provider/comando
  em `activate()` via `context.subscriptions.push(...)`.
- Atualize `package.json` (`activationEvents`, `contributes.*`) sem remover o que
  já existe, `CHANGELOG.md`, `README.md`, e bump de versão (SemVer).
- Sem novas dependências de runtime: só a API `vscode` e `fs`/`path` do Node.
