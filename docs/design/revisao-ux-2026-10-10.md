# UX re-review — 2026-10-10

Author: design-director. Status: **proposal, nothing applied** (no app code touched). UI strings are pt-BR; everything else is English. All values are tokens from `src/utils/theme.ts` unless marked NEW.

Sources read: `design-system.md`, `direcao-splits59.md`, `tema-claro-escuro.md` (headings + key sections), `auditoria-2026-10-05.md`, `docs/review/revisao-completa-2026-10-10.md`, `theme.ts`, all 6 screens, `Buttons`, `Segmented`, `NumbersRow`, `DayHeadline`, `ScreenHeader`, `FloatingTimer` (styles), `navigation/index.tsx`. Skills: ui-ux-pro-max (`search.py` ux/stack/design-system + `pro-rules.md`), design-system (token discipline), web-design-guidelines (a11y/zoom/safe-area rules, applied by hand).

Tool honesty: `search.py --design-system "fitness workout app dark mode"` returned a landing-page pattern ("Feature-Rich Showcase", orange `#F97316`, "Vibrant & Block-based"). That does not fit a calm in-gym utility app and contradicts Luiz's low-contrast request, so it was **discarded**. The `react-native` stack search for "gestures haptics" had no match. The UX search confirmed only generic rules (48dp Android / 44pt iOS targets, 8px gaps, stable skeletons, empty states with an action). Everything below rests on reading the code plus those rules. No visual QA was possible (Playwright MCP is down on Linux); contrast numbers are computed.

Already fixed since the 10/10 review (verified): `maximum-scale` is gone from `public/index.html`; `bottom-tabs`, `expo-haptics`, `expo-router` etc. are no longer in `package.json`.

---

## 1. Top 10 changes, ranked by impact / effort

| # | Change | Impact | Effort |
|---|---|---|---|
| 1 | Set-by-set "Série feita" button on the current exercise (full width, 56px) | Very high | M |
| 2 | Allow finishing a workout with skipped exercises | High | S |
| 3 | Contrast token fixes (exact hex in section 2) | High (correctness) | S |
| 4 | Visible failure feedback (check revert, variant save, offline) | High | S |
| 5 | Diet: "Agora" meal first, totals second | Medium-high | S |
| 6 | Home: weekly consistency + streak instead of lifetime total | Medium | S |
| 7 | Screen stays awake during a workout | Medium-high | S |
| 8 | Last load promoted to a readable line + bigger tertiary actions | Medium | S |
| 9 | Persistent 3-item bottom bar (Início, Treino, Dieta) replacing the Home list as the only hub | Medium | M |
| 10 | Motion + haptic feedback on check/finish, and real empty-state actions | Low-medium | S |

### 1. "Série feita" button, set by set (the gym change)

**Problem.** The only way to progress is a 32px visual checkbox at the top-right of the exercise block, beside the name. In the gym the thumb is at the bottom, the hand is sweaty, and the exercise has 3-4 sets but the app has a single bit of state. The rest timer is a separate outline button, so every set costs two taps in two places. "Anotar" and "Como fazer" are 16px underlined links (weak affordance).

**Spec (UI-only, no schema change).** Inside `CurrentExercise`, below the big `4 × 8–10`:
- Set dots row: N segments (`height 4`, `gap Spacing.xs`, `Radius.pill`), done = `accent` (day color), pending = `surface`. Label `Série 2 de 4`, Inter `FontSize.md`, `textMuted`. Counter is local component state (not persisted); it resets when the exercise changes. Persisting stays a future decision (needs a table).
- Primary full-width button (`PrimaryButton`, `Touch.primary` 56px): label `Série feita`. Tap: advance dot, **auto-start rest timer** with `exercise.rest_seconds`, light haptic. On the last set the label becomes `Último exercício feito`/`Exercício feito` and the tap marks the exercise checked (existing `toggleCheck`) and focuses the next one.
- Secondary row (below, `gap Spacing.sm`, each `Touch.comfort` 48px, `OutlineButton` soft): `Anotar`, `Como fazer` (tip only when present). The `Descanso 90 s` outline button is replaced by the auto-start, plus a smaller `Descanso` link kept for manual relaunch.
- Existing 56px checkbox stays on the row (a power-user shortcut: mark whole exercise done without tracking sets). Keep its hit area.
- Setting "Iniciar descanso ao marcar série" in Perfil (default on), `Segmented` 2 options `Sim`/`Não`. Stored locally.

**Files.** `src/screens/WorkoutScreen.tsx` (`CurrentExercise`), `src/components/Buttons.tsx` (no new variant needed), `src/screens/ProfileScreen.tsx` (toggle), a small preference in `ThemeContext`-style storage or `AsyncStorage` if already present. New component `SetDots` (inline, tokens only).

**Risk.** Timer auto-start on iOS web needs the audio unlock already performed on a user tap; the tap on `Série feita` is that tap, so pitfall 4 is respected.

### 2. Finish with skipped exercises

**Problem.** `PrimaryButton` is disabled until `allDone` (`WorkoutScreen.tsx:~565`). A busy machine blocks logging the whole session and the calendar loses the workout. Product rule, but a UX failure for real use.

**Spec.** Enabled once `checkedCount >= 1`. Label `Concluir treino (3/5)`; when `allDone`: `Marcar como concluído`. If pending exercises exist, tapping runs `confirmAction('Concluir sem terminar tudo?', 'Faltam 2 exercícios. Registrar o treino mesmo assim?', 'Concluir')` (existing util). Disabled state only at 0 done, label `Marque ao menos um exercício`. No hook change (`completeWorkout` takes only the day id).

**Files.** `WorkoutScreen.tsx` only. Verdict on the earlier rule "only when all done": **change**.

### 3. Contrast token fixes

See section 2 (exact values). Files: `src/utils/theme.ts`, and the mapping table in `tema-claro-escuro.md` §2.1 / §1.1 after approval.

### 4. Visible failure feedback

**Problem (review items 6).** `toggleCheck` silently reverts on network error; `changeVariant` shows the wrong variant after a failed save; `HomeScreen` and Calendar show errors only via blocks.

**Spec.** One shared inline notice component `Notice` (NEW, tokens only): row, `minHeight Touch.min`, `borderLeftWidth 3` in `red`, fill `surface`, text Inter `FontSize.md` `text`, trailing `LinkButton` `Tentar de novo`. Appears pinned at the top of the scroll content (not a toast: toasts vanish while the phone is on the bench). Copy:
- Check failed: `Não foi possível salvar a marcação. Confira a internet.` and the checkbox returns to its previous state with a 150 ms shake-free fade (no layout move).
- Variant failed: revert the `Segmented` selection to the saved value and show `Não foi possível salvar sua escolha. Mantivemos a anterior.`
- Offline (web `navigator.onLine` false / RN NetInfo not required): thin `textFaint` line `Sem internet. Suas marcações não estão sendo salvas.` under the header while offline.
- `accessibilityLiveRegion="polite"` / `role="alert"` on web.

**Files.** New `src/components/Notice.tsx`; `WorkoutScreen.tsx`, `DietScreen.tsx` (+ `useDiet`/`useWorkout` expose an error flag; hooks not designed here).

### 5. Diet: "Agora" first

**Problem.** The spec (§6.4) says the primary action is "see what to eat now", but the layout opens with a 4-number block of daily totals, which is static information; the next meal is below the fold of a 5-6 meal list.

**Spec.** Under the variant `Segmented`: a "next meal" strip: kicker `Agora` (`Tag` inverted), meal name in Barlow `FontSize.xxl` caps, time + kcal as numbers in `FontSize.xl`, macros line Inter `md`. Tap expands the meal (existing). Daily totals (`kcal`, `NumbersRow`) move below the meal list, collapsed to one line: `1.980 kcal · P 150g · C 190g · G 50g` as `textMuted`, tap to expand to the current numbers. Keep expanded-by-default for the next meal (already).
Also: `nextMealId` re-evaluated every 60 s (review item 11) and `useMemo` for `legacyVariants`.

**Files.** `DietScreen.tsx`. Verdict on "macros before meals": **change**.

### 6. Home: consistency, not lifetime total

**Problem.** `"47 treinos concluídos desde o início"` is in `FontSize.xl` at the bottom: a vanity number that rewards nothing. `user_stats` already has `current_streak`/`longest_streak` unused.

**Spec.** Replace the footer with a `NumbersRow` of 2 items (`valueSize` default): `4/6` + `treinos nesta semana` (completions Monday-Sunday vs the program's non-rest days) and `3` + `dias de sequência` (from `stats.current_streak`, hidden when 0). Keep lifetime total as a `textFaint` sentence under it. When the week goal is met, the `4/6` numeral uses `green` (the existing "done" semantics). Empty (new account): hide the row; show only `Seu primeiro treino começa aqui.` (`textMuted`).
**Files.** `HomeScreen.tsx`, `useWorkout` (week count; derivable from `useCalendar` data).

### 7. Keep the screen awake while training

**Problem.** Between sets the phone locks (default 30-60 s on Android, 30 s on iPhone). The user must unlock with a wet finger, and on iOS web the lock also suspends the page and its audio unlock (pitfall 4 mitigations assume a foreground page).

**Spec.** While `WorkoutScreen` is focused and at least one exercise is checked or a timer is running: request screen wake lock. Web: `navigator.wakeLock.request('screen')` (iOS Safari 16.4+, guarded, silently ignored if absent). Android: `expo-keep-awake` (part of the Expo SDK, small, needs the next APK; mention to Luiz: requires a new APK). Release on blur/unmount. A `textFaint` line in Perfil: `Manter a tela ligada durante o treino` with `Sim`/`Não` `Segmented` (default Sim). No visible UI otherwise.
**Files.** new `src/hooks/useKeepAwake.ts` (+ `.web.ts`), `WorkoutScreen.tsx`, `ProfileScreen.tsx`, `package.json` (`expo-keep-awake`).

### 8. Last load as a readable line; tertiary actions at 48px

**Problem.** Load is the most important number after sets × reps, and it lives in a 14px muted `Anotação: …` preview clipped to 2 lines.

**Spec.** Between `séries × repetições` and the actions, a line: kicker `Última vez` (`textMuted`, `FontSize.sm`), then the first line of the note in Inter `FontSize.base`, `text`, `numberOfLines 1`. Tap opens the note editor (existing). When no note: `Toque em Anotar para registrar a carga` in `textFaint`. Placeholder in the editor stays. `LinkButton` `Anotar`/`Como fazer` become 48px soft `OutlineButton`s (see #1). A true numeric load field with a +/- stepper needs a schema change (`exercise_notes` is free text): defer, flag to tech-lead.
**Files.** `WorkoutScreen.tsx`.

### 9. Persistent bottom bar (3 items)

**Problem.** Navigation is Home-and-back only: Workout → Diet is two screens and two taps, Calendar is reachable from Home and from a text link in the Workout header, Profile only from the Home avatar. For Usuária 2 on an iPhone PWA the swipe-back is unreliable in standalone mode and the "‹" glyph is the only way out.

**Spec.** A bottom bar `Início · Treino · Dieta` (Calendário stays a Home row and a link in Treino, Perfil stays on the avatar), built as a plain component (no new dependency) rendered next to `FloatingTimer` in `AppNavigator`, hidden on Login and Profile.
- Height `Touch.primary` 56 + safe-area bottom inset (`env(safe-area-inset-bottom)` on web via `useSafeAreaInsets`), background `bg`, `borderTopWidth 1` `border`, no shadow.
- Item: 3 equal flex cells, label Barlow `condSemi` `FontSize.lg` caps, inactive `textMuted`, active `text` with a 3px top bar in `text` (not the day color, so it never clashes with the day stripes). No icons (the project has no icon set; avoids emoji and the "icon circle" anti-pattern).
- Timer coexistence: `useTimerInsets().bottom` already pads scroll content; add the bar height to the bottom anchor of `FloatingTimer` (`bottom: barHeight + inset`), so the panel sits **above** the bar.
- In an active workout (a timer running) the bar stays visible; it is cheap and keeps the exit obvious.
**Files.** new `src/components/BottomBar.tsx`, `src/navigation/index.tsx`, `FloatingTimer.tsx` (bottom anchor), `useTimerInsets.ts`. `Home` drops the "Dieta" row (kept the "Calendário" row).
**Verdict risk.** Medium: it touches the timer geometry. Treat as its own task after 1-8.

### 10. Motion, haptics and empty states with actions

- Check / `Série feita`: fill transition 120 ms (`opacity`/background, ease-out) and 10 ms `Vibration` on Android (already used in Perfil). On iOS web, `navigator.vibrate` is unsupported: use no haptic, rely on the 120 ms fill. Respect `useReducedMotion`: cut to 0 ms.
- Workout complete: replace the plain `Treino registrado! Continue assim.` with the headline (Barlow `FontSize.xxxl`, caps) `Treino registrado` + `NumbersRow` (exercícios feitos, séries, minutos real) for 3 s, then settles into `Treino de hoje concluído.` No confetti.
- Empty states get one action each: Home `Sem programa` → `OutlineButton` `Falar com quem montou meu treino` is not possible without a feature; until onboarding exists use `Atualizar` (`retry`). Calendar empty month: `Nenhum treino em outubro.` + `LinkButton` `Ver o treino de hoje`. Diet pending: text stays, add `Atualizar`.
**Files.** `WorkoutScreen.tsx`, `HomeScreen.tsx`, `CalendarScreen.tsx`, `DietScreen.tsx`.

---

## 2. Contrast fixes (computed WCAG ratios)

Method: relative luminance per WCAG 2.x, ratio on the three fills where day-colored marks may sit (`bg`, `card`, `surface`). Target: **>= 4.5:1 on `surface`** (the worst case), so any text or indicator in a day color is safe anywhere. Hue is preserved (mix toward black for light, toward white for dark, minimal step). Present text uses of day colors: only `red` (error texts, danger button), always on `bg`/`card`; the day colors are stripes and underlines today (non-text rule 3:1 already holds). So this is a safety-margin fix, cheap, and it also corrects one miss in the review: dark `pullColor` on `card` is **4.49**, not >= 4.5.

### Light (`surface` `#E4E4E1`, `bg` `#F1F1EF`, `card` `#FAFAF9`)

| Token | Old | New | On surface | On bg | On card |
|---|---|---|---|---|---|
| `pushColor` | `#A9502F` (4.25) | `#9F4B2C` | 4.69 | 5.28 | 5.72 |
| `pullColor` | `#376CA6` (4.27) | `#34679E` | 4.60 | 5.19 | 5.62 |
| `legsColor` | `#2A7546` (4.42) | `#297144` | 4.66 | 5.25 | 5.68 |
| `restColor` | `#6E6E6B` (4.01) | `#646461` | 4.66 | 5.25 | 5.68 |
| `orange` | `#8F5F10` (4.32) | `#895B0F` | 4.62 | 5.21 | 5.64 |
| `pinkColor` | `#A6486B` (4.38) | `#9F4567` | 4.68 | 5.27 | 5.71 |
| `red` | `#B23A45` (4.60) | `#B03944` | 4.69 | 5.28 | 5.72 |
| `purple`, `suppColor`, `green`, `greenDim`, text tokens | unchanged | unchanged | 4.69 / 4.64 / 4.85 / 6.20 / >= 4.66 | all >= 5.2 | all >= 5.6 |

Note: `restColor` now equals `textFaint` (`#646461`). Acceptable (both mean "inactive"); the DB color for rest days maps to it.

### Dark (`surface` `#363634`, `bg` `#222221`, `card` `#2A2A29`)

| Token | Old | New | On surface | On card | On bg |
|---|---|---|---|---|---|
| `pushColor` | `#E07856` (4.03) | `#E4886A` | 4.63 | 5.49 | 6.09 |
| `pullColor` | `#5A93D4` (3.78) | `#73A3DA` | 4.60 | 5.46 | 6.05 |
| `restColor` | `#9A9893` (4.20) | `#A2A09C` | 4.64 | 5.50 | 6.10 |
| `pinkColor` | `#E07A9A` (4.28) | `#E283A1` | 4.61 | 5.47 | 6.06 |
| `red` | `#E8787F` (4.28) | `#EA8188` | 4.61 | 5.47 | 6.06 |
| `purple` | `#B48BDB` (4.42) | `#B790DC` | 4.63 | 5.50 | 6.09 |
| `legsColor`, `orange`, `suppColor`, `green` | unchanged | unchanged | 4.83 / 5.89 / 5.72 / 4.68 | >= 5.56 | >= 6.16 |

Softness check (Luiz asked for less contrast): the shifts are 3-5% in luminance and only on accents; `bg`, `text`, `textMuted`, `textFaint`, `card`, `surface` are untouched, so body text contrast (12.9:1 dark, 13.4:1 light) is unchanged.

### Other contrast items

- **Dividers.** Light `border` `#D4D4D0` is 1.31:1 on `bg`. Propose `#C8C8C3` (1.48 on `bg`, 1.61 on `card`), still a soft hairline (non-text, decorative; interactive edges use `borderStrong`). Dark `border` `#3E3E3B` (1.48 on `bg`): keep (the dark theme must stay soft).
- **Notification accent.** `NotificationColors.accent` `#1A9348` with white small text is 3.95:1; the system draws the title in white on dark gray, and the accent only colors the small icon/bar, so non-text 3:1 holds. Keep, but do not put small text on it.
- **Placeholder.** `textFaint` on `surface` (note input) is 4.66 / 4.69: fine.
- **Primary buttons.** Light: `onPrimary` `#F1F1EF` on `#262626` = 13.4. Dark: `onGreen` `#222221` on `#1DB954` = 6.16. Disabled: `textFaint` on `surface` 4.66 / 4.69. All pass.

Files: `src/utils/theme.ts` (values only) plus the two tables in `docs/design/tema-claro-escuro.md` (§1.1, §2.1) after approval; the native module `modules/rest-timer` is unaffected.

---

## 3. Keep / change verdicts on earlier decisions

| Earlier decision | Verdict | Reason |
|---|---|---|
| Splits59 direction (condensed caps headlines, hairlines instead of cards, square corners `Radius.sm` 2) | **Keep** | Delivers "numbers as protagonists" and calm, no card grid. Only the contrast and gym ergonomics change. |
| Caps only for short labels; names and body in Inter 16 | **Keep** | Correct for glanceable use. |
| Two themes, `system` default, selector in Perfil | **Keep** | Works; light theme is a good outdoors/gym-window option. Keep dark as the documented default for 6 a.m. fasted sessions (Luiz). |
| Dark `bg` `#222221` (lighter than the original `#1A1A1C`) | **Keep** | Matches "less dark". Do not lighten more: the earlier Spotify reference was the target. |
| Green `#1DB954` as dark primary; ink `#262626` as light primary | **Keep** | The only chromatic CTA. |
| Day color as 6px stripe / 3px underline / 4px bar (never as fill) | **Keep** | Identity without decoration. Contrast now safe even as text (section 2). |
| Today-first "Próximo treino" card on Home | **Keep** | Best moment of the app; add week/streak data (#6). |
| Home "list of rows" as the only hub | **Change** | Two-tap depth to Diet from Treino; add bottom bar (#9) and drop the Dieta row. |
| 32px visual checkbox, 56px hit area, one check per exercise | **Keep as a shortcut, change as primary** | Add `Série feita` (#1). |
| Link-style `Anotar` / `Como fazer` (16px underline) | **Change** | 48px soft outline buttons (#1, #8). |
| Floating timer, draggable top/bottom, long-press 350 ms + ↑/↓ button | **Keep, simplify the default** | Auto-start from `Série feita` makes manual launch rare; the alternative button keeps a11y. Recheck geometry with the bottom bar (#9). |
| Timer presets 30/60/90/120 at 48px | **Keep** | Good ergonomics. |
| Finish button disabled until all exercises are checked | **Change** | #2. |
| Macros first on Diet | **Change** | #5. |
| Footer lifetime total on Home | **Change** | #6. |
| Silent revert of failed saves | **Change** | #4. |
| Skeletons for loading, `ErrorBlock` with retry | **Keep** | Matches the "stable skeleton + busy" rule. |
| Web: 560px centered column, no desktop re-layout | **Keep** | The only web user is on an iPhone; a wide layout would cost more than it delivers. Re-evaluate only if a desktop user appears. |
| `Segmented` for variant / theme (48px, `radiogroup`) | **Keep** | Good. |
| Inverted `Tag` (`text` on `bg`) | **Keep** | Distinct without color. |
| Light `border` `#D4D4D0` | **Change** | `#C8C8C3` (section 2). |
| Login "G" glyph | **Change (later)** | Use the official Google mark before Play/OAuth verification (review item 10). |
| Emoji / icon circles | **Keep banned** | Bottom bar uses text only. |
| Android and iOS parity | **Keep, add notes** | Haptics Android-only (10 ms), iOS web relies on visual feedback; wake lock via `navigator.wakeLock` on iOS 16.4+, `expo-keep-awake` on Android. |

---

## 4. Suggested order and what Luiz must do

1. Batch A (one APK + one web publish): #3, #2, #4, #5, #6, #8, #10 (small, all inside existing screens).
2. Batch B: #1 and #7 (the gym changes; #7 adds `expo-keep-awake` so it needs a new APK).
3. Batch C: #9 bottom bar (touches the timer geometry; QA on both platforms).

No database change in any of the 10 items. No new heavy dependency (`expo-keep-awake` is part of the Expo SDK). Needs the Luiz's visual OK only for #9 (navigation changes) and #1 (new interaction on the main exercise block); the rest follow the already approved style. A static mockup was not produced in this round; ask if you want one for #1 and #9 before building.

## 5. Not verified

Real rendering of both themes at 390px, Android tab clipping, the `Série feita` + timer interplay on device, iOS Safari wake-lock availability on Usuária 2's version, and the Kotlin build. Contrast ratios are computed, not measured on screen.
