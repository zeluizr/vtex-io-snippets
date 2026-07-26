# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto sigue el [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

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
