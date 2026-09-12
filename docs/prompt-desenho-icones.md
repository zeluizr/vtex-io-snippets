# Prompt — Desenho de ícones (SVG) no traço da casa

> Prompt autossuficiente para enviar ao ChatGPT (ou a outro modelo de texto).
> Cole TODO o bloco entre as linhas `====` e troque a lista do fim.
>
> **Não é prompt de geração de imagem.** Peça ao modelo de TEXTO que escreva o
> markup. Gerador de imagem devolve PNG com geometria impossível de converter;
> o que este pipeline consome é o `d` de um `<path>`.

====================================================================

# Tarefa

Você escreve **geometria SVG** para um icon theme do VS Code. Não gere imagem,
não descreva o desenho em palavras, não explique o conceito: devolva markup.

# O fato que decide tudo

O VS Code desenha esses ícones a **16 pixels**. Toda regra abaixo existe por
causa disso. Detalhe que não sobrevive a 16px não é detalhe, é sujeira.

# As duas grades

|                      | marca de arquivo/pasta | glifo de interface |
| -------------------- | ---------------------- | ------------------ |
| `viewBox`            | `0 0 24 24`            | `0 0 16 16`        |
| caixa de conteúdo    | 2 a 22                 | 1.5 a 14.5         |
| espessura do traço   | 3.7                    | 1.35               |
| raio de canto        | 2                      | 1.35               |
| teto de elementos    | 2                      | 3                  |

O raio de canto é **igual à espessura do traço**. Não é coincidência, é a regra
que amarra o conjunto.

# Regras invioláveis

1. **Mantenha o traço como traço.** Declare `stroke` e `stroke-width`. NUNCA
   expanda, converta em contorno ou rode "outline stroke". A linha de centro é o
   que o pipeline consome; contorno expandido obriga a engenharia reversa.
2. **Nenhuma quina viva.** Toda esquina de 90° leva o raio da tabela, escrito
   como arco explícito (`A2 2 0 0 1 …`). Não confie em `stroke-linejoin`.
3. **Sem cor.** Use `currentColor` e nada mais. Sem gradiente, sombra, `filter`,
   `opacity`, `style` ou classe. A pintura é aplicada depois, por um gerador.
4. **Sem embrulho.** Sem `transform`, `<g>`, `<mask>`, `<clipPath>`, `<use>`,
   `<rect>`, `<circle>`. Só `<path>`.
5. **Comandos absolutos e maiúsculos:** `M L Q A Z`. Prefira `Q` a `C`.
6. **Furo é furo:** subcaminho no mesmo `d` com `fill-rule="evenodd"`. Nunca uma
   segunda forma na cor do fundo por cima.
7. **Coordenadas dentro do `viewBox`**, sem exceção.
8. **Pisos de tamanho na grade 24:** círculo com raio menor que 2.5 desaparece a
   16px; furo menor que 1.6 unidades fecha; dois traços vizinhos precisam de
   ~1.5 unidades de vão, senão encostam.
9. **Logo de marca é SÓLIDO.** Um `<path>` só, `fill="currentColor"`,
   `stroke="none"`, `fill-rule="evenodd"` se tiver furo. Logo em monoline a 8px
   vira teia de aranha. Simplifique a silhueta até ela sobreviver: menos raios,
   menos dentes, menos detalhe interno que a marca original.
10. **Nada de skeuomorphism.** Sem profundidade, material, brilho, bisel ou
    perspectiva. O estilo é monoline geométrico, no idioma do Lucide.

# Formato de saída

Para cada ícone pedido, exatamente isto e nada mais:

```svg
<!-- nome-do-icone -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.7" stroke-linecap="round" stroke-linejoin="round">
  <path d="..."/>
</svg>
```

Logo de marca usa a variante sólida:

```svg
<!-- nome-da-marca -->
<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
  <path fill-rule="evenodd" d="..."/>
</svg>
```

Depois de cada bloco, **uma única linha**: quantos elementos visuais tem e por
que a forma continua legível a 16px. Sem introdução, sem conclusão, sem CSS, sem
HTML de página, sem sugestão de biblioteca.

# Confira antes de responder

- [ ] Cada `d` usa só `M L Q A Z` maiúsculos.
- [ ] Nenhuma coordenada fora do `viewBox`.
- [ ] Contagem de elementos dentro do teto da grade.
- [ ] Toda esquina de 90° arredondada com o raio certo.
- [ ] Nenhum `transform`, nenhuma cor literal, nenhum `<g>`.
- [ ] Reduza mentalmente a 16px: o que virar mancha indistinta, redesenhe.

# Os ícones

Desenhe, na grade de marca de arquivo (24×24):

<!-- TROQUE ESTA LISTA -->
- `vercel` — logo, sólido
- `cloudflare` — logo, sólido
- `supabase` — logo, sólido

====================================================================
