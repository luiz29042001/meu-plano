# Tema claro/escuro + cronômetro móvel + notificação: parte do backend-engineer

Autor: backend-engineer. Data: 06/10/2026. Tarefas: **T1, T2** (`tema-claro-escuro.md`) e **T14, T15** (`cronometro-mover-notificacao.md`).
Dúvidas e conflitos entre spec e plano: `tema-claro-escuro-duvidas.md`.

## Resumo para o Luiz

- **Banco de dados: nada muda.** Nenhuma migração, nenhuma regra de acesso nova. Seus treinos, checks e anotações (e os da Usuária 2) não são tocados.
- Preparei a "base" do novo visual: as duas paletas (clara e escura), a escolha de tema salva no próprio celular e a tradução das cores dos dias para cada tema. As telas ainda não usam isso. Quem faz essa parte é o ui-builder, logo depois.
- O cronômetro agora guarda a posição (em cima/embaixo) no celular e ganhou o "+15 s".
- No Android, criei a peça que mostra o **tempo do descanso na barra de notificações** e **toca/vibra no fim**, mesmo com a tela bloqueada. Ela só passa a existir num **APK novo**, e precisa de um build de teste antes de chegar ao seu celular (ver "Pendências").
- No iPhone (web) nada muda nos avisos do cronômetro.

---

## T1: dependências e `app.json`

### `package.json` (diff)

```diff
   "dependencies": {
+    "@expo-google-fonts/barlow-condensed": "0.4.1",
+    "@expo-google-fonts/inter": "0.4.2",
     ...
     "expo-status-bar": "~1.12.1",
+    "expo-system-ui": "~3.0.7",
```

- `expo-system-ui` via `npx expo install expo-system-ui` (resolveu `~3.0.7`, SDK 51). É **nativo**: exige APK novo. O plugin dele é aplicado automaticamente pelo prebuild (não precisa entrar em `plugins`).
- Fontes via `npm install --save-exact` nas versões do plano (só JS + `.ttf`, sem dependências).
- `package-lock.json`: `+30 / -2` linhas. Entraram só os 3 pacotes (e nenhuma dependência transitiva nova: `@react-native/normalize-colors 0.74.85` e `debug` já existiam). As 2 linhas removidas são o bloco raiz do lock, que estava dessincronizado do `package.json` (`react-dom "^18.2.0"` → `"18.2.0"`, `react-native-web "^0.19.13"` → `"~0.19.10"`): o npm só copiou os intervalos do `package.json`. **Versões instaladas inalteradas**: `react-dom 18.2.0`, `react-native-web 0.19.13` (dentro de `~0.19.10`), `@expo/metro-runtime 3.2.3`.
- O módulo nativo local (`modules/rest-timer`) **não** entrou no `package.json` nem no lock.
- Peso das 6 fontes usadas: Inter 400/500/600 ≈ 335 KB cada; Barlow Condensed 500/600/700 ≈ 100 KB cada; **total ≈ 1,33 MB**. O ui-builder importa por subcaminho (abaixo) e confere no `dist` (T10).

### `app.json`

| Campo | Antes | Depois |
|---|---|---|
| `userInterfaceStyle` | `dark` | `automatic` (conferido no `expo config --type introspect`: `expo_system_ui_user_interface_style = automatic`) |
| `splash` (geral) | `splash.png`, `#0F0F0F` | `splash-icon.png`, `#F1F1EF` |
| `android.splash` | — | claro `#F1F1EF` + `dark.backgroundColor #222221` (gera `values-night/colors.xml` com `splashscreen_background #222221`) |
| `ios.splash` | — | igual, por consistência (iOS nativo fora do escopo) |
| `android.adaptiveIcon.backgroundColor` | `#0F0F0F` | `#222221` |
| `android.permissions` | — | `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `VIBRATE` |
| `web.themeColor` / `web.backgroundColor` | `#1A1A1C` | `#222221` |

- **Nova imagem `assets/splash-icon.png`**: a `splash.png` antiga tinha fundo escuro opaco (`#0F0F0F`), que apareceria como um quadrado preto no meio da splash clara. Gerei uma cópia com o mesmo logo laranja e **fundo transparente** (mesmo tamanho, 1242 px, bordas suavizadas). A `splash.png` antiga ficou no repositório, sem uso. Ver dúvida D7.
- Nenhum `#0F0F0F` sobrou no `app.json` (critério 18).

### `.gitignore` (correção necessária)

A linha `android/` ignorava **qualquer** pasta `android`, inclusive `modules/rest-timer/android` (o código Kotlin). O EAS envia o projeto respeitando o `.gitignore`, então o build sairia **sem** o módulo. Troquei para `/android/` e `/ios/` (só as pastas geradas na raiz). Conferido com `git check-ignore`.

---

## T2: lógica de tema (sem UI)

| Arquivo | O que tem |
|---|---|
| `src/utils/theme.ts` | `ColorScheme`, `ThemePreference`, `ThemeColors` (27 chaves: as 26 da spec §1 + `dragShadow` da §12), `ColorToken`, `lightColors`, `darkColors`, `palettes`, `NotificationColors.accent = '#1A9348'`, `Font`, `FontSize`, `Tracking`, `numberLineHeight()`, `Radius`, `Spacing`, `Touch`. `Colors` = `darkColors` com `@deprecated` (remover na T10). |
| `src/utils/dayColor.ts` | `dayColor(hex, scheme)`, `resolveAccent(value, scheme)`, `normalizeHex`, `contrastRatio`. Mapa §2.1 + reserva §2.2, memorizado. |
| `src/services/devicePrefs.ts` | Preferências do aparelho (AsyncStorage / `localStorage`). |
| `src/contexts/ThemeContext.tsx` | `ThemeProvider`, `useTheme`, `makeStyles`. |
| `src/utils/systemChrome.ts` / `.web.ts` | `applySystemChrome` (chamado pelo `ThemeProvider` a cada troca de tema). |
| `src/services/dietData.ts` | `color` das refeições do Luiz agora é **nome de token**: `suppColor`, `red`, `orange`, `purple`, `pushColor`, `legsColor`, `pullColor`, `restColor`. |
| `src/types/index.ts` | Só comentários em `Meal.color` e `TimerState.color` (sem mudança de tipo). |

Conferências do `dayColor` (rodadas em Node): `#E07A9A` → claro `#A6486B`; `#E8572A` → claro `#A9502F`, escuro `#E07856`; `#2A7BE8` → escuro `#5A93D4`; `#27AE60` → escuro `#42B968` (critério 9). Reserva: `#E07857` (fora do mapa) → `#A6583F` (spec dá `#A6593F` para `#E07856`); `#E07A9B` → `#B54569` (spec: `#B54568`). Vazio, `null` ou inválido → `restColor`. Aceita `#abc`, sem `#`, minúsculas e `#RRGGBBAA` (descarta o alfa).

**Atenção (estado intermediário):** como o `dietData` já usa nomes de token, a `DietScreen` **atual** passa `'pushColor'` etc. direto como cor (e concatena `+ '22'`) até a T7. Compila, mas as cores das refeições do Luiz ficam inválidas (sem cor) até o ui-builder trocar por `resolveAccent`. Não publicar nada antes da T7.

Nenhum arquivo do tema importa `services/supabase` (critério 16).

---

## T14: `TimerContext` + `devicePrefs`

- **Armadilha 4 preservada.** `endsAtRef` continua sendo a única fonte da verdade; o tempo restante é sempre `ceil((endsAt − agora)/1000)`; `tick` a cada 250 ms; recálculo ao voltar (`AppState` e `visibilitychange`); `unlockAudio` no toque; bipe na web e vibração no Android como antes.
- Mudança interna: um espelho síncrono (`stateRef`) substitui os efeitos colaterais dentro do updater do `setState`. O comportamento é o mesmo; isso permite avisar a notificação nativa com segurança.
- Ao pausar, o tempo congelado agora é calculado do `endsAt` no instante do toque (antes era o valor do último tick, até 250 ms atrasado).
- Cor padrão do cronômetro: `'#E8572A'` → `''` (vira `restColor` no `dayColor`).
- **Contexto dividido em 3** (estado, ações, layout): quem usa só `useTimerActions()` não re-renderiza a cada segundo.
- `addTime(s)`: rodando → `endsAt += s` (e `total` cresce junto, para a linha de progresso continuar coerente) e a notificação é reagendada; pausado/terminado → soma ao tempo parado, sem iniciar.
- Posição: carregada do aparelho no início (`'bottom'` por padrão); se o usuário mover antes da leitura terminar, vale o que ele fez.
- Notificação (Android): `launchTimer` e retomar → `startRestNotification`; pausar, zerar, preset, fechar, "terminado → voltar ao total" → `cancelRestNotification`. Ao **terminar**, o JS **não** cancela (o alarme pode estar tocando).
- Alerta sem duplicar (critério 35): se a notificação está armada com alarme exato, o app **não vibra**; o sistema toca e vibra. Sem alarme exato, o app vibra como hoje e, se estiver na frente, cancela o aviso atrasado do sistema.
- **Permissão de notificação:** pedida **uma única vez**, no primeiro descanso iniciado no Android (diálogo do sistema direto, como manda o plano). Fica registrado em `meu-plano:notif-pedida` (com o horário, para permitir a regra dos 30 dias no futuro). Ver dúvida D3.

---

## T15: módulo nativo `modules/rest-timer` (Android)

```
modules/rest-timer/
  expo-module.config.json        só android; módulo expo.modules.resttimer.RestTimerModule
  package.json                   privado, só para o autolinking dar nome ao módulo
  index.ts                       ponte JS (requireOptionalNativeModule('RestTimer') → null se não existir)
  android/build.gradle           mesmo padrão do expo-system-ui (SDK 51) + androidx.core 1.12.0
  android/src/main/AndroidManifest.xml   permissões + <receiver> RestTimerAlarmReceiver (exported=false)
  android/src/main/java/expo/modules/resttimer/
    RestTimerModule.kt           Name("RestTimer"): start, cancel, areNotificationsEnabled,
                                 canScheduleExactAlarms, openExactAlarmSettings, openAppNotificationSettings
    RestTimerNotifier.kt         canais, notificação com contagem, alarme, cancelamento, aviso do fim
    RestTimerAlarmReceiver.kt    recebe o alarme e publica "Descanso terminado"
  android/src/main/res/drawable/ic_stat_descanso.xml   ícone vetorial de cronômetro, branco
```

- Autolinking conferido: `npx expo-modules-autolinking resolve --platform android` encontra `rest-timer` com `expo.modules.resttimer.RestTimerModule`.
- Manifest conferido no `expo config --type introspect`: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM` e `VIBRATE` presentes.
- **Canais:** `descanso-andamento` ("Cronômetro de descanso", baixa, sem som e sem vibração) e `descanso-fim` ("Fim do descanso", alta, som padrão + vibração `0,400,200,400,200,600`, igual ao app).
- **Contagem:** `setUsesChronometer + setChronometerCountDown + setWhen(endsAt)`, fixa (`ongoing`), silenciosa, `CATEGORY_STOPWATCH`, visível na tela bloqueada (só "Descanso" + nome do exercício), `setTimeoutAfter(endsAt − agora)` contra contagem negativa, cor `#1A9348`. Tocar abre o app onde ele estava.
- **Fim:** `setExactAndAllowWhileIdle(RTC_WAKEUP, endsAt)` se houver permissão; senão `setAndAllowWhileIdle` (pode atrasar). O receptor remove a contagem (id 4207) e publica, com **outro id** (4209), o aviso "Descanso terminado" / "Próxima série: <exercício>" (sem exercício: "Hora da próxima série"), com som, vibração, heads-up; some ao tocar ou após 10 min.
- **Proteção contra alarme velho:** o módulo guarda o `endsAt` atual; o receptor ignora alarmes de descanso já cancelado ou substituído.
- `start` devolve `true` só quando a notificação pode aparecer, o alarme exato foi agendado **e** o canal `descanso-fim` está ligado com som; é isso que alimenta `isNativeAlertArmed()` (que ainda reconfere na hora do fim; ver "Correções da revisão").
- Sem ações na notificação (+15 s/Parar/Continuar/De novo), conforme decisão do Luiz.
- Web: `restNotification.web.ts` não faz nada e não pede permissão (critério 38). O bundle web não contém o módulo (conferido).

---

## Contratos para o ui-builder

### Tema

```ts
import { useTheme, makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, Tracking, Radius, Spacing, Touch, numberLineHeight } from '../utils/theme';

const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.bg },
  title: { fontFamily: Font.condSemi, fontSize: FontSize.xl, color: c.text, includeFontPadding: false },
}));

function Tela() {
  const styles = useStyles();
  const { colors, scheme, preference, setPreference, dayColor, resolveAccent } = useTheme();
}
```

- `useTheme(): { scheme, preference, colors, ready, setPreference, dayColor(hex), resolveAccent(value) }`. `useTheme` **lança erro** fora do `ThemeProvider`.
- `makeStyles(factory)` devolve um hook; uma `StyleSheet` por tema por arquivo, em cache. Subcomponentes do mesmo arquivo também chamam `useStyles()`.
- `ThemeColors` (27 chaves): `bg, bgElevated, card, cardHover, cardAlt, surface, border, borderStrong, text, textMuted, textFaint, primary, onPrimary, onAccent, green, greenDim, onGreen, dragShadow, pushColor, pullColor, legsColor, restColor, pinkColor, orange, red, purple, suppColor`.
- `Font`: `condMedium`, `condSemi`, `condBold`, `body`, `bodyMedium`, `bodySemi`. Os nomes são as **chaves do `useFonts`**. **Nunca** use `fontWeight` junto. Na web já vem com pilha de reserva.
- `FontSize`: `xs 12, sm 13, md 14, base 16, lg 18, xl 24, xxl 32, xxxl 40, display 64, hero 72, timer 80`. `Tracking`: `caps 0.5, tight -0.5, tighter -1.5`. `numberLineHeight(size)` = 0,92 × tamanho. `Radius`: `sm/md 2, lg/xl/xxl 4, pill 500`. `Spacing`: `xs 4 … xxl 24, xxxl 32, section 48`. `Touch`: `min 44, comfort 48, primary 56`.
- `NotificationColors.accent` só documenta a cor da notificação; a tela não usa.
- **Cores de dado:** toda cor do banco passa por `dayColor(...)` (Home, Treino, Calendário, `FloatingTimer` com `timerState.color`). Toda cor de refeição passa por `resolveAccent(meal.color)` (Dieta: tokens do `dietData` e hex do banco). Nada de `cor + '26'`.
- `Colors` (deprecado) = `darkColors`. Ainda compila nas telas antigas; remover na T10.

**Para a T3 (`App.tsx`):** carregar as fontes por subcaminho, com o `useFonts` do `expo-font` instalado:

```ts
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { BarlowCondensed_500Medium } from '@expo-google-fonts/barlow-condensed/500Medium';
import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed/600SemiBold';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
// useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
//            BarlowCondensed_500Medium, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold })
```

Nunca importar o índice (`@expo-google-fonts/inter`), que traz todos os pesos. A árvore e o `AppGate` (esperar `useTheme().ready` + fontes, teto de 3 s) seguem o plano. O `ThemeProvider` precisa ficar **acima** do `AuthProvider` e do `TimerProvider`.

### Preferências do aparelho (`src/services/devicePrefs.ts`)

```ts
type TimerPosition = 'top' | 'bottom';
THEME_STORAGE_KEY = 'meu-plano:tema'                 // igual ao script do public/index.html
loadThemePreference(): Promise<ThemePreference>      // inválido/erro → 'system'
saveThemePreference(p): Promise<void>
loadTimerPosition(): Promise<TimerPosition>          // 'meu-plano:cronometro-posicao', padrão 'bottom'
saveTimerPosition(p): Promise<void>
loadNotifPromptShown(): Promise<boolean>             // 'meu-plano:notif-pedida'
loadNotifPromptShownAt(): Promise<number | null>
saveNotifPromptShown(): Promise<void>
loadExactAlarmNoticeShown(): Promise<boolean>        // 'meu-plano:aviso-alarme-exato'
saveExactAlarmNoticeShown(): Promise<void>
```

Nenhuma lança erro. As telas normalmente **não** precisam chamar isso direto: o tema vem do `useTheme`, a posição do `useTimerLayout` e o aviso do `useRestNotification`.

### Cronômetro (`src/contexts/TimerContext.tsx`)

```ts
useTimerActions(): { launchTimer(label, seconds, color), closeTimer(), toggleTimer(),
                     resetTimer(), setPreset(seconds), addTime(seconds) }   // estável
useTimerLayout():  { position: 'top' | 'bottom', setPosition(p), panelHeight, setPanelHeight(h) }
useTimerState():   TimerState                       // muda a cada segundo
useTimer():        TimerActions & { timerState }    // compatível com o código atual
```

- `WorkoutScreen`: trocar `useTimer()` por `useTimerActions()` e passar a **cor crua** do dia: `launchTimer(ex.name, ex.rest_seconds, activeDay?.color ?? '')` (sem `Colors.pushColor`). O espaço da lista vem de `useTimerLayout()` (`paddingTop` ou `paddingBottom` = `panelHeight` conforme `position`).
- `FloatingTimer`: `useTimer()` (ou `useTimerState()` + `useTimerActions()`), `dayColor(timerState.color)` na renderização, `onLayout` → `setPanelHeight`, botão ↑/↓ e gesto → `setPosition`, "+15 s" → `addTime(15)`. `panelHeight` já volta a 0 sozinho quando o cronômetro fecha.
- Fora do `TimerProvider` os hooks lançam erro.

### Notificação (`src/hooks/useRestNotification.ts`, para Perfil e cronômetro)

```ts
useRestNotification(): {
  status: { supported: boolean; notifications: boolean; exactAlarm: boolean } | null; // null = carregando
  exactAlarmNoticePending: boolean;   // mostrar UMA vez o aviso "permita alarmes" no painel
  dismissExactAlarmNotice(): void;
  refresh(): void;                    // já roda ao voltar para o app
  requestPermission(): Promise<boolean>;
  openExactAlarmSettings(): void;     // tela "Alarmes e lembretes"
  openAppNotificationSettings(): void;
}
```

- Mostrar as linhas do Perfil e o aviso do cronômetro **só** quando `status?.supported` (Android com APK novo). Na web, `supported` é sempre `false`.
- Perfil: "Avisos do cronômetro: Ativados/Desativados" = `status.notifications`; tocar em "Desativados" → `requestPermission()` e, se continuar `false`, `openAppNotificationSettings()`. "Alarme na hora certa" = `status.exactAlarm`; tocar → `openExactAlarmSettings()`.
- Cronômetro: se `exactAlarmNoticePending`, mostrar o aviso com botão → `openExactAlarmSettings()` e chamar `dismissExactAlarmNotice()` (ao tocar no botão ou fechar o aviso).
- As telas **não** chamam `startRestNotification`/`cancelRestNotification`: o `TimerContext` já faz isso.

---

## Correções da revisão (docs/review/tema-claro-escuro.md, 06/10)

**Em português simples:** no fim do descanso, o aviso "Descanso terminado" podia, raramente, ser apagado pelo próprio sistema no mesmo instante em que aparecia (e o som era cortado). Agora a contagem e o aviso são duas notificações separadas, e isso não acontece mais. Além disso, se a pessoa desligar só o "Fim do descanso" nas configurações de notificação do Android, o app volta a vibrar sozinho em vez de ficar mudo.

### I4: ids separados para contagem e aviso do fim
- `RestTimerNotifier.kt`: `RUNNING_ID = 4207` (contagem) e `DONE_ID = 4209` (aviso). O antigo `NOTIFICATION_ID` deixou de existir.
- `showDone` (chamado pelo `RestTimerAlarmReceiver`): primeiro `cancel(RUNNING_ID)`, depois `notify(DONE_ID, …)`. O `setTimeoutAfter` da contagem só tem a chave `RUNNING_ID`, então não tem como apagar o aviso.
- `start`: cancela o `DONE_ID` (novo descanso tira o "terminado" anterior) e publica a contagem em `RUNNING_ID`.
- `cancel`: cancela o alarme e os dois ids.
- O `setTimeoutAfter(DONE_TIMEOUT_MS)` (10 min) do aviso continua só no `DONE_ID`.

### S1: "armado" exige o canal do fim ligado
- Kotlin: nova `RestTimerNotifier.isDoneChannelEnabled(context)` (Android 8+: canal `descanso-fim` com `importance >= IMPORTANCE_DEFAULT`, ou seja, ligado e com som; se o canal ainda não existe, `true`, porque o `start` o cria com importância alta; antes do Android 8, `true`). Exposta no módulo como `Function("isDoneChannelEnabled")` e tipada em `modules/rest-timer/index.ts`.
- `start` devolve `exact && isDoneChannelEnabled` (o alarme continua agendado mesmo com o canal desligado; é inofensivo).
- `src/services/restNotification.ts`: `isNativeAlertArmed()` agora devolve `armed && areNotificationsEnabled() && isDoneChannelEnabled()`, reconferindo **na hora do fim** (a pessoa pode ter desligado algo durante o descanso). Qualquer erro, ou APK sem a função nova → `false` → o app vibra (alerta próprio). Pode haver alerta duplo nesse caso de dúvida, nunca alerta mudo.
- `RestNotificationStatus` ganhou `doneChannel: boolean` (nativo e `.web.ts`; na web, `false`). Vem em `useRestNotification().status`, sem mudança na API do hook.
- `TimerContext.tsx` **não** foi alterado: ele já chama `isNativeAlertArmed()` no `alertFinished`.

### S2: texto do fim
- Na camada de serviço/nativo o texto já é **"Descanso terminado"** (`restNotification.ts` e o padrão do `RestTimerAlarmReceiver`/`RestTexts`). O "Descanso concluído" está em `FloatingTimer.tsx` (texto de tela): **fica para o ui-builder trocar para "Descanso terminado"**.

### Para o ui-builder (opcional)
- Perfil: se quiser, quando `status.supported && status.notifications && !status.doneChannel`, mostrar "Aviso do fim desligado" e, ao tocar, `openAppNotificationSettings()` (a tela de notificações do app lista o canal "Fim do descanso").

### Conferir no celular (além da lista abaixo)
- Repetir o fim do descanso com a tela bloqueada umas 5 vezes: o aviso "Descanso terminado" deve sempre ficar na gaveta, com som, e a contagem deve sumir.
- Ajustes do Android → Notificações do Meu Plano → desligar só "Fim do descanso": com o app aberto, no 0:00 o celular deve vibrar (alerta do app).

## Verificações feitas

- `npx tsc --noEmit -p .`: sem erros.
- `npx expo export --platform android` e `--platform web` (em pasta temporária, apagada depois): os dois compilam. O bundle Android contém a ponte do `RestTimer`; o web não.
- `npx expo config --type introspect`: `userInterfaceStyle automatic`, splash clara/escura, permissões no manifest.
- `npx expo-modules-autolinking resolve --platform android`: módulo local encontrado.
- Depois das correções da revisão (06/10): `tsc` sem erros; bundles Android e web compilam (pasta temporária, apagada).
- **Não verificado localmente:** a compilação do Kotlin (não há Java nem Android SDK nesta máquina; o `expo export` só empacota o JS).

## Pendências

1. **Build EAS de teste (`preview`) antes do APK final** para validar o Kotlin: `set EAS_NO_VCS=1 && eas build --platform android --profile preview --no-wait` (precisa do OK do Luiz; gasta um build da cota). Se falhar, o erro aparece no log do EAS, na etapa "Run gradlew", e eu corrijo.
2. **Conferir no celular (APK de teste)**, de preferência Android 13+ e 14+:
   - primeiro descanso → diálogo de permissão uma única vez (critério 31);
   - notificação "Descanso · <exercício>" com contagem descendo sozinha, com o app em segundo plano (32);
   - tela bloqueada: toca e vibra em até ~2 s no 0:00, vira "Descanso terminado", sem contagem negativa (33);
   - pausar, zerar, preset e fechar removem a notificação e não tocam depois; "+15 s" atualiza a contagem e o horário (34);
   - app aberto no fim → **um** alerta só (35);
   - Android 14: "Alarmes e lembretes" vem desligado; o aviso único aparece (quando o ui-builder fizer a T16) e o botão abre a tela certa (36);
   - celular claro → splash clara; escuro → splash escura; `useColorScheme` responde ao tema do aparelho (21).
3. **T3 (ui-builder):** `App.tsx` com `ThemeProvider` acima de tudo, `AppGate`, fontes e `ThemedStatusBar`; `public/index.html`/`manifest.json`.
4. **T7 (ui-builder):** a Dieta precisa de `resolveAccent` (ver "estado intermediário" acima).
5. **T10:** remover `Colors` deprecado e decidir se apaga `assets/splash.png` (sem uso).
6. **T13:** registrar no `CLAUDE.md` o módulo `modules/rest-timer`, a correção do `.gitignore` e a regra "sem `fontWeight` com fonte customizada".
