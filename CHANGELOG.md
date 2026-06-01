# Changelog

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
