# Changelog

## 2.2.1

- **GIF de demonstração** atualizado com 3 cenas (em espanhol): autocomplete aninhado (`slider-layout > itemsPerPage`), navegação entre blocos (Go to Definition/hover) e cobertura do blog. Gerado por `scripts/make-demo.js`.
- **README** ampliado: tabela de capacidades, seção de props anidadas, instruções de testes (`node --test`) e legenda do GIF.

## 2.2.0

- **Cobertura do blog** (`vtex.blog-interfaces`, +15 blocos): `blog-all-posts`, `blog-latest-posts-preview`, `blog-category-preview`/`-list`, `blog-post-container`/`-details`, `blog-post-navigation`, `blog-page-details`, `blog-search`/`-list`, `search-blog-articles-preview`/`-list`, `blog-related-products`/`-posts`, `blog-breadcrumb` — props extraídas da doc oficial (`vtex.wordpress-integration`). Cobertura global **93% → 97%** (381/393). Blog removido da lista de gaps aceitos.
- **Autocomplete aninhado** ampliado de 5 para 14 blocos via `PROP_OVERRIDES`: `product-summary-image` (`hoverImage`, `aspectRatio`/`maxHeight`/`width`/`height` responsivos), `search-result-layout(.desktop/.mobile)` + `search-not-found-layout` (`hiddenFacets`, `mobileLayout`), `menu` (`items`), `product-installments(-list)` (`installmentOptionsFilter`, `markers`, `installmentsToShow`), `share` (`social`, `options`), `order-by.v2` (`hiddenOptions`, `specificationOptions`), `product-specifications` (`visible/hiddenSpecifications`). Props injetadas em runtime (`classes`, `render`, `intl`…) ficam de fora de propósito.
- **Suíte de testes** (`node --test`): lógica pura de navegação extraída para `lib/blocks.js` (sem `vscode`), com testes de def×ref, chaves estruturais, exclusão de URLs e filtro de arquivos de tema; `test/schema.test.js` trava regressão dos overrides e exige geração determinística. Novo workflow CI `.github/workflows/test.yml`.

## 2.1.6

- **Autocomplete/validação de props (JSON Schema) agora também em `store/home.jsonc`** e qualquer `*.jsonc` sob `store/**` (antes só `blocks.json`/`blocks.jsonc` e `store/blocks/**`). Os `.json` continuam restritos a `store/blocks/**`, de propósito, para não aplicar o schema de blocos em `interfaces.json`/`routes.json` (que são `.json` e o `jsonValidation` não tem exclude).

## 2.1.5

- **Navegação entre blocos agora cobre todo o `store/**`** (não só `store/blocks/**`): inclui `store/home.jsonc`, `store/blocks.jsonc`, subpastas e blocos definidos fora de `store/blocks/`. Arquivos que não declaram blocos (`interfaces.json`, `routes.json`, `manifest.json`, `widgets.json`, `content-types.json`, `content-schemas.json`, `sender.json`, `plugins.json`) são ignorados na indexação para não gerar definições falsas.

## 2.1.4

- **Navegação entre blocos** (a extensão agora tem runtime — `extension.js`):
  - **Go to Definition** (Cmd/Ctrl+clique): de uma referência de bloco em `children`/`blocks`/`before`/`after`/`around` pula para onde o bloco está definido (`"id": { … }`), mesmo em outro arquivo de `store/blocks/**`.
  - **Find All References**: lista todos os usos de um bloco no tema.
  - **Hover**: mostra em qual arquivo:linha o bloco está definido e quantas referências existem.
  - Indexação dos arquivos `store/blocks/**/*.{json,jsonc}` cacheada e invalidada via `FileSystemWatcher` + edições abertas. Sem dependências de runtime (usa só a API `vscode`).

## 2.1.3

- **Autocomplete aninhado** em props que são objetos/arrays:
  - `images` (`list-context.image-list`, `image-list`) → array de objetos com `image`, `mobileImage`, `description`, `link`, `loading`, etc.
  - `link` (`image`, `image-new` e itens de `images`) → `url`, `noFollow`, `openNewTab`, `title`.
  - `slider-layout` → `itemsPerPage` (`desktop`/`tablet`/`phone`), `autoplay` (`timeout`/`stopOnHover`) e `slideTransition` (`speed`/`delay`/`timing`).
  - Implementado via mapa `PROP_OVERRIDES` curado em `scripts/generate-schema.js`, sem `additionalProperties: false` para não marcar campos extras como erro.

## 2.1.2

- Adicionado **GIF de demonstração** do autocomplete no README (mockup estilo VS Code do dropdown de props, navegação e inserção de enum). Gerado por `scripts/make-demo.js`.

## 2.1.1

- **Correção de falsos erros de validação**: tipos derivados da doc não são 100% confiáveis (ex.: `aspectRatio` `"1:1"` tipado como object). Agora só **enums** e **booleanos** são validados estritamente; demais escalares mantêm autocomplete de nome + descrição + default, sem marcar valores válidos como erro.
- README reescrito em espanhol com o panorama completo do projeto.

## 2.1.0

- **Fechamento de gaps de cobertura**: auditoria determinística contra o `store/interfaces.json` de cada app (ground-truth) elevou a cobertura de **71% → 93%** dos blocos nativos exigidos (366/393).
- **+85 blocos** novos, incluindo apps antes ausentes: `product-details`, `product-gifts`, `product-highlights`, `overlay-layout`, `store-video`, `product-bookmark`, `reviews-and-ratings` (`.vtex`), `delivery-promise-components`, `shipping-option-components`, `modal`, `shop-review-interfaces`.
- **Templates de página** reincluídos: `store.home`, `store.product`, `store.search`, `store.custom`, `store.account`, etc.
- Blocos faltantes em apps já cobertos: `store-components` (autocomplete-result-list, product-separator, user-address, product-services, notification…), `store-header`, `store-footer`, `menu`, `store-image`, `product-summary`.
- **Correção:** `product-specification-value` → `product-specification-values` (nome correto).
- Ferramentas novas no repo: `scripts/check-coverage.js` (auditoria) e `docs/coverage-report.md`.
- Fora de escopo (intencional): blog (`vtex.blog-interfaces`), `sandbox`, `pwa-components` e versões legadas `filter-navigator.v1/v2`/`order-by`/`total-products`.

## 2.0.0

- **Cobertura completa**: schema + snippets gerados automaticamente a partir da documentação oficial VTEX, cobrindo **286 blocos** (~1088 props) de 55 apps do Store Framework.
- Props com **tipos, enums, defaults e descrições** extraídos da doc — IntelliSense rico dentro de cada bloco.
- Conteúdo gerado de forma determinística por `scripts/generate-schema.js` a partir de `data/blocks.json`.
- Snippets e schema agora unificados e versionáveis (regeneráveis a qualquer momento).

## 1.2.0

- Ampliação do schema com os blocos usados no tema `construplaza-theme`:
  `list-context.image-list`, `list-context.product-list`, `shelf`/`shelf.*` (vtex.shelf),
  `product-specification-group`, `product-specification-text/values`, `product-specification-badges`,
  `login-content`, `category-menu`, `carousel`, `newsletter` (+ `newsletter-input-email`, `newsletter-submit`),
  `stack-layout`, `modal-trigger`, `modal-layout`, `product-summary.shelf`.
- 55 grupos de blocos cobertos no total.

## 1.1.0

- **IntelliSense de props** via JSON Schema (`contributes.jsonValidation`): dentro de cada bloco, o editor agora sugere os props válidos, mostra as **opções (enums)** dos campos e valida os valores — automaticamente, sem precisar configurar `settings.json` do tema.
- Schema aplicado a `store/blocks.json`, `store/blocks.jsonc` e `store/blocks/**/*.{json,jsonc}`.
- Cobertura de props: flex-layout, slider-layout, rich-text, image, info-card, call-to-action, product-images/name/price/quantity, sku-selector, buy-button/add-to-cart-button, product-summary-*, search-result-layout, gallery, filter-navigator.v3, order-by.v2, total-products.v2, logo, search-bar, minicart.v2, login, menu/menu-item, drawer, breadcrumb, share, sticky-layout, condition-layout e mais.
- Correção: snippet `order-by.v2` agora usa `showOrderTitle`.

## 1.0.0

- Versão inicial.
- 73 snippets cobrindo os blocos nativos do VTEX IO Store Framework:
  - Templates de página (`store.home`, `store.product`, `store.search`, `store.custom`...)
  - Rotas (`store/routes.json`)
  - Layout (`flex-layout`, `responsive-layout`, `slider-layout`, `list-context`, `sticky-layout`, `condition-layout`, `tab-layout`, `disclosure-layout`, `modal-layout`)
  - Conteúdo (`rich-text`, `image`, `info-card`, `call-to-action`, `newsletter`)
  - Header/navegação (`header-layout`, `logo`, `search-bar`, `minicart.v2`, `login`, `menu`, `drawer`)
  - Footer (`footer-layout`)
  - PDP (`product-images`, `product-name`, `product-price`, `sku-selector`, `buy-button`, `product-quantity`, `product-specifications`...)
  - Prateleira/summary (`product-summary.shelf`, `product-summary-*`, `add-to-cart-button`...)
  - Busca/SRP (`search-result-layout`, `gallery`, `filter-navigator.v3`, `order-by.v2`, `total-products.v2`...)
  - Avaliações (`product-rating-*`, `product-reviews`)
  - Utilitários (`contentSchemas`, valor responsivo)
