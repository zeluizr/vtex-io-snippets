# Prompt — Landing page do "VTEX IO Store Framework Snippets"

> Prompt autossuficiente para enviar a outro projeto do Claude Code (ou Cursor/v0).
> Cole TODO o bloco entre as linhas `====`. Ele não depende de nenhum contexto externo.

====================================================================

# Tarefa
Construa uma **landing page de produto** completa, responsiva, acessível e com acabamento visual de produto real (não template genérico), para uma extensão do **VS Code** chamada **"VTEX IO Store Framework Snippets"**. A página apresenta o produto e ensina, passo a passo, como usá-lo.

# Stack obrigatório
- **React Router v7 em framework mode** (sucessor do Remix, com plugin Vite + SSR/SSG). Inicialize um projeto novo:
  ```bash
  npx create-react-router@latest vtex-snippets-landing
  cd vtex-snippets-landing
  ```
  Use **TypeScript**. As rotas ficam em `app/routes/`. A landing é a rota raiz. Defina `meta()` para SEO (title, description, canonical, Open Graph e Twitter card).
- **TailwindCSS** para todo o estilo (sem CSS-in-JS, sem UI kit pesado). Configure corretamente no React Router v7 (use a versão estável mais recente — Tailwind v4 com `@import "tailwindcss";` no CSS, ou v3 com config). Defina os tons da cor primária no tema.
- **Ícones:** `lucide-react`.
- **Fontes:** `Inter` (texto) e uma monoespaçada (`JetBrains Mono` ou `Fira Code`) nos blocos de código.
- **Syntax highlight** nos blocos de código: use `shiki` (preferível) ou `react-syntax-highlighter`, sempre com **botão "copiar" funcional**.
- (Opcional) `framer-motion` para microanimações sutis. Respeite `prefers-reduced-motion`.
- O site é estático: precisa rodar com `npm run dev` e buildar com `npm run build` sem erros.

# Sobre o produto (use estes fatos)
- **Nome (displayName):** VTEX IO Store Framework Snippets
- **O que é:** extensão do VS Code que acelera a escrita dos arquivos de tema do VTEX IO Store Framework (`store/blocks.json`, `store/blocks/*.jsonc`, `store/routes.json`, `store/contentSchemas.json`).
- **Proposta de valor:** autocomplete e IntelliSense para os blocos do VTEX IO, direto no editor.
- **Duas camadas de autocomplete:**
  1. **Snippets de blocos** — digite o nome do bloco e insira o bloco inteiro pronto, com placeholders navegáveis por Tab.
  2. **IntelliSense de props (via JSON Schema)** — dentro de um bloco, o editor sugere os **props válidos daquele bloco**, mostra as **opções (enums)** de cada campo, exibe **defaults/descrições** e **valida** os valores. Aplicado automaticamente aos arquivos de blocos, sem configuração.
- **Cobertura:** **286 blocos** nativos do Store Framework, extraídos de **55 apps** da documentação oficial VTEX, totalizando **~1088 props** documentados (com tipos, enums, defaults e descrições).
- **Identificador da extensão:** `commenteme.vtex-io-intellisense`
- **Publisher:** commente.me

# Links reais (use exatamente)
- **Marketplace:** `https://marketplace.visualstudio.com/items?itemName=commenteme.vtex-io-intellisense`
- **GitHub:** `https://github.com/zeluizr/vtex-io-snippets`
- **Instalar via CLI:** `code --install-extension commenteme.vtex-io-intellisense`
- **Badges (shields.io):**
  - Versão: `https://img.shields.io/visual-studio-marketplace/v/commenteme.vtex-io-intellisense?label=VS%20Marketplace&color=F71963`
  - Instalações: `https://img.shields.io/visual-studio-marketplace/i/commenteme.vtex-io-intellisense?color=F71963`
  - Rating: `https://img.shields.io/visual-studio-marketplace/r/commenteme.vtex-io-intellisense?color=F71963`

# Marca e design system
- **Cor primária (VTEX):** `#F71963` (rosa). Gere a escala 50–900 a partir dela no tema do Tailwind.
- **Tema escuro por padrão**, "developer-first": fundo quase preto (`#0B0B0F`/`#111118`), texto claro, acentos em rosa. Toggle dark/light é opcional (mantenha o dark impecável).
- **Logo/ícone:** glifo `</>` branco sobre quadrado rosa arredondado (recrie em SVG inline; é a identidade da extensão).
- **Estilo visual:** gradientes sutis rosa→roxo, glassmorphism leve nos cards, sombras suaves, cantos `rounded-2xl`, títulos grandes (`text-5xl`/`text-6xl` no hero), espaçamento generoso. Microanimações de entrada (fade/slide) discretas.
- **Responsivo** (mobile-first) e **acessível**: contraste AA, foco visível, landmarks semânticos, `alt` em imagens, navegação 100% por teclado, accordion do FAQ acessível (aria-expanded).

# Estrutura da página (nesta ordem)

## 1. Header / Nav (sticky, com leve blur ao rolar)
- Logo `</>` + texto "VTEX IO Snippets".
- Âncoras: Recursos, Instalação, Como usar, Cobertura, FAQ.
- Botão primário rosa **"Instalar no VS Code"** → Marketplace.
- Ícone do GitHub → repo.

## 2. Hero
- Headline grande: **"Autocomplete e IntelliSense para os blocos do VTEX IO"**.
- Subtítulo: "Escreva temas VTEX IO mais rápido — snippets dos blocos e autocomplete de props (com enums, defaults e validação) direto no VS Code."
- Dois CTAs: "Instalar no VS Code" (Marketplace) e "Ver no GitHub".
- Linha de badges (versão, instalações, rating, MIT).
- Faixa de números: **286 blocos** · **55 apps** · **~1088 props documentados**.
- Visual à direita/abaixo: um **mockup de editor estilo VS Code** (janela com barra de título, abas e números de linha) mostrando um arquivo `store/blocks/search.jsonc` com um **dropdown de autocomplete aberto** dentro de `"props": {` do bloco `filter-navigator.v3`, sugerindo props como `layout`, `openFiltersMode`, `initiallyCollapsed`, `maxItemsCategory`... Recrie em HTML/CSS estilizado (não precisa ser screenshot real).

## 3. Recursos — "Duas camadas de autocomplete"
Dois cards grandes:
1. **Snippets de blocos** — "Digite o nome do bloco e insira o bloco inteiro pronto, com placeholders navegáveis por Tab."
2. **IntelliSense de props (JSON Schema)** — "Dentro de um bloco, o editor sugere os props válidos daquele bloco, mostra as opções (enums) e valida os valores. Aplicado automaticamente aos arquivos de blocos."
Mais 4 cards menores com ícone: "Funciona em `.json` e `.jsonc`", "Sem configuração", "Baseado na documentação oficial VTEX", "286 blocos cobertos".

## 4. Instalação (dois blocos lado a lado)
- **Pelo Marketplace:** "Abra a aba Extensions do VS Code (`Cmd/Ctrl+Shift+X`), procure por **VTEX IO Store Framework Snippets** e clique em Install." + botão para o Marketplace.
- **Manual / via CLI:** bloco de código com botão copiar:
  ```bash
  code --install-extension commenteme.vtex-io-intellisense
  ```
  Nota: "Também é possível baixar o `.vsix` em Releases do GitHub e rodar `code --install-extension vtex-io-intellisense-*.vsix`."

## 5. Como usar (seção central — passo a passo)
**A) Inserir um bloco (snippets):**
- Texto: "Em qualquer arquivo `.json`/`.jsonc` do tema, digite o nome do bloco (ex.: `flex-layout.row`, `rich-text`, `product-summary.shelf`) ou o atalho curto `v-` (ex.: `v-flex-row`). Use **Tab** para navegar pelos placeholders."
- Mostre o resultado (bloco de código com highlight):
  ```jsonc
  "rich-text#hero": {
    "props": {
      "text": "Texto em **Markdown**",
      "textAlignment": "CENTER"
    }
  }
  ```

**B) Autocompletar props (IntelliSense):**
- Texto: "Dentro de `\"props\": { }` de um bloco, pressione `Ctrl+Espaço` e o editor lista os props daquele bloco com suas opções. Funciona em `store/blocks.json`, `store/blocks.jsonc` e `store/blocks/**/*.{json,jsonc}`."
- Mostre um dropdown simulado para `slider-layout` com props `itemsPerPage`, `infinite`, `showNavigationArrows` e o enum do último: `always | mobileOnly | desktopOnly | never`.

**C) Dica — autocomplete enquanto digita:**
- Texto: "Para as sugestões aparecerem enquanto você digita (e não só com `Ctrl+Espaço`), ative sugestões em strings no `settings.json`:"
  ```json
  {
    "[jsonc]": { "editor.quickSuggestions": { "strings": true } },
    "[json]":  { "editor.quickSuggestions": { "strings": true } }
  }
  ```
- Nota: "Garanta que os arquivos `.jsonc` estão no language mode **JSON with Comments**."

## 6. Cobertura
- Texto: "Blocos nativos do VTEX IO Store Framework cobertos por snippets + schema de props (286 blocos)."
- Grade de chips/tags por categoria:
  - **Layout:** flex-layout.row/col, slider-layout, responsive-layout, condition-layout, tab-layout, modal-layout, sticky-layout, stack-layout, disclosure-layout
  - **Conteúdo:** rich-text, image, info-card, call-to-action, newsletter
  - **Header/Footer:** header-layout, footer-layout, logo, search-bar, minicart.v2, login, menu, drawer
  - **PDP:** product-images, product-name, product-identifier, product-selling-price, product-list-price, product-installments, product-quantity, sku-selector, buy-button, product-description, product-specifications, share, breadcrumb
  - **Prateleira:** product-summary.shelf, product-summary-image/name/buy-button, shelf, add-to-cart-button, list-context.product-list
  - **Busca:** search-result-layout(.desktop/.mobile), gallery, filter-navigator.v3, order-by.v2, total-products.v2
- Nota em destaque: "O schema é tolerante — props não mapeados não geram erro, apenas não são sugeridos. Os dados de props vêm da documentação oficial VTEX."

## 7. FAQ (accordion acessível)
- "Funciona em Cursor/VSCodium?" → "A extensão está no VS Code Marketplace. Em editores baseados em Open VSX, instale via `.vsix` do GitHub Releases."
- "Preciso configurar algo?" → "Não. O JSON Schema é aplicado automaticamente aos arquivos de blocos do tema."
- "Como os props são definidos?" → "Por um JSON Schema embutido na extensão, gerado a partir da documentação oficial VTEX."
- "É open source?" → "Sim, MIT. Contribuições no GitHub."
- "Funciona com qualquer versão de tema?" → "Sim, é baseado nos arquivos de blocos do Store Framework; não altera nada no projeto."

## 8. CTA final + Footer
- Bloco grande com gradiente rosa: "Comece agora — instale e ganhe velocidade nos seus temas VTEX." + botão Marketplace.
- Footer: links (Marketplace, GitHub, Issues), licença MIT, "feito por commente.me".

# Entregáveis
- Projeto React Router v7 funcional (`npm run dev` e `npm run build` sem erros).
- Tailwind configurado, tema dark, totalmente responsivo e acessível.
- Componentização limpa: `Header`, `Hero`, `EditorMock`, `FeatureCard`, `InstallTabs`, `CodeBlock` (com copiar), `StepsHowTo`, `CoverageGrid`, `FAQ`, `CTA`, `Footer`.
- `meta()` da rota com SEO + Open Graph + Twitter card.
- Favicon/og-image coerentes com a marca (glifo `</>` rosa).
- Um `README.md` curto explicando como rodar e buildar.

# Critérios de qualidade
- Hierarquia visual clara, tipografia caprichada, espaçamentos consistentes.
- Code blocks legíveis com highlight e copiar funcionando de verdade.
- Acessibilidade real (teclado, contraste AA, aria nos accordions e botões).
- Performance: imagens otimizadas, sem libs desnecessárias, bom LCP no hero.

====================================================================
