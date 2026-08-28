// @ts-check
'use strict'

/**
 * O preset de conforto do Puelche: fonte, ligature e respiro de leitura.
 *
 * Por que um comando e não `contributes.configurationDefaults`: uma extensão de
 * tema trocar a fonte de quem instala é invasivo, e quebra em silêncio para
 * quem não tem a fonte no disco. Aqui quem manda é o usuário — o comando mostra
 * o que vai mudar, aplica só o que ele confirmar, e guarda o valor anterior
 * para o desfazer.
 *
 * Módulo puro: não conhece `vscode` nem toca em disco. Recebe o que já foi lido
 * e devolve o que precisa ser escrito. Quem lê e escreve é o `extension.js`.
 */

/**
 * A fonte do preset: **Google Sans Code**.
 *
 * A escolha anterior era a Victor Mono, pelo itálico cursivo — o tema tem 12
 * chaves em itálico e a spec troca cor extra por itálico, então em teoria era a
 * que mais devolvia essa decisão. Na prática ficou ruim de ler em sessão longa:
 * o traço é fino e o cursivo, que é o ponto dela, cansa quando aparece em
 * comentário, parâmetro, atributo e import ao mesmo tempo.
 *
 * A Google Sans Code é mais legível e tem eixos variáveis. O que ela NÃO tem é
 * ligature: a tabela GSUB dela traz `aalt ccmp locl ss01`, sem `liga` nem
 * `calt`. O preset liga `editor.fontLigatures` mesmo assim porque é inofensivo
 * e passa a valer sozinho no dia em que uma fonte com ligature entrar na pilha.
 */
const FONTE = {
  nome: 'Google Sans Code',
  /** Casa com GoogleSansCode-Regular.ttf, GoogleSansCode_Proportional-… */
  arquivo: /^googlesanscode[-_. ]/i,
  cask: 'font-google-sans-code',
  url: 'https://fonts.google.com/specimen/Google+Sans+Code',
}

/**
 * O preset. `fontVariations` liga os eixos variáveis da Google Sans Code — é o
 * que dá o peso certo sem trocar de arquivo de fonte, e por isso não há
 * `fontWeight` fixo aqui.
 *
 * A pilha de `fontFamily` degrada: se a Google Sans Code sumir do sistema, cai
 * na Menlo, em vez de o editor escolher sozinho.
 */
const AJUSTES = {
  'editor.fontFamily': "'Google Sans Code', Menlo, monospace",
  'editor.fontLigatures': true,
  'editor.fontVariations': true,
  'editor.fontSize': 14,
  'editor.lineHeight': 1.6,
  'workbench.tree.indent': 16,
  'workbench.colorTheme': 'Puelche',
  'workbench.iconTheme': 'puelche-icons',
  'workbench.productIconTheme': 'puelche-product',
}

/**
 * A fonte está instalada? Recebe os nomes de arquivo já lidos das pastas de
 * fonte do sistema — quem varre o disco é o `extension.js`, porque as pastas
 * mudam por plataforma e isso não é decisão de lógica pura.
 *
 * @param {string[]} arquivos
 */
function fonteInstalada(arquivos) {
  return arquivos.some((f) => FONTE.arquivo.test(f))
}

const igual = (/** @type {any} */ a, /** @type {any} */ b) => JSON.stringify(a) === JSON.stringify(b)

/**
 * O que o preset mudaria, dado o que já está configurado.
 *
 * Só entra na lista a chave que de fato muda de valor: aplicar de novo em cima
 * de um preset já aplicado tem que dar lista vazia, senão o desfazer guardaria
 * o próprio preset como "valor anterior" e viraria uma via de mão única.
 *
 * @param {Record<string, unknown>} atual valores atuais do usuário (`undefined` = não definido)
 * @returns {{ chave: string, de: unknown, para: unknown }[]}
 */
function planejar(atual) {
  const mudancas = []
  for (const [chave, para] of Object.entries(AJUSTES)) {
    const de = atual[chave]
    if (!igual(de, para)) mudancas.push({ chave, de, para })
  }
  return mudancas
}

/**
 * O que escrever para voltar ao estado anterior.
 *
 * Chave que não existia antes volta a **não existir** — o valor é `undefined`,
 * que no `update()` do VS Code remove a entrada em vez de gravar o literal.
 * Gravar `undefined` como valor deixaria lixo no settings.json.
 *
 * @param {{ chave: string, de: unknown }[]} salvo
 * @returns {{ chave: string, para: unknown }[]}
 */
function restaurar(salvo) {
  return (salvo || []).map(({ chave, de }) => ({ chave, para: de }))
}

/** Uma linha `chave: atual → novo`, para o diálogo de confirmação. */
function descrever(/** @type {{ chave: string, de: unknown, para: unknown }} */ m) {
  const mostra = (/** @type {unknown} */ v) => (v === undefined ? '(não definido)' : JSON.stringify(v))
  return `${m.chave}: ${mostra(m.de)} → ${mostra(m.para)}`
}

module.exports = { AJUSTES, FONTE, fonteInstalada, planejar, restaurar, descrever }
