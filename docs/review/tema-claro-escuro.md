APROVADO COM RESSALVAS

# Revisão: tema claro/escuro + cronômetro móvel + notificação do descanso (06/10/2026)

Revisor: code-reviewer. Método: `git diff` / `git status` (o git funciona), mais leitura completa dos arquivos novos (não rastreados). Ignorados: `docs/`, `.claude/`, `CLAUDE.md`, `.mcp.json`.
Referências: `docs/tech/tema-claro-escuro.md`, `docs/tech/cronometro-mover-notificacao.md`, `docs/tech/tema-claro-escuro-backend.md`, `docs/tech/tema-claro-escuro-duvidas.md` (D1-D12, U1-U13), `docs/design/tema-claro-escuro.md`. Decisões do Luiz aplicadas: notificação sem ações; cronômetro não sobe sozinho com o teclado; onde a spec e o plano divergem, vale o plano.

## Verificação feita por mim

| Item | Resultado |
|---|---|
| `npx tsc --noEmit -p .` | sem erros |
| `npx expo export --platform android` (pasta temporária, apagada) | compilou |
| `npx expo export --platform web` (pasta temporária, apagada) | compilou |
| Fontes no `dist` web | só os 6 `.ttf` (Barlow 500/600/700 cerca de 100 KB cada; Inter 400/500/600 cerca de 340 KB cada; total de cerca de 1,33 MB) |
| Módulo `RestTimer` no bundle web | ausente (correto) |
| `git check-ignore modules/rest-timer/android/build.gradle` | não ignorado: o EAS vai receber o Kotlin |
| Greps dos critérios 12-16 | hex solto em telas/componentes/navegação/App: nenhum. `fontWeight`: nenhum. `Colors` deprecado: removido. `scheme ===` em telas/componentes: nenhum. Concatenação `+ 'xx'`: nenhuma. Tema sem import de Supabase. |
| Relatório do QA (`docs/qa/`) | **não existe**. A T11 não foi feita. Os itens que dependem do navegador estão listados no fim. |

**Não verificado (sem Android SDK nesta máquina):** a compilação do Kotlin. Fiz a leitura linha a linha e comparei com as APIs do `expo-modules-core` 1.12.26 instalado. Não achei erro de compilação provável (detalhes abaixo).

---

## Bloqueantes

Nenhum.

---

## Importantes

### I1. Flash do tema errado na web ao abrir com escolha manual (critério 5)
- **Onde:** `src/contexts/ThemeContext.tsx:60-62`.
- **Risco:** o `ThemeProvider` começa com `preference = 'system'` e `ready = false`. O efeito chama `applySystemChrome` na hora, com o tema do sistema. Exemplo: o usuário salvou "Claro" e o iPhone está escuro. O script do `index.html` pinta o `<html>` de claro, mas logo depois o efeito pinta de escuro (`#222221`) e troca as metas `theme-color`. Como o `AppGate` ainda devolve `null`, o que aparece na tela é justamente esse fundo do `<html>`. Quando a leitura do AsyncStorage termina, a cor volta para clara. Resultado: um ou dois quadros escuros, e a barra do PWA pisca. É exatamente o caso que o critério 5 proíbe.
- **Correção (uma linha):** não aplicar a moldura antes de ler a preferência:
  ```ts
  useEffect(() => {
    if (!ready) return;
    applySystemChrome(scheme, preference, palettes[scheme]);
  }, [ready, scheme, preference]);
  ```
  No Android isso não muda nada visível, porque a splash cobre a tela até `ready`.

### I2. Com o cronômetro no topo, ele cobre controles na Home, Dieta, Calendário e Perfil
- **Onde:** `src/screens/HomeScreen.tsx:125`, `src/screens/DietScreen.tsx:238`, `src/screens/CalendarScreen.tsx:99` (só reservam espaço quando `position === 'bottom'`). `src/screens/ProfileScreen.tsx` não reserva espaço nenhum. O painel compacto fica em `insets.top + HEADER_HEIGHT` (`FloatingTimer.tsx:139`).
- **Risco:** a posição fica salva e vale em todas as telas. Com o painel no topo, ele fica por cima do começo do conteúdo. Como a rolagem já está no início, não dá para trazer esse conteúdo para fora do painel. Na Dieta, isso tapa o seletor de variante A/B (Treino/Descanso da Usuária 2). No Calendário, tapa as setas de mês. Na Home, tapa a manchete "Próximo treino". No Perfil, com o painel na base, o botão "Sair da conta" pode ficar escondido em celulares baixos.
- **Correção:** repetir o padrão da `WorkoutScreen.tsx:386`: espaçador de `panelHeight` no topo do `ScrollView` quando `position === 'top'` (ou `paddingTop` no `contentContainerStyle`), nas 4 telas. No Perfil, aplicar também o `paddingBottom` da base. Vale extrair um hook `useTimerInsets()` que devolva `{ top, bottom }`, para não repetir a conta em 5 lugares.

### I3. Anotação em digitação se perde ao marcar o exercício ou abrir outro
- **Onde:** `src/screens/WorkoutScreen.tsx:547-562` (`<CurrentExercise key={current.id} …>`). O rascunho mora no estado local (`draft`, linha 162).
- **Risco:** o fluxo natural do Luiz é anotar a carga e marcar o exercício como feito. Ao marcar, `current` passa para o próximo exercício pendente, o componente desmonta e o texto não salvo some, sem aviso. O mesmo acontece ao tocar em outra linha da lista. Antes do redesign, cada exercício tinha o próprio cartão, e marcar não apagava o campo. A revisão anterior aprovou justamente o "não desmontar" dos cartões.
- **Correção (escolher uma):**
  1. Guardar os rascunhos no `WorkoutScreen`, por exercício (`drafts: Record<number, string>`), e passar `draft`/`setDraft` como props. É o mais simples e não perde nada.
  2. Ou, ao desmontar com `dirty`, salvar automaticamente (`onSaveNote(draft)`) e mostrar "Anotação salva" na linha que recolheu.
  3. Ou desabilitar o check do exercício atual enquanto houver texto não salvo, com a frase "Salve a anotação antes de marcar".

### I4. Notificação "Descanso terminado" pode ser apagada pelo próprio limite de tempo da contagem
- **Onde:** `modules/rest-timer/android/src/main/java/expo/modules/resttimer/RestTimerNotifier.kt:160` (`setTimeoutAfter(endsAt - now)` na contagem) junto com `:197-213` (aviso do fim publicado com o **mesmo** `NOTIFICATION_ID`).
- **Risco:** o Android implementa o `timeoutAfter` com um alarme do sistema, e esse alarme cancela pela **chave** da notificação (pacote + id), sem conferir qual versão está publicada. A contagem expira em `endsAt`, e o alarme do app também dispara em `endsAt`, então os dois chegam praticamente juntos. Se o aviso de fim for publicado poucos milissegundos antes de o sistema processar o timeout da contagem, o sistema cancela o aviso recém-publicado e corta o som. É raro, mas é exatamente o momento que importa (critério 33). Com alarme inexato isso não acontece, porque o aviso chega depois.
- **Correção:** usar ids diferentes. Por exemplo, `RUNNING_ID = 4207` e `DONE_ID = 4209`. No `showDone`, primeiro `cancel(RUNNING_ID)` e depois `notify(DONE_ID, …)`. No `cancel()`, cancelar os dois ids. O `start()` também deve cancelar o `DONE_ID`, para um novo descanso tirar o "terminado" anterior. Assim o timeout da contagem não tem como afetar o aviso.

---

## Sugestões

- **S1. Alerta mudo se o canal "Fim do descanso" estiver desligado.** `RestTimerNotifier.kt:168-171` devolve `true` (armado) só olhando para as notificações do app e para o alarme exato. Se o usuário desligar só o canal `descanso-fim`, ou deixar o canal sem som, o app deixa de vibrar (`TimerContext.tsx:71`) e o sistema também não avisa. Correção: no `start`, em API 26+, considerar armado só se `nm.getNotificationChannel(CHANNEL_DONE)?.importance >= IMPORTANCE_DEFAULT`.
- **S2. Texto do fim diferente no app e na notificação.** O painel mostra "Descanso concluído" (`FloatingTimer.tsx:297`), e a notificação mostra "Descanso terminado" (`restNotification.ts:405`). Escolher um só.
- **S3. Ações de acessibilidade sem efeito.** `FloatingTimer.tsx:370-378`: `accessibilityActions` num `View` com `accessible={false}`. O TalkBack não chega nesse elemento. O botão ↑/↓ já cobre o caso, então dá para remover as ações. Outra opção é tornar o painel acessível, mas isso agrupa os botões e é pior.
- **S4. Linhas repetidas.** `FloatingTimer.tsx:315-316` renderizam o mesmo `<Text>` em duas condições complementares. Basta `{!!label && …}`.
- **S5. Painel muda de altura ao ser levantado.** `panelLifted` (`FloatingTimer.tsx:58-62`) acrescenta `borderWidth: 1`. Isso dispara o `onLayout`, depois o `setPanelHeight`, e o Treino desloca a lista 1 ou 2 px durante o arraste. Usar a mesma espessura de borda nos dois estados e trocar só a cor.
- **S6. Valores soltos restantes.** `fontSize: 20` (`HomeScreen.tsx:46`), `fontSize: 28` e `width/height: 56` (`ProfileScreen.tsx:30-34`), `minHeight: 56` em várias linhas (é o `Touch.primary`), `FontSize.lg + 2` e `FontSize.md + 2` (Calendário, Segmented, Buttons), `lineHeight` 18/20/22/24/26 espalhados, `paddingHorizontal: 4` (`Segmented.tsx`). Não há cor solta. Sugiro criar um `LineHeight` no `theme.ts` e um token para o tamanho 20, ou registrar na spec que esses tamanhos são exceções aceitas.
- **S7. Estilo sem uso.** `restBtnText` em `WorkoutScreen.tsx:97`.
- **S8. `tsconfig.json`.** A mudança foi feita pela Expo CLI e é inofensiva (já era a S5 da revisão anterior).
- **S9. `assets/splash.png` sem uso.** Apagar na T10, ou registrar que fica no repositório.

---

## Pontos conferidos e aprovados

### Módulo nativo `modules/rest-timer` (Kotlin)
- **Compilação provável: OK.** `build.gradle` é idêntico ao padrão do `expo-system-ui` 3.0.7 (SDK 51). `lintOptions` também é usado pelo reanimated e pelo safe-area nesta mesma versão. `androidx.core:core-ktx:1.12.0` é compatível com o compileSdk 34. As APIs usadas existem no `expo-modules-core` 1.12.26: `Exceptions.ReactContextLost`, `appContext.reactContext`, `appContext.currentActivity`, `Record`/`@Field`, `Function` com 0 e 2 argumentos. O `catch (_: …)` aparece em módulos do próprio Expo SDK 51 (Kotlin 1.9), então não é problema. O `R.drawable.ic_stat_descanso` resolve pelo `namespace` do módulo.
- **PendingIntent:** `FLAG_UPDATE_CURRENT or FLAG_IMMUTABLE` nos dois (conteúdo e alarme), com intent explícita. Correto para Android 12+ e minSdk 23.
- **Canais:** `descanso-andamento` (baixa, sem som nem vibração) e `descanso-fim` (alta, som e vibração), criados uma vez e com guarda para API 26+.
- **Permissões e fallback:** `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM` e `VIBRATE` estão no manifest do módulo e no `app.json`. `canScheduleExactAlarms()` tem guarda para API 31+. Sem permissão de alarme exato, o código cai em `setAndAllowWhileIdle` e devolve `false`, e o JS mantém a vibração. O `SecurityException` também é tratado.
- **Receiver:** registrado no manifest do módulo com `exported="false"`. Ele ignora alarmes antigos comparando o `endsAt` salvo em SharedPreferences, o que cobre descanso cancelado, "+15 s" e relançado.
- **Cancelamento:** `cancel()` remove o alarme (por `filterEquals`, sem depender dos extras), a notificação e o `endsAt` salvo.
- **Ícone:** vetor branco 24dp sobre fundo transparente, correto para ícone pequeno de notificação.
- **Sem ações na notificação** (decisão do Luiz). Tocar abre o app onde ele estava (D8).
- **`.gitignore`:** a troca de `android/` por `/android/` e `/ios/` está correta e necessária. O `package-lock.json` não ganhou nada por causa do módulo.

### Dependências e configuração
- `package.json`: entram só `expo-system-ui ~3.0.7` e as duas famílias de fontes (`--save-exact`). Nada do lock foi regenerado. As 2 linhas alteradas no bloco raiz só alinham o lock ao `package.json` (D12). As versões instaladas continuam as mesmas: `react-dom 18.2.0`, `react-native-web 0.19.13`, `@expo/metro-runtime 3.2.3`. Armadilha 6: OK.
- `app.json`: `userInterfaceStyle: automatic`, splash clara e escura (`android.splash.dark`), ícone adaptativo `#222221` e nenhum `#0F0F0F`. Critério 18: OK.
- `metro.config.js` não foi alterado (armadilha 3).

### Tema
- `ThemeContext`: valor memoizado, `makeStyles` com cache por tema, nenhuma chamada ao Supabase. `devicePrefs` nunca lança erro e devolve o padrão quando a leitura falha. `systemChrome.web.ts` está em `try/catch` e protegido contra `document` ausente.
- `index.html`: o script anti-flash vem antes do bundle, depois das metas que ele ajusta, e usa a mesma chave `meu-plano:tema`. O CSS usa `prefers-color-scheme`, e o `body` está transparente. Só falta o I1 para a web ficar sem flash.
- `dayColor`/`resolveAccent`: mapa da spec, reserva com contraste mínimo de 4,5:1 e entrada inválida virando `restColor`. Toda cor vinda do banco passa por eles (Home, Treino, Calendário, cronômetro), e toda refeição passa por `resolveAccent`.
- `App.tsx`: a ordem `SafeAreaProvider > ThemeProvider > AppGate > GestureHandlerRootView > …` está certa, com teto de 3 s para as fontes e a splash segurada até `ready`.

### Cronômetro (`TimerContext`)
- **Armadilha 4: OK.** `endsAtRef` continua sendo a única fonte da verdade, com `remainingFrom(endsAt)`, tick a cada 250 ms e recálculo em `AppState` e `visibilitychange`. Pausar congela a partir do `endsAt` no momento do toque. Mover o painel não toca no tempo.
- O `stateRef` síncrono tira os efeitos colaterais de dentro do updater e permite o "terminado → De novo" com dois `toggleTimer()` seguidos (`FloatingTimer.tsx:293`). Funciona.
- `addTime`: quando está rodando, reagenda a notificação. Quando está pausado ou terminado, soma ao tempo e tira o "terminado".
- **Sem alerta duplo:** quando está armado, o app não vibra. Sem armar, o app vibra e cancela o aviso atrasado se estiver em primeiro plano. Ao terminar, o JS não cancela, o que evita cortar o som. O pedido de permissão é feito uma vez só, e o código confere se o descanso ainda é o mesmo antes de armar.
- **Re-render:** o contexto foi dividido em estado, ações e layout. O Treino usa só `useTimerActions` e `useTimerLayout`, então não re-renderiza a cada segundo (critério 30, a confirmar no QA).

### `FloatingTimer` (gesture-handler + reanimated)
- Pan com `activateAfterLongPress(350)`: toques curtos continuam indo para os botões. O movimento roda na thread de UI e não sofre com o tick. Há suporte a "reduzir movimento", a área segura é respeitada no topo (`insets.top + 56`, U1) e na base (`insets.bottom`), e o botão ↑/↓ tem 44 px de largura e rótulo em pt-BR.
- Web: o gesture-handler 2.16 implementa `activateAfterLongPress` no Pan web, e o `announceForAccessibility` existe (vazio) no react-native-web, então não quebra. Os estilos `userSelect`, `WebkitTouchCallout` e `touchAction` são aplicados só na web.

### Telas
- **Armadilha 5:** todos os `SafeAreaView` vêm de `react-native-safe-area-context`.
- **Armadilha 7:** abas com altura fixa (`Touch.comfort`), `includeFontPadding: false` e `numberOfLines={1}`.
- **Armadilha 8:** a Home navega com `{ daySlug: nextWorkout.slug }`, e o Treino aplica o slug novo.
- **Armadilha 9:** a Home e o Treino continuam usando `nextWorkout` do hook (último concluído), sem olhar o dia da semana.
- **Armadilha 10:** `calcTotals` filtra `isAlternative`, e substitutos com `kcal 0` não mostram calorias.
- **Armadilha 2:** o `toISOString` restante só aparece em `updated_at` (horário, não data). OK.
- **Armadilha 1** (correções anteriores): `onAuthStateChange` continua só com estado local e `setTimeout`. Sem regressão.
- Estados de erro com "Tentar de novo" preservados em Home, Treino, Dieta e Calendário. Esqueletos no carregamento. `saveError`, confirmação de substituir e confirmação de "Sair" (agora no Perfil) preservados. `dietMode` decide a dieta, e a dieta fixa só aparece com `status === 'fixed'`. Sem regressão das correções de 05/10.
- Textos em pt-BR. Nenhuma fonte com `fontWeight`.

### Limites inegociáveis
- Nada de dieta gerada por IA. Nenhum segredo novo. Nenhuma migração, nenhuma RLS alterada e nenhum uso de `service_role`. A notificação na tela bloqueada mostra só "Descanso" e o nome do exercício, sem dado de saúde sensível.

---

## O que precisa do build EAS de teste (antes do APK final)

1. **Compilação do Kotlin** (`modules/rest-timer`): só o EAS confirma. Se falhar, o erro aparece na etapa "Run gradlew". Fazer o build de teste **depois** de corrigir o I4, para não gastar dois builds.
2. Confirmar no log do EAS que o `expo-system-ui` e o módulo `rest-timer` foram ligados pelo autolinking.

## O que conferir no celular Android (APK de teste)

- Primeiro descanso: o diálogo de permissão de notificação aparece uma única vez (Android 13+).
- A notificação "Descanso · <exercício>" faz a contagem descer sozinha, também com o app em segundo plano.
- **Com a tela bloqueada e o alarme exato permitido:** no 0:00 o celular toca e vibra, e aparece "Descanso terminado", sem contagem negativa. **Repetir umas 5 vezes**, para pegar a corrida do I4 caso ela não tenha sido corrigida.
- Android 14+: "Alarmes e lembretes" vem desligado. O aviso único aparece no painel, e o botão abre a tela certa. Sem a permissão, o aviso pode atrasar, e o app vibra quando está aberto.
- Pausar, zerar, trocar o tempo ou fechar remove a notificação e não toca depois. O "+15 s" atualiza a contagem.
- Com o app aberto no fim do descanso, o alerta acontece uma vez só. Pelo D4, nesse caso vem o aviso do sistema no topo, com som.
- Segurar e arrastar o painel funciona, e os toques curtos nos botões não começam o arraste. Conferir o "estalo" de tamanho ao soltar (U6) e se o painel pisca por um quadro ao trocar de posição.
- Tema: celular claro mostra splash clara e app claro; celular escuro, o inverso. Com "Escuro" forçado e o celular claro, a barra de status fica escura com ícones claros.
- Abas do treino sem texto cortado (armadilha 7). Textos em Barlow e Inter, não em Roboto. Nomes longos de dia ("Inferior A + Glúteos") cabem na manchete.

## O que conferir no iPhone (PWA da Usuária 2) e no QA web (T11, ainda não feito)

- Abrir com o tema salvo diferente do iPhone e confirmar que não há quadro da outra cor (depende do I1).
- Barra de status do PWA legível nos dois temas com `apple-mobile-web-app-status-bar-style: default`.
- Segurar o cronômetro no Safari não abre lupa nem seleção de texto, e o arraste funciona. O Playwright não reproduz o long-press do Safari.
- O bipe do fim e a contagem correta ao voltar continuam funcionando (critério 38). Nenhum pedido de permissão aparece na web.
- Critérios 1 a 11, 20 e 23 a 30 do plano, nos dois temas, com a conta de teste.

## Antes de publicar

Corrigir I1 a I4. Rodar o QA web (T11). Fazer o build EAS de teste. Só então gerar o APK final e publicar a web (T13). As correções de 05/10 entram juntas e continuam dependendo das conferências I2 da revisão anterior antes de aplicar a migração `20261005120000`.
