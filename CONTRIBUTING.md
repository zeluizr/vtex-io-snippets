# Cómo contribuir

Gracias por venir. Esta guía es el resumen operativo; el detalle de cada tema vive en la
**[wiki](https://github.com/zeluizr/vtex-io-snippets/wiki)**.

## Arrancar

```bash
git clone https://github.com/zeluizr/vtex-io-snippets.git
cd vtex-io-snippets
npm install
npm test
```

`F5` en VS Code abre una ventana de desarrollo con la extensión cargada.

## Las ramas

Tres ramas de larga vida y una sola dirección:

```
rama de trabajo  ->  dev  ->  qa  ->  main
```

- La rama de trabajo **sale de `dev`**, y el PR **va contra `dev`**. Nunca commits directos
  en `main`, nunca un PR apuntando a `qa` o a `main`.
- Nombres: `feature/{nombre}`, `fix/{nombre}`, `docs/{nombre}`, `chore/{nombre}`.
- La promoción es merge de la rama entera, nunca cherry-pick.

## Las convenciones, a rajatabla

- **JavaScript puro, no TypeScript.** Sin `src/`, sin build step. El `main` es
  `./extension.js` en la raíz. El tipado va en JSDoc, con `// @ts-check`.
- Todo archivo empieza con `// @ts-check` y `'use strict'`.
- CommonJS: `require` y `module.exports`.
- Estilo: 2 espacios, **sin punto y coma**, comillas simples.
- **Sin dependencias de runtime nuevas.** Sólo la API `vscode` y `fs` / `path` de Node.
- `lib/*.js` es lógica pura y libre de `vscode`, para poder probarse con `node:test`. Los
  providers y el cableado que depende de `vscode` viven en `extension.js`.

## Idiomas

El repositorio es multilingüe a propósito, y **se mantiene el idioma del archivo que estás
editando**:

| | idioma |
|---|---|
| comentarios y mensajes del código | portugués |
| `CLAUDE.md`, `AGENTS.md`, `docs/traco-puelche.md` | portugués |
| `README.md`, `CHANGELOG.md`, este archivo, la wiki | español |

## Lo que la CI te va a cobrar

`.github/workflows/test.yml` corre en cada push y en cada PR, y falla si:

- el esquema o los snippets commiteados no son **exactamente** lo que produce el generador;
- los iconos o la fuente de la interfaz derivaron de su generador (`npm run icons:check` y
  `npm run product:check`);
- alguna de las 149 pruebas falla.

Córrelos en local antes de abrir el PR y no te vas a llevar sorpresas.

## Nada generado se edita a mano

Si tocaste algo que sale de un generador, **corre el generador**. La salida commiteada tiene
que ser byte a byte la que produce el script.

| qué | con qué se regenera |
|---|---|
| `schemas/`, `snippets/` | `node scripts/generate-schema.js` |
| `icons/`, `themes/puelche-icon-theme.json` | `npm run icons:build` |
| `themes/puelche-product*.{json,woff}` | `npm run product:build` |

## Commits

**Conventional Commits**, y el mensaje describe **el efecto, no el cambio**.

```
fix(ci): regenera os snippets a partir da fonte e destrava o check de drift
docs(readme): rotula los badges y detalla las fuentes de data/
```

## Los tres avisos que valen un PR entero

- **`data/product-codepoints.json` es append-only.** Reordenar o borrar una entrada reasigna
  el número a otro dibujo, y cada usuario con la fuente en caché vería el icono equivocado.
- **Si tocas un icono, míralo a 16px reales.** `node scripts/contact-sheet.js <dir>`. Una
  hoja de contacto a 32px aprueba dibujos que a 16 son una mancha.
- **Si cambias una regla de diseño, actualiza primero la spec del test.** En `theme.test.js`
  y en `icons.test.js` la spec está escrita en el archivo, y es el documento; el JSON es sólo
  el artefacto.

## Publicar

No lo hagas en un PR. La publicación en el Marketplace es **manual** y la hace el
publisher. Empujar una tag `v*` sólo empaqueta el `.vsix` y lo adjunta a la Release de
GitHub.
