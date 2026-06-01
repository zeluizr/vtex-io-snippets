<p align="center">
  <img src="images/icon.png" width="96" alt="VTEX IO Store Framework Snippets" />
</p>

<h1 align="center">VTEX IO Store Framework Snippets</h1>

<p align="center">
  Autocomplete e IntelliSense para os blocos do VTEX IO Store Framework.
</p>

<!-- Os badges abaixo passam a resolver após a primeira publicação no Marketplace -->
<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=commenteme.vtex-io-intellisense"><img src="https://img.shields.io/visual-studio-marketplace/v/commenteme.vtex-io-intellisense?label=VS%20Marketplace&color=F71963" alt="Marketplace" /></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=commenteme.vtex-io-intellisense"><img src="https://img.shields.io/visual-studio-marketplace/i/commenteme.vtex-io-intellisense?color=F71963" alt="Installs" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" />
</p>

---

Extensão do VS Code que acelera a escrita dos arquivos de tema VTEX IO (`store/blocks.json`, `store/blocks/*.jsonc`, `store/routes.json`, `store/contentSchemas.json`).

## O que ela faz

Duas camadas de autocomplete:

1. **Snippets de blocos** — digite o nome do bloco e insira o bloco inteiro pronto.
2. **IntelliSense de props (JSON Schema)** — dentro de um bloco, o editor sugere os **props válidos daquele bloco**, mostra as **opções (enums)** de cada campo e **valida** os valores. Aplicado automaticamente aos arquivos de blocos.

## Como usar

### Inserir um bloco (snippets)

Em qualquer arquivo `.json`/`.jsonc` do tema, digite o **nome do bloco** (ex.: `flex-layout.row`, `rich-text`, `product-summary.shelf`) ou o atalho curto `v-` (ex.: `v-flex-row`). Use **Tab** para navegar pelos placeholders.

### Autocompletar props (IntelliSense)

Dentro de `"props": { }` de um bloco, pressione `Ctrl+Espaço` e o editor lista os props daquele bloco com suas opções. Funciona em:

- `store/blocks.json` / `store/blocks.jsonc`
- `store/blocks/**/*.json` / `store/blocks/**/*.jsonc`

> Para o autocomplete aparecer **enquanto você digita** (e não só com `Ctrl+Espaço`), ative sugestões em strings no `settings.json`:
> ```json
> "[jsonc]": { "editor.quickSuggestions": { "strings": true } },
> "[json]":  { "editor.quickSuggestions": { "strings": true } }
> ```
> Garanta também que os `.jsonc` estão no language mode `JSON with Comments`.

## Instalação

- **Marketplace:** procure por **"VTEX IO Store Framework Snippets"** na aba Extensions do VS Code.
- **Manual (.vsix):** baixe o `.vsix` em [Releases](https://github.com/zeluizr/vtex-io-snippets/releases) e rode `code --install-extension vtex-io-intellisense-*.vsix`.

## Cobertura

Blocos nativos do VTEX IO Store Framework: layout (`flex-layout`, `slider-layout`, `responsive-layout`, `condition-layout`, `tab-layout`, `modal-layout`...), conteúdo (`rich-text`, `image`, `info-card`, `call-to-action`...), header/footer, PDP (`product-images`, `product-name`, preços, `sku-selector`, `buy-button`...), prateleira (`product-summary.*`, `shelf`, `add-to-cart-button`...), busca (`search-result-layout`, `gallery`, `filter-navigator.v3`, `order-by.v2`...) e mais.

> O schema é tolerante: props não mapeados não geram erro — apenas não são sugeridos. Os dados de props são extraídos da [documentação oficial VTEX](https://developers.vtex.com/docs/guides/vtex-io-documentation-store-framework).

## Contribuindo

O schema e os snippets são gerados a partir de `data/blocks.json` pelo script `scripts/generate-schema.js`. Para regenerar: `node scripts/generate-schema.js`.

## Licença

MIT
