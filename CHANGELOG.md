# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto sigue el [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

## [3.0.0] - 2026-08-21

### Añadido
- **Tema de color "Puelche"** (`themes/puelche-color-theme.json`). Oscuro y de baja
  saturación, hecho para sesiones largas: la identidad vive en el *chrome* de la
  interfaz, no en el resaltado de sintaxis. La regla de fondo es **colorear por papel,
  no por lenguaje**: hay 9 papeles semánticos y todos los lenguajes se mapean sobre
  esos mismos 9, así que una etiqueta HTML, un componente JSX, un selector de elemento
  CSS, un decorador de Python, un atributo de Prisma, una directiva de GraphQL y un
  título de Markdown reciben el mismo color, porque todos son "estructura con nombre".
  Un tema que colorea por lenguaje obliga a reaprender el mapa en cada archivo; éste
  se aprende una vez.
- **Decisiones de legibilidad del tema.** Los comentarios **no** se apagan: quedan en
  5.85:1 de contraste, por encima del mínimo de accesibilidad, porque un comentario
  que no se lee es un comentario que no se escribe. El cuerpo de texto de Markdown se
  queda **sin color**, para que un README siga leyéndose como prosa y no como código.
  La cursiva sustituye a los colores extra (comentarios, parámetros, `self`/`cls`,
  atributos HTML/JSX, `import`/`from`, blockquote), en vez de gastar un color nuevo en
  cada matiz. Y el color de acento sólo aparece en el chrome (cursor, pestaña activa,
  badge), **nunca** en texto de código.
- **Iconos de archivo y carpeta** (`themes/puelche-icon-theme.json`): 72 dibujos
  propios, monoline y coloreados con el mismo esquema de papeles del tema. Lo que los
  diferencia de un pack genérico es que cubren la estructura real de una app de
  **VTEX IO**: icono propio para las carpetas `store`, `react`, `node`, `graphql`,
  `messages`, `pixel`, `admin` y `styles`, y para los archivos `manifest.json`,
  `routes.json`, `blocks.json`, `interfaces.json` y `.vtexignore`. En total, ~80
  extensiones, ~62 nombres de archivo y 26 `languageIds`.
- **Product icon theme**: sustituye parte de los iconos de la propia interfaz de VS Code
  (barra de actividad, explorador, pestañas, barra de estado) por un conjunto propio.
  La cobertura es parcial **a propósito**: lo que no está cubierto se queda con el
  codicon nativo, que siempre será mejor que un dibujo forzado.
- **`test/theme.test.js`.** La especificación del tema está llena de reglas que sólo
  fallan "visualmente" (un hex inventado, el acento colándose en texto, un párrafo de
  Markdown coloreado), así que cada criterio de aceptación es una aserción: ningún hex
  fuera de la paleta declarada, acento sólo en las 11 claves de chrome, los 9 papeles
  por encima de 4.5:1 sobre el fondo del editor y el cuerpo de Markdown sin color.

### Cambiado
- **La extensión pasa a llamarse "inmmerce for VTEX"** (antes «VTEX IO Store Framework
  Snippets»). Dejó de ser sólo una extensión de lenguaje para ser un paquete de
  identidad completo: tema, iconos, snippets e IntelliSense. La descripción pasa a
  "Tema, snippets e IntelliSense para quem constrói na VTEX" y se añade la categoría
  `Themes`. El id de publicación (`commenteme.vtex-io-intellisense`) **no cambia**:
  quien ya la tiene instalada recibe la actualización sin hacer nada.

### Corregido
- **El `.vsix` publicado incluía archivos locales.** `AGENTS.md`, `.guilda/`,
  `.DS_Store` y `package-lock.json` viajaban dentro del paquete; ahora están en
  `.vscodeignore`. Sólo engordaban la descarga y filtraban notas de trabajo.

## [2.4.0] - 2026-08-01

### Cambiado
- **`assets/tokens.json` por defecto** actualizado con el design system "pixel"
  (escala de tipos, spacing, sizes, opacidad, escala alpha `--black-*`/`--white-*`
  y los grupos semánticos completos de `background`/`text`/`border`/`on` con sus
  variantes `hover-`/`active-`). Es el fallback que alimenta el autocompletado de
  `var(--...)` cuando el workspace no trae su propio `tokens.json`.

### Añadido
- Snippets de los bloques `container` y `department-carousel`.

### Nota
- Sólo se incluyó lo que `generateTokens()` sabe derivar. Familias sin regla de
  nombre en el generador **no** están en el fallback: `--spacing-negative`,
  `--*-full`, `--height-mini`, `--max-height-*`, tipografía (`--heading-N-*`,
  `--font-family-*`, `--letter-spacing`). Viven en el `:root` del app pixel
  instalado, pero no se autocompletan desde el JSON embebido.

## [2.3.0] - 2026-07-31

### Añadido
- **Autocompletado de CSS custom properties de VTEX Style.** Un
  `CompletionItemProvider` para `css`, `scss`, `less` y `postcss` (disparadores
  `-` y `(`) sugiere las variables que VTEX expone en runtime a partir del JSON
  de tokens (`var(--emphasis)`, `var(--spacing-2)`...). Si el cursor ya está
  dentro de `var(` inserta sólo el nombre; si no, `var(--nombre)`. Las variables
  de color usan `CompletionItemKind.Color` (muestran el swatch).
- **Generador de tokens puro y testeado (`lib/tokens.js`).** Convierte el JSON
  nativo de VTEX Style en `{ name, value, isColor }` con los nombres 1:1 de la
  plataforma (`typeScale` → `--type-scale-N`, `opacity` → `--opacity-90`,
  `semanticColors` → `--{grupo}-{clave}`...). Cubierto por `test/tokens.test.js`.
- **Carga con prioridad + recarga en caliente.** Busca `styles/configs/tokens.json`
  y luego `tokens.json` en la raíz del workspace, y cae a un `assets/tokens.json`
  embebido. Un `FileSystemWatcher` sobre `**/tokens.json` recarga en cambios; un
  parse inválido no tumba la extensión ni borra los tokens anteriores.
- **Comando "VTEX: Gerar tokens.css".** Reusa el mismo generador para exportar un
  `:root { ... }` con todas las variables, junto al JSON de origen.

## [2.2.4] - 2026-07-26

### Corregido
- **Los bloques se sugerían dentro de `props`.** Los 385 bloques se declaraban con
  `contributes.snippets`, y una contribución estática de snippet no conoce el contexto:
  VS Code la ofrece en cualquier punto del archivo. Al escribir dentro de
  `"props": { ... }` aparecía el catálogo entero, donde sólo caben propiedades.
  No hay forma de filtrar una contribución estática, así que los bloques pasaron a
  servirse desde un `CompletionItemProvider` que analiza la posición del cursor en el
  JSON (`lib/context.js`).

### Cambiado
- Las sugerencias ahora dependen de dónde está el cursor:
  - raíz del archivo → snippet del bloque completo;
  - `children` / `blocks` / `before` / `after` / `around` → ids de bloques **ya definidos**
    en el tema, tomados del índice del workspace;
  - `props` y cualquier otro sitio → nada, manda el JSON Schema.
- Sólo se sugiere en archivos de tema (bajo `store/`), no en cualquier `.json` abierto.
- Se retira `editor.tabCompletion` de `configurationDefaults`: sin contribución estática
  de snippets ya no tenía efecto. Se mantienen las sugerencias dentro de strings.

## [2.2.3] - 2026-07-26

### Corregido
- Los snippets no se expandían al pulsar `Tab`: VS Code trae `editor.tabCompletion`
  en `"off"` por defecto, así que el prefijo nunca se expandía. La extensión ahora
  aporta `configurationDefaults` para `json` y `jsonc` con `editor.tabCompletion`
  en `"onlySnippets"`, sugerencias dentro de strings y
  `editor.suggest.snippetsPreventQuickSuggestions` desactivado. Al ser *defaults*,
  la configuración del usuario sigue teniendo prioridad.
- El paquete `.vsix` incluía la carpeta local `.claude/`; ahora está en `.vscodeignore`.

### Añadido
- Sección de solución de problemas en el README, con la nota de que macOS se queda
  con `Ctrl + Espacio` para cambiar la fuente de entrada y nunca llega a VS Code.
- Estandarización del README (badges de badgen, contenido en español).
- Archivo `LICENSE` (MIT) y este `CHANGELOG`.

## [2.2.2] - 2026-06-04

### Añadido
- Versión inicial del proyecto.
