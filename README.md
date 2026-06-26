# VTEX IO Snippets

**Autocompletado, IntelliSense y snippets para los bloques del VTEX IO Store Framework.**

[![vs marketplace](https://badgen.net/vs-marketplace/v/commenteme.vtex-io-intellisense?label=marketplace&color=F71963)](https://marketplace.visualstudio.com/items?itemName=commenteme.vtex-io-intellisense)
[![instalaciones](https://badgen.net/vs-marketplace/d/commenteme.vtex-io-intellisense?label=instalaciones&color=F71963)](https://marketplace.visualstudio.com/items?itemName=commenteme.vtex-io-intellisense)
[![licencia](https://badgen.net/github/license/zeluizr/vtex-io-snippets?label=licencia&color=F71963)](./LICENSE)

Extensión de VS Code que agrega snippets de bloques y props (con enums y validación) en
`store/blocks`, rutas y contentSchemas, más validación de JSON en los archivos de tu tema.

---

## Instalación

Desde el **VS Code Marketplace**: busca **«VTEX IO Store Framework Snippets»**, o instálala
desde Quick Open (`Cmd/Ctrl + P`):

```
ext install commenteme.vtex-io-intellisense
```

## Uso

1. Abre un tema de **VTEX IO Store Framework**.
2. En los archivos `.json` / `.jsonc` de `store/` (por ejemplo `store/blocks/*.jsonc`), empieza
   a escribir el nombre de un bloque para disparar el snippet y el autocompletado.
3. Las props se autocompletan con sus **enums** y se **validan** contra el esquema de bloques
   (`blocks.json`, `store/blocks/**/*.json`, `store/**/*.jsonc`).

No necesita configuración: la validación de JSON se activa sola en esos archivos.

---

vtex-io-snippets es **open source** bajo licencia [MIT](./LICENSE).

_Hecho con amor y café por [zeluizr](https://github.com/zeluizr) y con la ayuda de [Claude](https://claude.ai/referral/Cz_UimA0NQ) ☕_
