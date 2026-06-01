# Relatório de cobertura — blocos nativos VTEX Store Framework

> Ground-truth: `store/interfaces.json` de cada app (raw GitHub vtex-apps). Diff determinístico contra `data/blocks.json`.

## Resumo

| Métrica | Valor |
|---|---|
| Apps analisados (com interfaces.json) | **65** |
| Blocos exigidos (sem deprecados/contexto) | **393** |
| Blocos exigidos cobertos | **366** |
| **Cobertura global** | **93%** |
| Blocos faltantes | 27 |
| Apps totalmente ausentes | 3 |
| Blocos órfãos (temos mas não existem) | 2 |
| Deprecados (não exigidos) | 6 |
| Contexto/sem-UI (não exigidos) | 6 |
| Abstratos/internos (unstable--, __fold__, wrappers) | 30 |

## ⚠️ Apps totalmente ausentes (shipam blocos, 0% cobertos)

- **vtex.blog-interfaces** (15 blocos): blog-all-posts, blog-latest-posts-preview, blog-category-preview, blog-category-list, blog-post-container, blog-post-details, blog-post-navigation, blog-page-details, blog-search, search-blog-articles-preview, search-blog-articles-list, blog-search-list, blog-related-products, blog-related-posts, blog-breadcrumb
- **vtex.pwa-components** (2 blocos): promotion-banner, offline-warning
- **vtex.sandbox** (3 blocos): sandbox, sandbox.product, sandbox.order

## Cobertura por app

| App | Cobertos / Exigidos | % | Faltantes |
|---|---|---|---|
| vtex.blog-interfaces | 0/15 | 0% | blog-all-posts, blog-latest-posts-preview, blog-category-preview, blog-category-list, blog-post-container, blog-post-details, blog-post-navigation, blog-page-details, blog-search, search-blog-articles-preview, search-blog-articles-list, blog-search-list, blog-related-products, blog-related-posts, blog-breadcrumb |
| vtex.pwa-components | 0/2 | 0% | promotion-banner, offline-warning |
| vtex.sandbox | 0/3 | 0% | sandbox, sandbox.product, sandbox.order |
| vtex.search-result | 22/27 | 81% | filter-navigator, filter-navigator.v1, filter-navigator.v2, order-by, total-products |
| vtex.seller-selector | 12/13 | 92% | store.product.sellertest |
| vtex.store | 12/13 | 92% | store.offline |
| vtex.add-to-cart-button | 1/1 | 100% | — |
| vtex.breadcrumb | 3/3 | 100% | — |
| vtex.carousel | 0/0 | 100% | — |
| vtex.category-menu | 0/0 | 100% | — |
| vtex.checkout-summary | 5/5 | 100% | — |
| vtex.condition-layout | 5/5 | 100% | — |
| vtex.delivery-promise-components | 4/4 | 100% | — |
| vtex.device-detector | 0/0 | 100% | — |
| vtex.disclosure-layout | 6/6 | 100% | — |
| vtex.flex-layout | 3/3 | 100% | — |
| vtex.iframe | 2/2 | 100% | — |
| vtex.list-context | 2/2 | 100% | — |
| vtex.locale-switcher | 1/1 | 100% | — |
| vtex.menu | 6/6 | 100% | — |
| vtex.minicart | 7/7 | 100% | — |
| vtex.modal | 1/1 | 100% | — |
| vtex.modal-layout | 6/6 | 100% | — |
| vtex.my-account | 12/12 | 100% | — |
| vtex.order-placed | 23/23 | 100% | — |
| vtex.overlay-layout | 2/2 | 100% | — |
| vtex.pixel-interfaces | 0/0 | 100% | — |
| vtex.product-availability | 1/1 | 100% | — |
| vtex.product-bookmark-interfaces | 1/1 | 100% | — |
| vtex.product-customizer | 9/9 | 100% | — |
| vtex.product-details | 4/4 | 100% | — |
| vtex.product-gifts | 6/6 | 100% | — |
| vtex.product-highlights | 3/3 | 100% | — |
| vtex.product-identifier | 3/3 | 100% | — |
| vtex.product-kit | 1/1 | 100% | — |
| vtex.product-list | 14/14 | 100% | — |
| vtex.product-price | 12/12 | 100% | — |
| vtex.product-quantity | 2/2 | 100% | — |
| vtex.product-review-interfaces | 5/5 | 100% | — |
| vtex.product-specification-badges | 1/1 | 100% | — |
| vtex.product-specifications | 4/4 | 100% | — |
| vtex.product-summary | 19/19 | 100% | — |
| vtex.responsive-layout | 5/5 | 100% | — |
| vtex.reviews-and-ratings | 3/3 | 100% | — |
| vtex.rich-text | 1/1 | 100% | — |
| vtex.search | 4/4 | 100% | — |
| vtex.shelf | 2/2 | 100% | — |
| vtex.shipping-option-components | 2/2 | 100% | — |
| vtex.shop-review-interfaces | 3/3 | 100% | — |
| vtex.slider-layout | 2/2 | 100% | — |
| vtex.stack-layout | 1/1 | 100% | — |
| vtex.sticky-layout | 2/2 | 100% | — |
| vtex.store-components | 25/25 | 100% | — |
| vtex.store-drawer | 4/4 | 100% | — |
| vtex.store-footer | 9/9 | 100% | — |
| vtex.store-form | 11/11 | 100% | — |
| vtex.store-header | 11/11 | 100% | — |
| vtex.store-icons | 34/34 | 100% | — |
| vtex.store-image | 4/4 | 100% | — |
| vtex.store-link | 2/2 | 100% | — |
| vtex.store-newsletter | 7/7 | 100% | — |
| vtex.store-video | 1/1 | 100% | — |
| vtex.tab-layout | 6/6 | 100% | — |
| vtex.telemarketing | 1/1 | 100% | — |
| vtex.wish-list | 6/6 | 100% | — |

## 🔎 Blocos órfãos (na nossa base, ausentes em todo interfaces.json)

Possível rename, bloco deprecado/removido, ou erro de extração por doc. Revisar:

- `login`
- `login-content`

> Nota: `login`/`login-content` podem ser **falsos órfãos** — o `vtex.login` não expôs `store/interfaces.json` em master/main, então seus blocos não entraram no ground-truth.

## Deprecados / Contexto (listados à parte, não exigidos)

- **vtex.seller-selector** — contexto: store.sellers
- **vtex.store** — contexto: store.product, store.search, store.content
- **vtex.carousel** — deprecados: carousel; 
- **vtex.category-menu** — deprecados: category-menu; 
- **vtex.pixel-interfaces** — contexto: pixel, pixels
- **vtex.product-list** — deprecados: price; 
- **vtex.shelf** — deprecados: shelf; 
- **vtex.store-components** — deprecados: product-price, newsletter; 

## Apps verificados sem `store/interfaces.json` (não shipam blocos de storefront)

`vtex.address-form`, `vtex.apps-graphql`, `vtex.channels-components`, `vtex.checkout-graphql`, `vtex.checkout-resources`, `vtex.country-codes`, `vtex.coupon`, `vtex.css-handles`, `vtex.file-manager`, `vtex.file-manager-graphql`, `vtex.format-currency`, `vtex.formatted-price`, `vtex.login`, `vtex.my-account-commons`, `vtex.my-cards`, `vtex.my-orders-app`, `vtex.native-types`, `vtex.on-view`, `vtex.open-graph`, `vtex.order-coupon`, `vtex.order-details`, `vtex.order-items`, `vtex.order-manager`, `vtex.order-placed-graphql`, `vtex.order-shipping`, `vtex.paginated-table`, `vtex.pixel-manager`, `vtex.product-context`, `vtex.product-list-context`, `vtex.product-summary-context`, `vtex.profile-form`, `vtex.pwa-graphql`, `vtex.react-portal`, `vtex.render-runtime`, `vtex.responsive-values`, `vtex.search-graphql`, `vtex.search-page-context`, `vtex.search-resolver`, `vtex.session-client`, `vtex.shipping-estimate-translator`, `vtex.slider`, `vtex.store-graphql`, `vtex.store-indexer`, `vtex.store-resources`, `vtex.store-session`, `vtex.store-theme`, `vtex.structured-data`, `vtex.styleguide`, `vtex.tenant-graphql`, `vtex.tester-hub`, `vtex.totalizer-translator`, `vtex.use-svg`

---
_Gerado por `scripts/check-coverage.js`. Caveats: branch master/main; `master` reflete o major mais recente; interfaces.json pode conter blocos abstratos._
