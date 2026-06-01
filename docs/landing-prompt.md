# Prompt — Landing page do "VTEX IO Store Framework Snippets"

> Cole o bloco abaixo num builder de IA (Claude Code, Cursor, v0, etc.).
> Ele contém o stack, o design e TODA a documentação de uso do plugin.

---

Você é um engenheiro front-end sênior. Crie uma **landing page de produto** completa, responsiva e de alto padrão visual para uma extensão do VS Code chamada **"VTEX IO Store Framework Snippets"**. A página explica o que a extensão faz e ensina, passo a passo, como usá-la.

## Stack obrigatório

- **React Router v7 em framework mode** (o sucessor do Remix, com plugin Vite). Inicialize com:
  ```bash
  npx create-react-router@latest vtex-snippets-landing
  ```
  Use TypeScript. Estrutura de rotas em `app/routes/`. A landing é a rota raiz (`app/routes/_index.tsx` ou `app/routes/home.tsx` conforme o template). Defina `meta()` para SEO (title, description, og:image).
- **TailwindCSS** para todo o estilo (sem CSS-in-JS, sem bibliotecas de UI pesadas). Configure o Tailwind no projeto React Router v7 (PostCSS/Vite). Pode usar Tailwind v4 (`@import "tailwindcss";`) ou v3 — escolha a mais recente estável e configure corretamente.
- Sem backend. É um site estático/SSG. Garanta que builda com `npm run build` e roda com `npm run dev`.
- Ícones: use `lucide-react`. Fontes: `Inter` (texto) e uma mono (`JetBrains Mono` ou `Fira Code`) para blocos de código.

## Marca e design system

- **Cor primária (VTEX):** `#F71963` (rosa). Crie tons (50–900) a partir dela no `tailwind.config`.
- **Tema escuro por padrão**, elegante e "developer-first": fundo quase preto (`#0B0B0F`/`#111118`), texto claro, acentos em rosa. Ofereça toggle dark/light (opcional, mas mantenha o dark caprichado).
- **Logo/ícone:** um glifo `</>` branco sobre fundo rosa arredondado (mesma identidade da extensão). Pode recriar em SVG inline.
- Visual: gradientes sutis rosa→roxo, glassmorphism leve nos cards, sombras suaves, cantos arredondados (`rounded-2xl`), tipografia grande nos títulos (`text-5xl`/`text-6xl` no hero), bom espaçamento. Microanimações de entrada (fade/slide) com `framer-motion` OU transições CSS — sutis, sem exagero. Respeite `prefers-reduced-motion`.
- Code blocks com syntax highlight (use `shiki` ou `react-syntax-highlighter`) e um botão **"copiar"** funcional em cada bloco.
- Totalmente **responsivo** (mobile-first) e **acessível** (contraste AA, foco visível, landmarks, alt text, navegação por teclado).

## Links reais (use exatamente estes)

- Marketplace: `https://marketplace.visualstudio.com/items?itemName=integram.vtex-io-snippets`
- GitHub: `https://github.com/zeluizr/vtex-io-snippets`
- Identificador da extensão: `integram.vtex-io-snippets`

## Estrutura da página (seções, em ordem)

### 1. Header / Nav (sticky)
- Logo `</>` + nome "VTEX IO Snippets".
- Links âncora: Recursos, Instalação, Como usar, Cobertura, FAQ.
- Botão primário (rosa): **"Instalar no VS Code"** → link do Marketplace.
- Ícone do GitHub → repo.

### 2. Hero
- Headline grande: **"Autocomplete e IntelliSense para os blocos do VTEX IO"**.
- Subtítulo: "Escreva temas VTEX IO mais rápido — snippets dos blocos e autocomplete de props (com enums e validação) direto no VS Code."
- Dois CTAs: "Instalar no VS Code" (Marketplace) e "Ver no GitHub".
- Badges: versão do Marketplace, instalações, licença MIT (use shields.io apontando para `integram.vtex-io-snippets`).
- À direita/abaixo: um **mockup de editor** (janela estilo VS Code) mostrando um dropdown de autocomplete dentro de um `store/blocks.jsonc`, com props sendo sugeridos (ex.: `filter-navigator.v3` com `layout`, `openFiltersMode`...). Pode ser SVG/HTML estilizado simulando o editor.

### 3. Recursos (cards) — "Duas camadas de autocomplete"
Dois cards grandes:
1. **Snippets de blocos** — "Digite o nome do bloco e insira o bloco inteiro pronto, com placeholders navegáveis por Tab."
2. **IntelliSense de props (JSON Schema)** — "Dentro de um bloco, o editor sugere os props válidos daquele bloco, mostra as opções (enums) e valida os valores. Aplicado automaticamente aos arquivos de blocos."
Mais 3–4 cards menores: "Funciona em `.json` e `.jsonc`", "Sem configuração", "Baseado na doc oficial VTEX", "Cobre dezenas de blocos nativos".

### 4. Instalação
Tabs ou dois blocos:
- **Pelo Marketplace:** "Abra a aba Extensions do VS Code (`Cmd/Ctrl+Shift+X`), procure por **VTEX IO Store Framework Snippets** e clique em Install." (com botão para o Marketplace)
- **Manual (.vsix):** bloco de código:
  ```bash
  code --install-extension vtex-io-snippets-*.vsix
  ```
  com nota "baixe o .vsix em Releases do GitHub".

### 5. Como usar (a parte central — passo a passo)
Subseção **A) Inserir um bloco (snippets):**
- Texto: "Em qualquer arquivo `.json`/`.jsonc` do tema, digite o nome do bloco (ex.: `flex-layout.row`, `rich-text`, `product-summary.shelf`) ou o atalho curto `v-` (ex.: `v-flex-row`). Use **Tab** para navegar pelos placeholders."
- Mostre um before/after: digitar `rich-text` → snippet inserido:
  ```jsonc
  "rich-text#hero": {
    "props": {
      "text": "Texto em **Markdown**",
      "textAlignment": "CENTER"
    }
  }
  ```

Subseção **B) Autocompletar props (IntelliSense):**
- Texto: "Dentro de `\"props\": { }` de um bloco, pressione `Ctrl+Espaço` e o editor lista os props daquele bloco com suas opções. Funciona em `store/blocks.json`, `store/blocks.jsonc` e `store/blocks/**/*.{json,jsonc}`."
- Mostre o dropdown simulado com props de um bloco (ex.: `slider-layout` → `itemsPerPage`, `infinite`, `showNavigationArrows` com enum `always | mobileOnly | desktopOnly | never`).

Subseção **C) Dica — autocomplete enquanto digita:**
- Texto: "Para as sugestões aparecerem enquanto você digita (e não só com `Ctrl+Espaço`), ative sugestões em strings no `settings.json`:"
  ```json
  {
    "[jsonc]": { "editor.quickSuggestions": { "strings": true } },
    "[json]":  { "editor.quickSuggestions": { "strings": true } }
  }
  ```
- Nota: "Garanta que os arquivos `.jsonc` estão no language mode **JSON with Comments**."

### 6. Cobertura
- Texto: "Blocos nativos do VTEX IO Store Framework cobertos por snippets + schema de props."
- Grade de "chips"/tags com categorias e exemplos:
  - **Layout:** flex-layout.row/col, slider-layout, responsive-layout, condition-layout, tab-layout, modal-layout, sticky-layout, stack-layout
  - **Conteúdo:** rich-text, image, info-card, call-to-action, newsletter
  - **Header/Footer:** header-layout, footer-layout, logo, search-bar, minicart.v2, login, menu, drawer
  - **PDP:** product-images, product-name, product-identifier, product-selling-price, product-list-price, product-installments, product-quantity, sku-selector, buy-button, product-description, product-specifications, share, breadcrumb
  - **Prateleira:** product-summary.shelf, product-summary-image/name/buy-button, shelf, add-to-cart-button, list-context.product-list
  - **Busca:** search-result-layout(.desktop/.mobile), gallery, filter-navigator.v3, order-by.v2, total-products.v2
- Nota em destaque: "O schema é tolerante — props não mapeados não geram erro, apenas não são sugeridos. Os dados de props vêm da documentação oficial VTEX."

### 7. FAQ (accordion)
- "Funciona em Cursor/VSCodium?" → "A extensão está no VS Code Marketplace. Em editores baseados em Open VSX, instale via `.vsix` do GitHub Releases."
- "Preciso configurar algo?" → "Não. O schema é aplicado automaticamente aos arquivos de blocos do tema."
- "Onde os props são definidos?" → "Num JSON Schema embutido na extensão, gerado a partir da documentação oficial VTEX."
- "É open source?" → "Sim, MIT. Contribuições no GitHub."

### 8. CTA final + Footer
- Bloco grande com gradiente rosa: "Comece agora — instale e ganhe velocidade nos seus temas VTEX." + botão Marketplace.
- Footer: links (Marketplace, GitHub, Issues), licença MIT, "feito por Integram".

## Entregáveis
- Projeto React Router v7 funcional (`npm run dev` e `npm run build` sem erros).
- Tailwind configurado, dark theme, totalmente responsivo e acessível.
- Componentização limpa (`Header`, `Hero`, `FeatureCard`, `CodeBlock` com copiar, `EditorMock`, `CoverageGrid`, `FAQItem`, `CTA`, `Footer`).
- Code blocks com highlight e botão copiar funcionando.
- `meta()` da rota com SEO + Open Graph.
- README curto explicando como rodar.

Capriche no acabamento visual: a página deve parecer um produto real de desenvolvedor, não um template genérico.
