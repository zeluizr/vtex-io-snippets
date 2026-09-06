# inmmerce for VTEX

**Tema, iconos, snippets e IntelliSense para quien construye en VTEX.**

Extensión de VS Code con todo lo que necesita un tema de **VTEX IO Store Framework**:
snippets de bloques y props con enums y validación en `store/blocks`, rutas y
contentSchemas; validación de JSON; autocompletado de las variables CSS del VTEX Style; y
un tema de color con sus iconos de archivo y de interfaz.

[![marketplace](https://badgen.net/vs-marketplace/v/commenteme.vtex-io-intellisense?label=marketplace&color=F71963)](https://marketplace.visualstudio.com/items?itemName=commenteme.vtex-io-intellisense)
[![instalaciones](https://badgen.net/vs-marketplace/i/commenteme.vtex-io-intellisense?label=instalaciones)](https://marketplace.visualstudio.com/items?itemName=commenteme.vtex-io-intellisense)
[![licencia](https://badgen.net/github/license/zeluizr/vtex-io-snippets?label=licencia)](./LICENSE)

![El tema Puelche con sus iconos de archivo y de interfaz](./images/preview.png)

---

## Instalación

Desde el VS Code Marketplace: busca **«inmmerce for VTEX»**, o instálala desde Quick Open
(`Cmd/Ctrl + P`):

```
ext install commenteme.vtex-io-intellisense
```

Desde el terminal:

```bash
code --install-extension commenteme.vtex-io-intellisense
```

## Uso

### Bloques y props

1. Abre un tema de VTEX IO Store Framework.
2. En los archivos `.json` / `.jsonc` de `store/` (por ejemplo `store/blocks/*.jsonc`),
   empieza a escribir el nombre de un bloque para disparar el snippet y el autocompletado.
3. Las props se autocompletan con sus enums y se validan contra el esquema de bloques
   (`blocks.json`, `store/blocks/**/*.json`, `store/**/*.jsonc`).

El catálogo trae **385 snippets** de bloques del Store Framework.

Las sugerencias son sensibles al contexto: el bloque completo sólo aparece en la raíz del
archivo, donde de verdad se define; dentro de `children` / `blocks` / `before` / `after` /
`around` se sugieren los ids ya definidos en el tema; y dentro de `props` sólo manda el
esquema, con las propiedades del bloque.

También hay **Go to Definition**, **Find All References** y **Hover** sobre los ids de
bloque del tema.

No necesita configuración: la extensión activa las sugerencias dentro de strings para
`json` / `jsonc`, y la validación de JSON se enciende sola en esos archivos.

### Variables CSS del VTEX Style

En archivos `css`, `scss`, `less` y `postcss` la extensión autocompleta las CSS custom
properties que VTEX expone en runtime a partir de tu JSON de tokens (el mismo formato del
`style.json` nativo): `var(--emphasis)`, `var(--spacing-2)`, `var(--type-scale-1)`,
`var(--background-action-primary)`…

- Se dispara al escribir `-` o `(`. Si el cursor ya está dentro de `var(`, inserta sólo el
  nombre; si no, inserta `var(--nombre)` completo.
- Las variables de color se muestran con su *swatch* y el valor.

El origen de los tokens se resuelve por prioridad: primero `styles/configs/tokens.json`,
luego `tokens.json` en la raíz del workspace, y si no hay ninguno cae a un `tokens.json`
embebido con los valores por defecto de VTEX. Los cambios en cualquier `tokens.json` se
recargan solos, y un JSON inválido no tumba la extensión ni borra los tokens anteriores.

### Ajustes de confort

`VTEX: Aplicar ajustes de conforto do Puelche` escribe en tus ajustes de usuario la fuente
recomendada, las ligaduras, el tamaño, la altura de línea y los tres temas del Puelche,
después de mostrarte `valor actual → valor nuevo` clave por clave. Si la fuente no está
instalada, te avisa y te copia el comando de instalación en vez de apuntar a una fuente
inexistente.

La fuente recomendada es
**[Google Sans Code](https://fonts.google.com/specimen/Google+Sans+Code)**, con sus ejes
variables activados. No trae ligaduras — su tabla GSUB no tiene `liga` ni `calt` —, pero el
preset deja `fontLigatures` activo por si entra otra fuente en la pila.

```bash
brew install --cask font-google-sans-code
```

## El tema Puelche

Un tema oscuro pensado para sesiones largas: la identidad de la extensión vive en el
*chrome* de la interfaz (cursor, pestaña activa, badges), no en el resaltado de sintaxis.

La paleta es **propia**. Parte de cinco colores ancla, con el hex intacto —
`#FF6E61`, `#FFB84D`, `#FCE2A1`, `#4EB7AC`, `#3C9CD7` — y todo lo que falta se deriva
de ellos en LCh, dentro de los dos arcos de tono que las cinco dejan vacíos: el verde
y el morado. Cada color derivado tiene coordenada; ninguno se eligió a ojo.

El fondo también se deriva: el ancla azul llevada a croma bajo da el azul nocturno
`#131F29`. El acento de chrome sigue siendo el dorado `#F6C92D` de inmmerce, porque es
identidad de marca y no un tono de sintaxis.

Actívalo con `Cmd/Ctrl + K` seguido de `Cmd/Ctrl + T` y elige **Puelche** en la lista.

### Colorea por papel, no por lenguaje

Hay 9 papeles semánticos y todos los lenguajes se mapean sobre esos mismos 9. Una etiqueta
HTML, un componente JSX, un selector de elemento CSS, un decorador de Python, un atributo
de Prisma, una directiva de GraphQL y un título de Markdown reciben el mismo color, porque
todos son «estructura con nombre». Aprendes el mapa una vez y sirve para todos los
archivos.

| papel | color | contraste sobre el fondo |
|---|---|---|
| Palabras clave | `#FF6E61` | 6.10:1 |
| Funciones y campos | `#4EB7AC` | 6.92:1 |
| Tipos y propiedades | `#3C9CD7` | 5.52:1 |
| Strings | `#FCE2A1` | 13.17:1 |
| Números y constantes | `#AA91E0` | 6.24:1 |
| Estructura con nombre | `#FFB84D` | 9.73:1 |
| Variables y prosa | `#F4F0E9` | 14.72:1 |
| Puntuación | `#9C9890` | 5.82:1 |
| Comentarios | `#91A3B1` | 6.43:1 |

### Legibilidad

- Los comentarios no están apagados: quedan en 6.43:1 de contraste, por encima del mínimo
  de accesibilidad. Un comentario que no se lee es un comentario que no se escribe.
- El cuerpo de texto de Markdown se queda sin color, para que un README siga leyéndose como
  prosa y no como código.
- La cursiva sustituye a los colores extra: comentarios, parámetros, `self` / `cls`,
  atributos HTML y JSX, `import` / `from` y blockquote. Un matiz más, no un color más.
- El color de acento sólo aparece en el chrome. Nunca colorea texto de código.

Estas reglas son asertos, no intenciones: `test/theme.test.js` las cobra en cada corrida —
ningún hex fuera de la paleta, los 9 papeles por encima de 4.5:1 sobre el fondo del editor,
ningún par de colores que comparten pantalla por debajo de ΔE76 10.

## Iconos de archivo y carpeta

51 iconos de archivo y 42 de carpeta, coloreados con el mismo esquema de papeles que el
tema, así que el explorador y el editor hablan el mismo idioma visual.

Cada icono son dos capas: una silueta sólida — la carpeta, o la hoja de papel — con el
color del papel semántico, y encima la marca de lo que contiene, **también sólida**, en un
tono oscuro del mismo color. La razón es el tamaño real: en el explorador el icono se
dibuja a 16px, y ahí un trazo de 1.33px se pierde sobre el fondo oscuro mientras que una
mancha se lee de un vistazo. Eso vale para la silueta y vale para la marca: en el conjunto
no queda un solo `stroke`. Lo que era una línea encima ahora es un hueco calado.

El tono oscuro no se elige a ojo: es el mismo color del papel mezclado al 70% con el fondo
del editor. El peor caso del conjunto queda en 3.25:1 entre silueta y marca, por encima
del mínimo de 3:1 para elemento gráfico.

Actívalos desde la paleta de comandos (`Cmd/Ctrl + Shift + P`) con
**`Preferences: File Icon Theme`** → **Puelche**.

Lo que los diferencia de un pack genérico es que cubren la estructura real de una app de
VTEX IO: cada builder tiene su carpeta — `store`, `react`, `node`, `graphql`, `messages`,
`styles`, `admin`, `pixel`, `assets`, `docs`, `checkout-ui-custom`, `sitemap`, `masterdata`
y `configuration` —, más la estructura de dentro del tema (`store/blocks`,
`store/templates`, `styles/iconpacks`) y las páginas de la tienda (`home`, `product`,
`search`, `header`, `footer`, `landing`, `cart`, `account`). Y los archivos `manifest.json`,
`routes.json`, `blocks.json`, `interfaces.json`, `style.json` y `.vtexignore`.

En total: 80 extensiones, 79 nombres de archivo, 117 nombres de carpeta y 26 `languageIds`.

Los nombres conocidos llevan marca propia, aunque la extensión diga otra cosa: en VS Code
`fileNames` gana a `fileExtensions`, así que `CLAUDE.md` y `AGENTS.md` llevan el *sunburst*
de Claude y no el icono de Markdown. Igual con npm, yarn, Prettier, ESLint, Docker, Git,
GitHub y VTEX. Son interpretaciones redibujadas para los 16px del explorador, no el asset
oficial: a ese tamaño la fidelidad se pierde y lo que queda es la silueta.

## Iconos de la interfaz

El *product icon theme* reemplaza los iconos de la propia UI de VS Code por un conjunto
propio: 58 glifos dibujados a mano que cubren la barra de actividad, el layout y
la barra de título, la barra de estado, el árbol del explorador, pestañas y editor, paneles,
acciones comunes y feedback. Se sirven como 93 entradas, porque 35 codicons distintos
comparten dibujo con otro.

Actívalo desde la paleta de comandos con **`Preferences: Product Icon Theme`** →
**Puelche**.

La cobertura es parcial a propósito: los iconos que no están cubiertos siguen usando el
codicon nativo de VS Code, que siempre se verá mejor que un dibujo forzado. Para que la
mezcla no se note, la fuente usa las mismas métricas que el codicon nativo (`unitsPerEm`
1000, razón 1.0), así que los glifos propios y los nativos comparten línea base y tamaño.

## Comandos

Todos desde la paleta de comandos (`Cmd/Ctrl + Shift + P`).

| comando | qué hace |
|---|---|
| `VTEX: Gerar tokens.css` | exporta un `:root { ... }` con todas las variables generadas, junto al JSON de origen |
| `VTEX: Aplicar ajustes de conforto do Puelche` | aplica el preset de fuente, ligaduras, respiro y los tres temas |
| `VTEX: Desfazer ajustes de conforto` | deshace el preset |

## Solución de problemas

**No aparece ninguna sugerencia de bloque.** Sólo se ofrecen en archivos bajo `store/`, y el
bloque completo únicamente en la raíz del archivo. Dentro de `props` es intencional que no
aparezca: ahí sólo caben propiedades.

**`Ctrl + Espacio` no abre las sugerencias (macOS).** macOS se queda con ese atajo para
*Seleccionar la fuente de entrada anterior*, así que nunca llega a VS Code. Dos salidas:

- Usa `Cmd + I`, que también dispara las sugerencias en VS Code.
- O libera el atajo en **Ajustes del Sistema → Teclado → Atajos de teclado → Fuentes de
  entrada** y desmarca *Seleccionar la fuente de entrada anterior*.

## Estructura

```
.
├── extension.js       # activate()/deactivate(), providers y comandos
├── lib/               # lógica pura, sin la API vscode (testeable con node:test)
├── data/              # las fuentes de todo lo que se genera
│   ├── blocks.json            # catálogo de bloques del Store Framework
│   ├── icons.json             # mapa del icon theme
│   ├── product-icons.json     # mapa del product icon theme
│   └── product-codepoints.json  # codepoints de la fuente (append-only)
├── snippets/          # .code-snippets (generado desde data/blocks.json)
├── schemas/           # JSON Schema de los bloques (generado)
├── themes/            # tema de color (a mano) + icon theme y product icon theme (generados)
├── icons/             # SVGs del icon theme (generados y commiteados)
├── assets/tokens.json # tokens del VTEX Style por defecto (fallback embebido)
├── scripts/           # generadores: schema, geometría, icon theme, fuente, preview
├── docs/              # traco-puelche.md, la spec de dibujo
└── test/              # node:test
```

## Desarrollo

JavaScript puro, sin TypeScript y sin build step: el `main` es `extension.js` en la raíz,
tipado con JSDoc y `// @ts-check`. CommonJS, 2 espacios, sin punto y coma, comillas simples.
Sin dependencias de runtime: sólo la API `vscode` y `fs`/`path` de Node.

```bash
git clone https://github.com/zeluizr/vtex-io-snippets.git
cd vtex-io-snippets
npm install

npm test                     # node:test
node --check extension.js
node scripts/generate-schema.js   # regenera schemas/ y snippets/ desde data/blocks.json
npm run icons:build          # regenera icons/*.svg + el icon theme
npm run icons:check          # build + git diff --exit-code
npm run product:build        # regenera el .woff + el product icon theme
npm run product:check        # build + git diff --exit-code
npm run preview              # regenera images/preview.png del Marketplace

npx --yes @vscode/vsce package --no-dependencies   # genera el .vsix
```

`F5` en VS Code abre una ventana de desarrollo con la extensión cargada.

**Casi todo lo publicado es generado, nunca editado a mano.** Los snippets y el JSON Schema
salen de `data/blocks.json`; los temas de iconos, de `scripts/icon-shapes.js` y
`scripts/product-shapes-{a,b}.js` con el mapeo en `data/`. Los generadores son deterministas:
misma entrada, mismos bytes. La CI (`.github/workflows/test.yml`) regenera el schema y los
snippets y **falla si lo commiteado no es exactamente lo que produce el script**; para los
iconos, ese mismo control es `icons:check` y `product:check`, en local.
`docs/traco-puelche.md` es la spec de dibujo y manda sobre las dos grillas.

Dos avisos con efecto en usuarios ya instalados:

- `data/product-codepoints.json` es **append-only**. Reordenar o borrar una entrada
  reasigna el número a otro dibujo, y cada usuario con la fuente en caché vería el icono
  equivocado.
- Si tocas un icono, míralo a **16px reales**. Es el tamaño al que el explorador lo dibuja
  y es el único juez: una hoja de contacto a 32px aprueba dibujos que a 16 son un borrón.
  `node scripts/contact-sheet.js <dir>` muestra los tres tamaños lado a lado.

**Publicar es empujar una tag.** `.github/workflows/publish.yml` empaqueta, sube al
Marketplace con el secret `VSCE_PAT` del publisher `commenteme` y adjunta el `.vsix` a la
Release de GitHub, con cada tag `v*`. Quien decide la versión publicada es `package.json`, no
la tag: hay que subirla —y cerrar `CHANGELOG.md`— **antes** de marcar, o el Marketplace
rechaza la versión repetida.

Conventional Commits; el mensaje describe el efecto, no el cambio.

## Licencia

[MIT](./LICENSE)

_Hecho con amor y café por [zeluizr](https://github.com/zeluizr) y con la ayuda de [Claude](https://claude.ai/referral/Cz_UimA0NQ) ☕_
