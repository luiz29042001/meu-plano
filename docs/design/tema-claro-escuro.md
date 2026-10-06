# Tema claro e escuro (linguagem Splits59) — spec definitiva

Autor: design-director. Data: 05/10/2026. Status: **aprovada a direção pelo Luiz** (gostou de A e B). Esta spec transforma `direcao-splits59.md` em regra de implementação.

Mockup: `docs/design/tema-claro-escuro.html` (abre no navegador; botão no topo alterna Claro/Escuro em todas as telas, e há a visão lado a lado).

Plano técnico em paralelo: `docs/tech/tema-claro-escuro.md` (tech-lead). Os **nomes de token** desta spec são estáveis; se algo precisar mudar, mude aqui primeiro.

---

## 0. Decisões em uma página

| Decisão | Valor |
|---|---|
| Temas | **Claro** (ex-variação A) e **Escuro** (ex-variação B, escuro suave). Mesmo layout, mesma tipografia, mesmos nomes de token. Muda só a cor. |
| Padrão | **Automático**: segue o tema do aparelho (Android e iPhone), inclusive se o aparelho mudar com o app aberto. |
| Escolha manual | Tela **Perfil** (aberta pelo quadrado da inicial na Home): seletor **Automático / Claro / Escuro**. Troca **imediata**, sem reiniciar, sem animação. |
| Onde a preferência fica | No **aparelho** (não no banco). Cada aparelho tem a sua. Chave `meu-plano:tema`, valores `system` / `light` / `dark`. |
| Botão principal | Claro: **tinta** `#262626` com texto claro. Escuro: **verde** `#1DB954` com texto escuro. Token único `primary`. |
| Verde | Progresso e "feito" nos dois. No claro escurece para `#137036` (o verde Spotify dá 2,3:1 no papel). |
| Cores dos dias | Continuam vindo de `workout_days.color`. O app **traduz** a cor por tema (mapa fixo + regra de reserva). **Nenhuma mudança no banco.** |
| Contraste | Todo texto >= 4,5:1 em **todos** os fundos de texto dos dois temas. `textFaint` corrigido nos dois (era 4,0:1 no claro sobre `surface` e 4,2:1 no escuro). |
| Barra do Android | Cor = `bg` do tema; ícones escuros no claro, claros no escuro. |
| Cronômetro móvel | Segurar e arrastar o painel para o **topo** ou a **base**; botão de mover como alternativa. Seção 12. |
| Notificação (Android) | Contagem regressiva fixa na gaveta + alerta ao terminar, com "+15 s" e "Parar". Seção 13. |
| Barra do iPhone (PWA) | `apple-mobile-web-app-status-bar-style` passa de `black-translucent` para **`default`** (barra opaca, nunca ilegível). `theme-color` por tema. |

---

## 1. Tokens de cor (os dois temas, mesmos nomes)

Dois objetos com **as mesmas chaves**: `lightColors` e `darkColors`. As telas leem a paleta ativa (ver seção 10). Chaves marcadas **novo** não existem no `theme.ts` atual.

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `bg` | `#F1F1EF` | `#222221` | Fundo de toda tela; barra de status; `theme-color`. |
| `bgElevated` | `#F7F7F5` | `#272726` | Painel do cronômetro, diálogo. |
| `card` | `#FAFAF9` | `#2A2A29` | Raro: bloco que precisa destacar (item aberto da refeição). |
| `cardHover` | `#E9E9E6` | `#323231` | Estado pressionado (100ms). |
| `cardAlt` | `#ECECE9` | `#262625` | Lista interna (itens da refeição aberta). |
| `surface` | `#E4E4E1` | `#363634` | Escolha selecionada, campo de texto, trilho da barra de progresso, esqueleto de carregamento. |
| `border` | `#D4D4D0` | `#3E3E3B` | Linhas finas de 1px (decorativo). |
| `borderStrong` **novo** | `#262626` | `#E9E7E3` | Contorno de botão de contorno, escolha selecionada, "feito" vazio, "hoje" no calendário, anel de foco na web. |
| `text` | `#262626` | `#E9E7E3` | Texto principal e números. |
| `textMuted` | `#4D4D4B` | `#B5B3AE` | Rótulos, músculos, apoio. |
| `textFaint` | `#646461` | `#A3A19C` | Dicas, itens feitos, futuro no calendário. **Corrigido** (antes `#6E6E6B` / `#9A9893`). |
| `primary` **novo** | `#262626` | `#1DB954` | Fundo do botão principal. |
| `onPrimary` **novo** | `#F1F1EF` | `#222221` | Texto/ícone sobre `primary`. |
| `onAccent` **novo** | `#F1F1EF` | `#222221` | Texto sobre cor de dia (etiqueta). |
| `green` | `#137036` | `#1DB954` | Progresso, "feito", "Descanso concluído". |
| `greenDim` | `#0F5E2D` | `#1AA34A` | "Feito" pressionado. |
| `onGreen` **novo** | `#F1F1EF` | `#222221` | Check sobre o "feito" preenchido. |
| `dragShadow` **novo** | `rgba(38,38,38,0.18)` | `rgba(0,0,0,0.45)` | Sombra do cronômetro **só enquanto é arrastado** (seção 12). |
| `pushColor` | `#A9502F` | `#E07856` | Dia Push; listra de refeição. |
| `pullColor` | `#376CA6` | `#5A93D4` | Dia Pull. |
| `legsColor` | `#2A7546` | `#42B968` | Dia Legs. |
| `restColor` | `#6E6E6B` | `#9A9893` | Descanso; reserva para cor inválida. |
| `pinkColor` **novo** | `#A6486B` | `#E07A9A` | Inferior A da Usuária 2. |
| `orange` | `#8F5F10` | `#E8A94A` | Listra de refeição; aviso. |
| `red` | `#B23A45` | `#E8787F` | Erro (texto), "Sair da conta". Escuro sobe de `#E0525E`. |
| `purple` | `#7A4FA8` | `#B48BDB` | Listra de refeição; Superior B. |
| `suppColor` | `#8A5A12` | `#E0A85A` | Suplementos; Glúteos C. |

Regras de uso:
1. **Nenhuma cor solta no código.** Inclusive `#000` no ícone de play da Home e `#2A1010`/`#E74C3C` no erro do Login: viram `onPrimary` e `red`.
2. Nada de transparência concatenada em cor (`cor + '26'`). No claro isso vira mancha suja. Onde hoje há fundo tingido (calendário, ícones da Home), o novo layout usa **barra/faixa sólida**, sem tinta de fundo.
3. Cores semânticas (`green`, `red`, `orange`, `purple`, cores de dia) como **texto** só sobre `bg`, `bgElevated`, `card` ou `cardAlt`. Nunca como texto sobre `surface` (passam como não-texto, mas alguns ficam entre 3,8 e 4,4:1).
4. Pares texto sobre cor: só `onPrimary` sobre `primary`, `onGreen` sobre `green`, `onAccent` sobre cor de dia traduzida.

### 1.1 Contraste WCAG (calculado)

Texto comum exige 4,5:1; número grande (>= 24px) e elemento não-texto, 3:1.

| Par | Claro | Escuro |
|---|---|---|
| `text` / `bg` | 13,4 | 12,9 |
| `text` / `surface` (escolha selecionada) | 11,9 | 9,8 |
| `textMuted` / `bg` | 7,5 | 7,6 |
| `textMuted` / `surface` | 6,7 | 5,8 |
| `textFaint` / `bg` | 5,3 | 6,2 |
| `textFaint` / `bgElevated` | 5,5 | 5,8 |
| `textFaint` / `card` | 5,7 | 5,6 |
| `textFaint` / `cardAlt` | 5,0 | 5,9 |
| `textFaint` / `cardHover` | 4,9 | 5,0 |
| **`textFaint` / `surface`** | **4,7** (era 4,0) | **4,7** (era 4,2) |
| `onPrimary` / `primary` | 13,4 | 6,2 |
| `onGreen` / `green` | 5,5 | 6,2 |
| `green` / `bg` | 5,5 | 6,2 |
| `green` / `bgElevated` (cronômetro concluído) | 5,8 | 5,8 |
| `red` / `bg` | 5,2 | 5,6 |
| `red` / `bgElevated` | 5,5 | 5,3 |
| `orange` / `bg` | 4,9 | 7,7 |
| `purple` / `bg` | 5,3 | 5,8 |
| `suppColor` / `bg` | 5,2 | 7,5 |
| cores de dia (traduzidas) / `bg` | 4,5 a 5,3 | 4,9 a 6,4 |
| `onAccent` / cor de dia | 4,5 a 5,3 | 4,8 a 6,4 |
| `borderStrong` / `bg` (não-texto) | 13,4 | 12,9 |
| `border` / `bg` (decorativo) | 1,3 | 1,5 |

O tema claro tem **menos** contraste que o app de hoje (15,5:1) e o escuro também. Os dois respeitam o pedido do Luiz.

---

## 2. Cores dos dias (banco) no tema claro e no escuro

`workout_days.color` guarda tons pensados para fundo escuro. O app **não usa a cor do banco direto**: passa por `dayColor(corDoBanco, tema)`, que devolve a cor certa para o tema. Banco intocado.

### 2.1 Mapa fixo (cores que existem hoje no banco)

Chave em maiúsculas, sem espaços. Inclui as cores saturadas antigas do Luiz (caso a correção A10 da auditoria ainda não tenha rodado no banco), que no escuro passam a usar a versão dessaturada.

| Cor no banco | Dia(s) | Claro | Escuro |
|---|---|---|---|
| `#E07856` | Push (Luiz) | `#A9502F` | `#E07856` |
| `#E8572A` (antiga) | Push (Luiz) | `#A9502F` | `#E07856` |
| `#5A93D4` | Pull (Luiz), Superior A (Usuária 2) | `#376CA6` | `#5A93D4` |
| `#2A7BE8` (antiga, 3,9:1 no escuro) | Pull (Luiz) | `#376CA6` | `#5A93D4` |
| `#42B968` | Legs (Luiz), Inferior B (Usuária 2) | `#2A7546` | `#42B968` |
| `#27AE60` (antiga) | Legs (Luiz) | `#2A7546` | `#42B968` |
| **`#E07A9A`** | **Inferior A (Usuária 2)** | **`#A6486B`** | `#E07A9A` |
| `#A878D4` | Superior B (Usuária 2) | `#7A4FA8` | `#A878D4` |
| `#E0A85A` | Glúteos C (Usuária 2) | `#8A5A12` | `#E0A85A` |
| `#8E8E96` / `#8E8E93` | Descanso | `#6E6E6B` | `#9A9893` |

Todas as saídas do claro passam 4,5:1 sobre `bg` e sustentam `onAccent` (claro) por cima. As do escuro passam 4,8:1 ou mais sobre `bg`.

### 2.2 Regra de reserva (cor nova que ainda não está no mapa)

Para quando alguém cadastrar uma cor no banco que não está acima:

- **Claro:** converter para HSL; limitar saturação a no máximo 45% e luminosidade a no máximo 50%; descer a luminosidade de 1 em 1 ponto até o contraste com `#F1F1EF` (`bg` claro) ficar >= 4,5:1. Ex.: `#E07856` daria `#A6593F`; `#E07A9A` daria `#B54568` (o mapa acima prefere `#A6486B`, mais sóbrio).
- **Escuro:** se o contraste com `#222221` já é >= 4,5:1, usar como está; senão subir a luminosidade de 1 em 1 ponto até passar.
- **Cor inválida ou vazia:** `restColor` do tema.
- Calcular uma vez por cor e tema (memorizar). A tradução é pura, sem rede.

### 2.3 Onde a cor do dia aparece (e onde não)

Ela só aparece como **faixa, barra, sublinhado ou etiqueta**; nunca como texto grande colorido nem como fundo tingido:
- Faixa de 6px à esquerda da manchete (Home, Treino).
- Sublinhado de 3px da aba ativa (Treino).
- Barra de progresso e linha do cronômetro.
- Barra de 4px no dia concluído do calendário e na legenda.
- Etiqueta rara com `onAccent` por cima.

---

## 3. Tipografia, escala, tracking, raios, espaçamento, toque

Iguais nos dois temas (vêm de `direcao-splits59.md` seção 5, agora definitivos).

**Famílias** (`Font`): `condMedium` Barlow Condensed 500, `condSemi` 600, `condBold` 700; `body` Inter 400, `bodyMedium` 500, `bodySemi` 600. Pacotes `@expo-google-fonts/barlow-condensed` e `@expo-google-fonts/inter`. Reserva: Android `sans-serif-condensed` / `sans-serif`; iPhone `DIN Condensed` / `-apple-system`.

**Escala** (`FontSize`):

| Token | Valor | Família | Uso |
|---|---|---|---|
| `xs` | 12 | Inter | Mínimo absoluto. |
| `sm` | 13 | Inter / Barlow | Rótulo sob número, etiqueta. |
| `md` | 14 | Inter | Apoio. |
| `base` | 16 | Inter | Texto padrão e campos (evita zoom do Safari). |
| `lg` | 18 | Inter / Barlow | Nome do exercício atual, abas, botões. |
| `xl` | 24 | Barlow | Título de tela, seção. |
| `xxl` | 32 | Barlow | Macros, números secundários. |
| `xxxl` | 40 | Barlow | Números da Home, contador 3/6, mês. |
| `display` | 64 | Barlow 700 | Séries × reps atual. |
| `hero` | 72 | Barlow 600 | Nome do dia, kcal do dia, "Meu Plano" no Login. |
| `timer` | 80 | Barlow 700 | Cronômetro. |

**Tracking** (`Tracking`): `caps: 0.5` (caixa alta até 18px), `tight: -0.5` (32 a 40), `tighter: -1.5` (64 a 80). Entrelinha dos números grandes: 0,92 × tamanho. Números sempre com `tabular-nums`.

**Caixa alta** só em: nome do dia, títulos de tela/seção, botões, abas, etiquetas, números. Sempre via `textTransform: 'uppercase'`, nunca no texto. Nome de exercício, frases, refeições: caixa normal, Inter.

**Raio** (`Radius`): `sm 2`, `md 2`, `lg 4`, `xl 4`, `xxl 4`, `pill 500` (só pontos e barra de progresso).

**Espaçamento** (`Spacing`): `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 20`, `xxl 24`, `xxxl 32` (novo), `section 48` (novo). Margem lateral da tela: `xl` (20).

**Toque** (`Touch`) **novo**: `min 44` (tudo), `comfort 48` (escolhas, abas, linhas, botão de contorno), `primary 56` (botão principal, "feito").

**Web larga** (> 600px): conteúdo centralizado com largura máxima 560px; fundo `bg` ocupa a janela inteira. Nada de colunas extras.

---

## 4. Componentes base (iguais nos dois temas)

| Peça | Spec | Tokens |
|---|---|---|
| Manchete do dia | Barlow 600 `hero` caixa alta `tighter`; faixa 6px `dayColor` à esquerda; músculos em Inter `base` `textMuted`. Rótulo > 10 caracteres cai para 56px. | `Font.condSemi`, `FontSize.hero` |
| Linha de números | 2-3 números Barlow 700 `xxxl` + rótulo Inter `sm` `textMuted`; separadores verticais 1px `border`; linha em cima e embaixo. | |
| Botão principal | Largura total, `Touch.primary`, `primary`/`onPrimary`, Barlow 600 `lg`+2 caixa alta, raio `sm`. Pressionado: opacidade 0,85 (100ms). Desabilitado: `surface`/`textFaint`. | |
| Botão de contorno | `Touch.comfort`, 1px `borderStrong`, fundo transparente, texto `text`. Pressionado: fundo `cardHover`. | |
| Link de ação | Inter 500 `base`, sublinhado 1px, área >= 44px. | |
| Escolha (quadrado/segmento) | `Touch.comfort`, contorno 1px `border`, texto `textMuted`; selecionado: contorno `borderStrong`, fundo `surface`, texto `text`. | |
| Lista com linhas | Linhas 56px, separador 1px `border`, "›" ou "+" em `textMuted`. | |
| Etiqueta | Fundo `text`, texto `bg`, Barlow 600 `sm` caixa alta. Ex.: "PRÓXIMA", "FEITO HOJE". | |
| Esqueleto (carregando) | Blocos `surface` com o tamanho do conteúdo final; opacidade 0,6 ↔ 1 em 1,2s; parado se "reduzir movimento". | |
| Bloco de erro | Frase em `text` (não vermelha), causa em `textMuted`, botão de contorno "Tentar de novo" largura total. Vermelho só numa faixa de 6px à esquerda (como a manchete). | `red` |

---

## 5. Seletor de tema e tela Perfil

### 5.1 Onde fica

- Home: no canto superior direito, um **quadrado de 44 × 44** com a inicial do nome (Barlow 600 20, contorno 1px `border`, raio `sm`). Hoje esse botão faz logout direto (auditoria A5); passa a **abrir a tela Perfil**. `accessibilityLabel`: "Abrir perfil e ajustes".
- Perfil é uma **tela da pilha** (desliza como as outras), não um painel por cima. Motivo: funciona igual no Android e no Safari, tem botão Voltar e gesto de voltar do iPhone, sem fundo escurecido nem foco preso.
- No Login não há seletor: vale a preferência salva no aparelho (padrão Automático).

### 5.2 Layout da tela Perfil (390px)

```
‹  PERFIL
[L]  Luiz Felipe
     Conta Google conectada
───────────────────────────────
Programa              Push Pull Legs
───────────────────────────────

APARÊNCIA
┌───────────┬─────────┬─────────┐
│AUTOMÁTICO │  CLARO  │ ESCURO  │   48px
└───────────┴─────────┴─────────┘
Segue o tema do celular. Agora: escuro.

(espaço)
┌───────────────────────────────┐
│        SAIR DA CONTA          │   48px, texto red
└───────────────────────────────┘
```

1. O olho vê 1o o **seletor de Aparência** (única ação frequente da tela), 2o quem está logado, 3o "Sair da conta" (embaixo, separado por `section` 48px, para não ser tocado sem querer).
2. Identidade: quadrado 56 × 56 com a inicial (Barlow 700 28) + nome Inter `bodySemi` `lg` + "Conta Google conectada" `textMuted` `md`. Sem e-mail na tela (privacidade; a pessoa sabe quem é).
3. Linha "Programa" com o nome do programa à direita (`textMuted`), sem ação por enquanto. **Só no Android**, logo abaixo, a linha "Avisos do cronômetro" com "Ativados" / "Desativados" (seção 13.4).
4. Título "Aparência" em Barlow 600 `xl` caixa alta.
5. **Seletor**: 3 segmentos iguais, colados, `Touch.comfort`, rótulos **Automático / Claro / Escuro** (caixa alta pelo estilo). `accessibilityRole="radiogroup"` no grupo, `radio` + `accessibilityState.checked` em cada um. Selecionado: contorno `borderStrong`, fundo `surface`, texto `text`.
6. Texto de apoio abaixo (Inter `md` `textMuted`), muda com a escolha:
   - Automático: "Segue o tema do celular. Agora: claro." / "… Agora: escuro."
   - Claro: "Sempre claro, mesmo com o celular no modo escuro."
   - Escuro: "Sempre escuro, mesmo com o celular no modo claro."
7. **Sair da conta**: botão de contorno largura total, contorno `border`, texto `red`. Abre a confirmação (o ui-builder já está fazendo): título "Sair da conta", texto "Deseja realmente sair?", botões "Cancelar" e "Sair". Cancelar é o padrão.

### 5.3 Feedback ao trocar

- **Imediato**: ao tocar, a tela Perfil e tudo por trás já repintam no novo tema, sem reiniciar e sem tela de carregamento. Barra de status e `theme-color` trocam no mesmo instante.
- **Sem animação de cor** (repintar o app todo com transição custa caro no Android e pisca). O único movimento é o segmento selecionado.
- Vibração curta no Android (10ms) ao trocar, como o "feito". Nada no iPhone.
- Sem toast: o próprio app mudando é o feedback. O leitor de tela anuncia "Claro, selecionado".
- Em Automático, se o aparelho mudar de tema com o app aberto, o app acompanha na hora (e o texto de apoio atualiza "Agora: …").

### 5.4 Estados

- Carregando perfil: nome vira esqueleto; seletor já funciona (não depende da rede).
- Erro ao carregar perfil: nome mostra "Atleta"; seletor e Sair continuam funcionando. Sem bloco de erro (a tela não depende disso).
- Falha ao salvar preferência no aparelho: aplica o tema mesmo assim nesta sessão; sem mensagem.
- Nome longo ("Maria Eduarda Albuquerque"): até 2 linhas, sem cortar.

---

## 6. Spec por tela (os dois temas)

O layout é idêntico nos dois temas. Abaixo, o que muda por tema aparece como "Claro / Escuro".

### 6.1 Login — ação principal: **Entrar com Google**

Hierarquia: 1) "MEU PLANO" em `hero` (72) caixa alta, `tighter`, alinhado à esquerda, a ~38% da altura; 2) frase "Seu treino, sua dieta e seu histórico, no seu celular." `textMuted` `base`; 3) lista com linhas (sem emoji, sem cards): "Treino do seu programa" / "Dieta da sua nutricionista" / "Calendário dos seus treinos", Inter `base`, 48px cada; 4) botão principal "Entrar com Google" (Claro: tinta; Escuro: verde) com o "G" em Barlow 700; 5) nota "Seus dados ficam salvos na nuvem." `textFaint` `md`.

Estados:
- Entrando: botão desabilitado com indicador `onPrimary` e texto "Entrando…".
- Cancelou o Google: volta ao normal, sem mensagem.
- Erro: bloco de erro acima do botão — "Não foi possível entrar." + causa em `textMuted` ("Confira a internet e tente de novo."). O botão principal continua "Entrar com Google" (é ele que tenta de novo; mesmo nome da ação do começo ao fim).
- Web larga: mesma coluna de 560px, centralizada.

### 6.2 Home — ação principal: **Começar treino**

Hierarquia: 1) manchete do próximo dia ("PUSH A") com faixa da cor do dia; 2) linha de números (exercícios, séries, minutos aprox.); 3) botão principal "Começar treino"; 4) lista com linhas: Dieta (kcal do dia ou situação), Calendário (treinos no mês); 5) rodapé "128 treinos concluídos desde o início".

Topo: "MEU PLANO" Barlow 700 `xl` à esquerda; quadrado da inicial à direita (abre Perfil). Abaixo: "Bom dia, Luiz. Segunda, 5 de outubro." `textMuted`.

Estados:
- Carregando: esqueleto da manchete (bloco 220 × 64), da linha de números e do botão; lista de Dieta/Calendário já aparece (é navegação).
- Erro: bloco de erro no lugar da manchete — "Não foi possível carregar seu treino." / "Confira a internet." + "Tentar de novo". Lista continua visível.
- Sem programa: manchete "SEM PROGRAMA" com faixa `restColor`, frase "Você ainda não tem um programa de treino.", **sem** botão principal até existir "Montar meu treino" (Roadmap). Dieta e Calendário continuam.
- Treinou hoje (sucesso): etiqueta "FEITO HOJE" ao lado do rótulo "Próximo treino", manchete do **próximo** dia, botão principal vira "Ver próximo treino" (mesmo destino).
- Dieta pendente: linha Dieta com valor "Em preparação" em `textFaint`, sem "›", não navegável.
- Extremos: "INFERIOR A" / "GLÚTEOS C" cabem em 72px; acima de 10 caracteres cai para 56px. Total "1.284" cabe no rodapé.

### 6.3 Treino — ação principal: **marcar o exercício como feito**

Hierarquia: 1) exercício atual aberto: nome Inter 600 `lg` + números `display` ("3 × 8–12") + "22 kg" `xxxl` (última carga); 2) "feito" de 56px à direita do nome; 3) manchete do dia `hero`−8 (64) com contador "3/6" em `xxxl` e barra fina de progresso na cor do dia.

- Abas dos dias: Barlow 600 `lg` caixa alta, 48px, ativa com sublinhado 3px `dayColor` e texto `text`; inativas `textMuted`. Altura fixa (armadilha 7).
- **"3 feitos" recolhido**: uma linha de 56px com o "feito" preenchido (`green` + check `onGreen`), "3 feitos" Barlow 600 22 `text`, nomes em Inter `sm` `textFaint` (1 linha, reticências) e link "Ver" à direita. "Ver" expande os feitos (200ms) e vira "Recolher". Tocar no "feito" de um exercício feito desfaz (como hoje).
- Próximos exercícios: linha compacta 56px, nome Inter `base`, "4 × 12–20" Barlow 600 22, "feito" vazio (contorno `borderStrong`).
- Ações do atual: botão de contorno "Descanso 90 s" (abre o cronômetro), links "Anotar" e "Como fazer".
- **Cronômetro flutuante**: painel fixo embaixo, fundo `bgElevated`, linha superior 1px `border` + linha de 3px `dayColor` que encolhe com o tempo. Rótulo "Descanso" `textMuted` + nome do exercício; tempo `timer` (80) `text`; botões de contorno "+15 s" e "Pausar"; atalhos 30/60/90/120 em quadrados 48px; link "Fechar". Respeita área segura inferior do iPhone (padding = 16 + inset). O conteúdo da lista ganha padding inferior igual à altura do painel, para o exercício atual nunca ficar escondido.
- Descanso concluído: linha superior cheia em `green`, rótulo "Descanso concluído" em `green` 600, tempo "0:00", botão "De novo". Pulso único de opacidade 300ms + vibração/som como hoje.

Estados:
- Carregando: abas reais (se o programa já veio) + esqueleto do exercício atual e de 3 linhas.
- Erro: bloco de erro "Não foi possível carregar seu treino." + "Tentar de novo" (auditoria A4).
- Sem programa: "Você ainda não tem um programa de treino." e link "Voltar ao início".
- Treino concluído (6/6): manchete com etiqueta "FEITO HOJE", barra cheia `green`, lista toda recolhida em "6 feitos", botão principal "Concluir treino" (se o fluxo atual exigir) ou mensagem "Treino de hoje concluído." `text`.
- Extremos: nome "Elevação pélvica com barra (hip thrust) unilateral" quebra em até 3 linhas Inter 18; "12–20/perna" em 64px cabe (~300px); carga "142,5 kg" cai para `xxl` se não couber ao lado.

### 6.4 Dieta — ação principal: **ver o que comer agora** (próxima refeição aberta)

Hierarquia: 1) troca de variante (2 segmentos 48px: "Variante A" / "Variante B" para o Luiz; "Dia de treino" / "Dia de descanso" para a Usuária 2); 2) total "2.150" `hero` + "kcal no dia"; 3) macros `xxl` sem cor; 4) refeições em lista: listra 3px na cor da refeição (tokens `red`, `orange`, `purple`, `pushColor`, `legsColor` do tema), horário Barlow `textMuted`, nome Inter 500, kcal Barlow, "+" / "−". A próxima refeição aberta com etiqueta "PRÓXIMA" e itens em `cardAlt`.

Estados:
- Carregando: esqueleto do total e de 5 linhas.
- Erro: bloco de erro "Não foi possível carregar sua dieta." + "Tentar de novo" (auditoria A16).
- Pendente (vazio): manchete "EM PREPARAÇÃO" com faixa `restColor`, frase "Sua dieta ainda está sendo preparada pela nutricionista." Sem botão.
- Extremos: "12.450" kcal cabe em 72px; nome de item longo quebra em 2 linhas; 9 refeições rolam normalmente.

### 6.5 Calendário — ação principal: **ver quando treinei neste mês**

Hierarquia: 1) mês "OUTUBRO" `xxxl` + "2026" `textMuted`, com setas ‹ › de 44px nas pontas; 2) linha de números: "4 neste mês" | "128 no total"; 3) grade; 4) legenda.

- Grade 7 colunas (D S T Q Q S S em Barlow `sm` `textFaint`), células 50 × 56, separadas por linhas 1px `border` só na horizontal. Número Barlow 600 20 tabular.
  - Dia passado sem treino: `textMuted`.
  - **Dia com treino**: número `text` 700 + **barra de 4px na `dayColor`** na base da célula. Sem fundo tingido (resolve o `cor + '26'` que suja no claro).
  - **Hoje**: contorno 1.5px `borderStrong` na célula.
  - Futuro: `textFaint`.
  - `accessibilityLabel` da célula: "5 de outubro, Inferior A concluído" / "7 de outubro, sem treino".
- Legenda: linhas de 44px, barra 16 × 4 na cor + nome do dia Inter `base` `textMuted`. Usa a mesma `dayColor` traduzida.

Estados:
- Carregando: grade com números, sem barras; no lugar dos números do topo, esqueleto.
- Erro: grade substituída por bloco de erro "Não foi possível carregar o calendário." + "Tentar de novo".
- Mês vazio: grade normal, "0 neste mês", frase "Nenhum treino em outubro." `textMuted` abaixo da grade.
- Extremos: mês de 6 semanas (grade 6 linhas); dois treinos no mesmo dia: barra dividida em duas metades com as duas cores.

### 6.6 Perfil — ver seção 5.

---

## 7. Interação e movimento (resumo)

| O quê | Como | Duração |
|---|---|---|
| Pressionar | fundo `cardHover` (ou opacidade 0,85 no principal) | 100ms |
| Trocar tema | troca direta, sem transição | 0 |
| Segmento selecionado | contorno e fundo mudam | 100ms |
| Abrir refeição / "Ver" feitos | altura + "+" vira "−" | 200ms, saída suave |
| Marcar feito | preenche 150ms; linha recolhe para "N feitos" | 250ms |
| Esqueleto | opacidade 0,6 ↔ 1 | 1,2s em loop |
| Cronômetro | linha encolhe contínua; pulso único ao terminar | 300ms |

"Reduzir movimento" do sistema: sem animação de altura e sem pulso do esqueleto.

---

## 8. Barra de status, splash e barra do navegador

| Onde | Claro | Escuro |
|---|---|---|
| Android `StatusBar` (expo-status-bar) | `style="dark"` (ícones escuros), `backgroundColor #F1F1EF` | `style="light"`, `backgroundColor #222221` |
| Android barra de navegação (gestos/botões) | `#F1F1EF`, botões escuros | `#222221`, botões claros |
| Android splash | `#F1F1EF` | `#222221` (variante `dark` da splash; segue o **aparelho**, não a escolha do app, porque roda antes do app) |
| iPhone PWA `theme-color` | `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F1F1EF">` | `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#222221">` |
| Escolha manual no app (web) | o app troca as duas metas por uma só com o `bg` do tema escolhido | idem |
| iPhone `apple-mobile-web-app-status-bar-style` | **`default`** (era `black-translucent`) | **`default`** |
| `<html>`/`<body>` na web | `background: bg` do tema ativo (evita faixa branca/preta no "puxar" do Safari) | idem |

Por que `default`: com `black-translucent` os ícones da barra ficam **sempre brancos** por cima do conteúdo; no tema claro ficariam invisíveis sobre `#F1F1EF`. Com `default` a barra é opaca e legível em qualquer caso. No modo instalado (tela de início), o iPhone pode pintar essa barra pela aparência do **aparelho** e não pela escolha do app: se a Usuária 2 escolher "Claro" com o iPhone no escuro, pode aparecer uma faixa escura fina no topo. É aceitável (legível) e precisa ser **conferido no iPhone real**. Se a barra não mudar depois de publicar, remover o atalho da tela de início e adicionar de novo.

---

## 9. Acessibilidade

- Toque: 44 mínimo; 48 escolhas, abas, segmentos, linhas; 56 principal e "feito".
- Contraste: tabela 1.1; nenhum texto abaixo de 4,5:1 nos dois temas.
- Seletor de tema: `radiogroup` com rótulo "Aparência"; cada opção `radio` com estado.
- "Feito": `role checkbox`, rótulo "Marcar <exercício> como feito", estado `checked`.
- Nada depende só de cor: "feito" tem check; dia de treino no calendário tem barra + rótulo acessível; erro tem frase, não só vermelho.
- Web: foco visível com contorno 2px `borderStrong` e afastamento 2px em todo controle.
- Fonte do sistema maior: textos Inter crescem; números `display`/`hero`/`timer` limitados a 1,2× para não estourar a linha.

---

## 10. Para o tech-lead / ui-builder

1. **Nomes estáveis.** `lightColors` e `darkColors` com exatamente as chaves da seção 1 (27 chaves, contando `dragShadow` da seção 12). Tipo único, ex. `ThemeColors`. `Font`, `FontSize`, `Tracking`, `Radius`, `Spacing`, `Touch` são **compartilhados** (não dependem do tema).
2. **Telas não podem mais importar `Colors` estático.** `StyleSheet.create` com cor no topo do arquivo congela o tema. Sugestão de contrato (decisão final do tech-lead): `const { colors, scheme } = useTheme()` + estilos criados por função `makeStyles(colors)` memorizada por tema. `scheme` é `'light' | 'dark'` (o efetivo, já resolvido o Automático).
3. **Preferência:** `'system' | 'light' | 'dark'`, padrão `'system'`, guardada no aparelho (AsyncStorage no Android, `localStorage` na web), chave `meu-plano:tema`. Não vai para o banco. Rótulos na UI: Automático / Claro / Escuro.
4. **Automático de verdade no Android:** `app.json` `userInterfaceStyle` precisa virar `"automatic"` (hoje está `"dark"`, e com isso o sistema sempre responde "escuro"). Verificar se `expo-system-ui` é exigido. **Precisa de APK novo.**
5. **Primeira pintura sem piscar:** Android segura a splash até ler a preferência e carregar as fontes. Web: script inline no `index.html` que lê `localStorage` + `prefers-color-scheme` e pinta `html { background }` e a `theme-color` antes do React montar.
6. **`dayColor(hex, scheme)`**: função pura com o mapa da seção 2.1 (chave normalizada em maiúsculas) e a reserva da 2.2. Usar em **todo** lugar que hoje lê `workout_day.color` / `nextWorkout.color` / `legend.color` (Home, Treino, Calendário, cronômetro). Sem mudança no banco.
7. **Remover cores soltas:** `#000` (play da Home), `#0F0F0F` (`App.tsx` StatusBar e `app.json` splash), `#2A1010`, `#C0392B44`, `#E74C3C` (Login), concatenações `cor + '26'`, `+ '1A'`, `+ '55'` (Home, Calendário). Cores das refeições em `dietData.ts` passam a ser **nomes de token** resolvidos na tela (auditoria A9).
8. **Barras:** `StatusBar` com `style` invertido ao `scheme` e `backgroundColor = colors.bg`, atualizado ao trocar. Barra de navegação do Android via `expo-navigation-bar` é desejável, não obrigatória (decisão do tech-lead; se ficar de fora, registrar).
9. **Web:** trocar `apple-mobile-web-app-status-bar-style` para `default`; duas metas `theme-color` com `media`; ao escolher manual, substituir por uma meta com o `bg`. `manifest.json` aceita um valor só: usar `#222221` em `theme_color` e `background_color` (splash do PWA; não segue a escolha).
10. **Confirmação de Sair:** é diálogo nativo (`Alert` / `window.confirm`), que segue o tema do **aparelho**, não o do app. Aceitável agora. Se um dia virar diálogo próprio: fundo `bgElevated`, título Barlow `xl`, botões "Cancelar" (contorno) e "Sair" (texto `red`).
11. **Avatar da Home** deixa de chamar `handleSignOut`; navega para `Profile`. Rota nova `Profile` na pilha.
12. **Ordem sugerida:** tokens + `useTheme` + `dayColor` → Perfil (para já testar a troca) → Treino → Home → Dieta → Calendário → Login. Cada tela verificada nos dois temas pelo qa (Playwright: `emulateMedia({ colorScheme })` + seletor manual).
13. **Fontes:** Barlow Condensed e Inter (já decididas na direção). Sem elas o mockup e a escala não fecham.
14. **Exige APK novo e publicar a web.** No iPhone, a Usuária 2 pode precisar fechar e reabrir o app (ou readicionar à tela de início, ver seção 8).

15. **Cronômetro móvel (seção 12):** posição `'bottom' | 'top'` no `TimerContext` (ou junto do `FloatingTimer`), salva no aparelho em `meu-plano:cronometro-posicao`. O contexto precisa expor a **posição efetiva** (inclui a subida automática com teclado) e a **altura do painel**, para as telas aplicarem o espaço em cima ou embaixo do conteúdo.
16. **Gesto:** pressionar 350ms + arrastar vertical. O app já tem `react-native-gesture-handler`; a escolha entre a `Animated` do RN e o Reanimated fica com o tech-lead (se exigir dependência nativa nova, já vai no mesmo APK). Na web o mesmo gesto precisa funcionar com toque no Safari.
17. **Teclado:** Android pelos eventos de teclado do RN; web pelo `visualViewport`. Com teclado aberto, a posição efetiva vira `top` e o arraste fica desligado.
18. **Botão de mover** e ações de acessibilidade ("Mover para cima/baixo") são obrigatórios: não é só gesto.
19. **Notificação (seção 13), só Android:** a contagem ao vivo usa o cronômetro **regressivo do próprio sistema** (horário de término = `endsAt`), não atualização a cada segundo. O `expo-notifications` do SDK 51 não parece oferecer isso; avaliar uma biblioteca com cronômetro regressivo e ações (ex.: notifee). Decisão do tech-lead. Dependência nativa: **APK novo**.
20. **Alerta no horário exato com a tela bloqueada:** agendar o "Descanso terminado" para `endsAt`. Alarme exato no Android 12+ tem regras (permissão especial e política da Play para apps que não são de relógio); alarme inexato pode atrasar no modo de economia de bateria. Escolher e **testar no celular do Luiz**. Atraso de até alguns segundos é aceitável; de minutos, não.
21. **Ações da notificação** ("+15 s", "Parar", "Continuar", "De novo") precisam funcionar com o app em segundo plano: atualizam o `endsAt` salvo, reagendam o alerta e atualizam a notificação; ao voltar, o `TimerContext` lê esse estado. Mesmos nomes dos botões do app.
22. **Permissão:** `POST_NOTIFICATIONS` no `app.json`. Guardar no aparelho se o painel explicativo já foi mostrado e quando ("Agora não" = 30 dias sem perguntar). Pedir só no primeiro descanso (13.4), nunca na abertura.
23. **Ícone e cor:** ícone pequeno monocromático branco (silhueta de cronômetro, 96 × 96 px, fundo transparente) a criar em `assets/`. Cor de destaque `#1A9348`, constante fora das paletas (ex. `NotificationColors.accent`), porque a gaveta segue o tema do aparelho.
24. **Web/iPhone:** sem notificação. Só o cronômetro móvel e a subida com teclado valem lá.
---

## 12. Cronômetro móvel (arrastar para o topo ou para a base)

Pedido do Luiz: liberar a área de anotações enquanto o descanso corre. O painel do cronômetro (o mesmo `FloatingTimer`, presente em todas as telas) pode ficar em **duas posições**: **base** (padrão, como hoje) ou **topo**. Não existe posição livre no meio: duas posições fixas são previsíveis e nunca cobrem o botão de voltar.

### 12.1 Sinal de que dá para mover

- Uma **alça** de 32 × 4px, centralizada a 6px da borda do painel que fica para o lado do conteúdo (na base: borda de cima; no topo: borda de baixo). Cor `textFaint` com opacidade 0,6. Raio `pill`.
- Um **botão de mover** de 44 × 48 na linha dos atalhos, antes de "Fechar": seta para cima (na base) ou para baixo (no topo). É também a **alternativa acessível sem gesto** (12.7).

### 12.2 Pressionar e segurar

- **Onde:** em qualquer área do painel que não seja botão, atalho ou link (o tempo, o rótulo, a alça, o fundo). Botões continuam respondendo ao toque normal.
- **Tempo:** 350ms segurando sem mover mais de 8px. Um toque curto não faz nada (não briga com a rolagem da tela).
- **Feedback ao "pegar":**
  - escala 1,02 em 120ms;
  - contorno 1px `borderStrong` em volta do painel;
  - sombra **só enquanto arrasta**: `0 8 24` com o token novo `dragShadow` (é a única sombra do app; ela comunica "isto está levantado");
  - vibração curta no Android (15ms, como um clique). Na web/iPhone não há vibração (o Safari não suporta); o realce visual basta.
- O tempo **continua correndo** durante todo o arraste, e os números não tremem (`tabular-nums`).

### 12.3 Enquanto arrasta

- O painel segue o dedo **só na vertical** (largura e posição horizontal fixas), com a escala 1,02, o contorno e a sombra.
- Aparecem as duas **zonas de encaixe**, no tamanho exato que o painel terá ali:
  - **topo:** logo abaixo do cabeçalho da tela;
  - **base:** encostada na borda de baixo (respeitando a barra de gestos/home).
  - Cada zona é um retângulo tracejado 1.5px `borderStrong` com opacidade 0,45 e o texto "Soltar em cima" / "Soltar embaixo" (Barlow 600 `lg` caixa alta, `textMuted`).
  - A zona **mais próxima** do centro do painel fica ativa: opacidade 1 e fundo `surface`. Ao trocar de zona ativa, vibração de 10ms no Android.
- O conteúdo da tela atrás não rola durante o arraste.

### 12.4 Soltar e encaixar

- Ao soltar, o painel vai para a **zona ativa**. Se o dedo soltou rápido (velocidade > 0,5 px/ms), vale a direção do movimento, mesmo que o centro ainda esteja mais perto da outra zona.
- Animação: 220ms, saída suave (desacelerando), escala volta a 1,0, a sombra some e o contorno some.
- Vibração de 10ms no Android ao encaixar.
- "Reduzir movimento" ligado: sem animação, troca direta.
- A posição escolhida fica **salva no aparelho** (chave `meu-plano:cronometro-posicao`, valores `bottom` / `top`; padrão `bottom`) e vale para os próximos descansos e para todas as telas.

### 12.5 Posição no topo

- Posição: `área segura de cima` + **altura do cabeçalho da tela (56px)**. O painel nunca cobre a barra de status, o notch nem o botão Voltar/título. Na tela Treino ele cobre as abas dos dias (pouco usadas no descanso); quem precisar delas move de volta.
- Linha de 1px `border` embaixo do painel (em vez de em cima) e a linha de progresso de 3px na cor do dia também na borda de baixo (a borda que encosta no conteúdo).
- **Compacto** no topo: rótulo + nome do exercício numa linha, tempo em `display` (64) em vez de `timer` (80), botões "+15 s" e "Pausar" na mesma linha do tempo, e o botão de mover. **Sem a linha de atalhos** 30/60/90/120 (só na base). Altura aproximada: 112px, contra 225px na base.
- O conteúdo da tela ganha um espaço em cima igual à altura do painel, para nada começar escondido; na base, o espaço vai embaixo (como já é hoje).

### 12.6 Teclado aberto (anotação)

- Se o teclado abre com o painel **na base**, o painel **sobe sozinho para o topo**, compacto, em 220ms, e a tela rola para manter o campo de anotação visível entre o painel e o teclado. Quando o teclado fecha, **volta para a base** (a escolha salva não muda).
- Se o painel já está no topo, nada muda.
- Durante o teclado aberto, o arraste fica desligado (evita perder o foco do campo).
- Web/iPhone: o teclado é detectado pela mudança de `visualViewport`. Se a detecção falhar, a pessoa ainda pode mover o painel pelo botão.

### 12.7 Alternativa acessível (sem gesto)

- Botão de mover (12.1): `accessibilityLabel` "Mover cronômetro para cima" / "Mover cronômetro para baixo". Ele faz o mesmo encaixe animado.
- No Android, o painel também expõe ações de acessibilidade ("Mover para cima", "Mover para baixo") para o TalkBack.
- O leitor de tela anuncia "Cronômetro no topo" / "Cronômetro na base" depois do encaixe.

### 12.8 Temas

Igual nos dois. Fundo `bgElevated`, contorno ativo `borderStrong`, zonas `borderStrong` / `surface`, sombra `dragShadow`:

| Token novo | Claro | Escuro | Justificativa |
|---|---|---|---|
| `dragShadow` | `rgba(38,38,38,0.18)` | `rgba(0,0,0,0.45)` | Única sombra do app, só durante o arraste, para mostrar que o painel está "levantado". No escuro precisa ser mais forte para aparecer. |

### 12.9 Estados extremos

- Tela curta (ex.: celular pequeno com teclado aberto): se não couber painel + campo + teclado, o painel compacto esconde o nome do exercício e fica só com tempo e botões (~96px).
- Descanso termina enquanto arrasta: o painel muda para "Descanso concluído" ali mesmo; o encaixe continua normal.
- Cronômetro fechado e aberto de novo: abre na posição salva.

---

## 13. Notificação do cronômetro (só Android)

Como o timer nativo do relógio: enquanto o descanso corre, uma notificação **fixa** mostra a contagem regressiva ao vivo; ao terminar, um **alerta**. Vale só para o APK (Luiz). Na web/iPhone isso **não existe** (o Safari não oferece notificação com contagem ao vivo); lá continua o alerta atual dentro do app com som destravado no toque.

A gaveta de notificações é desenhada pelo **sistema** e segue o tema do **aparelho**, não o do app. O app controla só o conteúdo, o ícone e uma cor de destaque.

### 13.1 Canais (aparecem nos Ajustes do Android)

| Canal | Nome visível | Importância | Som/vibração |
|---|---|---|---|
| `descanso` | "Cronômetro de descanso" | baixa | nenhum (é a contagem fixa) |
| `descanso-fim` | "Fim do descanso" | alta | som padrão + vibração igual à do app |

### 13.2 Notificação fixa (descanso correndo)

| Campo | Conteúdo |
|---|---|
| Ícone pequeno | Silhueta de cronômetro (círculo com o botão em cima e um ponteiro), monocromática, 24dp, branca sobre transparente (regra do Android). Não usar o ícone colorido do app. |
| Cor de destaque | `#1A9348` (token novo `notifAccent`, fixo, não muda com o tema): passa 3,5:1 ou mais na gaveta clara e na escura. O verde `#1DB954` some na gaveta clara (2,3:1). |
| Cabeçalho | "Meu Plano" + **contagem regressiva ao vivo** (cronômetro do sistema em modo regressivo, com o horário de término do descanso; o sistema atualiza o número sozinho, sem o app acordar a cada segundo). |
| Título | "Descanso" |
| Texto | Nome do exercício atual, ex.: "Desenvolvimento com halteres". Se não houver exercício (cronômetro aberto fora do treino): "Meu Plano". |
| Ações | "+15 s" (soma 15 segundos, igual ao botão do app) e "Parar" (encerra o descanso e remove a notificação). Mesmos nomes do app. |
| Toque no corpo | Abre o app na tela Treino, no dia em andamento. |
| Comportamento | Fixa (não dá para arrastar para longe enquanto corre), sem som, visível na tela bloqueada (o conteúdo não é sensível). Some quando o descanso é parado no app ou pela ação "Parar". Atualiza se a pessoa usar "+15 s", "Pausar" ou um atalho no app. |
| Pausado | Se pausar no app: título "Descanso pausado", cabeçalho mostra o tempo parado ("0:56"), ações "Continuar" e "Parar". |

Quando aparece: assim que o descanso começa, como o relógio do Android. Fica também com o app aberto (para quem bloqueia a tela no meio do descanso).

### 13.3 Fim do descanso

- A notificação fixa é **substituída** (mesmo lugar) por uma notificação do canal `descanso-fim`:
  - Título: **"Descanso terminado"**
  - Texto: **"Próxima série: Desenvolvimento com halteres"** (sem exercício: "Hora da próxima série")
  - Ação: "De novo" (reinicia com a mesma duração). Toque no corpo abre o app no Treino.
  - Som e vibração do canal; aparece por cima (heads-up) e na tela bloqueada.
  - Pode ser arrastada para longe; some sozinha ao abrir o app, ao começar outro descanso ou após 10 minutos.
- Com o app **na frente**: não dispara o alerta do sistema; vale o "Descanso concluído" do painel com a vibração atual (sem dois alertas ao mesmo tempo). A notificação fixa apenas some.

### 13.4 Pedido de permissão (Android 13 ou mais novo)

- **Quando:** na **primeira vez** que a pessoa inicia um descanso ("Descanso 90 s" ou atalho). Nunca na abertura do app nem no login.
- **Como:** o descanso **começa normalmente**, e um painel do app sobe de baixo, por cima do cronômetro (fundo `bgElevated`, véu `rgba` escurecido atrás, raio `lg` nos cantos de cima), explicando antes de chamar o diálogo do sistema:
  - Título (Barlow 600 `xl` caixa alta): **"Avisar quando o descanso acabar?"**
  - Texto (Inter `base` `textMuted`): **"O Meu Plano mostra o tempo do descanso na barra de notificações e avisa quando acabar, mesmo com a tela bloqueada."**
  - Botão principal: **"Permitir avisos"** → abre o diálogo do Android.
  - Link: **"Agora não"** → fecha; não pergunta de novo por 30 dias.
- Se negar no diálogo do sistema: nada de insistir. O cronômetro segue funcionando dentro do app.
- **Caminho de volta:** no Perfil (só Android), linha "Avisos do cronômetro" com o valor "Ativados" ou "Desativados". Tocar em "Desativados" mostra o mesmo painel; se o Android já bloqueou o pedido, o botão vira "Abrir ajustes do Android".

### 13.5 Acessibilidade e texto

- Todo texto em pt-BR, frases curtas, sem emoji.
- Ações com rótulos de verbo ("Parar", "De novo", "Continuar"), iguais aos botões do app.
- A contagem do sistema é lida pelo TalkBack como tempo.

### 13.6 iOS (web)

Sem notificação do cronômetro no iPhone. Nota: o iOS 16.4+ aceita notificação push em PWA instalado, mas não contagem ao vivo nem alerta exato sem servidor. Fora do escopo.

---

## 11. Critérios de aceite (para o qa)

- [ ] Com o aparelho no claro e preferência Automático, o app abre claro; mudar o aparelho para escuro com o app aberto troca na hora.
- [ ] Escolher Claro/Escuro no Perfil troca tudo na hora, inclusive barra de status; fechar e abrir o app mantém a escolha.
- [ ] Nenhuma cor de dia aparece "lavada" no claro: Inferior A da Usuária 2 sai `#A6486B`, Push sai `#A9502F`.
- [ ] Nenhum `textFaint` sobre `surface` abaixo de 4,5:1 (valores da tabela 1.1).
- [ ] Botão da inicial abre Perfil; não faz logout direto. "Sair da conta" pede confirmação.
- [ ] Todas as telas têm erro com "Tentar de novo" e não ficam em carregamento infinito.
- [ ] Barra do Safari/PWA legível nos dois temas.
- [ ] Segurar o cronômetro por ~0,35s levanta o painel (realce + vibração no Android); soltar perto do topo encaixa abaixo do cabeçalho, perto da base volta para baixo; a posição fica salva.
- [ ] No topo, o painel fica compacto, não cobre a barra de status, o notch nem o botão Voltar, e o campo de anotação fica visível e editável abaixo dele.
- [ ] Com o teclado aberto, o cronômetro sobe sozinho e volta para a base quando o teclado fecha.
- [ ] O botão de mover faz o mesmo sem gesto, com rótulo para leitor de tela.
- [ ] Android: ao iniciar um descanso, aparece a notificação fixa com contagem regressiva ao vivo, "+15 s" e "Parar" funcionando com a tela bloqueada.
- [ ] Android: ao terminar com o app em segundo plano, chega "Descanso terminado / Próxima série: <exercício>" com som e vibração, no horário certo.
- [ ] O pedido de permissão aparece só no primeiro descanso, com o painel explicativo antes do diálogo do sistema; "Agora não" não volta a perguntar por 30 dias.