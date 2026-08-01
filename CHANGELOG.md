# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto sigue el [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

## [2.3.1] - 2026-07-31

### Cambiado
- **`assets/tokens.json` por defecto** actualizado con el design system "pixel"
  (escala de tipos, spacing, sizes, opacidad, escala alpha `--black-*`/`--white-*`
  y los grupos semánticos completos de `background`/`text`/`border`/`on` con sus
  variantes `hover-`/`active-`). Es el fallback que alimenta el autocompletado de
  `var(--...)` cuando el workspace no trae su propio `tokens.json`.

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
