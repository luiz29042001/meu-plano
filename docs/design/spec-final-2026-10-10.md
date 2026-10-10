# Final design spec — Meu Plano (locked, 2026-10-10)

Author: design-director. Status: **locked proposal, awaiting Luiz's OK on the HTML mockup** (`spec-final-2026-10-10.html`). After the OK, implement everything in ONE pass (one APK, one web publish). Nothing in app code was touched.

Binding inputs: `veredito-splits59-2026-10-10.md` (keep Splits59 base), `revisao-ux-2026-10-10.md` (items 1-10, superseded where this file differs), `tema-claro-escuro.md`, `src/utils/theme.ts`, current screens. UI strings are pt-BR; the rest is English.

Skills used: ui-ux-pro-max (verdict searches + `pro-rules.md` checklist, section 14), design-system (token discipline: zero new color keys), web-design-guidelines (focus, safe-area, zoom, live regions, applied by hand), frontend-design (one memorable element = day-color stripe + condensed numerals; nothing else decorative). The ui-ux-pro-max design-system search was already discarded in the earlier review (landing-page pattern, wrong product); not re-run.

---

## 0. Decisions made (so nothing is open)

| # | Question | Decision |
|---|---|---|
| D1 | Accent system across themes | **Green = "done / progress / live action" in BOTH themes** (`green` token; light `#137036`, dark `#1DB954`). Day color = identity only (stripe, tab underline, dots fill). `primary` (ink in light, green in dark) stays for navigation CTAs (`Começar treino`, `Concluir treino`). No new hue. |
| D2 | Where does `Série feita` live | **Sticky dock above the bottom bar** (thumb zone, always visible, no scrolling), 56px button. Not inside the scroll. |
| D3 | Timer vs dock vs bar collision | Timer **default position becomes `top`** (compact, below header; stored user preference still wins). If the user moves it to the bottom, it sits **above dock + bar** (new `bottomOffset`). |
| D4 | Checkbox on the current exercise | **Removed** (two ways to mark = confusion). Compact rows keep their 56px check (toggle without sets). Current exercise is completed by the last `Série feita`; undo = `Desfazer série`. |
| D5 | Persist set count | **Per-device, per-day** in AsyncStorage/localStorage key `sets:YYYY-MM-DD:<exerciseId>`; old days pruned on mount. No schema change. The DB check stays the truth for "exercise done". |
| D6 | Sets parsing | `parseInt(exercise.sets)`; NaN or <1 -> 1 set; clamp 1-12. "3-4" -> 3. |
| D7 | Rest after the last set | Timer starts after **every** set, including the last of an exercise (rest before the next one), except the last set of the last pending exercise. |
| D8 | Skip-with-confirm finish | Enabled at >= 1 exercise checked. If pending exist: `confirmAction('Concluir sem terminar tudo?', 'Faltam N exercícios. Registrar o treino mesmo assim?', 'Concluir')`. |
| D9 | Bottom bar scope | Visible on every authenticated screen (Início, Treino, Dieta, Calendário, Perfil); active item on Calendário/Perfil = Início. Hidden on Login and while the keyboard is open. |
| D10 | Back chevron | Removed on Treino and Dieta (bar replaces it); kept on Calendário and Perfil. |
| D11 | Streak | **Luiz decision: no streaks.** Home shows only **days trained this week** (week starts Monday, counted client-side from completion dates), as `N/meta` where meta = number of non-rest program days. No `current_streak`, no weekly-streak cell. Do not read `user_stats.current_streak`. |
| D12 | Wake lock | Always on while Workout is focused and the workout is not completed; released on blur/background/completion. No setting (fewer toggles). Web: `navigator.wakeLock` (guarded). Android: `expo-keep-awake`. |
| D13 | Auto-rest setting | Perfil: `Iniciar descanso ao marcar série` `Sim`/`Não`, default Sim, device-local (`devicePrefs.ts`). |
| D14 | Offline detection | Web: `navigator.onLine` + events. Native: no NetInfo dependency; offline notice appears when a request fails with a network error and clears on the next success. |
| D15 | Desktop web | Unchanged: 560px centered column, bar inside the column. |
| D16 | Google "G" glyph on Login | Stays as text glyph (no new dependency). Official mark is deferred to roadmap item 3 (Play). |
| D17 | Haptics | Android `Vibration.vibrate(10)` on set done, 30 on finish. iOS web: none. |
| D18 | Icons | None (text-only chrome). Glyphs `›`, `+`, `−`, `✓` only, decorative and hidden from a11y. |

---

## 1. Final tokens

Only **values** change in `ThemeColors`; the 27 key names stay (zero new color keys). Contrast = WCAG 2.x, computed.

### 1.1 Color — light

| Token | Hex | On `bg` #F1F1EF | On `card` #FAFAF9 | On `surface` #E4E4E1 | Note |
|---|---|---|---|---|---|
| `bg` | `#F1F1EF` | - | - | - | unchanged |
| `bgElevated` | `#F7F7F5` | | | | unchanged (timer panel) |
| `card` / `cardAlt` / `cardHover` / `surface` | `#FAFAF9` / `#ECECE9` / `#E9E9E6` / `#E4E4E1` | | | | unchanged; `cardHover` = pressed fill |
| `border` | **`#C8C8C3`** (was `#D4D4D0`) | 1.48 | 1.61 | - | divider; non-text decorative |
| `borderStrong` | `#262626` | 13.38 | 14.49 | 11.88 | interactive edges |
| `text` | `#262626` | 13.38 | 14.49 | 11.88 | |
| `textMuted` | `#4D4D4B` | 7.49 | 8.11 | 6.65 | |
| `textFaint` | `#646461` | 5.25 | 5.68 | 4.66 | disabled/placeholder/pending outline |
| `primary` / `onPrimary` | `#262626` / `#F1F1EF` | 13.38 (pair) | | | |
| `green` / `onGreen` | `#137036` / `#F1F1EF` | 5.46 | 5.92 | 4.85 | pair contrast 5.46 (Série feita) |
| `greenDim` | `#0F5E2D` | 6.98 | 7.56 | 6.20 | pressed fill of green; pair with onGreen 6.98 |
| `pushColor` | **`#9F4B2C`** | 5.28 | 5.72 | 4.69 | |
| `pullColor` | **`#34679E`** | 5.19 | 5.62 | 4.60 | |
| `legsColor` | **`#297144`** | 5.25 | 5.68 | 4.66 | |
| `restColor` | **`#646461`** | 5.25 | 5.68 | 4.66 | == textFaint on purpose |
| `pinkColor` | **`#9F4567`** | 5.27 | 5.71 | 4.68 | |
| `orange` | **`#895B0F`** | 5.21 | 5.64 | 4.62 | |
| `red` | **`#B03944`** | 5.28 | 5.72 | 4.69 | errors only |
| `purple` | `#7A4FA8` | 5.29 | 5.73 | 4.69 | unchanged |
| `suppColor` | `#8A5A12` | 5.23 | 5.66 | 4.64 | unchanged |
| `dragShadow` | `rgba(38,38,38,0.18)` | | | | unchanged |

### 1.2 Color — dark

| Token | Hex | On `bg` #222221 | On `card` #2A2A29 | On `surface` #363634 | Note |
|---|---|---|---|---|---|
| `bg` / `bgElevated` / `card` / `cardAlt` / `cardHover` / `surface` | `#222221` / `#272726` / `#2A2A29` / `#262625` / `#323231` / `#363634` | | | | unchanged (Luiz: soft, not darker) |
| `border` | `#3E3E3B` | 1.48 | 1.34 | - | unchanged: same 1.48 on `bg` as light, so dividers have parity |
| `borderStrong`, `text` | `#E9E7E3` | 12.89 | 11.63 | 9.81 | |
| `textMuted` | `#B5B3AE` | 7.60 | 6.86 | 5.78 | |
| `textFaint` | `#A3A19C` | 6.17 | 5.57 | 4.69 | |
| `primary` / `onPrimary` | `#1DB954` / `#222221` | 6.16 (pair) | | | |
| `green` / `onGreen` | `#1DB954` / `#222221` | 6.16 | 5.56 | 4.68 | |
| `greenDim` | `#1AA34A` | 4.84 | 4.37 | **3.68** | pressed fill ONLY (pair with onGreen 4.84); never text on `surface` |
| `pushColor` | **`#E4886A`** | 6.09 | 5.49 | 4.63 | |
| `pullColor` | **`#73A3DA`** | 6.05 | 5.46 | 4.60 | |
| `legsColor` | `#42B968` | 6.35 | 5.73 | 4.83 | unchanged |
| `restColor` | **`#A2A09C`** | 6.10 | 5.50 | 4.64 | |
| `pinkColor` | **`#E283A1`** | 6.06 | 5.47 | 4.61 | |
| `orange` | `#E8A94A` | 7.74 | 6.98 | 5.89 | unchanged |
| `red` | **`#EA8188`** | 6.06 | 5.47 | 4.61 | |
| `purple` | **`#B790DC`** | 6.09 | 5.50 | 4.63 | |
| `suppColor` | `#E0A85A` | 7.52 | 6.79 | 5.72 | unchanged |
| `dragShadow` | `rgba(0,0,0,0.45)` | | | | unchanged |

**`src/utils/dayColor.ts` `DAY_COLOR_MAP` holds the real day colors** (the token values above are only the fallbacks), so it MUST be updated too, or the contrast fix does nothing:

| DB color(s) | Light | Dark |
|---|---|---|
| `#E07856`, `#E8572A` (Push) | `#9F4B2C` | `#E4886A` |
| `#5A93D4`, `#2A7BE8` (Pull, Superior A) | `#34679E` | `#73A3DA` |
| `#42B968`, `#27AE60` (Legs, Inferior B) | `#297144` | `#42B968` |
| `#E07A9A` (Inferior A) | `#9F4567` | `#E283A1` |
| `#A878D4` (Superior B) | `#7A4FA8` | **`#B790DC`** (old `#A878D4` was 3.63 on surface) |
| `#E0A85A` (Glúteos C) | `#8A5A12` | `#E0A85A` |
| `#8E8E96`, `#8E8E93` (Descanso) | `#646461` | `#A2A09C` |

Softness check (Luiz asked for less contrast): `bg`, `text`, `textMuted`, `textFaint`, `card`, `surface` are untouched in both themes; only the light divider and accent hues shift 3-5% in luminance. Body text stays at 13.4:1 / 12.9:1.

### 1.3 Non-text rules
- Dividers: `border` 1px (1.48:1, deliberately soft). Interactive edges (outline buttons, checkbox, segmented, active tab bar) use `borderStrong`.
- Pressed state in both themes: fill `cardHover` + (outline buttons) edge stays `borderStrong`; filled buttons: `green` -> `greenDim`, `primary` -> opacity 0.85. Duration 80 ms.
- Focus (web, keyboard): 2px outline `text`, offset 2px, never removed. Android: system focus.
- Pending set segment / unchecked: outline in `textFaint` (4.66 on `surface`, 5.25 on `bg`) — shape differs from filled, so color is not the only cue.
- Notification accent `#1A9348` unchanged (non-text only).

### 1.4 Type scale (unchanged families; sentence-case rule enforced)

Families: Barlow Condensed 500/600/700 (numerals, headlines, buttons, tabs), Inter 400/500/600 (body). No new fonts.

| Token | px | Use |
|---|---|---|
| `xs` 12 | **deprecated**: raise every use to `sm` (min text size = 13) |
| `sm` 13 | captions, units, kickers, Tag (Inter 600 **sentence case**) |
| `md` 14 | secondary body, notices, set label |
| `base` 16 | body, rows |
| `lg` 18 | tabs, bar labels, button text (Barlow caps), exercise name |
| `title` 20 | primary button text (Barlow caps) |
| `xl` 24 | screen titles (Barlow caps), `Série 2 de 4` count, row sets |
| `numeral` 28 / `xxl` 32 | meal kcal, macros |
| `xxxl` 40 | NumbersRow values, counters |
| `display` 64 | sets x reps, day name on Treino |
| `hero` 72 | day name on Início, Login title, kcal total |
| `timer` 80 | timer digits (panel); compact top timer uses `xxxl` 40 |

Rules: **uppercase only for Barlow >= 18px** (tabs, bar, buttons, headlines, screen titles). Anything < 18 is sentence case (Tag, kicker, link, caption, panel titles are raised to 18 or made Inter). Line-height: text 18/20/22/24/26; numerals 0.92 x size. `numberOfLines` + `maxFontSizeMultiplier 1.2` on all display numerals. Tabular numerals on every number.

### 1.5 Spacing, size, motion

- Spacing (unchanged 4/8/12/16/20/24/32/48): gutter 20 (`xl`); block gap 32; row padding 12.
- `Radius.sm` 2 for everything; `pill` only for progress/dots tracks.
- Touch: `min` 44 (links, back, avatar), `comfort` 48 (secondary buttons, segmented, tabs), `primary` 56 (rows, primary, dock button, bar items).
- **NEW `Layout` constants** (theme.ts): `BAR_HEIGHT = 56` (+ bottom safe inset), `DOCK_HEIGHT = 72` (8 + 56 + 8), `COLUMN_MAX = 560`, `TIMER_TOP_HEIGHT = 112` (existing estimate).
- **NEW `Motion` constants** (theme.ts), all become 0 with reduced motion (`useReducedMotion` native, `prefers-reduced-motion` web):

| Token | ms | Easing | Used by |
|---|---|---|---|
| `press` | 80 | linear | pressed fill/opacity on every tappable |
| `fill` | 150 | ease-out | dot fill, check fill, progress bar width, variant switch |
| `enter` | 200 | ease-out | Notice appear, completion summary fade, row expand (opacity only) |
| `route` | 150 | fade | stack animation for bar-switches (drill-downs keep `slide_from_right`) |
| `timer` | 220 | existing | timer snap (unchanged) |
| `pulse` | 300 | existing | timer finished pulse; **skipped** under reduced motion |

No layout-shifting transforms on press (pro-rules). No confetti, no bounce.

---

## 2. Global components

### 2.1 Buttons (`Buttons.tsx`)
- `PrimaryButton` (56): unchanged; add prop `tone="done"` -> fill `green`, text `onGreen`, pressed `greenDim`, disabled `surface`/`textFaint`. Used only for `Série feita`.
- `OutlineButton` (48): default edge `borderStrong`, text Barlow 18 caps `text`. Add `size="compact"` is NOT needed. Used for every per-set and per-item action (`Anotar`, `Como fazer`, `Descanso 90 s`, `Desfazer série`, `Substitutos`, `Dica`, `Salvar`, `Atualizar`).
- `LinkButton` (44, underlined): **restricted to low-frequency inline text actions** (`Tentar de novo` inside Notice, `Voltar ao início`). Never for anything used every set or every meal.

### 2.2 `Notice` (NEW, `src/components/Notice.tsx`)
Row, `minHeight 44`, fill `surface`, `borderLeftWidth 3` `red` (offline variant: `textFaint`), padding 12/16, text Inter 14 `text`, optional trailing `LinkButton` (`Tentar de novo`). Pinned at the top of the scroll content (not a toast: the phone is on a bench). `role="alert"` web / `accessibilityLiveRegion="polite"`. Fade in `enter` 200 ms.

### 2.3 `SetDots` (NEW, `src/components/SetDots.tsx`)
N segments (N <= 12), each `flex:1`, `height 8`, gap 4, `Radius.pill`. Done: filled with day color (`accent`); all done: filled `green`. Pending: transparent + 1.5px `textFaint` outline. Group `accessible`, label `Série 2 de 4`, role `progressbar` with value. Fill animates `fill` 150 ms.

### 2.4 `BottomBar` (NEW, `src/components/BottomBar.tsx`)
Height 56 + safe-area bottom inset; fill `bg`; top border 1px `border`; no shadow. Three equal cells `Início`, `Treino`, `Dieta`, label Barlow 600 18 caps. Inactive `textMuted` (7.5:1), active `text` + 3px top bar in `text` (not day color). Each cell is a button, `accessibilityState={{selected}}`, min 56 high, full cell hit area, pressed fill `cardHover`. Pending diet: `Dieta` stays enabled (screen shows the "Em preparação" state). Rendered inside `AppNavigator` after the Stack, constrained to the 560 column; reads the active route from a `navigationRef` (`onReady`/`onStateChange`). Hidden on Login and while `useKeyboardVisible()`.

### 2.5 `WorkoutDock` (NEW, `src/components/WorkoutDock.tsx`)
Sticky above the bar, Workout only. Height 72: padding 8/20, fill `bg`, top border 1px `border`. Contains one full-width button (see 4.2 state machine). Reports its height to `TimerContext.bottomOffset` while mounted so the timer (if at bottom) sits above dock + bar; hidden while keyboard is open.

### 2.6 `WeekStrip` (NEW, `src/components/WeekStrip.tsx`)
7 equal cells Seg..Dom: weekday initial (Inter 13 `textMuted`) over a 12px square marker. Done = filled `green`; today = 2px `borderStrong` outline (filled green if done); past and missed = 1px `textFaint` outline; future = 1px `border` outline. Not tappable. Single a11y label: `Esta semana: treinou segunda, terça, quinta e sexta. 4 de 6.`

### 2.7 `ScreenHeader`
Add `back?: boolean` (default true). Treino/Dieta pass `back={false}`: title starts at the 20px gutter. Subtitle `xs` -> `sm` 13. Title Barlow 24 caps (unchanged).

### 2.8 `Tag`
Inter 600 13px, **sentence case**, `bg` text on `text` fill (inverted, unchanged idea). Was Barlow caps 13 (violates the new rule).

### 2.9 Timer (`FloatingTimer`, `TimerContext`)
- Default position `top` (compact, 112px) — stored preference still wins.
- Bottom anchor = `BAR_HEIGHT + bottom inset + dockHeight` via `bottomOffset`.
- Auto-launched by `Série feita` (`launchTimer(name, rest_seconds, dayColorRaw)`); unlocks iOS audio on that same tap (pitfall 4 respected).
- Digits: compact `xxxl` 40, full 80; `+30 s`, `Pular`, `Fechar` are 48px outline buttons (existing presets 30/60/90/120 stay in full mode).
- Finished: pulse 300 ms (not under reduced motion), label `Descanso terminado` in `green`, vibration pattern as today.
- Content paddings: `useTimerInsets` adds `BAR_HEIGHT + inset (+ DOCK_HEIGHT on Workout)` to `bottom`; `top` unchanged.

---

## 3. Início (Home)

**Objective / one action:** start today's workout -> `Começar treino`.
**Hierarchy:** 1) next-workout name (hero 72, stripe), 2) `Começar treino`, 3) week progress (`4/6`), 4) rows to Calendário/Perfil.

### 390px layout (top to bottom, gutter 20)
1. Header 44: `MEU PLANO` (Barlow 24 caps) left; avatar button 44x44 right (initial; `Abrir perfil e ajustes`).
2. Greeting Inter 16 `textMuted`: `Bom dia, Luiz. Sábado, 10 de outubro.`
3. (gap 32) `DayHeadline`: kicker `Próximo treino` (Tag `Feito hoje` when applicable), name hero (72, shrinks to 56 above 10 chars), muscles Inter 16.
4. (gap 20) `NumbersRow`: `6` exercícios / `22` séries / `58` minutos, aprox.
5. (gap 20) `PrimaryButton` `Começar treino` (or `Ver próximo treino` when done today). Note `Último treino: Push A.` Inter 14 muted.
6. (gap 32) **Week block**: kicker `Esta semana` (Inter 13 muted), `WeekStrip` (Monday first), then one `NumbersRow` cell: `4/6` + `treinos na semana` (numeral `green` when goal met). No streak.
7. (gap 32) Hairline list, rows 56 with trailing `›`: `Calendário` / `Histórico de treinos`; `Perfil` / `Aparência, avisos e conta`.
8. Bottom padding = `bottom` inset (bar + timer).

Removed: `Dieta` row (bar), lifetime-total footer (moved into Calendário, which already shows `no total`).

Wider web: same 560 column centered; no re-layout.

### States
| State | UI |
|---|---|
| Loading | Skeleton 220x64 + 88 + 56 (existing); week block skeleton 1 line + 56; header and bar render immediately. |
| Ready | as above. |
| Done today | Tag `Feito hoje`, CTA `Ver próximo treino`. |
| Empty (no program) | `DayHeadline` `Sem programa` (rest color), `Você ainda não tem um programa de treino.` + OutlineButton `Atualizar`. Week block hidden. |
| New account, no workouts | week block shows `0/6 treinos na semana`; note `Seu primeiro treino começa aqui.` |
| Error | `ErrorBlock` `Não foi possível carregar seu treino.` + cause + `Tentar de novo`. Bar still works. |
| Offline | `Notice` (neutral edge) `Sem internet. Mostrando o último treino carregado.` if cached data exists, else Error. |
| Extremes | Name > 10 chars shrinks; `Feito hoje` + long name stay on one line (name `numberOfLines 1`); `12/12`, `99+` clamp; 4-digit minutes impossible (cap 999). |

Motion: none on load; week markers fill `fill` 150 ms on first paint only. Access: avatar label; NumbersRow cells are single a11y elements; WeekStrip single label; rows `button` role with `Calendário: Histórico de treinos`.

---

## 4. Treino (Workout)

**Objective / one action:** log the current set -> `Série feita`.
**Hierarchy:** 1) `3 × 10–12` numerals + exercise name, 2) `Série feita` (dock), 3) set dots + `Série 2 de 4`, 4) last load line, 5) the rest of the list.

### 4.1 Layout at 390px
Top to bottom: Header 56 (`TREINO`, subtitle program name, no back, nothing on the right) -> **Tabs** 48 (Barlow 18 caps; active `text` + 3px underline in day color; next-workout dot 6px in day color; unchanged geometry, pitfall 7 kept) -> [timer top slot 112 when running] -> scroll:

1. `DayHeadline` display (64) + counter right `2/6` Barlow 40 + `exercícios` 13 (turns `green` at 100%). Progress bar 4px (track `surface`, fill day color -> `green` at 100%, width animates 150 ms).
2. List (top border 1px `border`):
   - **Done group** (only if >0): one row 56: `✓` box (green) + `1 feito` (Barlow 24) + names (Inter 13 `textFaint`, 1 line) + `+`/`−`. **The whole row is the button** (no underlined `Ver`). Expanded rows = CompactRow with its 56px check (undo).
   - **Current block** (top/bottom hairlines, padding 20/20):
     - `Exercício 2 de 6` Inter 14 muted.
     - Name Inter 600 18 (2 lines max).
     - Numerals `3 × 10–12` Barlow 700 64 (shrinks to 50 when > 8 chars, e.g. `3 × 12–20/perna`) + caption `séries × repetições` 13.
     - `SetDots` + label row: `Série 2 de 4` (Barlow 24 `text`) left, `Descanso 90 s` (Inter 14 muted) right.
     - **Last-load line** (row 56, hairlines): left kicker `Última vez` (13 muted), value = first line of the saved note, Inter 600 18 `text`, 1 line; trailing `›`. Whole row opens the note editor. No note: `Sem anotação ainda. Toque para registrar a carga.` in `textFaint`.
     - **Actions row** (wrap, gap 8, each flexGrow 1, minWidth 104, height 48, OutlineButton): `Anotar`, `Como fazer` (only if tip), `Descanso 90 s` (launches timer manually). After >= 1 set: `Desfazer série` appended.
     - Tip box (3px left border `border`, Inter 14) and note editor (as today) open below the actions; opening one closes the other.
   - **Next rows** (CompactRow 56): name + `3 × 10` + 56px check; row tap focuses it (it becomes the current block).
3. **Finish section** (in scroll, below list): see 4.3.

### 4.2 Dock state machine (always the 72px dock, one button)
| Condition | Dock | Behavior |
|---|---|---|
| Rest day or no exercises | hidden | - |
| Current exercise not done, sets < N | `PrimaryButton tone=done` `Série feita` | +1 set, light haptic, dot fills 150 ms, auto timer (if pref on, D7), a11y announcement `Série 2 de 4 feita. Descanso de 90 segundos.` |
| Last set (sets == N-1) | same label; set label reads `Última série` | on tap: `toggleCheck(exercise, false)`, focus moves to next pending, timer starts (except D7 exception) |
| Viewing an exercise already done | `OutlineButton` `Reabrir exercício` | unchecks, sets reset to 0 |
| All exercises done, not completed | `PrimaryButton` `Marcar como concluído` | completes (4.3) |
| Completed today | hidden | in-flow `Treino de hoje concluído.` |
| Saving | `PrimaryButton loading` `Salvando…` | busy |

### 4.3 Finish
In the scroll, under the list (visible even when the dock shows `Série feita`): `OutlineButton` (48) `Concluir treino (3/6)` enabled at >= 1 checked; label at 0: `Marque ao menos um exercício` (disabled). When pending exist -> `confirmAction` (D8). When `allDone` the dock takes the action and this button hides. Existing "replace today's other workout" confirm stays first.
Success: headline Barlow 40 caps `Treino registrado` + `NumbersRow` (exercícios feitos, séries, minutos real from first set to now) for 3 s (`enter` 200 ms fade), then settles to `Treino de hoje concluído.` Wake lock released.

### 4.4 States
| State | UI |
|---|---|
| Loading | header + tabs skeleton; Skeleton 220x64, bar 4, 160, 56, 56. |
| Empty (no program) | `Você ainda não tem um programa de treino.` + OutlineButton `Atualizar` + LinkButton `Voltar ao início`. |
| Error load | `ErrorBlock` `Não foi possível carregar seu treino.` + `Tentar de novo`. |
| Check/set save error | `Notice` `Não foi possível salvar a marcação. Confira a internet.` + `Tentar de novo`; the control reverts with a `fill` fade; set count is local so the dot stays (it syncs when the exercise check succeeds). |
| Complete error | Notice `Não foi possível registrar o treino. Tente de novo.` and the dock button returns to `Marcar como concluído`. |
| Offline | persistent `Notice` (neutral) `Sem internet. Suas marcações não estão sendo salvas.`; buttons stay enabled (optimistic). |
| Rest day | headline + `Recuperação ativa` (Barlow 24) + `Caminhada leve, mobilidade articular ou alongamento. O crescimento muscular acontece no descanso.`; no dock, no finish. |
| Done today | Tag `Feito hoje`; list read-only collapsed; `Treino de hoje concluído.` |
| Extremes | Name 2 lines; numerals shrink; 1 set -> single segment, label `Série 1 de 1`, button `Série feita`; 12 sets -> 12 thin segments; 10+ exercises -> list scrolls, counter `10/12` fits (xxxl 40, 4 chars); exercise with tip 300+ chars wraps; note 2000 chars shows 1 line in the last-load row. |
| Tab with 6 days | tabs scroll horizontally; active tab scrolled into view on mount. |

Interaction: tapping a tab resets focus/done-collapse; changing tab never loses set progress (key = exercise id). Draft notes survive (existing). Pressing the Android back button on Treino -> Início.
Access: dock button label `Série feita, série 2 de 4, Supino inclinado`; dots one element; live region for set/timer; checkbox `role=checkbox`; all targets >= 48 (actions) / 56 (dock, rows).

---

## 5. Dieta

**Objective / one action:** know what to eat next -> read the `Agora`/`Próxima` meal. (No write actions except variant.)
**Hierarchy:** 1) next meal (name, time, kcal), 2) its items, 3) remaining meals, 4) day totals (one line).

### 390px layout
1. Header 56 (`DIETA`, subtitle `Déficit calórico` or plan name; no back).
2. `Segmented` (48) `Variante A | Variante B` or `Dia de treino | Dia de descanso`; banner Inter 14 under it.
3. **Next-meal hero** (gap 20): Tag `Agora` (meal time <= now < time + 45 min) or `Próxima` + relative `daqui a 1 h 20` Inter 14; meal name Barlow 32 caps (2 lines max); time Barlow 700 40 + `kcal` figure Barlow 600 28 on one row; macros Inter 14 `P 38g · C 52g · G 12g`. Items listed under it always expanded: name Inter 500 16, detail Inter 14 muted, item kcal Barlow 18; per-item `Substitutos` and `Dica` are **OutlineButtons 48** (not underlined links) that expand the panel below the item.
4. After the last meal of the day: hero becomes `Refeições de hoje concluídas` + `Amanhã, 07:00 · Café da manhã` (first meal) — no empty hero.
5. **All meals** list (kicker `Todas as refeições` Inter 13): rows 56 with 3px stripe in meal color, time (Barlow 18 muted), name (Inter 500 16, past meals `textMuted`), sub macros Inter 13, kcal Barlow 18, `+`/`−`. Hairlines `border`. Rows already shown in the hero are omitted from the list.
6. **Day totals** row (56, hairlines): `Total do dia  1.980 kcal · P 150g · C 190g · G 50g`, trailing `+`; expands to kcal numeral (hero 72) + `NumbersRow` + macro note.
7. Hydration block (title Barlow 24 caps + body 16).
8. `useMemo` on `legacyVariants`; `nextMealId` recomputed on a 60 s tick while the screen is focused.

### States
| State | UI |
|---|---|
| Loading | Skeletons: hero 72 + 5 rows 56 (existing); bar visible. |
| Pending (no diet yet) | `DayHeadline` `Em preparação` (rest color) + `Sua dieta ainda está sendo preparada pela nutricionista.` + OutlineButton `Atualizar`. |
| Error | `ErrorBlock` `Não foi possível carregar sua dieta.` + `Tentar de novo`. |
| Variant save failed | `Notice` `Não foi possível salvar sua escolha. Mantivemos a anterior.`; Segmented reverts. |
| Offline | `Notice` neutral `Sem internet. Mostrando a última dieta carregada.` when cached, else Error. |
| Extremes | meal names 2 lines; kcal `2.150` (pt-BR dots); `kcal: 0` items show no calories; substitutes with kcal 0 hide it (pitfall 10); alternative meals excluded from totals and from `nextMealId`; supplements/fasted never "next"; 8+ items scroll; diets with no timestamps -> hero hidden, list only. |

Motion: meal expand = opacity `enter` 200 ms (no height animation, avoids jank on web); variant switch cross-fades `fill`.
Access: hero is one a11y group `Próxima refeição: Almoço, 12:30, 640 quilocalorias`; rows `button` with `expanded` state; Segmented `radiogroup`.

---

## 6. Calendário

**Objective:** see consistency. One action: change month (`‹ ›`, 44px each; arrows get a 1px `border` box so they read as buttons).
Layout (unchanged): month title Barlow caps + year; `NumbersRow` `neste mês` / `no total`; weekday header (Inter 13); 7-col grid, cell >= 44 high with day number, completed days marked with the day-color 4px underline + filled `green` square when completed; today outlined `borderStrong`; legend (day color + label, sentence case, Inter 14).
Changes: contrast tokens only; `FontSize.xs` -> 13; `Legenda` heading Barlow 18 caps; Empty month gets `OutlineButton` `Ver o treino de hoje` (-> Treino).
States: loading (skeleton grid 5x7 + numbers), error (`ErrorBlock` + retry), empty month (`Nenhum treino em outubro.` + button), future month (grid, no marks), offline Notice `Sem internet. Histórico do último carregamento.` Extreme: 31-day months starting Sat (6 rows) fit with scroll; completed counts up to 4 digits.
Bar: visible, `Início` active. Header keeps back chevron.

---

## 7. Perfil

**Objective:** change appearance/behavior or sign out. Back chevron kept; bar visible (`Início` active).
Layout: identity (avatar 56 square with initial, name Barlow 24, `Conta Google conectada`), then hairline rows: `Programa` (value), [Android] `Avisos do cronômetro`, `Alarme na hora certa`; section `Aparência` (Segmented `Sistema | Claro | Escuro` + help line); section `Treino` (Segmented `Iniciar descanso ao marcar série`: `Sim | Não`, help `O cronômetro começa sozinho a cada série feita.`); `Sair da conta` (OutlineButton danger, confirm dialog `Sair da conta` / `Deseja realmente sair?`).
States: profile loading (name skeleton, rows disabled), profile error (`Atleta`, selectors and Sair still work), no program (`Sem programa`), notifications unsupported (rows hidden, web), permission denied (row `Desativados` opens system settings).
Motion: Segmented thumb none; selection fill 80 ms; Android 10 ms vibration on change.

---

## 8. Login

Layout unchanged: title `MEU PLANO` hero 72, lead, 3 benefit rows (hairlines 48), error block, `PrimaryButton` `G  ENTRAR COM GOOGLE`, footnote `Seus dados ficam salvos na nuvem.`. Bar hidden.
States: idle; loading (`Entrando…`, button busy, disabled); error (`ErrorBlock` `Não foi possível entrar.` + cause; button re-enabled); cancelled (silent); offline (`Notice` `Sem internet. Conecte-se para entrar.`); web redirect in progress = loading label. Extreme: 320px wide keeps title one line via shrink.
Contrast: `textFaint` footnote 5.25 / 6.17. Official Google mark deferred (D16).

---

## 9. Copy (pt-BR, final)

| Where | Text |
|---|---|
| Bar | `Início`, `Treino`, `Dieta` (a11y: `Ir para Treino`) |
| Dock | `Série feita`; `Marcar como concluído`; `Reabrir exercício`; `Salvando…` |
| Sets | `Série 2 de 4`; `Última série`; `Desfazer série`; `Descanso 90 s`; `Exercício 2 de 6` |
| Last load | `Última vez`; empty `Sem anotação ainda. Toque para registrar a carga.` |
| Finish | `Concluir treino (3/6)`; `Marque ao menos um exercício`; confirm `Concluir sem terminar tudo?` / `Faltam 2 exercícios. Registrar o treino mesmo assim?` / `Concluir`; success `Treino registrado`; `Treino de hoje concluído.` |
| Errors | `Não foi possível salvar a marcação. Confira a internet.`; `Não foi possível registrar o treino. Tente de novo.`; `Não foi possível carregar seu treino.`; `Não foi possível carregar sua dieta.`; `Não foi possível salvar sua escolha. Mantivemos a anterior.`; `Tentar de novo` |
| Offline | `Sem internet. Suas marcações não estão sendo salvas.`; `Sem internet. Mostrando o último treino carregado.`; `Sem internet. Conecte-se para entrar.` |
| Home | `Próximo treino`; `Começar treino`; `Ver próximo treino`; `Esta semana`; `treinos na semana`; `semanas seguidas na meta`; `Seu primeiro treino começa aqui.`; rows `Calendário`/`Histórico de treinos`, `Perfil`/`Aparência, avisos e conta` |
| Diet | `Agora`; `Próxima`; `daqui a 1 h 20`; `Todas as refeições`; `Total do dia`; `Refeições de hoje concluídas`; `Substitutos`; `Dica`; `Em preparação` |
| Profile | `Iniciar descanso ao marcar série`; `O cronômetro começa sozinho a cada série feita.` |
| Calendar | `Nenhum treino em outubro.`; `Ver o treino de hoje` |

---

## 10. Accessibility summary
- Targets: dock/bar/rows/primary 56; secondary buttons, tabs, segmented 48; links, avatar, back, calendar arrows 44. No target below 44 (checkbox visual 32 keeps a 56 hit area).
- Text >= 4.5:1 everywhere incl. `surface` (section 1). Disabled uses `textFaint` on `surface` (4.66/4.69). Color is never the only cue (pending dots are outlines; done = fill + `✓`; active bar = top bar + weight).
- Dynamic type: display numerals capped at 1.2x with `numberOfLines`; body scales; dock/bar heights are minimums (`minHeight`), so larger text grows them.
- Screen reader order = visual order; live regions for set/timer/Notice; `progressbar` for dots and progress; Segmented `radiogroup`; headers have `header` role.
- Reduced motion: all `Motion` tokens -> 0, no pulse, stack animation `none`.
- Dragging the timer keeps the button alternative (`↑/↓`).
- Web: zoom allowed (no `maximum-scale`), visible focus ring, `viewport-fit=cover`, bottom padding = `env(safe-area-inset-bottom)` through `useSafeAreaInsets`.

---

## 11. Implementation list — ONE build, in order

New dependency: **`expo-keep-awake ~13.0.2`** (`npx expo install expo-keep-awake`; SDK 51 compatible; needs a new APK). Nothing else.

1. `package.json` (+ lock minimal change): add `expo-keep-awake`.
2. `src/utils/theme.ts`: color values (sections 1.1/1.2), `Layout`, `Motion`; mark `FontSize.xs` deprecated (keep export, no uses).
3. `src/utils/dayColor.ts`: `DAY_COLOR_MAP` per 1.2 table.
4. `src/services/devicePrefs.ts`: `autoRest` pref get/set.
5. `src/services/workout.ts`: `fetchRecentCompletionDates(userId, fromISO)` (dates only, last 12 weeks).
6. `src/utils/weekStats.ts` (NEW): Monday-start week helpers, `weekCount(dates)`, `weeksAtGoal(dates, goal)` (local dates, `todayISO` rules; pitfall 2).
7. `src/hooks/useWorkout.ts`: expose `weekDone`, `weekGoal` (week Monday-first); no streak; expose `checkError` flag already present; keep API otherwise.
8. `src/hooks/useSetProgress.ts` (NEW): per-day per-exercise set count (AsyncStorage; web localStorage via same API; try/catch; prune old days).
9. `src/hooks/useKeepAwake.ts` + `.web.ts` (NEW): wake lock with release on blur/background.
10. `src/hooks/useOnline.ts` (+ `.web.ts`), `src/hooks/useKeyboardVisible.ts` (NEW).
11. `src/contexts/TimerContext.tsx`: default position `top`; add `bottomOffset`/`setBottomOffset`; keep `endsAt` logic untouched (pitfall 4).
12. `src/hooks/useTimerInsets.ts`: `bottom` += bar + inset (+ dock when registered).
13. `src/components/`: `Buttons.tsx` (tone `done`; link restriction), `DayHeadline.tsx` (Tag sentence case), `ScreenHeader.tsx` (`back`, 13px), `Notice.tsx`, `SetDots.tsx`, `BottomBar.tsx`, `WorkoutDock.tsx`, `WeekStrip.tsx`, `FloatingTimer.tsx` (bottom anchor, compact digits 40, `+30 s`/`Pular` buttons, reduced motion), `Skeleton.tsx` (reduced motion: no shimmer).
14. `src/navigation/index.tsx`: `navigationRef`, active-route tracking, render `BottomBar` after the Stack inside the column, `animation: 'fade'` for bar destinations, hide on Login.
15. Screens: `WorkoutScreen.tsx` (CurrentExercise rewrite, dock, last-load line, finish flow, Notice, keep-awake), `HomeScreen.tsx` (week block, rows, remove Dieta row/footer), `DietScreen.tsx` (hero, totals row, buttons, tick), `CalendarScreen.tsx`, `ProfileScreen.tsx` (auto-rest Segmented), `LoginScreen.tsx` (offline Notice).
16. `public/index.html`: confirm `viewport-fit=cover`, no `maximum-scale`.
17. Docs sync (ui-builder or tech-lead, not code): `docs/design/tema-claro-escuro.md` §1.1/§2.1 tables, `docs/design/design-system.md`, CLAUDE.md "Design" section.
18. QA assets: extend `tests/qa/` Supabase simulator with `exercise_checks` toggles, `workout_completions` (recent dates for week stats), offline/500 routes; add the checklist below as scripts.
19. Verify once: `tsc`, Android + web bundles, then QA, then review (diff only). One APK (EAS preview), one web publish.

---

## 12. Test checklist

**Web 375px, run in BOTH themes (`light` and `dark`, plus `system`)**
- [ ] No horizontal scroll on every screen; 560 column centered at 1280.
- [ ] Contrast: sample text/day-color/border/dots/buttons against section 1 values (computed, not eyeballed).
- [ ] Bar: 3 items, active state, safe-area padding, hidden on Login and with keyboard open; Calendário/Perfil show Início active.
- [ ] Treino: dock visible without scrolling at 375x667 with timer top running; `Série feita` x N fills dots, starts timer, last set checks the exercise and focuses the next; `Desfazer série`; reload keeps set count (same day); next day resets.
- [ ] Skip finish: 1/6 -> confirm dialog text; cancel keeps state; confirm completes; Calendar shows it.
- [ ] Last-load line: with note, without note, long note; editor opens from the whole row.
- [ ] Notice: simulate 500 on check and on completion; offline (Playwright offline) banner; revert behavior.
- [ ] Diet: hero `Agora`/`Próxima`/after-last-meal states by mocking the clock; totals collapsed/expanded; Substitutos/Dica buttons; variant failure notice.
- [ ] Home: week strip with 0, 4, 6 of 6 (Monday-first); empty program; error; done-today.
- [ ] Reduced motion (`prefers-reduced-motion`): no pulse, no transitions.
- [ ] Zoom 200% and text size: display numerals do not clip; dock/bar grow.
- [ ] Keyboard: Tab order matches visual; focus ring visible; Enter/Space on dock button.
- [ ] iPhone Safari (Usuária 2): PWA standalone bottom inset, audio unlock on first `Série feita`, wake lock present or silently skipped, no zoom on input focus (font >= 16 in note input).
- [ ] No console errors; no Supabase call inside `onAuthStateChange` (pitfall 1); dates local (pitfall 2).

**Android (manual on Luiz's APK; Playwright cannot see it)**
- [ ] Tab text not clipped (pitfall 7); bar labels not clipped (fixed height, `includeFontPadding false`).
- [ ] Keep-awake: screen stays on during Treino, releases on leave/lock.
- [ ] `Série feita` -> 10 ms vibration, timer notification still works when app backgrounded; timer top/bottom positions with bar + dock; hardware back from Treino -> Início.
- [ ] Gesture navigation bar inset under the bar; keyboard hides bar/dock.
- [ ] Dark/light follow system; Perfil selector overrides; notification drawer color unaffected.
- [ ] Large system font (1.3x): nothing hidden behind dock/bar.

**pro-rules checklist result (design level)**: no emoji icons (text glyphs only, hidden from a11y); tokens only; pressed states without layout shift; targets >= 44/48/56; independent dark contrast checked; safe areas for header/bar/dock; scroll insets for fixed chrome; reduced motion + dynamic type specified; 4/8 spacing rhythm kept; text measure limited by the 560 column. Not verifiable here: real rendering, device behavior, Kotlin build.

---

## 13. Genuine decisions for Luiz (3)

1. **Finishing with skipped exercises counts as a normal workout day** in the calendar and in the weekly goal (with a confirmation). Recommendation: yes.
2. **Rest timer starts at the top of the screen** (compact) instead of the bottom for everyone who never moved it; it can still be moved. Recommendation: yes (keeps the `Série feita` button free).
3. ~~Streak~~ **Decided by Luiz: no streaks; show days trained in the week, Monday start.**
