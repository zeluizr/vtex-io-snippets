# O traço Puelche

Spec de desenho do conjunto de ícones. Vale para as duas grades: os ícones de
arquivo e pasta (24×24, placa sólida com marca traçada) e os glifos do product
icon theme (16×16, contorno preenchido para virar fonte).

Quem desenha segue este documento. Quem revisa cobra por ele.

## A decisão

O idioma de traço é o do **Lucide**: monoline, ponta e junção redondas, canto
com raio. O que era nosso e continua nosso é o **vocabulário** — a cor por papel
semântico, a pasta que carrega a marca do que guarda, e as formas que só existem
no mundo VTEX (vitrine, pixel, blocos, rota, manifest).

O que mudou: **a silhueta de arquivo e pasta deixou de ser traçada e passou a ser
sólida.** O motivo é o tamanho. A 16px do Explorer, um traço de 2 unidades sai
com 1.33px; uma pasta traçada com uma marca traçada dentro vira uma malha de
linhas finas que some no fundo escuro e não distingue vizinho de vizinho. Mancha
lê nesse tamanho, linha não. É a mesma escolha do Material Icon Theme, e é o que
o conjunto precisava depois de medido a 16px reais.

O idioma de traço não morreu: ele foi para dentro. A **marca** continua monoline,
com a mesma espessura e o mesmo raio de canto. O que virou área é a silhueta que
segura a marca.

## As duas camadas

Todo ícone de arquivo e pasta é montado por `scripts/build-icon-theme.js` assim:

| camada | pintura | quem é |
| --- | --- | --- |
| **placa** | `fill` na cor do papel, `stroke="none"` | `folder`, `folderOpen` ou `plate` |
| **marca** | `fill="none"`, `stroke` no tom escuro, espessura aparente 2 | qualquer outra forma |

A raiz do SVG carrega a cor do papel; a placa herda e não declara pintura. Só a
orelha da página tem cor própria dentro da placa, pelo token `@d`.

**O tom escuro é derivado, não escolhido.** `rolesDeep[papel]` é o papel
misturado a **60% com o fundo do editor `#1A181F`**, e o gerador recusa qualquer
valor que não seja exatamente isso. Fica em família com o tema e, sobre o fundo
do Puelche, parece um recorte — mas é cor explícita, então o ícone continua certo
sobre qualquer fundo.

A conta de contraste entre placa e marca: `sage` sai a 3.55:1 e `punct` — o cinza
mais escuro da paleta, e o papel de 21 arquivos e 5 pastas — a **2.67:1**, abaixo
do piso de 3:1 para elemento gráfico. Medido a 16px reais, a marca ainda lê nas
placas cinzas. O número está travado em `test/icons.test.js` em vez de escondido:
mexeu na paleta ou na mistura, o teste conta o que aconteceu.

## Constantes

| eixo | grade 24×24 (arquivo e pasta) | grade 16×16 (produto) |
| --- | --- | --- |
| espessura da marca | **2** | **1.35** |
| raio de canto | **2** | **1.35** |
| caixa de conteúdo da marca | **2 a 22** | **1.5 a 14.5** |
| extensão da placa | **1 a 23** | não tem |
| ponta e junção | redonda | redonda |
| placa | sólida, cor do papel | não tem: é fonte, tudo é contorno |

A caixa de conteúdo é a régua do **traço**: uma forma desenhada de 2 a 22, com o
traço de 2 centrado, põe tinta de 1 a 23. A placa é **área**, não traço, então
ela ocupa direto essa mesma extensão de 1 a 23. As duas réguas descrevem o mesmo
tamanho de tinta — é por isso que a placa não parece maior que o contorno que ela
substituiu.

A grade 16 é a grade 24 dividida por 12/8: `2 × 16/24 = 1.333`, arredondado para
1.35. É a mesma razão de traço.

O raio de canto é **igual à espessura do traço** nas duas grades. Não é
coincidência, é a regra: o miolo de um canto arredondado com raio = espessura
fecha exatamente, sem sobra nem entalhe.

## Regras

**Nenhuma quina viva.** Toda esquina de 90° — na placa ou na marca — leva o raio
da tabela. Ângulo agudo de forma orgânica (bico do funil, ponta do lápis, dobra
da página) fica, porque o Lucide também os tem: a regra é sobre retângulo, não
sobre desenho.

**Sólido é da placa, traço é da marca.** A marca não tem preenchimento, com duas
exceções. A primeira: um disco de raio ≤ 1.1 na grade 24 (≤ 0.75 na 16) quando a
forma pede um ponto e o anel some — na prática o disco quase não sobrevive, sai
com meio pixel dentro da marca e vale mais tirar. A segunda são as **marcas de
terceiro**, abaixo. Quadrado sólido decorativo não existe.

**Espessura única.** Nenhuma forma declara espessura própria. A marca é escalada,
e o traço dela é dividido pela escala para sair na mesma espessura aparente.

**Respiro nas bordas.** A marca vive dentro da caixa de conteúdo; a placa, dentro
da extensão de tinta. Nenhuma das duas encosta na parede do viewBox.

**Máximo de três elementos por marca.** Na placa e dentro da pasta a marca sai
com ~8px de lado. A partir do quarto elemento o desenho vira uma mancha e duas
marcas vizinhas na árvore deixam de se distinguir. `test/icons.test.js` cobra.

**Densidade comparável.** Duas formas vizinhas na árvore não podem ter peso de
tinta muito diferente. Se um desenho precisa de cinco elementos para se explicar
e o vizinho de dois, o de cinco está errado: simplifique até caber no peso do
conjunto.

## As placas

**`plate`** é a página de todo arquivo: retângulo 3.5..20.5 × 1..23, cantos de raio
2, canto superior direito cortado em 45° a partir de (14, 1). O triângulo que falta
nesse canto é a **orelha**, preenchida no tom escuro — é a dobra da página, e é o
único lugar da placa com cor própria.

Consequência para quem desenha: **a marca de arquivo não pode ter moldura.** A
moldura virou a placa. Foi por isso que `javascript`, `typescript` e `image`
perderam o retângulo de 19×19 e `doc` e `markdown` perderam a página — página
dentro de página não lê.

**`folder`** é a pasta sólida em 1..23 × 2.4..21.6, pela mesma conta: preenchida,
a silhueta ocupa a extensão de tinta que o contorno traçado tinha.

**`folderOpen`** é a parede de trás no tom escuro mais a faixa da frente na cor
do papel. Duas manchas da mesma cor não leem como pasta aberta — a silhueta
sozinha vira uma pasta mordida, e foi o que a primeira tentativa entregou. O que
separa as duas é o tom: a parede fica na sombra e a faixa vem para a frente.

## A marca inscrita

A marca é a mesma biblioteca de formas dos dois lados da árvore, escalada por
`fit()` para preencher a altura livre da placa:

| destino | centro | altura de tinta | vão livre do corpo | escala |
| --- | --- | --- | --- | --- |
| placa de arquivo | (12, 14.4) | 12.8 | 16.0 | 0.54 |
| pasta fechada | (12, 13.65) | 12.4 | 15.9 | 0.52 |
| pasta aberta | (12.6, 15.9) | 10.4 | 11.8 | 0.42 |

As escalas de arquivo e pasta fechada são irmãs de propósito: uma marca que
sobrevive dentro da pasta sobrevive na placa, e as duas usam a mesma biblioteca.
`MARK_SPAN` converte "quanta tinta de altura eu quero" em fator de escala, e o
denominador é o vão de conteúdo das formas — hoje 20.

**O teto é uma proporção, não um número de escala.** A marca ocupa ~78% do vão
livre do corpo. A varredura original — a 16px reais, ampliada 8× — foi feita
sobre a pasta traçada e chegou a 0.47 como teto; aquele número era 76% de um
corpo menor. O corpo cresceu junto com a placa, então a escala subiu para 0.52 e
a proporção ficou onde estava. É a proporção que manda: acima de ~85% do vão a
tinta da marca encosta na parede e a silhueta de pasta some — deixa de ser "pasta
com marca" e vira "caixa cheia". Não adianta pedir mais tamanho; o que falta a
partir daí é desenho.

**Silhueta direcional.** A ~8px, forma centralmente simétrica não carrega
informação: elipses concêntricas, anéis, engrenagem, escudo, cubo e cilindro
viram todos a mesma mancha redonda ou quadrada. O que sobrevive é a silhueta
externa assimétrica — uma haste, uma diagonal, um recorte que aponta. É por isso
que `types` (um T), `scripts` (`>_`) e `styles` (a diagonal do pincel) leem, e a
engrenagem de seis dentes virou o par de cursores.

**Os dois apelidos de escape.** `markShape()` procura, nesta ordem:

```
pasta    SHAPES[nome + 'Badge']  ->  SHAPES[nome]
arquivo  SHAPES[nome + 'Mark']   ->  SHAPES[nome]
```

São dois porque a mesma forma pode querer coisas diferentes nos dois lugares: a
pasta `docs` quer um livro, o arquivo `.md` sobre uma placa de página não pode
ter outra página dentro. Hoje todos os arquivos usam a forma base — o apelido
`Mark` existe para o dia em que um deles divergir, sem obrigar a pasta a mudar
junto. `data/icons.json` não muda em nenhum dos dois casos: os dois lados
continuam apontando para a mesma forma.

### Marcas de terceiro

`CLAUDE.md` merece o sunburst do Claude mesmo sendo um `.md`, e é o `fileNames`
do VS Code — que ganha da extensão — que permite isso. Hoje têm marca própria:
Claude (`CLAUDE.md`, `AGENTS.md`, pasta `.claude`), npm, yarn, Prettier, ESLint,
Docker, Git, GitHub e VTEX.

**Logo é sólido, não traçado.** É a segunda exceção à regra de preenchimento.
Um sunburst ou um wordmark em monoline a ~8px vira teia de aranha; a mancha
sobrevive. Cada marca declara `fill="@c" stroke="none"` e, quando tem furo,
`fill-rule="evenodd"` — sempre num `<path>` só, para caber no teto de três
elementos.

**Não são o asset oficial.** São interpretações redesenhadas para os ~8px em que
o Explorer desenha, e fidelidade que não sobrevive a esse tamanho foi trocada por
silhueta que sobrevive: o sunburst tem oito raios e não onze, a baleia do Docker é
casco mais pilha sem cauda nem olho, o losango do Git tem uma diagonal e um nó no
lugar de três. Duas exceções a essa regra, onde o desenho original já era simples
o bastante para entrar quase inteiro: o quadrado do npm com o recorte do "n" e a
silhueta do gato do GitHub.

Quando não existe símbolo oficial que sobreviva, o certo é não inventar um. O
`yarn.lock` leva um novelo com um Y recortado, não o logo; o `.editorconfig`
continua no pictograma genérico de ajuste. Está dito no comentário de cada forma.

Um badge legível que não significa nada é pior que uma bolha. Quando não existe
desenho que seja ao mesmo tempo legível a ~8px e fiel ao que a pasta guarda, o
certo é não entregar badge e deixar a cor do papel fazer o trabalho.

## Como o produto é desenhado

O `svgicons2svgfont` lê só geometria e joga fora todo atributo de pintura: um
`stroke` viraria glifo vazio. Por isso o glifo de produto não pode ser traçado
direto — ele é **declarado como traço e convertido em contorno preenchido** por
`scripts/stroke-outline.js`.

Quem desenha escreve primitivas (`line`, `arc`, `ring`, `dot`, `rect`, `fill`),
não coordenadas de contorno. O motor cuida do winding: subcaminho aditivo
sempre horário, furo sempre anti-horário, no mesmo `d`. É o que dá ponta e
junção redondas de graça e o que torna o desenho revisável por humano.

Restrições que o lint de `test/icons.test.js` impõe e o motor respeita: só
`M`, `L`, `Q`, `A` e `Z` absolutos, só `<path>`, nada de `transform`, nenhum
subcaminho com área ~0, e toda coordenada dentro de 0..16.

## O que não muda

A paleta de 9 papéis e a atribuição papel → ícone em `data/icons.json`. A
precedência do VS Code (`fileNames` > `fileExtensions` > `languageIds`). O
sistema de pasta com marca inscrita. A cobertura parcial do chrome, que deixa o
não coberto cair no codicon nativo de propósito.

## As contas que ficam abertas

**As duas grades deixaram de ser um conjunto só.** O arquivo e a pasta são placa
sólida com marca; o glifo de produto é monoline. É escolha, não descuido: fonte
não carrega duas cores, então a barra lateral e a paleta de comandos não têm como
receber o mesmo tratamento. As duas famílias dividem o léxico e o raio de canto,
não a pintura.

**O `punct` está no limite.** 2.67:1 entre placa e marca é o pior caso do
conjunto e é também o papel mais frequente da árvore. Se um dia a paleta abrir,
o certo é dar cor própria a `dist`, `utils`, `config`, `.github` e `node_modules`
em vez de subir só a mistura desse papel.

**A espessura do produto.** A 16px o nosso glifo de produto sai com 1.35 de tinta
e o codicon nativo com ~1.1. Lado a lado na mesma barra, o nosso lê um pouco mais
pesado. Se um dia a cobertura do chrome ficar completa, dá para reabrir e descer
para 1.2.
