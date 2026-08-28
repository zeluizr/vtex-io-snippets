# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto sigue el [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

## [3.6.0] - 2026-08-28

### Cambiado
- **El vocabulario del archivo deja de ser todo blanco.** Medido sobre un `.tsx` real: 16
  identificadores —`classNames`, `useCssHandles`, `CSS_HANDLES`, `handles`,
  `productContext`, `product`, `raw`, `attributes`, `rows`…, el vocabulario entero del
  archivo— salían del mismo blanco. El tema coloreaba lo que el token **es**
  gramaticalmente (palabra clave, tipo, llamada, cadena) y dejaba sin color todo nombre
  que el autor había escrito. Dracula tiene la misma propiedad; aquí se pidió más.
  - **Dónde nace un nombre** va en lavanda `#D6ACFF`; **el uso** se queda en el color de
    texto. Es el contraste entre los dos el que hace la lectura: se ve la definición sin
    buscarla.
  - **Lo que viene de fuera** —el nombre importado— va en cian claro `#A4FFFF` en cursiva,
    así el bloque de `import` se lee como lo que es: la superficie externa del archivo.
  - **El parámetro pasa a naranja en cursiva**, que es lo que Dracula hace. Estaba en
    `#D2D2CC`, casi indistinguible del texto común: una desviación nuestra que costaba
    color justo donde más se necesita.
- `lavender` y `aqua` suben de extras de terminal a papeles de sintaxis. Son dos de los
  brillantes de la tabla ANSI de Dracula, y ninguno queda por debajo de ΔE76 10 contra el
  resto de lo que comparte pantalla.
- Tres pruebas nuevas fijan las distinciones: que declaración y uso no salgan del mismo
  color, que el parámetro no vuelva a ser un blanco de segunda, y que el nombre importado
  no empate ni con el texto común ni con el color de tipo.

### Corregido
- **El preset de conforto cambia de fuente: Victor Mono sale, entra Google Sans Code.** La
  recomendación era por su cursiva, pero resultó difícil de leer en sesión larga —el trazo
  es fino y la cursiva, que es su gracia, cansa cuando aparece a la vez en comentario,
  parámetro, atributo e import—. El preset ahora activa `editor.fontVariations` para usar
  los ejes variables, y por eso ya no fija `fontWeight`. Google Sans Code **no tiene
  ligaduras** (su tabla GSUB trae `aalt ccmp locl ss01`, sin `liga` ni `calt`); el preset
  deja `fontLigatures` activo igualmente, inofensivo y listo para el día que entre una
  fuente que sí las tenga.

## [3.5.0] - 2026-08-28

### Añadido
- **Reglas de resaltado específicas por lenguaje**, siete. No dan un color a cada lenguaje
  —eso rompería la regla fundacional del tema, colorear por papel y no por lenguaje—: dan
  más **resolución dentro** del lenguaje, separando ámbitos que compartían regla y salían
  del mismo color:
  - **React: un componente ya no tiene el color de una etiqueta.** `<ProductCard>` pasa a
    cian, el color de tipo, y `<div>` se queda en naranja, el de estructura con nombre.
    Compartían regla, así que en un `.tsx` no había forma de distinguirlos de un vistazo.
  - **React: la llave que abre JavaScript dentro del markup** (`{`…`}`) es rosa, para que
    la frontera entre JSX y expresión se vea. Antes caía en la puntuación común y
    desaparecía.
  - **GraphQL: `$variable` dejó de pintarse como una llamada a función.** Estaba en la
    regla de funciones y salía en verde; ahora lleva el color de parámetro, en cursiva.
  - **`this`, `super`, `self` y `cls` son el mismo papel en todos los lenguajes**: morado
    en cursiva, el valor que da el lenguaje. `this` estaba entre las palabras clave, que es
    lo que no es, y `self` de Python tenía regla propia con otro color.
  - **`async` y `await` en cursiva.** Siguen siendo palabra clave en color; lo que los
    separa es la cursiva, no un color nuevo — la misma decisión que el tema ya toma para
    `import`, los parámetros y los atributos.
  - **Regex: ancla, grupo y clase de caracteres** en naranja, dentro de la cadena morada.
  - **Los signos de la etiqueta** (`<`, `/`, `>`) bajan a color de puntuación, para que el
    nombre del componente sea lo que se lee.
- Seis pruebas nuevas fijan esas distinciones, porque son fallos que solo se ven leyendo
  código: que el componente no comparta color con la etiqueta, que la llave del JSX no
  caiga en la puntuación, que `$variable` no sea una función, que `this`/`super`/`self`
  salgan los tres del mismo papel, y que ninguna regla nueva invente un color.

## [3.4.0] - 2026-08-28

### Cambiado
- **La paleta de sintaxis pasa a ser la de Dracula.** El motivo del cambio se pidió con
  una razón concreta —"necesito entender solo de mirar"— y la paleta desaturada fallaba
  justo en eso: sus nueve papeles vivían entre ΔE76 10 y 15, en el límite del mínimo. Las
  15 colores de Dracula están **todas** por encima de ΔE76 10 entre sí, con holgura. Las
  palabras clave son rosa, los tipos y clases cian, las funciones verde, las cadenas
  amarillo, los números y constantes morado, la estructura con nombre naranja.
- **El fondo sigue siendo el `#1A181F` del Puelche**, más oscuro que el `#282A36` de
  Dracula. No es descuido: sobre él cada color gana ~24% de contraste sobre el tema de
  origen —verde 12.81:1 contra 10.38:1, rojo 5.60:1 contra 4.53:1—. Pedir más destaque y
  quedarse con el fondo oscuro da todavía más destaque.
- **Los iconos siguen la misma paleta**, para que el explorador y el editor no hablen dos
  idiomas de color. Los once papeles de familia adoptan los colores de Dracula y pasan a
  llamarse por su matiz (`purple`, `pink`, `cyan`…), porque con esta paleta los nombres
  antiguos eran mentira: `clay` guardaba un morado.
- **El terminal usa los valores ANSI exactos de Dracula**, los 16, normales y brillantes.

### Corregido
- El **comentario** no es el `#6272A4` de Dracula: sobre este fondo da 3.74:1, por debajo
  del mínimo de 5.7:1 que este tema exige desde siempre, con la razón escrita en la
  especificación —un comentario que no se lee es un comentario que no se escribe—. Va
  aclarado un 30% hacia el texto: `#8F9ABB`, 6.29:1.
- Dos colores de icono tampoco son de Dracula, y la medición dice por qué. El blanco
  `#F8F8F2` convertía `docs`, `README` y `CHANGELOG` en lo más luminoso del árbol —un
  documento no debe dominar—, así que documento se queda en `parchment` `#B8AE9E`. Y el
  `#6272A4` para lo generado chocó con un **piso de luminancia del sistema de dos capas**
  que nadie había medido: una placa demasiado oscura no deja sitio para la marca, y daba
  2.64:1. `dim` `#808DB4` es ese mismo azul aclarado hasta el punto exacto en que la
  cuenta cierra, 3.35:1, y sigue siendo la placa más apagada del conjunto.

## [3.3.0] - 2026-08-28

### Añadido
- **Comando "VTEX: Aplicar ajustes de conforto del Puelche"** (y su
  "VTEX: Deshacer ajustes de conforto"). Escribe en TUS ajustes de usuario la fuente
  recomendada, las ligaduras, el tamaño, la altura de línea y los tres temas del Puelche
  —color, iconos e interfaz—, después de un diálogo que lista `valor actual → valor nuevo`
  clave por clave. Antes de aplicar busca la fuente en el disco: si no está, avisa y ofrece
  copiar el comando de instalación en vez de apuntar a una fuente que no existe, que es el
  fallo silencioso clásico. El deshacer devuelve cada clave a su valor anterior, y una
  clave que no existía antes vuelve a **no existir**.
- Es un comando y no `configurationDefaults` a propósito: que una extensión de tema cambie
  la fuente de quien la instala es invasivo.
- La fuente recomendada es **Victor Mono**, elegida por la cursiva. El tema usa cursiva en
  12 claves y la especificación cambia color extra por cursiva —es la única del grupo con
  cursiva de verdad, no una simple inclinación.

### Cambiado
- **Un color por familia.** El papel de color deja de elegirse caso por caso y pasa a ser
  la familia a la que pertenece la entrada, para que el árbol se lea por bloques y no como
  un mosaico: VTEX, escaparate, frontend, backend, código compartido, herramienta, estilo,
  recurso, documento, prueba y generado. La excepción son las marcas de terceros, que
  llevan el papel más cercano a su propio color.
- **La paleta pasa de 9 a 11 papeles.** `comment` y `punct` convivían a **ΔE76 6.1** —a
  simple vista, la carpeta `docs` y la carpeta `dist` eran el mismo color—. `comment` sale
  de la paleta de iconos (sigue en el tema de color, pintando comentarios) y entran
  `periwinkle` para el escaparate, `teal` para las herramientas y `parchment` para los
  documentos. El par más cercano de los 11 queda en ΔE76 11.0.
- **La marca oscura pasa del 60% al 70%** de mezcla con el fondo. Con el 60% cinco papeles
  quedaban por debajo del mínimo de 3:1 para elemento gráfico, con `punct` en 2.67:1. Ahora
  el peor caso es 3.17:1 y ninguno reprueba.
- **La silueta ocupa más caja**: de `1..23` a `0.5..23.5` de las 24 unidades. VS Code fija
  el icono en 16px, así que cuánto de la caja ocupa el dibujo es la única palanca de tamaño
  que queda. La marca creció en la misma proporción.
- **Seis marcas bajaron a dos elementos** —el cierre de la caja, la división del cilindro,
  el segundo diente de la llave, el segundo nodo de la ruta, el segundo nodo del grafo y la
  fuente del píxel—. El techo del CI baja de 3 a **2**: la regla pasa a cobrarse.

### Corregido
- `test/icons.test.js` gana la traba que faltaba: **ningún par de papeles por debajo de
  ΔE76 10**. Es la métrica que el tema de color ya exigía y que la paleta de iconos nunca
  tuvo — y es la que habría detectado el `comment` × `punct` hace meses.

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
