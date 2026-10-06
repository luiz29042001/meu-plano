# Plano técnico: cronômetro móvel + notificação do descanso

Autor: tech-lead. Data: 06/10/2026. Status: **aguardando aprovação do Luiz**. Entra **na mesma build** do tema claro/escuro.
Plano principal: `docs/tech/tema-claro-escuro.md` (seção "Adendo"). Spec visual: `docs/design/tema-claro-escuro.md` (§6.3, cronômetro; o design-director está atualizando em paralelo a alça, as posições e o botão de mover).

---

## Objetivo

(i) O usuário pode arrastar o cronômetro (pressionar e segurar) e soltá-lo preso no **topo** ou na **base** da tela, para liberar a área de anotações. Existe também um botão para quem não usa o gesto.
(ii) No Android, enquanto o descanso corre aparece uma notificação fixa com **contagem regressiva ao vivo**, igual ao timer nativo. Ao terminar, toca e vibra mesmo com o app em segundo plano ou a tela bloqueada. No iPhone (web), isso não é possível nesta build (ver §3).

## Estado atual (conferido no código)

- `react-native-gesture-handler` **2.16.2** e `react-native-reanimated` **3.10.1** instalados; `babel.config.js` já tem `react-native-reanimated/plugin`; `GestureHandlerRootView` já envolve o app (`App.tsx`). **Nenhuma dependência nova para arrastar.**
- `TimerContext`: fonte da verdade é `endsAtRef` (armadilha 4); `tick` a cada 250 ms; alerta no Android = `Vibration.vibrate` **só se o JS estiver rodando**. Com a tela bloqueada, o Android congela o JS e o alerta só sai ao voltar ao app.
- O valor do contexto é um objeto novo a cada render do provider, então **toda tela que usa `useTimer()` re-renderiza a cada segundo** enquanto o cronômetro corre (inclui a tela de Treino, com os campos de anotação).
- Não existe `addTime` (a spec pede "+15 s").
- `expo-notifications` e `@notifee/react-native` **não** estão instalados. `expo-keep-awake` 13.0.2 está, mas não é usado.

---

## 1. Cronômetro móvel

### Abordagem

- **Gesto:** `GestureDetector` com `Gesture.Pan().activateAfterLongPress(350)` no painel inteiro. Toques curtos continuam indo para os botões; só depois de segurar 350 ms o painel "descola". Vibração curta de 10 ms ao descolar no Android (mesma da spec do tema).
- **Movimento no thread de UI:** `useSharedValue(translateY)` + `useAnimatedStyle`. Ao soltar, o painel vai para a âncora mais próxima (topo ou base) com `withTiming` de 200 ms; com "reduzir movimento" (`useReducedMotion()` do reanimated), vai direto. O tick do cronômetro (re-render a cada segundo) **não interfere**: o deslocamento mora no valor compartilhado, não no estado do React.
- **Âncoras** calculadas a partir de `useWindowDimensions()`, `useSafeAreaInsets()` (notch no topo, barra de gestos/home indicator na base) e da altura do painel (`onLayout`):
  - topo: `top = insets.top + Spacing.sm`;
  - base: `bottom = insets.bottom + Spacing.sm` (posição atual).
  O painel continua `position: 'absolute'` sobre todas as telas, como hoje.
- **Alternativa sem gesto (acessibilidade):** botão de 44 px no painel, "Mover para cima" / "Mover para baixo" (ícone ↑/↓, `accessibilityLabel` com o texto). Também `accessibilityActions` no painel (`moveUp`/`moveDown`) para leitores de tela. O botão é o caminho principal para quem não descobrir o gesto.
- **Persistência: sim, no aparelho.** Chave `meu-plano:cronometro-posicao` (`'top' | 'bottom'`, padrão `'bottom'`). Mesmo mecanismo do tema; custo quase zero, e a pessoa que prefere em cima não precisa arrastar a cada série. Para não duplicar código, o `themePreference.ts` do plano do tema vira `src/services/devicePrefs.ts` com uma função para cada uma das duas chaves.
- **Conteúdo não fica escondido:** a spec já pede que a lista do Treino tenha espaço igual à altura do painel. Agora esse espaço vai para **cima ou para baixo**, conforme a âncora: a tela lê `{ position, panelHeight }` de `useTimerLayout()`.
- **Teclado aberto:** nada automático nesta build. No Android (`softwareKeyboardLayoutMode` padrão `resize`), o painel na base sobe junto com o teclado e pode cobrir o campo de anotação; é exatamente o caso em que o usuário move o painel para o topo (e a escolha fica salva). Mover sozinho ao abrir o teclado exigiria detectar teclado na web do iPhone (`visualViewport`), que não emite os eventos do RN. Fica como melhoria futura, se o uso pedir.
- **Web/Safari:** o gesture-handler 2.16 tem implementação web para Pan com long-press, e o reanimated 3.10 funciona na web. No painel, aplicar só na web `userSelect: 'none'`, `WebkitTouchCallout: 'none'` e `touchAction: 'none'`, para o Safari não abrir a lupa/seleção nem rolar a página durante o gesto. **Conferir no iPhone real** (o Playwright emula toque, mas não o long-press do Safari).

### Armadilha 4

Mover não toca em `endsAt`, `tick`, `unlockAudio` nem vibração. A posição mora num estado separado do `timerState`.

### Descartado

- **`PanResponder` do React Native:** dispensaria o reanimated, mas o movimento rodaria no JS, que já re-renderiza a cada segundo com o cronômetro; o arrasto ficaria travado no Android. As bibliotecas já estão instaladas e configuradas.
- **Posição livre (qualquer altura):** mais estado, mais casos de sobreposição. Topo/base resolve o objetivo.

---

## 2. Notificação do descanso (Android)

### Recomendação: **módulo nativo próprio, local, com a Expo Modules API** (`modules/rest-timer/`)

Criado com `npx create-expo-module@latest --local rest-timer`. Fica dentro do repositório, é ligado automaticamente pelo Expo e compilado pelo EAS. **Não adiciona pacote ao `package.json` nem ao `package-lock.json`** (o `expo-modules-core` já vem com o `expo`). Cerca de 150 linhas de Kotlin:

| Peça | Como |
|---|---|
| Notificação fixa com contagem ao vivo | `NotificationCompat.Builder` com `setOngoing(true)`, `setUsesChronometer(true)`, `setChronometerCountDown(true)`, `setWhen(endsAt)`, `setOnlyAlertOnce(true)`, `setTimeoutAfter(endsAt - agora)`, `setCategory(CATEGORY_STOPWATCH)`, tocar abre o app (`PendingIntent` da activity principal). Canal **`descanso-andamento`** (importância LOW: sem som, sem pop-up). O próprio Android anima a contagem; o JS não precisa estar rodando. |
| Alerta ao terminar, com app em segundo plano ou tela bloqueada | `AlarmManager.setExactAndAllowWhileIdle(RTC_WAKEUP, endsAt, pendingIntent)` → `BroadcastReceiver` do módulo publica, **com o mesmo id**, a notificação "Descanso concluído · Próxima série" (substitui a contagem) no canal **`descanso-fim`** (importância HIGH: som padrão + padrão de vibração parecido com o atual). |
| Sem permissão de alarme exato | Cai para `setAndAllowWhileIdle`: o Android pode atrasar o aviso (em descansos curtos, dezenas de segundos). O alerta dentro do app ao voltar continua como hoje. |
| Cancelar | `cancel()`: cancela o alarme e remove a notificação. Chamado ao pausar, zerar, trocar preset, fechar e reiniciar o cronômetro. |
| Permissões | `canPostNotifications()` / pedido de `POST_NOTIFICATIONS` (Android 13+) pelo `PermissionsAndroid` do próprio RN 0.74; `canScheduleExactAlarms()` e `openExactAlarmSettings()` (`Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM`). |
| Ícone | Drawable vetorial monocromático `ic_stat_descanso` no `res/` do módulo (o ícone do app aparece como quadrado cinza na barra). |

**Contagem ao terminar:** o cronômetro do Android, em modo regressivo, passa para negativo ("−0:03") se ninguém mexer. A troca pela notificação de "concluído" no mesmo instante, com o `setTimeoutAfter` como garantia, evita isso.

### Fluxo de permissões (na primeira vez que o cronômetro inicia)

1. `POST_NOTIFICATIONS` (Android 13+): pedir no toque que inicia o cronômetro. Se negar, tudo funciona como hoje, só dentro do app. Pedir **uma vez**; guardar em `devicePrefs` que já pediu. A tela Perfil ganha a linha "Notificações do descanso: ativadas/desativadas", que abre as configurações do app.
2. Alarme exato: no Android 14+, `SCHEDULE_EXACT_ALARM` vem **negado** por padrão para apps com alvo na API 33+, inclusive no APK atualizado do Luiz (o app nunca declarou essa permissão). Se não houver permissão, mostrar **uma vez** um aviso no painel do cronômetro ("Para avisar na hora certa com a tela bloqueada, permita alarmes") com botão que chama `openExactAlarmSettings()`, e repetir o mesmo item no Perfil. Sem permissão, segue no modo atrasado.

### Ligação com o `TimerContext` (sem quebrar a armadilha 4)

- `endsAt` continua sendo a única fonte da verdade. O módulo só recebe uma **cópia** (`start({ endsAt, label })`).
- Chamadas: `launchTimer` e retomar → `start`; pausar, `resetTimer`, `setPreset`, `closeTimer` → `cancel`; `addTime` → `start` de novo com o novo `endsAt` (reagenda e atualiza a contagem).
- **Sem alerta duplicado:** quando a notificação está armada (permissão de notificação **e** de alarme exato), o alerta do Android vem só da notificação, mesmo com o app aberto, como no timer do relógio do Android. O `alertFinished()` do app pula a vibração nesse caso. Sem as permissões, o comportamento de hoje continua.
- **Ao terminar, o JS não cancela o alarme** (corrida: cancelaria o som). Só o fechamento do painel remove a notificação "concluído".
- **Alerta atrasado ao voltar:** se o app volta depois de `endsAt + 2 s` e a notificação estava armada, o `tick` não vibra de novo.

### Ações na notificação (+30 s, Parar)

**Viáveis, mas fora desta build.** Exigem que o receptor nativo mude o horário de término com o app em segundo plano e que o JS sincronize ao voltar (dois lugares mexendo no `endsAt`). É exatamente o tipo de mudança que já quebrou o cronômetro antes (armadilha 4). Nesta build, tocar na notificação abre o app no cronômetro. Próximo passo, se o Luiz sentir falta: o módulo guarda o `endsAt` alterado e o `TimerContext` relê no `AppState 'active'`.

### Descartados

- **`@notifee/react-native` 9.1.8** (tem `showChronometer` + `chronometerDirection: 'down'` + gatilho por horário): faz o mesmo com menos Kotlin, mas a **última versão é de 12/2024**, sem manutenção visível. No Android também exige um repositório Maven extra via `expo-build-properties` (`extraMavenRepos` apontando para `node_modules/@notifee/react-native/android/libs`), adiciona pacote ao lock e é um risco concreto na atualização obrigatória do SDK do Roadmap 3 (nova arquitetura, API 36). O módulo local usa só APIs do Android e a Expo Modules API, que acompanham o SDK.
- **`expo-notifications` (0.28.x no SDK 51):** agenda bem o aviso do fim, mas **não tem contagem ao vivo** (sem `usesChronometer`), que era o pedido. Instalar só para o aviso final traria Firebase/push sem uso.
- **Serviço em primeiro plano** (manter o JS vivo e tocar pelo JS): o Android 14+ exige tipo de serviço declarado e justificativa na Play, e o JS do RN ainda atrasa timers com a tela desligada. O alarme exato é a peça certa para "tocar na hora".
- **`USE_EXACT_ALARM`** (concedida sem pedir): a Play só aceita em apps cujo propósito principal é alarme ou timer. Arriscado no Roadmap 3. `SCHEDULE_EXACT_ALARM` é a permissão aceita.

### Impacto no APK e configuração

- **APK novo:** já necessário pelo tema; nenhum custo extra de entrega. Tamanho: desprezível (Kotlin do módulo + um ícone vetorial).
- `app.json` → `android.permissions`: `["POST_NOTIFICATIONS", "SCHEDULE_EXACT_ALARM", "VIBRATE"]`. O `BroadcastReceiver` vai no `AndroidManifest.xml` do próprio módulo, que é mesclado no build.
- **Roadmap 3 (API 36):** `setUsesChronometer`/`setChronometerCountDown`, canais, `POST_NOTIFICATIONS` e `SCHEDULE_EXACT_ALARM` seguem válidos no Android 15/16. Na Play, declarar o uso de notificações no formulário de Segurança dos dados (não envolve dado pessoal) e testar o "voltar preditivo" ao tocar na notificação. O Android 16 traz notificações de "progresso ao vivo" (`Notification.ProgressStyle` / Live Updates): é uma evolução opcional, não um requisito.

---

## 3. iPhone (web/PWA no Safari): o que é possível

Avaliação honesta:
- A **Notification API** existe no Safari do iOS 16.4+, **só no app instalado na tela de início**, com permissão pedida num toque. Mas ela só exibe uma notificação **quando o JS está rodando**. Com a PWA em segundo plano ou a tela bloqueada, o Safari **suspende** a página: `setTimeout` não dispara e o áudio para.
- **Não existe agendamento local** (Notification Triggers não existe no Safari) e **não existe contagem ao vivo** em notificação web em nenhum navegador.
- O único jeito de avisar com a PWA fechada é **Web Push vindo de um servidor**: guardar a inscrição (VAPID) no Supabase e disparar um push no `endsAt` por uma Edge Function agendada. Os agendamentos do Supabase (`pg_cron`) têm granularidade de 1 minuto, impreciso demais para descansos de 30 a 120 s, além de serem uma peça nova de infraestrutura.

**Decisão: fora do escopo desta build.** Na web nada muda: o bipe e a contagem correta ao voltar (`endsAt`) continuam funcionando com o app aberto. Sugestão de baixo custo para avaliar depois, **não incluída**: manter a tela acesa durante o descanso (`navigator.wakeLock` na web; `expo-keep-awake`, já instalado, no Android), o que mantém o bipe funcionando com o iPhone apoiado no banco. A falha conhecida do Wake Lock em PWA instalada foi corrigida no iOS 18.4.

O módulo de notificação tem um gêmeo `src/services/restNotification.web.ts` que não faz nada, para o `TimerContext` chamar as mesmas funções nas duas plataformas.

---

## 4. Contratos

```ts
// src/services/devicePrefs.ts  (substitui o themePreference.ts do plano do tema)
export type TimerPosition = 'top' | 'bottom';
export function loadThemePreference(): Promise<ThemePreference>;   // chave 'meu-plano:tema'
export function saveThemePreference(p: ThemePreference): Promise<void>;
export function loadTimerPosition(): Promise<TimerPosition>;       // 'meu-plano:cronometro-posicao', padrão 'bottom'
export function saveTimerPosition(p: TimerPosition): Promise<void>;
export function loadNotifPromptShown(): Promise<boolean>;          // 'meu-plano:notif-pedida'
export function saveNotifPromptShown(): Promise<void>;

// src/contexts/TimerContext.tsx — dividido para não re-renderizar telas a cada segundo
interface TimerActions {             // useTimerActions(): valor estável (useMemo/useCallback)
  launchTimer(label: string, seconds: number, color: string): void;
  closeTimer(): void; toggleTimer(): void; resetTimer(): void;
  setPreset(seconds: number): void;
  addTime(seconds: number): void;    // novo: endsAt += s (rodando) ou seconds += s (pausado)
}
interface TimerLayout {              // useTimerLayout(): muda só ao mover/medir
  position: TimerPosition;
  setPosition(p: TimerPosition): void;   // estado + devicePrefs
  panelHeight: number;                   // 0 quando invisível
  setPanelHeight(h: number): void;       // só o FloatingTimer chama
}
export function useTimer(): TimerActions & { timerState: TimerState }; // compatível com o uso atual
export function useTimerActions(): TimerActions;
export function useTimerLayout(): TimerLayout;

// src/services/restNotification.ts (nativo, chama o módulo) | restNotification.web.ts (no-op)
export interface RestNotificationStatus { notifications: boolean; exactAlarm: boolean }
export function getRestNotificationStatus(): Promise<RestNotificationStatus>;
export function requestNotificationPermission(): Promise<boolean>; // PermissionsAndroid, API 33+
export function openExactAlarmSettings(): void;
export function openAppNotificationSettings(): void;
export function startRestNotification(p: { endsAt: number; label: string }): Promise<void>;
export function cancelRestNotification(): Promise<void>;
/** true se a notificação está armada com alarme exato: o app não vibra por conta própria */
export function isNativeAlertArmed(): boolean;

// modules/rest-timer (Expo Modules API, Kotlin) — superfície JS
//   start(endsAtMs: number, title: string, body: string): void
//   cancel(): void
//   canScheduleExactAlarms(): boolean
//   openExactAlarmSettings(): void
```

Detalhe importante do `TimerContext`: `endsAtRef` continua sendo a fonte da verdade. `restNotification` só recebe cópias. Nenhuma função do serviço devolve ou altera `endsAt`.

---

## 5. Riscos

| Risco | Mitigação |
|---|---|
| Long-press + arrasto no Safari do iPhone conflitar com seleção/lupa/rolagem | Estilos web do §1; conferência no iPhone real; o botão ↑/↓ funciona sempre. |
| Arrasto engolir os toques dos botões do painel | `activateAfterLongPress(350)`: toques curtos não ativam o Pan. QA testa todos os botões. |
| Re-render a cada segundo nas telas (já existe hoje) | Divisão em `useTimerActions`/`useTimerLayout`; o Treino deixa de re-renderizar a cada tick. |
| Alarme exato negado (Android 14+) → aviso atrasado | Aviso único com botão para as configurações + item no Perfil; o alerta dentro do app continua. |
| Alerta duplicado (notificação + vibração do app) | Regra `isNativeAlertArmed()`; critério de aceite. |
| JS cancelar o alarme na hora de tocar | O JS não cancela ao terminar; só ao pausar/zerar/fechar/preset/relançar. |
| Processo do app morto pelo Android durante o descanso | O alarme e a notificação são nativos e tocam mesmo assim; ao reabrir, o app começa sem cronômetro (aceito). |
| Kotlin sem desenvolvedor Android na equipe | Módulo pequeno, APIs estáveis do `NotificationCompat`/`AlarmManager`; erros de compilação aparecem no EAS; comportamento validado no APK (critérios 31 a 35). |
| Notificação "Descanso" visível na tela bloqueada | Mostra só "Descanso · <exercício>", sem dado de saúde sensível. `VISIBILITY_PUBLIC` aceitável; o design-director confirma o texto. |
| Armadilha 4 | `endsAt` intocado; ver §2. |

---

## 6. Tarefas (numeração continua a do plano do tema)

- [x] **T14 (backend-engineer)** (feito 06/10, ver `tema-claro-escuro-backend.md`) `devicePrefs.ts` (absorve `themePreference.ts` da T2). `TimerContext`: divisão `useTimerActions`/`useTimerLayout`, `addTime`, posição persistida, ganchos para `restNotification`, regra de alerta duplicado. Sem mudar o cálculo por `endsAt`.
- [x] **T15 (backend-engineer)** (código feito 06/10; falta o build EAS de teste) Módulo local `modules/rest-timer` (Kotlin, Expo Modules API): canais, notificação com contagem, alarme exato + receptor, cancelamento, permissões, ícone. `restNotification.ts`/`.web.ts`. `app.json` `android.permissions`. Conferir que o `package-lock.json` **não** mudou por causa do módulo. `expo export --platform android` e um build EAS de teste (`preview`) para validar a compilação nativa.
- [ ] **T16 (ui-builder)** `FloatingTimer`: gesto (Pan com long-press), âncoras com área segura, botão ↑/↓ e `accessibilityActions`, estilos web anti-seleção, `onLayout` → `setPanelHeight`, "+15 s" (`addTime`), aviso único de alarme exato. Faz parte da T5 do plano do tema (Treino + cronômetro).
- [ ] **T17 (ui-builder)** `WorkoutScreen`: espaço no topo ou na base conforme `useTimerLayout()`; trocar `useTimer()` por `useTimerActions()`. `ProfileScreen`: linhas "Notificações do descanso" e "Alarme na hora certa" (status + abrir configurações), só no Android (`Platform.OS === 'android'`).
- [ ] QA (T11) e revisão (T12) incluem os critérios abaixo.

---

## 7. Critérios de aceite

**Mover (web e Android)**
23. Segurar o painel ~0,35 s e arrastar: ele segue o dedo; ao soltar na metade de cima, fica preso no topo, abaixo do notch/barra de status; na metade de baixo, na base, acima da barra de gestos.
24. Toques curtos nos botões do painel (presets, pausar, +15 s, fechar, ↑/↓) continuam funcionando e não iniciam arrasto.
25. O botão ↑/↓ (≥ 44 px, `accessibilityLabel` "Mover para cima"/"Mover para baixo") faz o mesmo sem gesto.
26. A posição escolhida continua depois de fechar e abrir o cronômetro e depois de recarregar/reabrir o app (`localStorage['meu-plano:cronometro-posicao']` na web).
27. Com o painel no topo, o exercício atual e o campo de anotação ficam visíveis e editáveis; a lista ganha espaço no topo, não na base.
28. Mover o painel durante a contagem não altera o tempo restante (comparar com o relógio) nem dispara alerta.
29. Com "reduzir movimento" ativo, o painel vai direto para a âncora, sem animação.
30. Com o cronômetro correndo, a tela de Treino não re-renderiza a cada segundo (React DevTools Profiler ou log temporário em desenvolvimento; só o `FloatingTimer` re-renderiza).

**Notificação (somente Android, conferir no APK)**
31. Primeira vez que o cronômetro inicia no Android 13+: o sistema pede permissão de notificação uma única vez. Negando, o cronômetro funciona como hoje.
32. Com a permissão: ao iniciar um descanso de 60 s, aparece uma notificação fixa "Descanso · <exercício>" com contagem regressiva que anda sozinha, inclusive com o app em segundo plano.
33. Com a tela bloqueada e permissão de alarme exato, ao chegar a 0:00 o celular toca e vibra em até ~2 s, e a notificação vira "Descanso concluído". Não aparece contagem negativa.
34. Pausar, zerar, trocar preset ou fechar o cronômetro remove a notificação e **não** toca depois. "+15 s" atualiza a contagem da notificação e o horário do toque.
35. Com o app aberto no fim do descanso, o alerta acontece **uma vez** (sem vibração dupla).
36. Sem permissão de alarme exato: aparece uma vez o aviso com botão que abre a tela "Alarmes e lembretes" do Android; o Perfil mostra o status. O cronômetro continua funcionando.
37. `package-lock.json` sem mudança por causa do módulo; `app.json` com as 3 permissões; `tsc` e os dois bundles compilam; o build EAS `preview` compila.

**Web/iPhone**
38. Nenhuma mudança de comportamento de alerta na web: o bipe com o app aberto e a contagem correta ao voltar continuam (regressão da armadilha 4). Nenhum pedido de permissão de notificação na web.
