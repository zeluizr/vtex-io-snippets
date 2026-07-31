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

Las sugerencias son **sensibles al contexto**: el bloque completo sólo aparece en la raíz del
archivo, donde de verdad se define; dentro de `children` / `blocks` / `before` / `after` /
`around` se sugieren los **ids ya definidos** en el tema; y dentro de `props` sólo manda el
esquema, con las propiedades del bloque.

No necesita configuración: la extensión activa las sugerencias dentro de strings para
`json` / `jsonc` y la validación de JSON se enciende sola en esos archivos.

### Variables CSS del VTEX Style

En archivos `css`, `scss`, `less` y `postcss` la extensión también autocompleta las **CSS
custom properties** que VTEX expone en runtime a partir de tu JSON de tokens (el mismo
formato del `style.json` nativo): `var(--emphasis)`, `var(--spacing-2)`,
`var(--type-scale-1)`, `var(--background-action-primary)`…

- Se dispara al escribir `-` o `(`. Si el cursor ya está dentro de `var(`, inserta sólo el
  nombre; si no, inserta `var(--nombre)` completo.
- Las variables de **color** se muestran con su *swatch* (color preview) y el valor.

**Origen de los tokens (por prioridad):** primero `styles/configs/tokens.json`, luego
`tokens.json` en la raíz del workspace, y si no hay ninguno cae a un `tokens.json` embebido
en la extensión con los valores por defecto de VTEX. Los cambios en cualquier `tokens.json`
se recargan solos.

**Comando `VTEX: Gerar tokens.css`** (paleta de comandos, `Cmd/Ctrl + Shift + P`): exporta un
`:root { ... }` con **todas** las variables generadas, guardado junto al JSON de origen.

## Solución de problemas

**No aparece ninguna sugerencia de bloque.** Sólo se ofrecen en archivos bajo `store/`, y el
bloque completo únicamente en la raíz del archivo. Dentro de `props` es intencional que no
aparezca: ahí sólo caben propiedades.

**`Ctrl + Espacio` no abre las sugerencias (macOS).** macOS se queda con ese atajo para
*Seleccionar la fuente de entrada anterior*, así que nunca llega a VS Code. Dos salidas:

- Usa `Cmd + I`, que también dispara las sugerencias en VS Code.
- O libera el atajo en **Ajustes del Sistema → Teclado → Atajos de teclado → Fuentes de entrada**
  y desmarca *Seleccionar la fuente de entrada anterior*.

---

vtex-io-snippets es **open source** bajo licencia [MIT](./LICENSE).

_Hecho con amor y café por [zeluizr](https://github.com/zeluizr) y con la ayuda de [Claude](https://claude.ai/referral/Cz_UimA0NQ) ☕_
