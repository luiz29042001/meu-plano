# Direção visual "Splits59" — proposta para avaliação

Autor: design-director. Data: 05/10/2026. Status: **proposta, aguardando o Luiz**. Nada aqui foi aplicado ao app.

Mockup para abrir no navegador: `docs/design/direcao-splits59.html`.
Capturas do site de referência: `docs/design/ref-splits59/`.

Referências internas que continuam valendo em qualquer direção: `src/utils/theme.ts` (tokens atuais), `docs/design/design-system.md` e `docs/design/auditoria-2026-10-05.md` (hierarquia, toque >= 44px, números protagonistas, estados).

---

## 1. Resumo em uma página

**A essência do site:** preto e branco, quase sem cor. Letra **condensada em caixa alta** (família DIN Condensed) para títulos, menus e botões, e um título gigante em grotesca negrito bem apertada. Cantos retos, linhas finas de 1px separando tudo, botões de contorno ou blocos pretos de largura total, muito espaço em branco. A cor fica só no produto (a faixa lateral creme e caramelo das leggings).

**Funciona num app de treino?** A **tipografia** funciona muito bem: letra condensada deixa os números enormes caberem em 390px ("4 × 8–10" em 64px numa linha). As **linhas finas no lugar de cards** deixam a tela mais calma, o que combina com o pedido de menos contraste. O que **não** funciona: texto pequeno e fino em caixa alta (o site usa muito texto condensado de 14 a 17px em peso leve), fotos grandes (o app não tem fotos e elas atrapalham no meio da série), cinza claro sobre branco e botões quadrados pequenos.

**Duas variações:**
- **A "Splits59 claro"**: fundo cinza-papel claro, tinta quase preta, botão principal preto. Mais fiel ao site.
- **B "Splits59 escuro suave"**: a mesma tipografia e as mesmas linhas finas, sobre um carvão um pouco **mais claro** que o atual, com texto em branco-gelo. Mantém o verde como ação principal.

**Recomendação: B.** Ela traz a parte do estilo que realmente melhora o app (tipografia, números grandes, linhas finas, cantos retos) e mantém o que o Luiz já pediu (escuro suave, menos contraste). A variação A muda a cara do app inteiro, obriga a reescurecer as cores dos dias que estão no banco e deixa a tela clara às 6h da manhã no treino em jejum. Os tokens das duas têm os mesmos nomes, então um "tema claro" (A) pode virar uma opção depois, sem refazer telas.

**Custo:** as duas exigem **um novo APK** para o Luiz e **publicar a web** para a Usuária 2. A troca de fonte não precisa de mudança nativa (o `expo-font` já está instalado), mas, como o app não tem atualização pelo ar, qualquer mudança visual no Android só chega com APK novo.

---

## 2. Como o site foi estudado

Ferramenta: **playwright mcp** (navegação e leitura, site público). Não houve login, nada foi para o carrinho. Ao abrir, o site mostrou um aviso de "país de entrega" e um convite de fidelidade; foram **fechados** no "X", sem aceitar nada. Não apareceu banner de cookies para aceitar.

Páginas vistas: home, coleção "Leggings" e produto "Airweight High Waist Legging", em 1280px e 390px. Os estilos foram lidos com `getComputedStyle` (fontes, tamanhos, tracking, cores, transições).

Capturas salvas em `docs/design/ref-splits59/`:

| Arquivo | O que mostra |
|---|---|
| `home-desktop-1280.png` | Topo da home: faixas pretas de aviso, foto de página inteira, título "SEASONAL SHIFT" e botão de contorno. |
| `home-desktop-1280-full.jpg` | Home inteira: carrossel de produtos, segundo banner, faixa preta com texto correndo, "Join the club", rodapé. |
| `colecao-desktop-1280.jpg` | Coleção: título "LEGGINGS" condensado, grade de fotos sem borda, etiqueta preta "NEW ARRIVAL". |
| `produto-desktop-1280.jpg` | Produto: nome e preço condensados, bolinhas de cor, **tamanhos em quadrados de contorno fino**, botão preto de largura total, acordeões com "+". |
| `home-mobile-390.jpg`, `colecao-mobile-390.jpg`, `produto-mobile-390.jpg` | As mesmas páginas no celular. |

Limitação: o site carrega fontes próprias (DIN Condensed, Helvetica Bold), que não são livres. Os nomes vieram da leitura do navegador; para o app, sugerimos equivalentes gratuitos.

---

## 3. A linguagem visual do site

| Aspecto | O que o site faz (medido) |
|---|---|
| **Paleta** | Preto `#000` e branco `#FFF` em 95% dos elementos. Cinza `#757575` em menus inativos, `#BFBFBF` em placeholders. Nenhuma cor de marca: a cor vem do produto (creme, caramelo, tijolo nas faixas laterais das leggings). |
| **Tipografia** | **DIN Condensed** (Regular e Light) em quase tudo: menus 19px, botões e títulos de seção 30 a 45px, nome de produto 17px, tudo em **caixa alta**, com **tracking levemente negativo** (cerca de -1%). Título de campanha em **Helvetica Bold 73px**, caixa alta, entrelinha 0,9 e tracking **-3,5%** (letras quase se tocando). Texto corrido em Helvetica normal, raro. |
| **Escala** | Saltos grandes: 14 → 17 → 19 → 30 → 45 → 73. Pouca coisa no meio. |
| **Grid e respiro** | Margem de 40px no desktop e 20px no celular. Fotos sangram até a borda. Muito espaço vazio entre seções (80px ou mais). Grade de produtos de 2 colunas com 4px de vão. |
| **Fotografia** | É o centro de tudo: foto de página inteira na home, fotos de produto em fundo cinza claro. |
| **Botões** | Dois tipos, ambos **sem arredondamento**: bloco preto sólido de largura total ("ADD TO CART") e contorno branco ou preto sobre a foto ("SHOP NEW"). Tamanhos e comprimentos em **quadrados de contorno fino**, o selecionado com borda preta. |
| **Navegação** | Texto condensado em caixa alta, link ativo **sublinhado**. No celular, ícones finos de linha (menu, busca, conta, sacola). |
| **Detalhes** | Linhas de 1px separando acordeões, "+" para abrir. Etiqueta preta com texto branco ("NEW ARRIVAL"). Faixas pretas de aviso no topo. |
| **Movimento** | Discreto: transições de cor e opacidade de 0,1 a 0,3s, carrossel com deslize de 0,5s. Uma faixa de texto correndo ("SALE UP TO 70% OFF…"). |

---

## 4. O que aproveitar e o que evitar num app de treino

O app é usado no meio da série, com a mão suada, o celular apoiado no banco, às vezes a 1 metro de distância, e com pressa.

### Funciona (aproveitar)

1. **Letra condensada para números.** A letra estreita deixa o número grande caber. "4 × 8–10" em 64px ocupa cerca de 190px de largura; numa letra normal, ocuparia 260px. É exatamente o que a auditoria pediu (B1): números protagonistas.
2. **Título do dia como manchete.** "PUSH A" em 72px, caixa alta e apertado, como o "SEASONAL SHIFT". Dá identidade sem enfeite e responde "o que eu treino hoje" em meio segundo.
3. **Linhas finas no lugar de cards.** Tira as caixas e as sombras. A tela fica mais calma e com menos contraste de blocos, que é o pedido do Luiz.
4. **Quadrados de contorno para escolhas** (os tamanhos P, M, G do site). Encaixam perfeitamente nos atalhos do cronômetro (30, 60, 90, 120 s) e na troca de variante da dieta, desde que tenham 48px.
5. **Acordeão com "+"** para as refeições, que já começam recolhidas.
6. **Um único botão sólido de largura total** como ação principal ("Começar treino"), igual ao "Add to cart".
7. **Sublinhado como seleção** nas abas dos dias, na cor do dia.
8. **A faixa lateral** das leggings vira a **faixa da cor do dia**: uma barra vertical de 6px ao lado do título. É a cor de categoria com papel de identidade, sem círculo nem fundo colorido.

### Não funciona (evitar ou adaptar)

| No site | Problema no treino | Como fica no app |
|---|---|---|
| Texto condensado leve de 14 a 17px em caixa alta | Difícil de ler de relance e no sol; caixa alta lê mais devagar em frases longas | Caixa alta **só** em títulos curtos, números e rótulos de 1 ou 2 palavras. Nomes de exercício e textos em **caixa normal, numa fonte de texto** (Inter), mínimo 16px. Nada em peso leve. |
| Nomes longos em caixa alta | "ELEVAÇÃO PÉLVICA COM BARRA (HIP THRUST)" quebra em 3 linhas e grita | Nome do exercício em caixa normal. |
| Fotos grandes | O app não tem fotos, elas pesam no 4G e distraem | Sem fotos. O "herói" é a tipografia: o nome do dia e os números. |
| Preto puro e branco puro | Contraste máximo, contra o pedido do Luiz | A: tinta `#262626` sobre papel `#F1F1EF` (13,4:1). B: gelo `#E9E7E3` sobre carvão `#222221` (12,9:1). Ambos com menos contraste que o app hoje (15,5:1). |
| Cinza claro sobre branco (`#BFBFBF`, 1,8:1) | Ilegível | Texto mais apagado nunca abaixo de 4,5:1. |
| Quadrados de 34 a 36px | Pequenos para o dedo no meio da série | Mínimo 48px de altura nos quadrados e 56px no botão principal e no "feito". |
| Link sublinhado como única pista de ação | Pouco visível como botão | Só para ações secundárias ("Anotar", "Como fazer"), e sempre com 44px de área de toque. |
| Faixa de texto correndo | Movimento sem motivo, atrapalha | Não usar. O único movimento contínuo é o cronômetro. |
| Hover e efeitos de passar o mouse | Não existem no celular | Estado "pressionado" com `cardHover`, 100ms. |
| Tracking negativo em texto pequeno | Letras grudam | Tracking negativo só de 32px para cima. Em rótulos pequenos em caixa alta, tracking **positivo** de 0,5px. |

---

## 5. Base comum às duas variações

### 5.1 Tipografia

Duas famílias, com papéis bem separados:

| Papel | Fonte no app | Pacote | Pesos | Uso |
|---|---|---|---|---|
| Condensada (títulos, números, abas, botões) | **Barlow Condensed** | `@expo-google-fonts/barlow-condensed` | 500, 600, 700 | Nome do dia, números (séries, reps, carga, tempo, kcal), abas, botões, rótulos curtos. É a alternativa gratuita mais próxima da DIN Condensed do site. |
| Texto (nomes, frases, listas) | **Inter** | `@expo-google-fonts/inter` | 400, 500, 600 | Nome do exercício, dicas, refeições, mensagens de erro. |

Fallback enquanto a fonte carrega ou se falhar:
- Android: `sans-serif-condensed` (Roboto Condensed do sistema) e `sans-serif` (Roboto).
- iPhone (Safari): `DIN Condensed` (vem no iOS, só em negrito) e `-apple-system`.
- Mockup no Windows: `Bahnschrift` (DIN do Windows) e `Segoe UI`.

Alternativa à Barlow Condensed, se o Luiz quiser algo mais "academia": **Oswald** (mais pesada e mais alta). Fica como segunda opção.

**Novos tokens de família** (em `theme.ts`):

```ts
export const Font = {
  condMedium: 'BarlowCondensed_500Medium',
  condSemi:   'BarlowCondensed_600SemiBold',
  condBold:   'BarlowCondensed_700Bold',
  body:       'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi:   'Inter_600SemiBold',
};
```

**Escala** (`FontSize`, mesmos nomes, valores novos, mais três tokens):

| Token | Hoje | Proposto | Fonte | Uso |
|---|---|---|---|---|
| `xs` | 11 | **12** | Inter | Mínimo absoluto (legenda de número). |
| `sm` | 12 | **13** | Inter / Barlow | Rótulo sob número, etiqueta. |
| `md` | 13 | **14** | Inter | Texto de apoio. |
| `base` | 15 | **16** | Inter | Texto padrão e campos (16 evita o zoom automático do Safari, ver auditoria item 7). |
| `lg` | 17 | **18** | Inter / Barlow | Nome do exercício atual, abas. |
| `xl` | 22 | **24** | Barlow | Título de tela. |
| `xxl` | 26 | **32** | Barlow | Números secundários (macros, 3/6). |
| `xxxl` | 32 | **40** | Barlow | Números da Home. |
| `display` (novo) | — | **64** | Barlow 700 | Séries × reps do exercício atual. |
| `hero` (novo) | — | **72** | Barlow 600 | Nome do dia (PUSH A), total de kcal. |
| `timer` (novo) | — | **80** | Barlow 700 | Tempo do cronômetro. |

A letra condensada parece menor que a normal no mesmo tamanho; por isso os números sobem bastante.

**Tracking** (novo token `Tracking`): `caps: 0.5` (rótulos em caixa alta até 18px), `tight: -0.5` (Barlow de 32 a 40), `tighter: -1.5` (64 a 80). Entrelinha dos números grandes: 0,92 do tamanho.

### 5.2 Espaçamento

Mantém os tokens atuais e acrescenta dois:

| Token | Valor | Uso |
|---|---|---|
| `xs`…`xxl` | 4, 8, 12, 16, 20, 24 | Sem mudança. |
| `xxxl` (novo) | 32 | Entre blocos dentro da tela. |
| `section` (novo) | 48 | Entre seções (respiro editorial). |

Margem lateral da tela: `Spacing.xl` (20), como o site no celular.

### 5.3 Raio

Cantos quase retos, como o site. Mesmos nomes, valores novos:

| Token | Hoje | Proposto |
|---|---|---|
| `sm` | 8 | **2** |
| `md` | 12 | **2** |
| `lg` | 16 | **4** |
| `xl` | 20 | **4** |
| `xxl` | 24 | **4** |
| `pill` | 500 | 500 (só para pontos e a barra de progresso) |

Usar 2px em vez de 0 suaviza o pixel no Android sem perder o ar de corte reto.

### 5.4 Toque

`Touch.min = 44` (da auditoria), mais `Touch.comfort = 48` (quadrados de escolha, abas, linhas de lista) e `Touch.primary = 56` (botão principal e o "feito" do exercício).

### 5.5 Componentes (como o estilo vira peça do app)

| Peça | Como fica | Tokens |
|---|---|---|
| **Manchete do dia** | Nome do dia em Barlow 600, `hero` (72), caixa alta, `tighter`, com a **faixa** de 6px na cor do dia à esquerda. Músculos embaixo em Inter `base`, `textMuted`. | `Font.condSemi`, `FontSize.hero`, cor de categoria |
| **Linha de números** | 2 a 3 números em Barlow 700 `xxxl`, rótulo embaixo em Inter `sm` `textMuted`, separados por linha vertical de 1px `border`. Sem card. | `FontSize.xxxl`, `Colors.border` |
| **Botão principal** | Bloco de largura total, 56px, Barlow 600 `lg` caixa alta, raio `sm`. A: fundo `primary` (tinta). B: fundo `primary` (verde). | `Colors.primary`, `Colors.onPrimary`, `Touch.primary` |
| **Botão de contorno** | 1px `borderStrong`, fundo transparente, 48px, Barlow 600. Ex.: "Descanso 90 s". | `Colors.borderStrong`, `Touch.comfort` |
| **Quadrados de escolha** | 48 × 48 no mínimo, contorno 1px `border`; o selecionado ganha contorno `borderStrong` e fundo `surface`. | idem |
| **Lista com linhas** | Linhas de 1px `border` entre itens, sem card. Linha com 56px de altura. "+" à direita para abrir, "›" para navegar. | `Colors.border` |
| **Abas dos dias** | Barlow 600 `lg` caixa alta, 48px de altura, ativa com sublinhado de 3px na cor do dia e texto `text`; inativas em `textMuted`. Mantém a armadilha 7 (altura fixa, `includeFontPadding: false`, `numberOfLines={1}`). | |
| **Etiqueta** | Bloco pequeno com fundo `text` e texto `bg`, Barlow 600 `sm` caixa alta ("HOJE", "FEITO"). Como o "NEW ARRIVAL". Uso raro. | |
| **Cronômetro** | Painel com fundo `bgElevated`, linha superior de 3px na cor do dia que **encolhe** conforme o tempo passa. Tempo em `timer` (80). Atalhos em quadrados de 48px. Ao terminar: linha e texto "Descanso concluído" em `green`. | |

### 5.6 Movimento

- Pressionar: fundo `cardHover`, 100ms.
- Abrir refeição: altura e "+" girando para "×", 200ms, saída suave.
- Marcar exercício feito: o "feito" preenche em 150ms; a linha do exercício recolhe para a forma compacta em 250ms e o próximo exercício se expande.
- Cronômetro: a linha superior encolhe continuamente; ao terminar, um pulso único de opacidade (300ms) e vibração/som como hoje.
- Respeitar "reduzir movimento" do sistema: sem animação de altura, troca direta.
- Nada de texto correndo, nada de entrada animada de seções.

### 5.7 Acessibilidade

- Toque: 44px mínimo em tudo, 48 em escolhas e abas, 56 no principal e no "feito".
- Contraste: texto normal >= 4,5:1 em todos os pares listados abaixo; números grandes passam com folga.
- Caixa alta só em textos curtos. Leitores de tela leem o texto em caixa normal (aplicar `textTransform: 'uppercase'` no estilo, nunca escrever o texto em maiúsculas no código).
- `accessibilityLabel` em todo botão de ícone (lista A15 da auditoria).
- Números com `fontVariant: ['tabular-nums']` para o cronômetro não "tremer" (a Barlow tem algarismos tabulares; conferir na implementação).

---

## 6. Variação A — "Splits59 claro"

Fiel ao espírito do site: papel cinza-claro neutro (não creme), tinta quase preta, botão principal em tinta. O verde vira só sinal de **progresso e feito**, e precisa escurecer para ser legível no claro.

### 6.1 Tokens de cor (substituem os do `theme.ts`)

```ts
export const Colors = {
  bg: '#F1F1EF',          // papel neutro (nao branco puro)
  bgElevated: '#F7F7F5',  // painel do cronometro, barra inferior
  card: '#FAFAF9',        // raro: so onde precisa destacar um bloco
  cardHover: '#E9E9E6',   // pressionado
  cardAlt: '#F1F1EF',
  surface: '#E4E4E1',     // quadrado selecionado, campo de texto
  border: '#D4D4D0',      // linhas finas
  borderStrong: '#262626',// NOVO: contorno de botao e escolha selecionada

  text: '#262626',        // tinta (nao preto puro)
  textMuted: '#595957',
  textFaint: '#6E6E6B',   // nao usar sobre surface em texto pequeno (4,0:1)

  primary: '#262626',     // NOVO: fundo do botao principal
  onPrimary: '#F1F1EF',   // NOVO: texto sobre o botao principal
  onAccent: '#F1F1EF',    // NOVO: texto sobre cor de categoria

  green: '#167A3D',       // progresso e "feito" (verde de pista, legivel no claro)
  greenDim: '#12663A',

  pushColor: '#A9502F',   // coral escurecido
  pullColor: '#376CA6',
  legsColor: '#2A7546',
  restColor: '#6E6E6B',
  pinkColor: '#A6486B',   // NOVO (Inferior A da Usuária 2)

  orange: '#8F5F10',
  red: '#B23A45',
  purple: '#7A4FA8',
  suppColor: '#8A5A12',
};
```

### 6.2 Cores dos dias e verde

- **Cores dos dias: escurecer.** As cores atuais (`#E07856`, `#5A93D4`…) dão 2,3 a 3:1 sobre o papel claro e somem no texto. As versões acima passam de 4,5:1.
- **Problema:** as cores dos dias ficam **no banco** (`workout_days.color`), uma por dia. Para a variação A, o app precisa de uma tabela de tradução no código (cor do banco → versão escura) ou de uma migração que troque as cores. A tradução no código é mais segura e deixaria o B funcionar ao mesmo tempo.
- **Verde:** sai do papel de "botão principal" (que vira tinta, como no site) e fica só como progresso e "feito", escurecido para `#167A3D`. O verde Spotify `#1DB954` dá 2,3:1 no claro e não pode ser usado em texto.
- Atenção: o verde de destaque e o verde do Legs ficam próximos. Já acontece hoje; no A, o "feito" sempre vem com o ícone de check para não depender só da cor.

### 6.3 Contraste (WCAG, calculado)

| Par | Contraste | Resultado |
|---|---|---|
| `text` sobre `bg` | 13,4:1 | AAA |
| `textMuted` sobre `bg` | 6,2:1 | AA |
| `textFaint` sobre `bg` | 4,5:1 | AA (no limite) |
| `textFaint` sobre `card` | 4,9:1 | AA |
| `onPrimary` sobre `primary` (botão) | 13,4:1 | AAA |
| `green` sobre `bg` | 4,8:1 | AA |
| `pushColor` / `pullColor` / `legsColor` / `pinkColor` sobre `bg` | 4,8 / 4,8 / 5,0 / 4,9 | AA |
| `onAccent` sobre `pushColor` | 4,8:1 | AA |
| `border` sobre `bg` | 1,3:1 | decorativo, ok |

### 6.4 Prós e contras de A

- **Prós:** é a leitura mais fiel do site; parece "revista"; ótima legibilidade em academia bem iluminada e na rua.
- **Contras:** inverte a direção que o Luiz aprovou (tema escuro suave); brilho alto às 6h no treino em jejum e no quarto à noite; exige escurecer as cores dos dias (banco ou tradução no código) e as cores das refeições; a barra de status do Android e do iPhone muda para ícones escuros; mais arquivos mudam.

---

## 7. Variação B — "Splits59 escuro suave"

A mesma tipografia, as mesmas linhas finas e os mesmos cantos retos, sobre um carvão **um pouco mais claro e neutro** que o atual, com texto em branco-gelo (um aceno ao creme da faixa das leggings, sem virar bege). O verde continua sendo o botão principal.

### 7.1 Tokens de cor (substituem os do `theme.ts`)

```ts
export const Colors = {
  bg: '#222221',          // antes #1A1A1C: um degrau mais claro
  bgElevated: '#272726',  // painel do cronometro
  card: '#2A2A29',        // raro: so onde precisa destacar um bloco
  cardHover: '#323231',
  cardAlt: '#262625',
  surface: '#363634',     // quadrado selecionado, campo de texto
  border: '#3E3E3B',      // linhas finas
  borderStrong: '#E9E7E3',// NOVO: contorno de botao e escolha selecionada

  text: '#E9E7E3',        // branco-gelo (antes #F2F2F4)
  textMuted: '#ADABA6',
  textFaint: '#9A9893',   // antes #7A7A82 (3,5:1); agora 5,5:1

  primary: '#1DB954',     // NOVO: botao principal continua verde
  onPrimary: '#222221',   // NOVO: texto escuro sobre verde
  onAccent: '#222221',    // NOVO: texto sobre cor de categoria

  green: '#1DB954',       // mantido
  greenDim: '#1AA34A',

  pushColor: '#E07856',   // mantidos (ja dessaturados)
  pullColor: '#5A93D4',
  legsColor: '#42B968',
  restColor: '#9A9893',
  pinkColor: '#E07A9A',   // NOVO (ja usado no banco)

  orange: '#E8A94A',
  red: '#E36A73',         // um pouco mais claro para passar 4,5:1 no novo fundo
  purple: '#B48BDB',
  suppColor: '#E0A85A',
};
```

### 7.2 Cores dos dias e verde

- **Cores dos dias: manter.** As cores dessaturadas atuais passam de 4,9:1 no novo fundo. Nada muda no banco além do que a auditoria já pediu (A10: trocar as cores saturadas antigas do Luiz).
- **Verde: manter** `#1DB954`, só para a ação principal e progresso, com texto escuro por cima.

### 7.3 Contraste (WCAG, calculado)

| Par | Contraste | Resultado |
|---|---|---|
| `text` sobre `bg` | 12,9:1 (hoje 15,5:1) | AAA, **menos contraste que hoje** |
| `textMuted` sobre `bg` | 6,9:1 | AA |
| `textFaint` sobre `bg` | 5,5:1 (hoje cerca de 3,5:1 no card) | AA |
| `textFaint` sobre `card` | 5,0:1 | AA |
| `textMuted` sobre `surface` | 5,3:1 | AA |
| `onPrimary` sobre `green` | 6,2:1 | AA |
| `onAccent` sobre `pushColor` / `pullColor` / `pinkColor` | 5,3 / 5,0 / 5,6 | AA |
| `pushColor` / `pullColor` / `legsColor` sobre `bg` | 5,3 / 5,0 / 6,4 | AA |
| `border` sobre `bg` | 1,5:1 | decorativo, ok |

### 7.4 Prós e contras de B

- **Prós:** mantém o pedido do Luiz (e até reduz o contraste e clareia o fundo); cores dos dias do banco continuam valendo; a Usuária 2 não leva um susto de "outro app"; menos arquivos mudam.
- **Contras:** menos "cara de Splits59" que a A, porque a marca é muito associada ao branco; o verde Spotify continua sendo o sinal principal (o site não tem cor de ação).

---

## 8. As três telas na nova linguagem

As duas variações têm o mesmo layout. Muda só a cor. O mockup mostra cada tela em A e em B lado a lado.

### Home — ação principal: **Começar treino**
1. Manchete do próximo dia ("PUSH A", 72px, com a faixa da cor do dia).
2. Linha de números: exercícios, séries, minutos estimados.
3. Botão "Começar treino" de largura total.
4. Lista com linhas: Dieta (com as kcal do dia), Calendário (treinos no mês). Total de treinos numa linha simples no fim.
- O avatar vira o texto "Perfil" (abre o menu, nunca faz logout direto; auditoria A5).
- Vazio (conta sem programa): manchete "SEM PROGRAMA", uma frase e o botão "Montar meu treino" (Roadmap 2).
- Erro: frase "Não foi possível carregar seu treino. Confira a internet." e botão de contorno "Tentar de novo".

### Treino — ação principal: **marcar a série/exercício como feito**
1. Abas dos dias com sublinhado na cor do dia.
2. Manchete do dia com contador "3/6" em 40px e barra fina de progresso.
3. Exercício atual **aberto**: nome em Inter 18, e embaixo os números gigantes "3 × 8–12" (64px) com a carga "22 kg" ao lado, vinda da anotação (auditoria B2). Botão de contorno "Descanso 90 s" (inicia o cronômetro) e os links "Anotar" e "Como fazer". O "feito" é um quadrado de 56px à direita do nome.
4. Exercícios feitos se recolhem numa linha só ("3 feitos", com os nomes em 13px e o link "Ver"), para o exercício atual e os botões dele nunca ficarem atrás do cronômetro (auditoria A14). Os próximos ficam compactos, com "4 × 12–20" em 22px.
5. Cronômetro fixo embaixo: tempo em 80px, "Pausar" e "+15 s", atalhos 30/60/90/120 em quadrados de 48px.
- Erro e vazio: mensagem e "Tentar de novo" no lugar do carregamento infinito (auditoria A4).
- Dado extremo: nome longo quebra em até 2 linhas em caixa normal; "12–20/perna" cabe em 64px condensado (cerca de 300px).

### Dieta — ação principal: **ver o que comer agora** (a próxima refeição já vem aberta)
1. Troca de variante em dois quadrados de 48px ("Variante A", "Variante B" para o Luiz; "Dia de treino", "Dia de descanso" para a Usuária 2).
2. Total de kcal em 72px, macros embaixo em 32px **sem cor** (auditoria B6).
3. Refeições em lista com linhas: horário condensado, nome, kcal à direita e "+". A próxima refeição aberta, com os itens e o link "Trocar".
4. Água no fim, como uma linha simples.
- Erro com "Tentar de novo" (auditoria A16). Pendente: "Sua dieta ainda não foi cadastrada pela nutricionista."

---

## 9. Impacto da troca

### O que muda no código (para o tech-lead e o ui-builder, depois do sim)

| Arquivo | A (claro) | B (escuro suave) |
|---|---|---|
| `src/utils/theme.ts` | Todos os valores de cor, raio e fonte; tokens novos | Alguns valores de cor; raio e fonte; tokens novos |
| `package.json` | `@expo-google-fonts/barlow-condensed` e `@expo-google-fonts/inter` | igual |
| `App.tsx` | Carregar as fontes (`useFonts`) e segurar a splash até carregar; barra de status com **ícones escuros** | Carregar as fontes; barra de status com `Colors.bg` (já pedido na auditoria A1) |
| `app.json` | Cor da splash e do ícone adaptativo para o papel claro; `userInterfaceStyle` | Cor da splash e do ícone para `#222221` |
| `public/index.html`, `public/manifest.json` | `theme-color` claro e barra do iPhone em `default` (ícones escuros) | `theme-color #222221` |
| 5 telas + `FloatingTimer.tsx` | Todo estilo de texto ganha `fontFamily`; cards viram listas com linhas; botões e escolhas novos | igual |
| `src/services/dietData.ts` | Cores das refeições escurecidas | Cores das refeições pelos tokens (auditoria A9) |
| Banco (`workout_days.color`) | Precisa de tradução no código ou migração com cores escuras | Só a correção A10 da auditoria |
| `docs/design/design-system.md` | Reescrever a direção ("claro editorial") | Atualizar a direção ("escuro suave editorial") |

### O que o Luiz precisa fazer depois

- **Novo APK: sim, nas duas.** O app não recebe atualização pelo ar, então qualquer mudança visual no Android exige instalar um APK novo (`/gerar-apk`). A fonte em si não exige mudança nativa: o `expo-font` já está no app.
- **Publicar a web: sim** (`/publicar-web`). A Usuária 2 pode precisar fechar e abrir o app do iPhone para pegar a versão nova.
- A web vai baixar as fontes na primeira abertura (cerca de 150 a 250 KB). Enquanto carrega, mostra a tela de carregamento, para não piscar a fonte errada.

### Esforço estimado

- **B:** médio. Tokens + fontes + refazer os estilos das telas (o que boa parte da auditoria já pedia).
- **A:** médio-alto. Tudo do B, mais cores do banco, barras de status, splash e uma revisão de todos os pares de contraste no claro.

---

## 10. Recomendação

**Variação B, "Splits59 escuro suave".**

1. O que faz o estilo Splits59 dar certo num app de treino é a **tipografia condensada, os números enormes, as linhas finas e os cantos retos**. Isso está inteiro na B.
2. A B respeita o pedido do Luiz: fundo mais claro que o atual e **menos contraste** (12,9:1 contra 15,5:1 hoje).
3. As cores dos dias que estão no banco continuam funcionando; a A obriga a escurecer todas.
4. Tela clara às 6h no treino em jejum incomoda; a B não.
5. Os tokens têm os mesmos nomes nas duas. Se um dia o Luiz quiser um "tema claro", a A entra como opção sem refazer as telas.

Se a escolha for B, a ordem sugerida: primeiro as correções A1 a A16 da auditoria (que valem em qualquer direção), depois a troca de tokens e fontes, tela por tela, começando pelo **Treino**, onde o ganho é maior.

---

## 11. O que precisa do seu sim

1. **Direção:** A (claro), B (escuro suave) ou manter o visual atual só com as correções da auditoria?
2. **Fonte:** trocar para **Barlow Condensed + Inter**? (Alternativa mais "academia": Oswald + Inter.)
3. **Cantos retos** (2 a 4px) no lugar dos cantos arredondados atuais?
4. **Botão principal:** verde (B) ou tinta preta (A)?
5. **Cores dos dias:** manter as atuais (B) ou escurecer (A, exige mudar o banco ou o código)?
6. **Caixa alta** nos nomes dos dias e nos números, com nomes de exercício em caixa normal: ok?
7. Ciente de que é preciso **gerar um APK novo** e **publicar a web** para ver a mudança.

Depois do sim, a atualização do `design-system.md` e do `theme.ts` entra no plano do tech-lead. Nada foi alterado no app.
