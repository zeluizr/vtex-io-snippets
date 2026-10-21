# VTEX IO Snippets

**Snippets, validación e IntelliSense para temas de VTEX IO Store Framework.**

Extensión de VS Code para quien construye temas de **VTEX IO Store Framework**: snippets de bloques y props con enums
y validación en `store/blocks`, rutas y contentSchemas; navegación entre los ids de bloque del tema; y autocompletado
de las variables CSS del VTEX Style.

[![marketplace](https://badgen.net/badge/marketplace/instalar/005278)](https://marketplace.visualstudio.com/items?itemName=commenteme.vtex-io-intellisense)
[![instalaciones](https://badgen.net/vs-marketplace/i/commenteme.vtex-io-intellisense?label=instalaciones)](https://marketplace.visualstudio.com/items?itemName=commenteme.vtex-io-intellisense)
[![licencia](https://badgen.net/github/license/zeluizr/vtex-io-snippets?label=licencia)](./LICENSE)

![Autocompletado de ids de bloque y validación de props en store/blocks/home.jsonc](images/preview.png)

Versión del código: **5.0.0**, según [package.json](package.json). Requiere **VS Code >= 1.60.0**. El identificador
publicado se mantiene como `commenteme.vtex-io-intellisense`, aunque el nombre visible sea VTEX IO Snippets.

La documentación completa está en la **[wiki](https://github.com/zeluizr/vtex-io-snippets/wiki)**: cada feature con
su detalle, la solución de problemas, y cómo se genera y se publica todo esto.

---

## Instalación

Desde el VS Code Marketplace: busca **«VTEX IO Snippets»**, o instálala desde Quick Open (`Cmd/Ctrl + P`):

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

## Comandos

Desde la paleta de comandos (`Cmd/Ctrl + Shift + P`).

| comando | qué hace |
|---|---|
| `VTEX: Gerar tokens.css` | exporta un `:root { ... }` con todas las variables generadas, junto al JSON de origen |

## Solución de problemas

**No aparece ninguna sugerencia de bloque.** Sólo se ofrecen en archivos bajo `store/`, y el
bloque completo únicamente en la raíz del archivo. Dentro de `props` es intencional que no
aparezca: ahí sólo caben propiedades.

**`Ctrl + Espacio` no abre las sugerencias (macOS).** macOS se queda con ese atajo para
*Seleccionar la fuente de entrada anterior*, así que nunca llega a VS Code. Dos salidas:

- Usa `Cmd + I`, que también dispara las sugerencias en VS Code.
- O libera el atajo en **Ajustes del Sistema → Teclado → Atajos de teclado → Fuentes de
  entrada** y desmarca *Seleccionar la fuente de entrada anterior*.

**Usaba el tema Puelche.** El tema de color, los iconos y los ajustes de confort salieron de esta extensión en la
5.0.0 y van a publicarse como una extensión aparte. Hasta entonces, VS Code vuelve a su tema y a sus iconos por
defecto.

## Estructura

```
.
├── extension.js       # activate()/deactivate(), providers y comandos
├── lib/               # lógica pura, sin la API vscode (testeable con node:test)
├── data/blocks.json   # catálogo de bloques del Store Framework (fuente de todo lo generado)
├── snippets/          # .code-snippets (generado desde data/blocks.json)
├── schemas/           # JSON Schema de los bloques (generado)
├── assets/tokens.json # tokens del VTEX Style por defecto (fallback embebido)
├── images/            # ícono, ladrillo de la marca e imagen del README
├── scripts/           # generadores: schema, cobertura, ícono e imagen del README
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

npm test                          # node:test
node --check extension.js
node scripts/generate-schema.js   # regenera schemas/ y snippets/ desde data/blocks.json
npm run icone                     # regenera images/icon.png desde el ladrillo
npm run preview                   # regenera images/preview.png

npx --yes @vscode/vsce package --no-dependencies   # genera el .vsix
```

`F5` en VS Code abre una ventana de desarrollo con la extensión cargada.

**Lo publicado sale de un generador, nunca se edita a mano.** Los snippets y el JSON Schema salen de
`data/blocks.json`, y el generador es determinista: misma entrada, mismos bytes. La CI (`.github/workflows/test.yml`)
regenera el schema y los snippets y **falla si lo commiteado no es exactamente lo que produce el script**.

**Una tag `v*` empaqueta el `.vsix`** y lo adjunta a la Release de GitHub (`.github/workflows/publish.yml`). La
publicación en el Marketplace es manual, con `vsce publish` desde `main`. Quien decide la versión es `package.json`:
hay que subirla —y cerrar `CHANGELOG.md`— **antes** de marcar, o el Marketplace rechaza la versión repetida.

Conventional Commits; el mensaje describe el efecto, no el cambio.

## Licencia

[MIT](./LICENSE)

_Hecho con amor y café por [commente.me](https://commente.me)_
