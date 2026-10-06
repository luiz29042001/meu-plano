# Tema claro/escuro + cronômetro: dúvidas e conflitos (backend-engineer)

Data: 06/10/2026. Regra aplicada: onde a spec (`docs/design/tema-claro-escuro.md`) e o plano técnico divergem, vale o **plano**, mais as decisões do Luiz (notificação sem ações; cronômetro não sobe sozinho com teclado; módulo nativo próprio; banco sem mudança).

| # | Ponto | Spec | Plano / decisão | O que foi feito |
|---|---|---|---|---|
| D1 | Ações na notificação | §13.2/13.3: "+15 s", "Parar", "Continuar", "De novo" | Decisão do Luiz: sem ações nesta build | Sem ações. Tocar abre o app. |
| D2 | Teclado aberto | §12.6: painel sobe sozinho | Decisão do Luiz: não nesta build | O `TimerLayout` expõe só a posição escolhida (sem "posição efetiva por teclado"). |
| D3 | Pedido de permissão | §13.4: painel explicativo do app antes do diálogo; "Agora não" = 30 dias | Plano §2: pedir no toque que inicia o cronômetro, **uma vez** | O `TimerContext` chama o diálogo do sistema direto, uma única vez. A chave `meu-plano:notif-pedida` guarda o horário, então um painel explicativo e a regra dos 30 dias podem ser feitos depois sem trocar a chave. |
| D4 | Alerta com o app aberto | §13.3: com o app na frente, não dispara o alerta do sistema; vale a vibração do app | Plano §2: com alarme exato armado, o alerta vem só do sistema, mesmo com o app aberto | Seguido o plano: sem vibração do app quando armado. Com o app aberto, o Android mostra o aviso no topo (heads-up) com som. Se o Luiz achar invasivo, dá para trocar depois. |
| D5 | Notificação pausada | §13.2: "Descanso pausado" com tempo parado | Plano: pausar cancela a notificação | Pausar remove a notificação; retomar cria de novo. |
| D6 | Id do canal | §13.1: `descanso` | Plano: `descanso-andamento` | Id técnico do plano. Nomes visíveis da spec: "Cronômetro de descanso" / "Fim do descanso". Textos da spec: "Descanso" + exercício; "Descanso terminado" / "Próxima série: …" (sem exercício: "Hora da próxima série"). |
| D7 | Imagem da splash | §8: só cores | Plano: "imagem atual, salvo se o design-director pedir variante" | A `splash.png` tinha **fundo escuro opaco**, que apareceria como um quadrado preto na splash clara. Criei `assets/splash-icon.png` (mesmo logo, fundo transparente) e usei nos dois temas. **design-director:** confirmar se o laranja do logo sobre `#F1F1EF` está bom ou se quer outra arte. |
| D8 | Tocar na notificação | §13.2: abre o app na tela Treino | Plano: abre o app | Traz o app de volta para onde estava (normalmente o Treino). Abrir numa rota específica exigiria deep link; ficou de fora. |
| D9 | Número de tokens | §10.1: 27 chaves (com `dragShadow`) | Contrato do plano: 26 | `ThemeColors` tem **27** (inclui `dragShadow`, necessário para o arraste da T16). |
| D10 | `.gitignore` | — | — | `android/` ignorava `modules/rest-timer/android` (o EAS não enviaria o Kotlin). Trocado para `/android/` e `/ios/`. |
| D11 | Fontes de reserva no Android | §3: reserva `sans-serif-condensed` / `sans-serif` | Plano: só o nome no nativo | No nativo não existe pilha de fontes: se a fonte não carregar no teto de 3 s, o Android usa a fonte padrão (Roboto). Na web há pilha completa. |
| D12 | Lock | Plano: "só ganha os 3 pacotes" | — | Além dos 3 pacotes, o npm corrigiu 2 linhas do bloco raiz do lock que estavam dessincronizadas do `package.json` (intervalos de `react-dom` e `react-native-web`). Nenhuma versão instalada mudou. |

---

## ui-builder (06/10/2026): decisões tomadas na implementação

Regra: opção mais conservadora; onde spec e plano divergem, vale o plano e o que o Luiz decidiu.

| # | Ponto | Decisão |
|---|---|---|
| U1 | Altura do cronômetro no topo | Plano: `insets.top + Spacing.sm`; spec §12.5: abaixo do cabeçalho de 56 px. Usei a spec (`insets.top + 56`), para nunca cobrir o botão Voltar. Na tela de Treino a lista ganha um espaço do tamanho do painel entre o cabeçalho e as abas. |
| U2 | "Última carga" no exercício atual (spec §6.3) | O banco não guarda carga estruturada (só a anotação em texto). Não inventei o dado: mostro a anotação do exercício (2 linhas) no lugar. |
| U3 | Home: "Calendário (treinos no mês)" | Para não fazer uma consulta nova só para o texto, a linha mostra "Histórico de treinos". Dieta mostra a situação (variantes, nome do plano, "Em preparação"). |
| U4 | Tamanho 22 da spec (`N feitos`, "4 × 12–20") | 22 não é token; usei `FontSize.xl` (24). |
| U5 | Dias da semana no calendário | Spec pede D S T Q Q S S; mantive as 3 letras de `WEEKDAY_SHORT` (decisão anterior para evitar ambiguidade). Rótulo acessível de cada célula tem a data completa. |
| U6 | Encaixe do cronômetro | O painel completo (base) e o compacto (topo) têm alturas diferentes. Ao soltar, ele desliza até a borda escolhida com o tamanho de antes e troca para o layout da nova posição no fim (um "estalo" de tamanho na borda). Conferir no celular se incomoda. |
| U7 | Linha de progresso | Anima de forma contínua (1 s linear por tick). Com "reduzir movimento", anda em passos. |
| U8 | Nome longo do dia | Acima de 10 caracteres cai para 78% do tamanho (72 -> 56, 64 -> 50), como na spec, sem `adjustsFontSizeToFit` (não existe na web). |
| U9 | Banners das dietas | Sem faixa tingida (spec): o texto do banner vira uma linha `textMuted`, sem emoji (tirado do começo da frase). |
| U10 | Ícones/emoji | Removidos de todas as telas (spec). Setas e "✓" são caracteres de texto. |
| U11 | Espaço do cronômetro nas outras telas | Home, Dieta e Calendário ganham `paddingBottom` = altura do painel quando ele está na base. Perfil não (tela curta). |
| U12 | Posição do `Treinos` na Home | A linha "Treinos" saiu da lista (spec §6.2 lista só Dieta e Calendário); o botão principal abre o treino. Sem programa não há botão. |
| U13 | Foco visível na web | CSS global `:focus-visible` com `--focus` (= `borderStrong`), definido no script do `index.html` e em `systemChrome.web.ts`. |

## Correções da revisão (ui-builder, 06/10/2026)

- **I1:** `ThemeContext` só chama `applySystemChrome` depois de `ready`. O script anti-flash do `public/index.html` continua cobrindo o primeiro quadro (lê a mesma chave `meu-plano:tema`).
- **I2:** novo `src/hooks/useTimerInsets.ts` (`{ top, bottom }`). Home, Dieta, Calendário e Perfil agora têm espaçador no início da rolagem quando o cronômetro está no topo, e `paddingBottom` quando está na base. O Treino usa o mesmo hook (espaçador fora da rolagem, entre cabeçalho e abas, como antes).
- **I3:** rascunhos de anotação guardados por exercício no `WorkoutScreen` (`drafts`). Salvar com sucesso limpa o rascunho. Se houver rascunho, o campo reabre já aberto.
- **S2:** texto do fim agora é "Descanso terminado" (igual à notificação).
- **S3:** removidas as `accessibilityActions` do painel (o botão ↑/↓ cobre o caso).
- **S4:** linha repetida do exercício no painel removida.
- **S5:** `panelLifted` não acrescenta mais `borderWidth`; só troca a cor da borda já existente (altura estável durante o arraste). Decisão: a borda destacada aparece só no lado que já tinha borda.
- **S6:** tokens novos em `theme.ts`: `FontSize.title` (20), `FontSize.numeral` (28) e `LineHeight` (sm 18, md 20, base 22, lg 24, xl 26). `minHeight`/tamanhos 56 viraram `Touch.primary`; `+ 2` viraram tokens; `paddingHorizontal: 4` virou `Spacing.xs`.
- **S7:** `restBtnText` removido.
