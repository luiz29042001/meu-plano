# Auditoria de design — telas existentes (05/10/2026)

Autor: design-director. Escopo: Login, Home, Treino, Dieta, Calendário, Cronômetro flutuante, navegação, `App.tsx`, `public/index.html`, `public/manifest.json`.

**Como foi feita.** O app não foi visto rodando (o QA visual com login ainda não existe). Cada tela foi reconstruída lendo o código. Quando uma conclusão depende do que está no banco ou de como a tela se comporta na prática, ela está marcada como **(inferência)**. Mockup de apoio: `docs/design/auditoria-2026-10-05.html`.

**Referências:** `src/utils/theme.ts` (fonte da verdade dos tokens) e `docs/design/design-system.md`.

---

## Resumo em uma página

O app tem uma base sólida: fundo carvão suave, verde do Spotify, cores por dia de treino, e a Home já tem uma ação principal clara (o card "Próximo treino"). Os problemas se concentram em quatro pontos:

1. **Os números não são protagonistas.** Séries, repetições e descanso aparecem em 12px, menores que o nome do exercício. O tempo do cronômetro tem 20px dentro de um anel de 84px.
2. **Alvos de toque pequenos onde mais importa.** O círculo de "feito" do exercício tem 28px, os botões ⏱ ✎ ⓘ têm cerca de 32px, e os atalhos de tempo do cronômetro têm cerca de 20px, com texto de 9px. Tudo isso é usado no meio da série, com a mão suada.
3. **Pontos mais escuros e mais saturados do que o pedido.** A barra de status do Android (`#0F0F0F`), o painel do cronômetro (`#18181B`, com sombra pesada) e os banners da dieta ficam mais escuros que o fundo. As cores dos dias do Luiz e das refeições dele provavelmente ainda são as versões saturadas antigas.
4. **Estados faltando.** Se o carregamento do treino falha, a tela fica girando para sempre. A Home e o Calendário não mostram erro nenhum. O botão de avatar da Home faz logout direto, sem confirmação e sem rótulo.

---

## Diagnóstico por tela

Legenda: ✔ funciona · ✘ não funciona · ⚠ atenção.

### 1. Login (`src/screens/LoginScreen.tsx`)

Hierarquia: logo com emoji, título, 3 cards de recursos, botão "Entrar com Google". A ação principal é única e clara.

- ✔ Há estado de carregamento no botão e estado de erro (`:59-63`, `:70-71`).
- ✔ "Cancelou o login" não aparece como erro (`:25`).
- ✘ **Padrão proibido:** 3 cards idênticos com ícone emoji à esquerda (`:43-57`). É o "grade de cards idênticos com ícone" do design system, só que em lista.
- ✘ **Bloco branco grande:** o botão do Google usa `Colors.text` (`#F2F2F4`) como fundo, com largura total e 16px de padding (`:130-138`). O design system pede para evitar "branco puro sobre fundo escuro em blocos grandes". Também gasta o destaque fora do verde, que é a cor da ação principal.
- ✘ Valores soltos: `fontSize: 34` (`:100`), `paddingHorizontal: 24`, `paddingVertical: 40`, `gap: 24` e `gap: 10` (`:92-95`, `:110`), `padding: 16` e `gap: 14` (`:114-117`).
- ✘ Cores de erro fora dos tokens: `#2A1010`, `#C0392B44` e `#E74C3C` (`:123-129`). O token `Colors.red` existe e não foi usado.
- ✘ A mensagem de erro mostra `error.message` cru (`:26`), que pode vir em inglês e em linguagem técnica.
- ⚠ O "G" em fonte serif (`:139-144`) imita o logo do Google sem ser o logo. Fica com cara de improviso.

### 2. Home (`src/screens/HomeScreen.tsx`)

Hierarquia reconstruída: 1) saudação e nome em 26px; 2) card "Próximo treino" com o nome do dia na cor da categoria e o botão ▶; 3) dois cards de números; 4) "Explorar" com 3 linhas de navegação.

- ✔ **Uma ação principal clara:** o card "Próximo treino" abre direto na aba certa (`:48-71`). É o melhor momento do app.
- ✔ A cor do dia dá identidade (barra lateral, título e botão) sem decoração extra (`:54`, `:57`, `:67`).
- ✘ **O avatar faz logout com um toque**, sem confirmação, sem rótulo e sem nada que indique a função (`:40-44`). Risco real: a Usuária 2 toca no círculo com a inicial esperando ver o perfil e sai do app. No web, ela ainda precisa refazer o login com o Google.
- ✘ **O card principal tem só uma informação acionável.** Faltam os números do treino (exercícios, séries). O nome do dia (22px) disputa com o nome da pessoa (26px, `:162`), que é maior. A saudação ganha do treino.
- ✘ **Padrão proibido:** "Explorar" tem 3 linhas idênticas com emoji num quadrado colorido de 52px (`:98-145`, `:220-221`). Os fundos usam `pushColor`, `green` e `pullColor` a 15% só como enfeite, e o Calendário fica azul sem motivo. Isso gasta as cores de categoria, que deveriam identificar os dias.
- ✘ O verde aparece em 4 lugares sem ser ação nem progresso: a inicial do avatar (`:168`), o total de treinos (`:79`), o ✓ de hoje (`:85`) e o fundo do ícone de Dieta (`:118`).
- ✘ **Estados:** se `useWorkout` falhar, o card some e o total vira 0, sem mensagem (o `error` do hook não é usado). Uma conta sem programa (conta nova, Roadmap item 1) também mostra a Home sem card nenhum e sem explicação.
- ✘ Valores soltos: `fontSize: 18` e `color: '#000'` (`:190`), `paddingHorizontal: 10`, `paddingVertical: 4`, `fontSize: 10` (`:217-219`), `fontSize: 26` (`:221`), `fontSize: 22` (`:225`), `marginBottom: 6` (`:180`), `paddingBottom: 40` e `height: 40` (`:155`, `:147`).
- ⚠ Rótulos em CAIXA ALTA espaçada ("PRÓXIMO TREINO", "EM BREVE") (`:56`, `:129`). Fica com cara de modelo pronto e se repete em todas as telas.
- ⚠ `playIcon` usa `color: '#000'` (`:190`): preto puro, contra a direção visual.

### 3. Treino (`src/screens/WorkoutScreen.tsx`)

Hierarquia reconstruída: 1) cabeçalho "Treinos" com o nome do programa; 2) abas dos dias; 3) card do dia com contador `3/5` em 26px e barra de progresso; 4) lista de exercícios; 5) botão de concluir no fim da lista.

- ✔ O contador `3/5` em 26px e a barra de progresso na cor do dia (`:242-255`) são o melhor uso de números do app.
- ✔ O botão de concluir tem os estados salvando, sucesso, já registrado e erro com mensagem útil (`:287-314`). A anotação tem salvando, salvo e erro (`:102-107`).
- ✔ As abas seguem a armadilha 7: altura fixa, `includeFontPadding: false`, `numberOfLines={1}` (`:221`, `:366-383`).
- ✘ **Os números de carga, repetições e descanso são figurantes.** "4 séries · 8–10 reps · ⏱ 90s" está em 12px (`:62-64`, `:419-421`), menor que o nome do exercício (15px). É exatamente o contrário do que o design system pede. A carga só existe dentro da anotação, escondida atrás de "📝" com 2 linhas em 12px (`:66-68`).
- ✘ **O alvo de toque principal é o menor.** O círculo de "feito" tem 28×28 (`:408`). Os botões ⏱ ✎ ⓘ têm `padding: 8` com ícone de cerca de 16px, ou seja, cerca de 32px (`:423`). Também não têm rótulo de acessibilidade, e o leitor de tela lê "ⓘ".
- ✘ **Botão de relógio redundante.** O descanso aparece como texto "⏱ 90s" e de novo como botão ⏱. São dois elementos para a mesma informação.
- ✘ **Erro e vazio viram carregamento infinito.** Se `useWorkout` falha ou o programa não tem dias, `days` fica vazio, o efeito sai cedo (`:146`), `activeDayIdx` continua `null` e a tela fica no `ActivityIndicator` para sempre (`:187-192`). **(inferência sobre o comportamento; a lógica está no código)**
- ✘ **O cronômetro cobre o fim da lista (inferência).** O painel flutuante fica a 90px do fundo e tem cerca de 145px de altura, então cobre até cerca de 235px. O espaço extra no fim da lista é de 120px (`:323`). Com o cronômetro aberto, o botão "Marcar como concluído" pode ficar escondido atrás dele.
- ✘ Preto puro como cor de texto: `'#000'` em `:114`, `:303`, `:384` e `:413`.
- ✘ Valores soltos: `fontSize: 16` e `15` inline (`:72`, `:75`, `:79`), `width/height: 40` (`:348`, `:355`, `:367`), `paddingHorizontal: 20` (`:370`), `padding: 32` (`:401`), `paddingHorizontal: 12`, `paddingVertical: 10` (`:336`), `marginBottom: 8`, `marginTop: 10` (`:333`, `:338`), `height: 120` (`:323`).
- ⚠ O botão de concluir só libera com todos os exercícios marcados (`:300`). Se um aparelho estava ocupado e um exercício foi pulado, o treino não pode ser registrado. É uma regra de produto, não de visual: veja a seção "Direção nova".
- ⚠ A dica "Toque o relógio em cada exercício…" no fim da lista (`:318-321`) existe porque o botão ⏱ não se explica sozinho.
- ⚠ Botões de voltar e de calendário com 40px (`:347-357`). As abas também têm 40px de altura (`:367`).

### 4. Dieta (`src/screens/DietScreen.tsx`)

Hierarquia reconstruída: 1) cabeçalho com o seletor A/B (ou Treino/Descanso); 2) banner da variante; 3) card de macros com 4 mini-cards; 4) refeições recolhidas; 5) hidratação.

- ✔ Há estados de "pendente" (`:204-224`), carregando e erro (`:226-235`).
- ✔ As refeições começam recolhidas, o que deixa a tela respirar.
- ✘ **A tela mais fora dos tokens.** Ela nem importa `Spacing` (`:12`) e usa números soltos em quase todo estilo: `paddingHorizontal: 20`, `gap: 10`, `width/height: 36`, `borderRadius: 10` (`:320-334`); `fontSize: 20` (`:337`); `borderRadius: 10` e `8` (`:341`, `:348`); `padding: 16, gap: 8` (`:351`); `padding: 18` (`:360`); `borderRadius: 500` em vez de `Radius.pill` (`:315`); `padding: 14` e `gap: 12` (`:380-383`); entre outros.
- ✘ **Fundos mais escuros que o app:** os banners `#1A2A1A` e `#1A1A2A` (`:246`) têm o mesmo brilho do fundo `#1A1A1C`, só com um tom esverdeado ou azulado. Leem como "buraco" e não como destaque.
- ✘ **Texto branco sobre verde** no seletor A/B (`:195`, `color: '#fff'`). O contraste é de cerca de 2,3:1, ilegível ao sol. No resto do app o texto sobre verde é escuro.
- ✘ **Cores de treino reaproveitadas como macros:** Proteína = `pushColor`, Carbo = `pullColor`, Gordura = `green` (`:107-109`, `:258-260`). O verde de destaque vira "gordura", e o coral do Push vira "proteína". Isso confunde a identidade das cores de categoria.
- ✘ **Grade de 4 mini-cards idênticos** para os macros (`:256-267`), com o número em 15px (`:371`). O total de calorias, que é o número da tela, tem o mesmo peso que "Gordura".
- ✘ **As cores das refeições do Luiz são saturadas e fora do tema:** `#E67E22`, `#C0392B`, `#F5A623`, `#9B59B6`, `#E8572A`, `#27AE60`, `#2A7BE8` e `#666666` (`src/services/dietData.ts:8, 30, 49, 107, 130, 197, 219, 270`). A dieta da Usuária 2, que vem do banco, já usa os tons dessaturados (`supabase/003_diet_and_glute_focus.sql:22`). Então os dois usuários veem paletas diferentes na mesma tela.
- ✘ O erro "Não foi possível carregar…" não tem botão "Tentar de novo" (`:232`).
- ✘ A troca de variante não trata erro (`:170-176`). Se falhar, a tela mostra a nova variante, mas o banco guarda a antiga.
- ✘ Alvos pequenos: voltar 36px (`:329`), botões ⇄ e ℹ com cerca de 26px (`:409`), seletor de variante com cerca de 28px de altura (`:345-349`).
- ⚠ O título do cabeçalho tem 20px (`:337`), e o Treino e o Calendário usam `FontSize.xl` (22). O botão voltar aqui é quadrado (raio 10, `:329`), e nas outras telas é redondo.
- ⚠ Emojis em todo título (💡 💧 🕐 📝) somam ruído.

### 5. Calendário (`src/screens/CalendarScreen.tsx`)

Hierarquia reconstruída: 1) "Treinos Concluídos"; 2) navegação do mês; 3) grade 7×N com o dia e o nome do treino; 4) dois cards de números; 5) legenda.

- ✔ A grade usa a cor do dia de treino. É a melhor aplicação das cores de categoria no app (`:96-115`).
- ✔ O dia de hoje fica marcado em verde discreto (`:222-226`).
- ✘ **Texto de 7px** com o nome do treino dentro da célula (`:228-233`). É ilegível. O `adjustsFontSizeToFit` não funciona na web, então no iPhone da Usuária 2 "INFERIOR A" é cortado. **(inferência sobre o corte na web)**
- ✘ **Número repetido:** "X treinos" aparece no subtítulo do mês (`:67-69`) e de novo no card "Neste mês" (`:131-134`).
- ✘ O laranja em "Neste mês" (`:132`) é cor solta, sem significado.
- ✘ **Sem estado de erro:** se a busca falha, o mês aparece vazio, como se nada tivesse sido feito. Isso é enganoso.
- ✘ Sem estado de vazio com orientação. Um mês sem treinos é só uma grade cinza.
- ⚠ É possível navegar para meses futuros sem limite (`:30-33`).
- ⚠ A legenda é um card a mais no fim da tela, e só serve porque a célula não consegue mostrar o nome.

### 6. Cronômetro flutuante (`src/components/FloatingTimer.tsx`)

Hierarquia reconstruída: uma linha com o nome do exercício e 5 atalhos de tempo mais o ✕, e embaixo o anel de 84px com o tempo e os botões Iniciar/Pausar e ↺.

- ✔ O cálculo por `endsAt` e o alerta por plataforma estão corretos (armadilha 4, fora do escopo visual).
- ✔ A cor do anel segue a cor do dia, e o verde aparece ao terminar. É um uso correto do verde como progresso.
- ✘ **O tempo, que é o número mais importante do app durante o treino, tem 20px** (`:176-181`). Dentro do anel, sobra pouco espaço. A legenda "restante" tem 8px (`:182-186`).
- ✘ **Atalhos de 30, 60, 75, 90 e 120 s em 9px**, com alvo de cerca de 20×16px (`:136-146`). O ✕ tem cerca de 22px (`:147-153`). É impossível acertar com o celular apoiado no banco.
- ✘ **Painel mais escuro que o app:** `#18181B` (`:107`), sombra `0.5` e `elevation: 20` (`:111-115`). É o elemento mais "pesado" da interface, contra o pedido de menos escuridão e contra a regra de não pôr sombra em tudo.
- ✘ **Contraste baixo no botão principal:** o texto `Colors.text` (claro) fica sobre a cor do dia ou sobre o verde (`:84`, `:202`). Sobre o coral do Push dá cerca de 2,7:1, e sobre o verde cerca de 2,3:1.
- ✘ **Não respeita a área segura:** `bottom: 90` fixo (`:104`). Funciona por sorte no iPhone (90px > 34px do indicador), mas não acompanha teclado nem telas diferentes.
- ✘ Valores soltos: `#18181B`, `padding: 14`, `borderRadius: 6`, `fontSize: 9`, `8` e `20`, `gap: 4`, `paddingVertical: 11` etc.
- ⚠ A cor padrão do contexto é `#E8572A` (`src/contexts/TimerContext.tsx:17`), a versão saturada antiga do Push.

### 7. Estrutura e plataforma (`App.tsx`, `navigation`, `public/`)

- ✘ **Barra de status do Android mais escura que o app:** `backgroundColor="#0F0F0F"` com `translucent={false}` (`App.tsx:15`). No APK do Luiz aparece uma faixa quase preta acima do fundo carvão. O `app.json` também usa `#0F0F0F` como fundo da splash e do ícone adaptativo (`app.json:12`, `:24`). **(inferência sobre a splash: o efeito depende do build)**
- ✔ `index.html`: `viewport-fit=cover`, `theme-color #1A1A1C`, `lang="pt-BR"` e status bar `black-translucent`. Com o `SafeAreaView` (`edges={['top']}`), o topo do iPhone deve ficar correto.
- ⚠ `maximum-scale=1` (`public/index.html:6`) impede o zoom. É compreensível porque evita o zoom automático do Safari ao tocar no campo de anotação (fonte de 15px, abaixo de 16), mas tira o zoom de quem precisa. Se um dia for removido, o campo de anotação precisa ir para 16px.
- ⚠ A web não tem largura máxima. Num computador, os cards esticam de ponta a ponta. A Usuária 2 usa o iPhone, então o impacto é baixo.
- ✔ O manifest está coerente com o tema (`#1A1A1C`).
- ⚠ O carregamento inicial (`navigation/index.tsx:41-46`) é só um spinner, sem a marca do app. Aceitável.

### 8. Cores de categoria (banco)

- ⚠ **(inferência importante)** As cores dos dias do Luiz foram gravadas em `supabase/schema.sql:218-224` como `#E8572A`, `#2A7BE8` e `#27AE60`, as versões saturadas. Nenhuma migração posterior altera `color` (`002:24` e `003:58` só mexem em `program_id`, `label` e `muscles`). Se ninguém trocou pelo painel, **o Luiz vê hoje as cores fortes antigas**, e não os tokens `pushColor`, `pullColor` e `legsColor`. Isso afeta abas, Home, cronômetro e calendário de uma vez. Confira no painel do Supabase antes de agir.
- ✔ As cores da Usuária 2 (`002:63-68`) já são dessaturadas. A única fora dos tokens é o rosa `#E07A9A` (Inferior A).

---

## Consistência entre telas

| Elemento | Treino | Calendário | Dieta | Proposta |
|---|---|---|---|---|
| Botão voltar | 40px redondo | 40px redondo | 36px quadrado (raio 10) | 44px redondo, `Colors.card` |
| Título do cabeçalho | `FontSize.xl` | `FontSize.xl` | `20` solto | `FontSize.xl` |
| Linha acima do título | CAIXA ALTA espaçada | CAIXA ALTA espaçada | CAIXA ALTA espaçada | caixa normal, `textMuted`, `FontSize.sm` |
| Texto sobre verde | `#000` | — | `#fff` | `Colors.bg` (ver token `onAccent`) |
| Card de números | — | 2 cards centralizados | 4 mini-cards | linha de números alinhada à esquerda |
| Espaço no fim | `120` | `40` | `40` | calculado pela altura do cronômetro mais a área segura |

O cabeçalho (voltar, linha de apoio e título) se repete em 3 telas e foi escrito 3 vezes de formas diferentes. Vale virar um componente `ScreenHeader`. Isso é decisão técnica do tech-lead, registrada aqui como sugestão.

---

## Lista priorizada de melhorias

### A. Correções de consistência (seguem o design system; não mudam a cara do app)

Ordenadas de maior impacto e menor esforço para menor impacto e maior esforço.

| # | Melhoria | Onde | Impacto | Esforço |
|---|---|---|---|---|
| A1 | Barra de status do Android com `Colors.bg` (`#1A1A1C`) em vez de `#0F0F0F`. Splash e ícone adaptativo idem. | `App.tsx:15`, `app.json:12,24` | Alto (em toda tela do Luiz) | Mínimo |
| A2 | Texto sobre verde e sobre cor de categoria: escuro (`Colors.bg`), nunca `#000`, `#fff` ou `Colors.text`. Corrige o seletor A/B, o botão do cronômetro, o ▶ e o check. | Diet `:195`, Timer `:84/202`, Home `:190`, Workout `:114,303,384,413` | Alto (legibilidade) | Baixo |
| A3 | Área de toque de 44px no círculo de "feito", nos botões ⏱ ✎ ⓘ, no voltar, nas abas, nos atalhos e no ✕ do cronômetro, e nos botões ⇄ ℹ da dieta. O visual pode continuar pequeno; o que cresce é a área de toque (`hitSlop` ou `minHeight`). | Workout `:408,423,347,367`; Timer `:136,147`; Diet `:329,345,409` | Alto (uso no meio da série) | Baixo |
| A4 | Tela de treino: erro e programa vazio com mensagem e "Tentar de novo", em vez de girar para sempre. | Workout `:146,187` | Alto | Baixo |
| A5 | Avatar da Home abre uma confirmação ("Sair da conta?") ou um menu de perfil, com rótulo de acessibilidade "Perfil". Nunca sair com um toque. | Home `:40` | Alto (evita logout acidental da Usuária 2) | Baixo |
| A6 | Painel do cronômetro com `Colors.card` e borda `Colors.border`, sem sombra pesada. O nome continua em `textMuted`. | Timer `:107-115` | Médio-alto (pedido do Luiz) | Baixo |
| A7 | Banners da dieta com `Colors.card` e uma faixa de 4px na cor da variante, em vez de `#1A2A1A` e `#1A1A2A`. | Diet `:246` | Médio | Baixo |
| A8 | Erro do login com `Colors.red` (texto) e `Colors.red + '1A'` (fundo), e mensagem em pt-BR ("Não foi possível entrar. Verifique a conexão e tente de novo."). | Login `:26,122-129` | Médio | Baixo |
| A9 | Cores das refeições do Luiz trocadas pelos tokens (`suppColor`, `red`, `orange`, `purple`, `pushColor`, `legsColor`, `pullColor`, `restColor`). | `dietData.ts` | Médio | Baixo |
| A10 | **Conferir no Supabase** as cores dos dias `ppl-6x`. Se ainda forem `#E8572A`, `#2A7BE8` e `#27AE60`, criar uma migração para `#E07856`, `#5A93D4` e `#42B968` (backend-engineer; o Luiz confirma antes de aplicar). Trocar também o padrão `#E8572A` do TimerContext. | `schema.sql:218-224`, `TimerContext.tsx:17` | Alto (muda a cor de tudo no app do Luiz) | Baixo |
| A11 | Calendário: tirar o rótulo de 7px da célula (manter só o número na cor do dia), tirar o número repetido "Neste mês" ou o subtítulo, e mostrar erro em vez de mês vazio. | Calendar `:67,112,131,87` | Médio | Baixo |
| A12 | Dieta: trocar números soltos por `Spacing`, `Radius` e `FontSize`, e o botão voltar e o título iguais às outras telas. | Diet (arquivo todo) | Médio (consistência) | Médio |
| A13 | Login e Home: trocar números soltos (`34`, `24`, `40`, `18`, `10`, `26`, `22`) por tokens. | Login, Home | Baixo | Baixo |
| A14 | Espaço no fim da lista do Treino igual à altura do cronômetro mais a área segura, para o botão de concluir nunca ficar escondido. | Workout `:323` | Médio | Baixo |
| A15 | Rótulos de acessibilidade (`accessibilityLabel`) em todos os botões de ícone: "Iniciar descanso de 90 segundos", "Anotar", "Como fazer", "Marcar Supino Inclinado como feito", "Voltar", "Mês anterior". | todas | Médio | Baixo |
| A16 | Dieta: botão "Tentar de novo" no erro, e reverter a variante se o salvamento falhar. | Diet `:170,232` | Baixo-médio | Baixo |

### B. Direção nova (precisa da aprovação do Luiz)

Estas mudam a aparência ou o comportamento. Estão no mockup HTML como "Proposto".

| # | Proposta | Por quê | Esforço |
|---|---|---|---|
| B1 | **Números grandes no exercício.** "4 × 8–10" em `FontSize.xl` e peso 800. O nome do exercício fica acima, em `FontSize.base`. O descanso vira um botão "90s" de 44px que inicia o cronômetro, e o ⏱ separado deixa de existir. Anotar e "Como fazer" viram botões de texto numa linha abaixo. | É o que o Luiz olha entre as séries. Hoje o número tem 12px. Também tira 1 dos 3 ícones sem nome. | Médio |
| B2 | **Carga em destaque.** A anotação aparece logo abaixo dos números, em `textMuted` e `FontSize.md`, sem o emoji 📝 e com a primeira linha completa ("Última: 22 kg por lado"). O app não interpreta o texto, só dá destaque. | A carga é o número que mais muda semana a semana e hoje está escondida. | Baixo |
| B3 | **Home com o treino como herói.** "Próximo treino" maior, com os números do treino ("5 exercícios · 16 séries"). Botão verde "Começar treino" de largura total como única ação principal. Saudação menor. Os números viram uma linha simples ("128 treinos · 14 em outubro"). "Explorar" vira uma lista limpa, sem emoji em quadrado colorido. | Deixa uma única coisa óbvia para fazer ao abrir o app e devolve as cores de categoria aos dias de treino. | Médio |
| B4 | **Cronômetro com tempo em 40px**, atalhos de 44px de altura numa linha própria, botão principal largo e, ao terminar, "Descanso concluído" em verde. | Precisa ser lido a 1 metro, com o celular no banco. | Médio |
| B5 | **Permitir concluir o treino incompleto**, com confirmação: "Registrar com 4 de 5 exercícios?". | Hoje um exercício pulado impede o registro, e o histórico fica errado. | Baixo (decisão de produto) |
| B6 | **Macros da dieta sem as cores de treino.** Calorias em `FontSize.xxxl` como número principal, e Proteína, Carbo e Gordura em `text` e `textMuted`, sem cor. A cor fica só nas refeições. | Libera verde, coral e azul para o papel deles e cria hierarquia entre os macros. | Baixo |
| B7 | **Login sem os 3 cards.** Nome do app, uma frase ("Seu treino e sua dieta, num lugar só.") e o botão "Entrar com Google" em verde com texto escuro. | Tira o padrão proibido e o bloco branco grande. | Baixo |
| B8 | **`textFaint` um pouco mais claro** (`#7A7A82` → `#8E8E96`). Hoje dá cerca de 3,5:1 sobre o card e fica abaixo do mínimo para textos de 11 a 12px. Com `#8E8E96`, fica em cerca de 4,6:1. | Contraste mínimo legível. Mexe no tema base, por isso pede aprovação. Não aumenta o contraste geral, só o do texto mais apagado. | Mínimo |

---

## Tokens novos propostos

Todos entram em `src/utils/theme.ts` só com aprovação.

| Token | Valor | Justificativa |
|---|---|---|
| `Colors.onAccent` | `'#1A1A1C'` (igual a `bg`) | Texto e ícone sobre verde ou cor de categoria. Substitui `#000`, `#fff` e `Colors.text` nesses casos. Contraste: cerca de 6,7:1 sobre o verde e cerca de 5,8:1 sobre `pushColor`. É um alias com nome, para ninguém voltar ao preto puro. |
| `Colors.pinkColor` | `'#E07A9A'` | Já é usado no banco (INFERIOR A da Usuária 2) e não existe no tema. Documenta a paleta de categoria completa. |
| `FontSize.display` | `40` | Tempo do cronômetro e número principal da Home. O maior token hoje é 32, que dentro do anel ainda fica pequeno para leitura de longe. |
| `Touch.min` | `44` | Tamanho mínimo de área tocável, referenciado por todos os botões. Hoje cada tela usa 36, 40 ou 28. |
| (alteração) `Colors.textFaint` | `'#8E8E96'` | Ver B8. Só com aprovação. |

Fica proibido, como regra nova sugerida para o `design-system.md`: fonte menor que `FontSize.xs` (11). Hoje há 7, 8, 9 e 10px no app.

---

## Estados que faltam (checklist para o ui-builder)

| Tela | Vazio | Carregando | Erro | Sucesso | Dados extremos |
|---|---|---|---|---|---|
| Login | — | ✔ | ⚠ (texto técnico) | — | ✔ |
| Home | ✘ (sem programa: tela sem card) | ✔ | ✘ | ✔ (✓ treinou hoje) | ⚠ (nome de dia longo sem `numberOfLines`) |
| Treino | ✘ (spinner infinito) | ✔ | ✘ (spinner infinito) | ✔ | ✔ (nome longo quebra linha) |
| Dieta | ✔ (pendente) | ✔ | ⚠ (sem tentar de novo) | — | ⚠ (nome de plano longo no cabeçalho com toggle) |
| Calendário | ✘ | ✔ | ✘ (parece mês vazio) | — | ✘ (rótulo de 7px) |
| Cronômetro | — | — | — | ✔ (verde) | ✔ (nome com `numberOfLines`) |

---

## Conferir no celular (o QA web não cobre)

- Android: a cor da barra de status (A1) e as abas com 44px de altura mantendo a armadilha 7.
- Android: as cores dos dias depois de A10.
- iPhone: o cronômetro acima do indicador de início, e o botão de concluir visível com o cronômetro aberto (A14).
