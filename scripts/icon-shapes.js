// @ts-check
'use strict'

/**
 * Geometria autoral dos ícones — a única fonte de desenho do conjunto.
 *
 * Cada forma é markup interno de SVG numa grade 24x24, desenhado como monoline:
 * o `build-icon-theme.js` embrulha tudo num <svg> com `stroke` da cor do papel,
 * `stroke-width` 1.8 e pontas arredondadas. Onde a forma precisa de preenchimento
 * sólido usa o token `@c`, trocado pela cor na geração.
 *
 * Manter o traço uniforme é o que faz o conjunto inteiro parecer um só: nenhuma
 * forma declara `stroke-width` próprio, e o conteúdo vive entre 3 e 21 na grade.
 */

/** @type {Record<string, string>} */
const SHAPES = {
  // --- estrutura e dados ---
  braces:
    '<path d="M9.5 4h-.8C7.2 4 6.5 4.8 6.5 6.3v2.4c0 1.2-.6 1.9-1.8 1.9v2.8c1.2 0 1.8.7 1.8 1.9v2.4C6.5 19.2 7.2 20 8.7 20h.8"/>' +
    '<path d="M14.5 4h.8c1.5 0 2.2.8 2.2 2.3v2.4c0 1.2.6 1.9 1.8 1.9v2.8c-1.2 0-1.8.7-1.8 1.9v2.4c0 1.5-.7 2.3-2.2 2.3h-.8"/>',
  angles:
    '<path d="M9.5 6 4 12l5.5 6"/><path d="M14.5 6l5.5 6-5.5 6"/>',
  react:
    '<circle cx="12" cy="12" r="1.9" fill="@c" stroke="none"/>' +
    '<ellipse cx="12" cy="12" rx="8.6" ry="3.4"/>' +
    '<ellipse cx="12" cy="12" rx="8.6" ry="3.4" transform="rotate(60 12 12)"/>' +
    '<ellipse cx="12" cy="12" rx="8.6" ry="3.4" transform="rotate(120 12 12)"/>',
  typescript:
    '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M7.5 9.5h5M10 9.5V16"/>' +
    '<path d="M16.8 9.8c-1.6-.6-2.9.1-2.9 1.4 0 1.9 3.1 1.4 3.1 3.3 0 1.3-1.4 2-3 1.4"/>',
  javascript:
    '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M10.2 9v5.4c0 1.2-.7 1.9-1.8 1.9-.9 0-1.5-.4-1.9-1.1"/>' +
    '<path d="M17.3 10c-1.5-.8-3.1-.2-3.1 1.1 0 1.9 3.2 1.3 3.2 3.3 0 1.4-1.6 2.1-3.3 1.2"/>',
  python:
    '<path d="M12 3.5c-3 0-4 1.2-4 3v2h4.2v.9H6.6c-1.8 0-3.1 1.2-3.1 4s1.3 4 3.1 4H8v-2.6c0-1.9 1.4-3.3 3.3-3.3h3.4c1.6 0 2.8-1.2 2.8-2.8V6.5c0-1.8-1.4-3-4-3z"/>' +
    '<circle cx="9.8" cy="6.3" r=".9" fill="@c" stroke="none"/>',

  // --- estilo ---
  brush:
    '<path d="M6 14.5 14.8 5.7a2.6 2.6 0 0 1 3.7 3.7L9.7 18"/><path d="M6 14.5c-1.6 1.6-1 4-1 4s2.4.6 4-1"/>',
  droplet: '<path d="M12 3.5s6 6.2 6 9.8a6 6 0 0 1-12 0c0-3.6 6-9.8 6-9.8z"/>',

  // --- documentos ---
  doc:
    '<path d="M6 3.5h7.5L18 8v12.5H6z"/><path d="M13.2 3.7V8H18"/><path d="M8.8 12.5h6.4M8.8 15.8h6.4"/>',
  book:
    '<path d="M4.5 5.5c2.5-1.3 5-1.3 7.5 0 2.5-1.3 5-1.3 7.5 0v13c-2.5-1.3-5-1.3-7.5 0-2.5-1.3-5-1.3-7.5 0z"/>' +
    '<path d="M12 5.5v13"/>',
  history: '<circle cx="12" cy="12" r="8"/><path d="M12 7.4V12l3.2 2"/>',
  license:
    '<path d="M12 3.5 19 6v5.6c0 4-2.9 7.4-7 8.9-4.1-1.5-7-4.9-7-8.9V6z"/><path d="M9.3 12l1.9 1.9 3.5-3.6"/>',

  // --- mídia e binário ---
  image:
    '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="8.6" cy="9.6" r="1.5"/>' +
    '<path d="M4 17l4.6-4.4c.8-.8 1.9-.8 2.7 0L20 20"/>',
  vector:
    '<path d="M7 7h10v10H7z"/><rect x="3.6" y="3.6" width="3.4" height="3.4" fill="@c" stroke="none"/>' +
    '<rect x="17" y="3.6" width="3.4" height="3.4" fill="@c" stroke="none"/>' +
    '<rect x="3.6" y="17" width="3.4" height="3.4" fill="@c" stroke="none"/>' +
    '<rect x="17" y="17" width="3.4" height="3.4" fill="@c" stroke="none"/>',
  font: '<path d="M5.5 19 12 4.5 18.5 19"/><path d="M8 14h8"/>',
  archive:
    '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M3.5 9.5h17"/>' +
    '<path d="M11 5v4.5M13 5v4.5M11 13h2v2.5h-2z"/>',
  play: '<circle cx="12" cy="12" r="8.2"/><path d="M10.4 9.2l4.6 2.8-4.6 2.8z"/>',
  audio: '<path d="M9 15V6l8-1.6V14"/><circle cx="7" cy="16" r="2.3"/><circle cx="15" cy="14" r="2.3"/>',

  // --- configuração e ferramentas ---
  gear:
    '<circle cx="12" cy="12" r="3.4"/>' +
    '<path d="M12 7V5.2M12 17v1.8M7 12H5.2M17 12h1.8"/>' +
    '<path d="M15.54 8.46 16.81 7.19M8.46 15.54 7.19 16.81M15.54 15.54l1.27 1.27M8.46 8.46 7.19 7.19"/>',
  lock:
    '<rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/>' +
    '<circle cx="12" cy="15.2" r="1.2" fill="@c" stroke="none"/>',
  key: '<circle cx="8" cy="12" r="3.6"/><path d="M11.6 12H20"/><path d="M17.2 12v3.2M14.4 12v2.4"/>',
  terminal: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M7.5 9.5 10.5 12l-3 2.5M13 15h4"/>',
  wrench:
    '<path d="M15.6 4.6a5 5 0 0 0-6.1 6.6l-5.2 5.2a2 2 0 0 0 2.8 2.8l5.2-5.2a5 5 0 0 0 6.6-6.1l-3 3-2.3-2.3z"/>',
  flask: '<path d="M9.5 3.8v5.6L4.8 17c-.9 1.6.2 3.2 2 3.2h10.4c1.8 0 2.9-1.6 2-3.2L14.5 9.4V3.8"/><path d="M8.4 3.8h7.2M7.6 14h8.8"/>',
  slash: '<circle cx="12" cy="12" r="8.2"/><path d="M6.2 6.2l11.6 11.6"/>',
  branch: '<circle cx="7" cy="6" r="2.4"/><circle cx="7" cy="18" r="2.4"/><circle cx="17" cy="9" r="2.4"/><path d="M7 8.4v7.2M17 11.4c0 3-2.4 4.2-5.4 4.6"/>',
  box: '<path d="M12 3.6 20.5 8v8L12 20.4 3.5 16V8z"/><path d="M3.5 8 12 12.4 20.5 8M12 12.4v8"/>',
  layers: '<path d="M12 3.8 3.6 8.2 12 12.6l8.4-4.4z"/><path d="M3.6 12.4 12 16.8l8.4-4.4M3.6 16.2 12 20.6l8.4-4.4"/>',
  grid:
    '<rect x="3.8" y="3.8" width="7" height="7" rx="1.4"/><rect x="13.2" y="3.8" width="7" height="7" rx="1.4"/>' +
    '<rect x="3.8" y="13.2" width="7" height="7" rx="1.4"/><rect x="13.2" y="13.2" width="7" height="7" rx="1.4"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1.3" fill="@c" stroke="none"/><circle cx="4.8" cy="12" r="1.3" fill="@c" stroke="none"/><circle cx="4.8" cy="17.5" r="1.3" fill="@c" stroke="none"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.6h17M9.5 9.6V19.5"/>',

  // --- dados e rede ---
  graph:
    '<circle cx="12" cy="5.6" r="2.3"/><circle cx="5.6" cy="16" r="2.3"/><circle cx="18.4" cy="16" r="2.3"/>' +
    '<path d="M10.6 7.6 6.9 13.9M13.4 7.6l3.7 6.3M7.9 16h8.2"/>',
  database: '<ellipse cx="12" cy="6.4" rx="7.5" ry="2.9"/><path d="M4.5 6.4v11.2c0 1.6 3.4 2.9 7.5 2.9s7.5-1.3 7.5-2.9V6.4"/><path d="M4.5 12c0 1.6 3.4 2.9 7.5 2.9s7.5-1.3 7.5-2.9"/>',
  cloud: '<path d="M7.4 18.5a4 4 0 0 1-.4-8 5.4 5.4 0 0 1 10.3 1.3 3.4 3.4 0 0 1-.5 6.7z"/>',
  container: '<rect x="3.5" y="9.5" width="17" height="8" rx="1.6"/><path d="M7 9.5V6.2h3.4v3.3M13.6 9.5V6.2H17v3.3M3.5 13.5h17"/>',
  hex: '<path d="M12 3.4 20 8v8l-8 4.6L4 16V8z"/><path d="M9.4 15V9.6l5.2 4.8V9"/>',

  // --- identidade VTEX ---
  storefront:
    '<path d="M4.2 9.4 6 4.6h12l1.8 4.8"/><path d="M4.2 9.4a2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0"/>' +
    '<path d="M5.6 11.6v7.8h12.8v-7.8"/>',
  message: '<path d="M4.5 5.5h15v10.2h-9L6 19.4v-3.7H4.5z"/><path d="M8.5 10.6h7"/>',
  pixel:
    '<rect x="4" y="4" width="5.4" height="5.4" rx="1" fill="@c" stroke="none"/>' +
    '<rect x="14.6" y="4" width="5.4" height="5.4" rx="1"/>' +
    '<rect x="4" y="14.6" width="5.4" height="5.4" rx="1"/>' +
    '<rect x="14.6" y="14.6" width="5.4" height="5.4" rx="1" fill="@c" stroke="none"/>',
  shield: '<path d="M12 3.5 19 6v5.6c0 4-2.9 7.4-7 8.9-4.1-1.5-7-4.9-7-8.9V6z"/><circle cx="12" cy="10.8" r="1.9"/><path d="M8.6 17c.6-1.9 1.9-2.9 3.4-2.9s2.8 1 3.4 2.9"/>',
  route: '<circle cx="6.4" cy="6.4" r="2.6"/><circle cx="17.6" cy="17.6" r="2.6"/><path d="M9 6.4h5.6a3.6 3.6 0 0 1 0 7.2H9.4a3.6 3.6 0 0 0 0 7.2"/>',

  // --- genéricos ---
  file: '<path d="M6 3.5h7.5L18 8v12.5H6z"/><path d="M13.2 3.7V8H18"/>',
  folder: '<path d="M3.5 18.6V6.4c0-1 .8-1.8 1.8-1.8h3.8l2.4 2.6h7.2c1 0 1.8.8 1.8 1.8v9.6c0 1-.8 1.8-1.8 1.8H5.3c-1 0-1.8-.8-1.8-1.8z"/>',
  folderOpen:
    '<path d="M3.5 18.6V6.4c0-1 .8-1.8 1.8-1.8h3.8l2.4 2.6h7.2c1 0 1.8.8 1.8 1.8v1.4"/>' +
    '<path d="M3.5 18.6 6 10.8c.2-.7.9-1.2 1.7-1.2h13c1.2 0 2 1.1 1.7 2.2l-1.9 6.2c-.2.9-1 1.4-1.9 1.4H5.3c-1 0-1.8-.8-1.8-1.8z"/>',
}

module.exports = { SHAPES }
