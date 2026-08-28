// @ts-check
'use strict'

/**
 * Geometria autoral dos ícones — a única fonte de desenho do conjunto.
 *
 * Cada forma é markup interno de SVG numa grade 24x24. O `build-icon-theme.js`
 * monta o ícone em DUAS CAMADAS (docs/traco-puelche.md):
 *
 *   placa   `plate`, `folder` ou `folderOpen`, preenchidas com a cor do papel
 *   marca   qualquer outra forma daqui, traçada por cima no tom escuro
 *
 * Quem desenha escreve só a geometria; a pintura é toda do gerador. A raiz do
 * SVG leva `fill` da cor do papel e `stroke="none"`, e a camada de marca leva
 * `fill="none"`, `stroke` do tom escuro e `stroke-width` 2 aparente.
 *
 * Tokens de cor, trocados na geração: `@c` é a cor da camada (papel na placa,
 * tom escuro na marca) e `@d` é o tom escuro dentro da placa — existe por causa
 * de um só desenho, a orelha da página.
 *
 * Regras (docs/traco-puelche.md), valem para toda forma daqui:
 *
 * - **Espessura única.** Nenhuma forma declara `stroke-width` próprio. Também
 *   nenhuma usa `scale`, que escalaria o traço junto — só o embrulho da marca
 *   escala, e lá a espessura é dividida de volta.
 * - **Caixa de conteúdo 2 a 22.** O desenho ocupa 20 das 24 unidades. Com o
 *   traço centrado, a tinta chega a 1 e 23.
 * - **Raio de canto 2 em toda esquina de 90°** de contorno fechado, escrito
 *   como arco explícito (`a2 2 0 0 1 …`) ou como `rx="2"` em `<rect>`. Não dá
 *   para confiar no `stroke-linejoin="round"`: com traço 2 ele entrega ~1u e
 *   visualmente não conta. Ângulo agudo de forma orgânica (bico do funil, ponta
 *   do lápis, dobra da página) fica — a regra é sobre retângulo.
 * - **Círculo com raio ≥ 2.5**, senão some a 16px.
 * - **A marca não tem preenchimento sólido**, exceto disco de raio ≤ 1.1
 *   (`python`). Sólido é assunto da placa. Quadrado sólido não existe.
 * - **Máximo de 3 elementos por marca.** Na placa e dentro da pasta a marca sai
 *   com ~8px de lado, e desenho de quatro elementos vira borrão nesse tamanho.
 *   `test/icons.test.js` cobra.
 * - **Vão mínimo de ~1.5u entre traços vizinhos.** Dois traços a 2u de
 *   distância se encostam: cada um cresce 1u para cada lado.
 */

/**
 * A placa de página: a silhueta que TODO ícone de arquivo usa por baixo da
 * marca. Retângulo 3..21 x 0.5..23.5, cantos de raio 2, canto superior direito
 * cortado em 45° a partir de (14, 0.5).
 *
 * A placa é ÁREA, não traço, então ela não obedece à caixa de conteúdo 2..22 —
 * essa caixa é a régua do traço. A silhueta vai a 0.5 e 23.5, quase sangria
 * total: o VS Code trava o ícone em 16px, e quanto da caixa ele ocupa é a única
 * alavanca de tamanho que sobra depois disso.
 *
 * A orelha é o triângulo que falta no canto cortado, preenchida no tom escuro
 * (`@d`) — é a dobra da página, e é o único lugar da placa com cor própria.
 */
const PLATE =
  '<path d="M14 .5H5a2 2 0 0 0-2 2v19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.5z"/>' +
  '<path d="M14 .5v5a2 2 0 0 0 2 2h5z" fill="@d"/>'

/** Escudo — base de `license` e `shield`. Ápice em (12, 2.5), base em (12, 21.7). */
const SHIELD =
  '<path d="M12 2.5 20.2 5.5v6.4c0 4.5-3.3 8.3-8.2 9.8-4.9-1.5-8.2-5.3-8.2-9.8V5.5z"/>'

/**
 * Estrela de raios afilados, centrada em (12, 12) — a construção do sunburst.
 * Cada raio é um quadrilátero: `meiaPonta` de meia-largura na ponta, `meiaBase`
 * no centro. As bases passam POR (12, 12), não em volta dele — com raio interno
 * maior que zero sobra um furo de meio pixel no miolo, e a estrela fica com um
 * ponto escuro no meio que o original não tem. Todos os subcaminhos têm o mesmo
 * winding, então o preenchimento nonzero devolve a união.
 *
 * Gerado em vez de escrito à mão porque oito raios são 32 coordenadas
 * trigonométricas: a lista de ângulos é revisável, o `d` de 400 caracteres não.
 */
function burst(angulos, raio, meiaPonta, meiaBase) {
  const r = (/** @type {number} */ n) => Math.round(n * 100) / 100
  const d = angulos
    .map((graus) => {
      const a = (graus * Math.PI) / 180
      const [dx, dy] = [Math.cos(a), Math.sin(a)]
      const [px, py] = [-dy, dx]
      const pt = (/** @type {number} */ dist, /** @type {number} */ meia, /** @type {number} */ lado) =>
        `${r(12 + dx * dist + px * meia * lado)} ${r(12 + dy * dist + py * meia * lado)}`
      return `M${pt(raio, meiaPonta, 1)}L${pt(raio, meiaPonta, -1)}L${pt(0, meiaBase, -1)}L${pt(0, meiaBase, 1)}Z`
    })
    .join('')
  return `<path d="${d}" fill="@c" stroke="none"/>`
}

/** @type {Record<string, string>} */
const SHAPES = {
  // --- estrutura e dados ---
  braces:
    '<path d="M8.6 2.6h-1a2 2 0 0 0-2 2v4.8a2.6 2.6 0 0 1-2.6 2.6 2.6 2.6 0 0 1 2.6 2.6v4.8a2 2 0 0 0 2 2h1"/>' +
    '<path d="M15.4 2.6h1a2 2 0 0 1 2 2v4.8a2.6 2.6 0 0 0 2.6 2.6 2.6 2.6 0 0 0-2.6 2.6v4.8a2 2 0 0 1-2 2h-1"/>',
  angles: '<path d="M9 5.5 2.5 12 9 18.5"/><path d="M15 5.5 21.5 12 15 18.5"/>',
  // uma órbita só. Três elipses e o núcleo davam quatro elementos concêntricos
  // que a 8px viram um disco; duas cruzadas viram uma lente sólida no meio.
  // Sobra a inclinada — é a metade do átomo que ainda diz React.
  react: '<ellipse cx="12" cy="12" rx="9.6" ry="5.6" transform="rotate(-28 12 12)"/>',
  // TS e JS perderam a moldura de 19x19: a moldura virou a placa. Sobram as
  // duas letras, ocupando a caixa inteira — a 8px cada letra tem ~4px e é o
  // limite do que dá para ler. O que separa .ts de .js na árvore é a cor.
  typescript:
    '<path d="M2.4 4.8h11.2M8 4.8v14.4"/>' +
    '<path d="M21.2 5.6c-3-1.3-6-.2-6 2 0 3.6 6.4 2.5 6.4 6.1 0 2.7-3.2 3.8-6.4 2.1"/>',
  javascript:
    '<path d="M11.6 3.8v11.6c0 3-2 4.8-4.8 4.8-2.3 0-4-1.1-4.9-2.9"/>' +
    '<path d="M21.2 5.6c-3-1.3-6-.2-6 2 0 3.6 6.4 2.5 6.4 6.1 0 2.7-3.2 3.8-6.4 2.1"/>',
  python:
    '<path d="M14 2.6c-4.1 0-5.4 1.6-5.4 4.1v2.7h5.7v1.2H6.7c-2.5 0-4.2 1.6-4.2 5.4s1.8 5.4 4.2 5.4h1.9v-3.5' +
    'c0-2.6 1.9-4.5 4.5-4.5h4.6c2.2 0 3.8-1.6 3.8-3.8V6.6c0-2.5-1.9-4.1-5.4-4.1z"/>' +
    '<circle cx="11.1" cy="6.4" r="1.1" fill="@c" stroke="none"/>',

  // --- estilo ---
  brush:
    '<path d="M4.5 15.8 16 4.3a3.2 3.2 0 0 1 4.5 4.5L9 20.3"/>' +
    '<path d="M4.5 15.8c-2 2-1.3 5-1.3 5s3 .7 5-1.3"/>',
  droplet: '<path d="M12 2.6c0 0 7 7.6 7 11.8a7 7 0 0 1-14 0c0-4.2 7-11.8 7-11.8z"/>',

  // --- documentos ---
  // linhas de texto, sem a página em volta: a página já é a placa. A última
  // linha é mais curta — é a assimetria que faz a marca ler a 8px.
  doc: '<path d="M3 5.4h18M3 12h18M3 18.6h11.4"/>',
  // a seta do logo do Markdown, dentro da página. O "M" ao lado dela cabe a
  // 32px e vira borrão a 16 — sobra a seta, que é a metade memorável da marca.
  markdown: '<path d="M12 3.6v11.6M6 9.8 12 15.8l6-6"/>',
  // as quatro quinas externas do livro eram os únicos 90° vivos que sobraram
  // fora dos retângulos: viraram arco de raio 2 como o resto do conjunto.
  // livro fechado, com a lombada arredondada à esquerda. O livro ABERTO — duas
  // folhas mais o vinco no meio — tem três verticais quase iguais e na placa
  // vira "|||". A lombada é a assimetria que faz a marca ler.
  book:
    '<path d="M6 2.6h15v18.8H6a3 3 0 0 1-3-3V5.6a3 3 0 0 1 3-3z"/>' +
    '<path d="M3 18.4A3 3 0 0 1 6 15.4h15"/>',
  history: '<circle cx="12" cy="12" r="9.5"/><path d="M12 6.3V12l3.9 2.4"/>',
  license: SHIELD + '<path d="M8.4 12.1 11 14.7l4.8-4.9"/>',

  // --- mídia e binário ---
  image:
    '<circle cx="7" cy="7" r="2.6"/>' +
    '<path d="M2.6 20.4 10.2 12.8a2 2 0 0 1 2.8 0l8.4 8.4"/>',
  // triângulo + quadrado arredondado + círculo: o léxico de "formas vetoriais".
  // O antigo era um quadrado com quatro alças sólidas — dois níveis de quadrado.
  vector:
    '<path d="M11.2 2.6 17.4 12.4H5z"/>' +
    '<circle cx="16.6" cy="17" r="4.4"/>',
  font: '<path d="M4 20.5 12 3.5l8 17"/><path d="M7.3 14.5h9.4"/>',
  // sem o trinco: a 8px ele é um traço de meio pixel no meio da caixa.
  archive:
    '<rect x="2.5" y="2.8" width="19" height="5.4" rx="2"/>' +
    '<path d="M4.6 8.2v11a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2v-11"/>',
  play: '<circle cx="12" cy="12" r="9.5"/><path d="M10 8.6 16.4 12 10 15.4z"/>',
  audio:
    '<path d="M9.4 17.2V4.4L20.2 2.2v12"/>' +
    '<circle cx="6.2" cy="17.2" r="3.2"/>',

  // --- configuração e ferramentas ---
  // dois cursores num trilho. A engrenagem de 6 dentes é o desenho certo a 24px
  // e uma bolha dentada a 8px: anel, dentes e miolo se encostam. O par de
  // trilhos com o cursor deslocado é assimétrico e diz "ajuste" no mesmo tanto.
  gear: '<path d="M3 8.2h18M3 16.8h18"/><path d="M8.4 5.4v5.6M15.6 14v5.6"/>',
  lock:
    '<rect x="3" y="10" width="18" height="11.4" rx="2"/>' +
    '<path d="M7 10V6.6a5 5 0 0 1 10 0V10"/>',
  // um dente só: a 8px os dois ficam a 1px um do outro e viram um borrão sobre
  // a haste. Anel mais diagonal já é a silhueta da chave.
  key: '<circle cx="7.8" cy="16.2" r="4.3"/><path d="M10.8 13.2 21 3M17.4 6.6 19.2 8.4"/>',
  // sem moldura: o terminal do Lucide é só o prompt e a linha de comando.
  terminal: '<path d="M3 5 10.5 12 3 19"/><path d="M13 19h8"/>',
  wrench:
    '<path d="M16.8 3.4a6 6 0 0 0-7.3 7.9l-6.2 6.2a2.4 2.4 0 0 0 3.4 3.4l6.2-6.2' +
    'a6 6 0 0 0 7.9-7.3l-3.6 3.6-2.8-2.8z"/>',
  flask:
    '<path d="M9.2 2.8v6.6L3.6 17.6c-1 1.8.3 3.6 2.3 3.6h12.2c2 0 3.3-1.8 2.3-3.6l-5.6-8.2V2.8"/>' +
    '<path d="M8 2.8h8M6.6 14.4h10.8"/>',
  slash: '<circle cx="12" cy="12" r="9.5"/><path d="M5.3 5.3 18.7 18.7"/>',
  box: '<path d="M12 2.4 21.2 7.6v8.8L12 21.6 2.8 16.4V7.6z"/><path d="M2.8 7.6 12 12.8l9.2-5.2M12 12.8v8.8"/>',
  layers:
    '<path d="M12 2.4 2.6 7.3 12 12.2l9.4-4.9z"/>' +
    '<path d="M2.6 12.2 12 17.1l9.4-4.9M2.6 16.5 12 21.4l9.4-4.9"/>',
  // grade 2x2 de peças: só a pasta de componentes usa. Blocos VTEX são
  // composição e ganharam forma própria (`blocks`).
  grid:
    '<rect x="2.8" y="2.8" width="7.2" height="7.2" rx="2"/><rect x="14" y="2.8" width="7.2" height="7.2" rx="2"/>' +
    '<rect x="2.8" y="14" width="7.2" height="7.2" rx="2"/><rect x="14" y="14" width="7.2" height="7.2" rx="2"/>',
  // dois blocos que se encaixam, um deslocado do outro: bloco VTEX é composição.
  blocks:
    '<rect x="2.6" y="6.6" width="14.8" height="14.8" rx="2"/>' +
    '<rect x="12.6" y="2.6" width="8.8" height="8.8" rx="2"/>',
  // os três discos viraram três traços curtos: disco de raio 1.1 na marca sai
  // com 1px e some, e traço curto lê como marcador do mesmo jeito.
  list:
    '<path d="M9.4 5.4h12M9.4 12h12M9.4 18.6h12"/>' +
    '<path d="M2.6 5.4h2.4M2.6 12h2.4M2.6 18.6h2.4"/>',
  table:
    '<rect x="2.6" y="3.4" width="18.8" height="17.2" rx="2"/>' +
    '<path d="M2.6 9.4h18.8M9.6 9.4v11.2"/>',

  // --- dados e rede ---
  // hexágono com o triângulo dentro: é a marca do GraphQL reduzida a dois
  // elementos. Os três nós ligados por três arestas eram quatro elementos.
  graph:
    '<path d="M12 2.4 20.6 7.4v9.2L12 21.6 3.4 16.6V7.4z"/>' +
    '<path d="M12 8.8 15.8 15.4H8.2z"/>',
  // sem a divisória do meio: a 8px ela fica a menos de 1px do tampo e as duas
  // curvas viram uma faixa grossa só.
  database:
    '<ellipse cx="12" cy="5.4" rx="8.6" ry="3.4"/>' +
    '<path d="M3.4 5.4v13.2c0 1.9 3.9 3.4 8.6 3.4s8.6-1.5 8.6-3.4V5.4"/>',
  cloud: '<path d="M7 20a4.6 4.6 0 0 1-.5-9.2 6.2 6.2 0 0 1 11.8 1.5 3.9 3.9 0 0 1-.6 7.7z"/>',
  hex: '<path d="M12 2.3 20.6 7.3v9.4L12 21.7 3.4 16.7V7.3z"/><path d="M9 15.8V8.6l6 6.8V8.2"/>',

  // --- identidade VTEX ---
  // o toldo e o festão saem no MESMO path: eram dois traços a 0.5u um do
  // outro, e a 8px encostavam e viravam uma barra grossa.
  message:
    '<path d="M4.6 3.4h14.8a2 2 0 0 1 2 2v9.6a2 2 0 0 1-2 2h-8.4l-4.6 4.2v-4.2H4.6a2 2 0 0 1-2-2V5.4a2 2 0 0 1 2-2z"/>' +
    '<path d="M7.6 10.2h8.8"/>',
  // farol de rastreamento: núcleo e duas ondas. O antigo era um tabuleiro de
  // dois quadrantes sólidos — quadrado sólido não existe neste conjunto.
  pixel:
    '<circle cx="12" cy="12" r="3"/>' +
    '<path d="M8.8 20A8.6 8.6 0 0 1 8.8 4"/><path d="M15.2 4a8.6 8.6 0 0 1 0 16"/>',
  shield:
    SHIELD +
    '<circle cx="12" cy="10.4" r="2.3"/><path d="M8.1 17.4c.7-2.2 2.2-3.5 3.9-3.5s3.2 1.3 3.9 3.5"/>',
  // um nó só, na origem, e o cotovelo terminando em seta. Dois círculos iguais
  // nas pontas são duas manchas idênticas a 8px e não dizem direção.
  route:
    '<circle cx="5.4" cy="5.4" r="3"/>' +
    '<path d="M5.4 8.4v8.6a2 2 0 0 0 2 2h11.2M15.4 15.2 19.2 19l-3.8 3.8"/>',
  // o V duplo da marca Vue
  vue: '<path d="M2.6 4.4h4.4L12 13.2l5-8.8h4.4L12 21.2z"/><path d="M8.8 4.4 12 9.8l3.2-5.4"/>',

  // --- vitrine e páginas do tema ---
  // Cupom: página com a barra rasgada embaixo. É `checkout-ui-custom`. A sacola
  // ficou com `cart`, e as duas juntas na mesma árvore precisavam de silhuetas
  // diferentes — mesma cor e mesma forma seriam a mesma pasta.
  receipt:
    '<path d="M5 21.4V4.6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16.8l-2.8-1.8-2.8 1.8-2.8-1.8-2.8 1.8z"/>' +
    '<path d="M8.8 8.4h6.4M8.8 12.6h6.4"/>',
  // Sacola: corpo mais alça. O carrinho de rodinhas tem cesto, duas rodas e o
  // cabo, quatro elementos que a 8px viram um rabisco; a sacola diz o mesmo
  // com dois.
  cart:
    '<path d="M4.6 7.6h14.8l-1.3 11.8a2 2 0 0 1-2 1.8H7.9a2 2 0 0 1-2-1.8z"/>' +
    '<path d="M8.8 10.4V6.6a3.2 3.2 0 0 1 6.4 0v3.8"/>',
  // Casa: telhado mais corpo. É a `home` do tema.
  home:
    '<path d="M2.8 10.6 12 3l9.2 7.6"/>' +
    '<path d="M5.2 8.8v10.4a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V8.8"/>',
  // Etiqueta de preço — a única forma do conjunto orientada na diagonal e
  // fechada: quina reta em cima à esquerda, bico embaixo à direita. Era o badge
  // da vitrine; virou `product`, que é o que ela sempre disse.
  tag:
    '<path d="M11.8 2.8H4.8a2 2 0 0 0-2 2v7a2 2 0 0 0 .6 1.4l8 8a2 2 0 0 0 2.8 0l7-7' +
    'a2 2 0 0 0 0-2.8l-8-8a2 2 0 0 0-1.4-.6z"/>' +
    '<circle cx="7.8" cy="7.8" r="1.7"/>',
  // Megafone: a `landing`. Aqui a semântica perdeu para a silhueta de
  // propósito. O desenho "certo" seria um wireframe — moldura com faixa de
  // herói e duas colunas —, mas na mesma listagem já moram `header`, `footer`,
  // `templates` e `schemas`, todas moldura-com-linhas: a 8px seria a quinta
  // mancha retangular da lista. A cunha do megafone é a única forma assimétrica
  // livre no conjunto, e "campanha" é o que uma landing de loja é.
  megaphone:
    '<path d="M2.8 10.4 21.2 5.2v13.6L2.8 13.6z"/>' +
    '<path d="M11.4 16.4a3.2 3.2 0 0 1-6.2-1.7"/>',
  // Lupa: a busca do tema (`search`, `plp`, `category`).
  search: '<circle cx="10.4" cy="10.4" r="7.4"/><path d="M15.9 15.9 21.2 21.2"/>',
  // Cabeçalho e rodapé: a caixa cheia marca de que lado da página a pasta mora.
  // São a mesma forma espelhada, e é o espelho que as distingue a 8px.
  header:
    '<rect x="2.6" y="3.4" width="18.8" height="6.6" rx="2"/>' +
    '<path d="M2.6 14h18.8M2.6 19h12.4"/>',
  footer:
    '<path d="M2.6 5h18.8M2.6 10h12.4"/>' +
    '<rect x="2.6" y="14" width="18.8" height="6.6" rx="2"/>',
  // Pessoa: `account`, `login`, `my-account`. O cadeado já é `admin`.
  person:
    '<circle cx="12" cy="7.4" r="4.4"/>' +
    '<path d="M4.2 21.2v-1.6a5 5 0 0 1 5-5h5.6a5 5 0 0 1 5 5v1.6"/>',
  // Hierarquia: haste com dois braços de comprimentos diferentes. O nó em cima
  // com dois embaixo — stem mais arco — lia como a mesma letra "A" da pasta
  // `fonts`; a haste lateral tem direção e nenhuma outra marca do conjunto tem.
  sitemap: '<path d="M6 3.4v17.2"/><path d="M6 9.4h7.4M6 16.6h11.4"/>',

  // --- placas (preenchidas, cor do papel) ---
  plate: PLATE,
  // pasta sólida em 0.5..23.5 x 2..22, pela mesma conta da placa: área não
  // obedece à caixa do traço, e o que sobra de alavanca de tamanho é ocupar
  // mais da caixa de 24.
  folder:
    '<path d="M.5 20V4a2 2 0 0 1 2-2h5.8l3 3.4H21.5a2 2 0 0 1 2 2v12.6' +
    'a2 2 0 0 1-2 2H2.5a2 2 0 0 1-2-2z"/>',
  // pasta aberta: a parede de trás no tom escuro e a faixa da frente na cor do
  // papel. Duas manchas da MESMA cor não leem como aberta — a silhueta sozinha
  // vira uma pasta mordida. O que separa as duas é o tom, não o contorno: a
  // parede fica na sombra e a faixa vem para a frente.
  folderOpen:
    '<path d="M.5 20V4a2 2 0 0 1 2-2h5.8l3 3.4H21.5a2 2 0 0 1 2 2v12.6' +
    'a2 2 0 0 1-2 2H2.5a2 2 0 0 1-2-2z" fill="@d"/>' +
    '<path d="M3.4 22a2 2 0 0 1-1.9-2.6l2.6-7.6A2 2 0 0 1 6 10.4h14.6a2 2 0 0 1 1.9 2.6' +
    'l-2.6 7.6a2 2 0 0 1-1.9 1.4z"/>',

  // -------------------------------------------------------------------------
  // Marcas de terceiro
  //
  // **Logo é sólido, não traçado.** É a única exceção à regra "sólido é da
  // placa, traço é da marca" (docs/traco-puelche.md): um sunburst ou um
  // wordmark em monoline a ~8px vira teia de aranha, e a mancha sobrevive. Cada
  // uma declara `fill="@c" stroke="none"` e, quando tem furo, `fill-rule`
  // evenodd — sempre num `<path>` só, para caber no teto de 3 elementos.
  //
  // Não são o asset oficial: são interpretações redesenhadas para os ~8px em
  // que o Explorer desenha. Fidelidade que não sobrevive a esse tamanho foi
  // trocada por silhueta que sobrevive.
  // -------------------------------------------------------------------------

  // `CLAUDE.md`, `AGENTS.md`, pasta `.claude`. Oito raios em vez dos onze
  // irregulares do original: a 8px cada raio tem ~1px, e o décimo primeiro só
  // fecha o vão entre os vizinhos e transforma a estrela em disco.
  claude: burst([0, 45, 90, 135, 180, 225, 270, 315], 9.8, 1.6, 0.9),

  // `package.json`. O quadrado com o recorte angular do "n" — é o que resta do
  // wordmark quando ele encolhe, e é por essa silhueta que o npm é reconhecido.
  npm:
    '<path fill-rule="evenodd" d="M4.2 2.6h15.6a1.6 1.6 0 0 1 1.6 1.6v15.6a1.6 1.6 0 0 1-1.6 1.6' +
    'H4.2a1.6 1.6 0 0 1-1.6-1.6V4.2a1.6 1.6 0 0 1 1.6-1.6z' +
    'M6.3 6.3h11.4v11.4h-2.9V9.1h-2.9v8.6H6.3z" fill="@c" stroke="none"/>',

  // `yarn.lock`. Novelo com o Y recortado. As agulhas cruzadas e os fios do
  // original são traços de 1u que somem a 8px, e uma diagonal atravessando o
  // disco lê como sinal de proibido — a mesma marca de `.vscodeignore`.
  yarn:
    '<path fill-rule="evenodd" d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6z' +
    'M10.5 18.4v-3.9L6.4 7.6h3.4l2.2 4.4 2.2-4.4h3.4l-4.1 6.9v3.9z" fill="@c" stroke="none"/>',

  // `.prettierrc`. As barras empilhadas de comprimento desigual — é o logo
  // inteiro, e por sorte é também a forma que melhor sobrevive a 8px.
  prettier:
    '<path d="M3 3.2h18v2.8H3zM3 8.6h11.6v2.8H3zM3 14h18v2.8H3zM3 19.4h8.4v2.8H3z" fill="@c" stroke="none"/>',

  // `.eslintrc`. O anel hexagonal. A parede tem 3.4u e sai com ~1.2px a 8px —
  // é o mínimo para o furo não fechar e o hexágono não virar mancha.
  eslint:
    '<path fill-rule="evenodd" d="M12 2.2 20.5 7.1v9.8L12 21.8 3.5 16.9V7.1z' +
    'M12 5.6 6.5 8.8v6.4l5.5 3.2 5.5-3.2V8.8z" fill="@c" stroke="none"/>',

  // `Dockerfile`. Casco mais a pilha de contêineres. A baleia inteira — cauda,
  // esguicho, olho — é detalhe que morre; o que identifica é a pilha sobre o
  // casco arredondado.
  docker:
    '<path d="M2.4 12.8h19.2c0 4.3-3.2 7.4-7.6 7.4H9.8c-4.1 0-7.4-2.9-7.4-6.6z" fill="@c" stroke="none"/>' +
    '<path d="M6 6.4h5.2v4.8H6zM13 6.4h5.2v4.8H13zM13 1.2h5.2V6H13z" fill="@c" stroke="none"/>',

  // `.gitignore`. O losango com o ramo recortado. A 8px os três nós do original
  // teriam 0.6px cada: sobra o losango, que já é a marca.
  git:
    '<path fill-rule="evenodd" d="M12 1.8 22.2 12 12 22.2 1.8 12z' +
    'M8.1 14.3 14.3 8.1l1.6 1.6-6.2 6.2z' +
    'M14.4 12.1h3v3h-3z" fill="@c" stroke="none"/>',

  // pasta `.github`. A silhueta do gato — cabeça, orelhas e o braço. É a única
  // marca daqui em que a fidelidade compensou o detalhe: o contorno é
  // reconhecível mesmo quando vira mancha.
  github:
    '<path d="' +
    'M12 2 C6.48 2 2 6.48 2 12 c0 4.43 2.86 8.16 6.84 9.49 0.5 0.09 0.69 ' +
    '-0.21 0.69 -0.47 0 -0.24 -0.01 -1.02 -0.01 -1.86 -2.51 0.46 -3.16 ' +
    '-0.61 -3.36 -1.17 -0.11 -0.29 -0.6 -1.17 -1.02 -1.41 -0.35 -0.19 -0.85 ' +
    '-0.65 -0.01 -0.66 0.79 -0.01 1.35 0.73 1.54 1.02 0.9 1.51 2.34 1.09 ' +
    '2.91 0.83 0.09 -0.65 0.35 -1.09 0.64 -1.34 -2.22 -0.25 -4.55 -1.11 ' +
    '-4.55 -4.94 0 -1.09 0.39 -1.99 1.02 -2.69 -0.1 -0.25 -0.45 -1.27 0.1 ' +
    '-2.65 0 0 0.84 -0.26 2.75 1.02 0.8 -0.22 1.65 -0.34 2.5 -0.34 s1.7 ' +
    '0.11 2.5 0.34 c1.91 -1.3 2.75 -1.02 2.75 -1.02 0.55 1.38 0.2 2.4 0.1 ' +
    '2.65 0.64 0.7 1.02 1.59 1.02 2.69 0 3.84 -2.34 4.69 -4.56 4.94 0.36 ' +
    '0.31 0.68 0.91 0.68 1.85 0 1.34 -0.01 2.41 -0.01 2.75 0 0.26 0.19 0.58 ' +
    '0.69 0.48 A10.01 10.01 0 0 0 22 12 c0 -5.52 -4.47 -10 -10 -10 z' +
    '" fill="@c" stroke="none"/>',

  // `manifest.json`, `vtex.json`, `.vtexignore`. O V, sólido. A VTEX não publica
  // um símbolo separado do logotipo; o V é a parte dele que sobrevive a 8px, e
  // sobre a placa rosa não sobra dúvida de onde a gente está.
  vtex: '<path d="M2.8 3.2h4.8L12 14.6l4.4-11.4h4.8L14.4 20.8H9.6z" fill="@c" stroke="none"/>',

  // -------------------------------------------------------------------------
  // Marcas de pasta (`<forma>Badge`)
  //
  // `folderSvg()` desenha `SHAPES[nome + 'Badge']` quando a chave existe e cai
  // em `SHAPES[nome]` quando não existe. Dentro do corpo da pasta a marca sai
  // com ~7px de lado a 16px, e um desenho que precisa de três elementos para se
  // explicar a 24px vira um borrão cinza nesse tamanho — indistinguível da
  // pasta vizinha. Aqui a regra é outra: **no máximo dois elementos, silhueta
  // acima de detalhe.** O ícone de arquivo continua exatamente como está,
  // porque só a pasta consulta o apelido; `data/icons.json` não muda.
  // -------------------------------------------------------------------------

  // `dist`: bandeja com seta entrando. O `archive` de arquivo é caixa +
  // divisória + trinco — a 7px some. E para uma pasta de build a seta diz
  // melhor "saída" do que a caixa de zip. A seta encurtou e as pernas do
  // bico abriram: com 4.4u de perna o V fechava contra a haste.
  archiveBadge:
    '<path d="M3.2 14.4v4.2a2 2 0 0 0 2 2h13.6a2 2 0 0 0 2-2v-4.2"/>' +
    '<path d="M12 2.6v7.8M7.4 5.8 12 10.4l4.6-4.6"/>',
  // `docs`: página com o canto dobrado grande. O livro aberto de duas folhas
  // (a versão anterior) tem três verticais quase iguais e a 7px vira um bloco
  // fechado. O corte do canto é a assimetria e por isso é exagerado: 8u de
  // diagonal, ~2.5px na tela — com os 5u da página de arquivo ele desaparece
  // e a marca empata com a moldura de `schemas`.
  bookBadge:
    '<path d="M11.4 2.8H6.6a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2v-8.4z"/>',
  // `scripts`: o mesmo `>_`, ocupando a caixa inteira.
  terminalBadge: '<path d="M2.6 3.4 13.4 12 2.6 20.6"/><path d="M14.6 20.6h6.8"/>',
  // `schemas`: moldura com faixa de cabeçalho, sem a divisória vertical.
  tableBadge: '<rect x="2.6" y="3.4" width="18.8" height="17.2" rx="2"/><path d="M2.6 9.4h18.8"/>',
  // `images`: moldura com um pico só. O disco do sol some antes de ajudar.
  imageBadge:
    '<rect x="2.5" y="2.5" width="19" height="19" rx="2"/>' +
    '<path d="M2.7 19 9.6 12.1a2.4 2.4 0 0 1 3.4 0l5.6 5.6"/>',
  // `assets`: duas camadas, as duas abertas. O losango fechado da versão
  // anterior tem 10.8u de altura e a caneta come 8.6 — sobra 2u de miolo, ou
  // seja, uma barra sólida. Duas setas em V abertas guardam o vão inteiro.
  layersBadge: '<path d="M2.8 7.2 12 12.4l9.2-5.2"/><path d="M2.8 14.6 12 19.8l9.2-5.2"/>',
  // `node`: só o hexágono. É a marca mais fraca do conjunto e está assumida
  // como tal: hexágono a 7px é um anel, e anel é a bolha do diagnóstico. Fica
  // porque é a única forma fechada e convexa que sobrou entre as 27 pastas —
  // lê por eliminação, não por silhueta. Um "N" dentro só fecharia o miolo.
  hexBadge: '<path d="M12 2.3 20.6 7.3v9.4L12 21.7 3.4 16.7V7.3z"/>',
  // `components`: duas peças na diagonal. Quatro quadrados a 7px são quatro
  // pontos iguais aos do `typescript` emoldurado.
  gridBadge:
    '<rect x="2.6" y="2.6" width="8.4" height="8.4" rx="2"/>' +
    '<rect x="13" y="13" width="8.4" height="8.4" rx="2"/>',
  // `types`: o "T" sozinho, sem moldura — a moldura é que empatava com
  // `schemas`.
  typescriptBadge: '<path d="M3.6 6h16.8M12 6v14"/>',

  // `pixel`: o farol deixa de emitir para os dois lados e passa a emitir de um
  // canto só — dois arcos concêntricos e a fonte. Anel + anel + núcleo, que é
  // o desenho de arquivo, é o caso puro de simetria central.
  // O ponto é um círculo TRAÇADO, não preenchido: dentro da pasta a caneta tem
  // 4.3u de largura e um disco de raio 1.1 sumiria debaixo dela.
  // sem a fonte: um disco de raio 1.2 sai com meio pixel e some debaixo do
  // arco de dentro. Os dois arcos concêntricos já apontam para o mesmo canto.
  pixelBadge:
    '<path d="M4.6 12.4a7 7 0 0 1 7 7"/>' +
    '<path d="M4.6 5.4a14 14 0 0 1 14 14"/>',
  // `admin`: cadeado. O escudo tem contorno curvo em volta inteira e a 7px
  // arredonda para um seixo; nem a ponta de baixo sobrevive. Tentei antes a
  // pessoa (cabeça + ombros): a cabeça e o arco se encostam e o conjunto lê
  // como um "A" — a mesma marca da pasta `fonts`. O cadeado diz o mesmo do
  // escudo (área restrita) e tem os dois pesos separados por um vão real:
  // o arco da haste em cima, o corpo embaixo.
  shieldBadge:
    '<rect x="3.4" y="10.4" width="17.2" height="11" rx="2.4"/>' +
    '<path d="M7.4 10.4V7.4a4.6 4.6 0 0 1 9.2 0v3"/>',
  tagBadge:
    '<path d="M12.6 2.6H4.6a2 2 0 0 0-2 2v8a2 2 0 0 0 .6 1.4l7.4 7.4a2.4 2.4 0 0 0 3.4 0' +
    'l6.6-6.6a2.4 2.4 0 0 0 0-3.4L14 3.2a2 2 0 0 0-1.4-.6z"/>',
  // `data`: três barras em escada. O cilindro é elipse sobre elipse — simetria
  // central com miolo de 1.5px, o retrato do borrão. A escada tem direção
  // (sobe para a direita) e continua dizendo "dado".
  databaseBadge: '<path d="M4.4 20.4V13M12 20.4V7.8M19.6 20.4V3.6"/>',
  // `src` e `modules`: a metade assimétrica de `</>`. O cubo isométrico é um
  // hexágono, e hexágono a 7px é anel — ainda por cima o mesmo anel de `node`.
  // As duas pastas compartilham a forma em data/icons.json, então a marca tem
  // de servir às duas: "código empacotado" serve.
  boxBadge: '<path d="M9.4 5.6 2.8 12l6.6 6.4"/><path d="M19.8 4.4 13.2 19.6"/>',
  // `snippets`: uma chave só, ocupando a caixa inteira. `{}` espelhado é
  // simétrico e, pior, as duas chaves se fecham no meio. E a chave precisa de
  // 5.6u de reentrância para a barriga aparecer — com os 2.4u do desenho de
  // arquivo ela vira um "C". Os arcos são elípticos (5.6 x 3) justamente
  // porque a reentrância tem de ser larga sem gastar altura, e as hastes retas
  // de 3.6u são o que separa a chave do "<" de `src`.
  bracesBadge:
    '<path d="M15.6 3h-1.4a2.4 2.4 0 0 0-2.4 2.4v3.6a5.6 3 0 0 1-5.6 3 5.6 3 0 0 1 5.6 3' +
    'v3.6a2.4 2.4 0 0 0 2.4 2.4h1.4"/>',
  // `messages`: bandeira. O balão de fala não sobrevive: com 13u de altura o
  // miolo tem 1.2px e a cauda, que é toda a assimetria, some como um entalhe
  // no canto — testei balão oval, balão com cauda grande e envelope, e os três
  // leem como "retângulo com um furo". A bandeira é a convenção de
  // `locales`/`i18n` e tem silhueta de um lado só: mastro à esquerda, pano à
  // direita, com o rabo de andorinha recortado.
  messageBadge:
    '<path d="M5.2 3.4v18"/><path d="M5.2 4.4h14.2l-3.4 4.8 3.4 4.8H5.2z"/>',
  // `graphql`: dois nós e a aresta entre eles. O triângulo de três nós fecha
  // um miolo minúsculo e vira mancha. A diagonal é a "\", ao contrário da "/"
  // de `styles` e `utils` — a 7px o sentido da diagonal é informação legível.
  graphBadge:
    '<circle cx="5.8" cy="5.8" r="2.8"/>' +
    '<path d="M8.3 8.3 21 21"/>',
  // `test`: o visto. O frasco tem gargalo estreito sobre corpo cônico e a 7px
  // as duas diagonais convergem: sai um triângulo com haste, que é a mesma
  // mancha do "A" de `fonts` (conferido lado a lado, ampliado). Alarguei o
  // gargalo para 6u e ainda lia como "A". O visto é o que a pasta guarda —
  // prova que passou — e é a única diagonal quebrada do conjunto.
  flaskBadge: '<path d="M3.4 12.6 9.4 18.6 20.6 6.4"/>',
  // `hooks`: o caminho que dobra, agora com bico. Os dois nós do `route` viram
  // dois pontos e o percurso entre eles some; a ponta de seta diz sozinha que
  // aquilo é passagem, e diz para onde.
  routeBadge:
    '<path d="M4.8 3.6v9.6a3.6 3.6 0 0 0 3.6 3.6h11"/><path d="M15.4 12.8 19.8 17.2 15.4 21.6"/>',
  // `clients`: a mesma nuvem, esticada para ocupar a caixa inteira. Ela já era
  // de um elemento só e assimétrica; o que faltava era altura — com 14u de
  // altura o miolo tinha 1.5px e fechava.
  cloudBadge: '<path d="M7 20.6a5.4 5.4 0 0 1-.6-10.8 7.4 7.4 0 0 1 14 2 4.6 4.6 0 0 1-1.8 8.8z"/>',
}

module.exports = { SHAPES }
