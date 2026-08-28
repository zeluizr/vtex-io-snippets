# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto sigue el [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

## [3.2.1] - 2026-08-28

### Añadido
- Icono para `landing` (y `campaign`, `promo`), que en un tema de VTEX vive en
  `store/blocks/` junto a `home`, `product` y `search` y era la única de esas carpetas que
  seguía cayendo en el icono genérico. Lleva un megáfono: el dibujo "correcto" habría sido
  un *wireframe*, pero en esa misma lista ya viven `header`, `footer`, `templates` y
  `schemas`, todas marco-con-líneas —a 16px reales sería la quinta mancha rectangular
  seguida—. La cuña del megáfono es la única silueta asimétrica libre del conjunto.
- `.DS_Store`, `Thumbs.db` y `desktop.ini` dejan de caer en el icono de archivo genérico.

## [3.2.0] - 2026-08-28

### Añadido
- **Cobertura completa de la estructura VTEX IO.** `checkout-ui-custom` no tenía icono y
  caía en la carpeta genérica; ahora lo tiene, y con él todos los builders que faltaban:
  `sitemap`, `masterdata` y `configuration`. Dentro del tema entran `store/blocks` —que
  antes compartía icono con `components`, aunque un bloque de VTEX no sea un componente de
  React—, `store/templates` y `styles/iconpacks`. Y las páginas de la tienda, que son donde
  un tema pasa el día: `home`, `product`, `search`, `header`, `footer`, `cart` y `account`.
  Son **112 nombres de carpeta**, frente a 79.
- La carpeta `store` pasa a llevar la **marca de VTEX**, la misma que `manifest.json`: es el
  builder de la tienda, y la etiqueta de precio que tenía antes decía menos que la marca.
  Esa etiqueta no se tiró: ahora es el icono de `product`, que es lo que siempre dibujó.
- `style.json` —el archivo de tokens del VTEX Style que esta misma extensión lee para
  autocompletar `var(--...)`— tiene icono propio en vez de caer en el `.json` genérico.

- **Marcas de terceros por nombre de archivo.** `CLAUDE.md` y `AGENTS.md` llevan el
  *sunburst* de Claude aunque sean `.md` —manda `fileNames`, que en VS Code gana a la
  extensión—, y lo mismo la carpeta `.claude`. Con ellos entran npm (`package.json`,
  `package-lock.json`, `.npmrc`), yarn (`yarn.lock`, `.yarnrc`), Prettier
  (`.prettierrc*`, `.prettierignore`), ESLint (`.eslintrc*`, `.eslintignore`), Docker
  (`Dockerfile`, `docker-compose`, `.dockerignore`), Git (`.gitignore`,
  `.gitattributes`), GitHub (carpeta `.github`) y VTEX (`manifest.json`, `vtex.json`,
  `.vtexignore`). Son **109 iconos** y **74 nombres de archivo**.
- Estas marcas son **sólidas**, no trazadas: es la segunda excepción de la
  especificación de dibujo. Un *sunburst* o un logotipo en monoline a los ~8px reales
  del explorador se convierte en telaraña; la mancha sobrevive. Y **no son el asset
  oficial**: son interpretaciones redibujadas para ese tamaño —ocho rayos en vez de
  once, la ballena de Docker sin cola ni ojo, el rombo de Git con una diagonal y un
  nodo en vez de tres—. Donde no hay símbolo oficial que sobreviva, no se inventa uno:
  `.editorconfig` se queda con el pictograma genérico.

## [3.1.0] - 2026-08-28

### Cambiado
- **Los iconos de archivo y carpeta pasan de *monoline* a silueta sólida.** Cada icono
  son ahora **dos capas**: una silueta rellena con el color del papel semántico —la
  carpeta, o la hoja de papel— y encima la marca de lo que contiene, trazada en un tono
  oscuro del mismo color. El motivo es el tamaño en el que el icono se dibuja de verdad:
  en el explorador son 16px, y ahí un trazo de 1.33px se disuelve sobre el fondo oscuro
  mientras que una mancha sólida se lee de inmediato. La carpeta trazada con una marca
  trazada dentro era una malla de líneas finas en la que `dist`, `docs` y `scripts` no se
  distinguían.
- **El tono oscuro es derivado, no elegido**: cada papel mezclado al **60%** con el fondo
  del editor (`#1A181F`), en el nuevo bloque `rolesDeep` de `data/icons.json`. El
  generador rechaza cualquier valor que no sea exactamente esa mezcla, y el contraste
  entre silueta y marca queda registrado en los tests —el peor caso es `punct`, a
  2.67:1—. La paleta de 9 papeles **no cambia**.
- **La carpeta abierta** ya no es un contorno: es la pared de atrás en el tono oscuro más
  la solapa delantera en el color del papel. Dos manchas del mismo color no se leen como
  carpeta abierta; lo que las separa es el tono.
- **Las marcas se simplificaron para los ~8px en los que se dibujan.** `javascript`,
  `typescript` e `image` perdieron su marco de 19×19 y `doc` y `markdown` su hoja —el
  marco es ahora la propia silueta, y hoja dentro de hoja no se lee—. El engranaje de
  seis dientes pasó a ser un par de deslizadores, el átomo de React a una sola órbita, y
  `branch`, `graph`, `container` y `list` bajaron de cuatro o cinco elementos a dos. El
  techo de **3 elementos por marca** es ahora una aserción del CI.
- **Los iconos ocupan más caja.** La silueta rellena va de 1 a 23 de la rejilla, que es
  exactamente hasta donde llegaba la tinta del contorno trazado (trazo de 2 centrado en la
  caja de contenido 2..22). La marca creció en la misma proporción, así que en el
  explorador el conjunto se lee más grande sin cambiar el equilibrio entre silueta y marca.
- `readme` pasó del libro abierto al libro cerrado con lomo: tres verticales casi iguales
  se leían como "|||" sobre la hoja. Los nodos de `graphql` subieron a radio 2.6, que es el
  mínimo para que un círculo sobreviva a 16px.
- `docs/traco-puelche.md`, la especificación de dibujo, se reescribió alrededor de las dos
  capas. El *product icon theme* **no cambia**: sigue siendo monoline, porque una fuente
  no puede llevar dos colores.

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
- **Product icon theme "Puelche"** (`contributes.productIconThemes`, id `puelche-product`):
  reemplaza los iconos de la propia interfaz de VS Code por un conjunto propio. Son **58
  glifos** dibujados a mano, servidos como **93 entradas** de `iconDefinitions` —35 de
  ellas alias de codicons que comparten dibujo— sobre 58 codepoints, de `\e900` a `\e939`,
  empaquetados en `themes/puelche-product.woff` (5.616 bytes). La fuente usa `unitsPerEm`
  1000 con `ascender` 1000 y `descender` 0, **la misma razón 1.0 del codicon nativo**: así
  los glifos propios y los que se quedan sin cubrir comparten línea base y no bailan entre
  sí en la misma barra. Cubre la barra de actividad, el layout y la barra de título, la
  barra de estado, el árbol del explorador, pestañas y editor, paneles, acciones comunes y
  feedback. La cobertura es parcial **a propósito**: lo que no está cubierto se queda con
  el codicon nativo, que siempre será mejor que un dibujo forzado.
- **La fuente de iconos se construye de forma determinista**: mismo sha256 en ejecuciones
  repetidas (`svg2ttf` con `ts` fijo). Así el `.woff` commitado se puede verificar contra
  su generador, en vez de confiar en que alguien se acordó de regenerarlo.
- **`test/theme.test.js`.** La especificación del tema está llena de reglas que sólo
  fallan "visualmente" (un hex inventado, el acento colándose en texto, un párrafo de
  Markdown coloreado), así que cada criterio de aceptación es una aserción: ningún hex
  fuera de la paleta declarada, acento sólo en las 11 claves de chrome, los 9 papeles
  por encima de 4.5:1 sobre el fondo del editor y el cuerpo de Markdown sin color. Con
  el tema, los iconos y la fuente, la suite pasa de 64 a **81 pruebas**, todas en verde.

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

### Nota
- **El Marketplace venía sirviendo la 2.2.4.** Las versiones 2.3.0 y 2.4.0 se etiquetaron
  pero nunca se publicaron, así que quien tiene la extensión instalada todavía **no** tiene
  el autocompletado de las CSS custom properties del VTEX Style ni el comando
  `VTEX: Gerar tokens.css`. La 3.0.0 entrega todo eso junto con el tema y los iconos: para
  el usuario del Marketplace, el salto es de 2.2.4 a 3.0.0 de una sola vez.

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
