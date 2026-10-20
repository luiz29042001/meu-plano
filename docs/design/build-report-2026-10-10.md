# Build report — spec final 2026-10-10

## Done
- Dependency: `expo-keep-awake ~13.0.2` (only new package).
- Tokens: theme.ts colors (light/dark), `Layout`, `Motion`, `FontSize.xs` deprecated (no uses); `dayColor.ts` map updated.
- Services/hooks: `devicePrefs` (autoRest, per-day set counts, timer default `top`), `fetchRecentCompletionDates`, `utils/weekStats.ts` (Monday week), `useSetProgress`, `useKeepAwake(.web)`, `useOnline(.web)` + `utils/networkStatus.ts`, `useKeyboardVisible(.web)`, `useMotion`, `useWorkout` (weekDone/weekGoal/weekDays/weekDoneDates, network reporting).
- Components: `Notice`, `SetDots`, `BottomBar`, `WorkoutDock`, `WeekStrip`; Buttons (`tone="done"`), ScreenHeader (`back`, 13px), Tag sentence case, NumbersRow `ok`, FloatingTimer (+30 s, Pular/Fechar, compact digits 40, bottom anchor above bar + dock).
- Navigation: `navigationRef`, active-route tracking, bar after the Stack (hidden with keyboard / on Login), fade for bar destinations, reduced motion -> no animation.
- Screens: Workout (current-exercise rewrite, dock state machine, last-load line, skip-finish confirm, summary, Notices, keep-awake, tab scroll into view), Home (week block, no streak, Perfil row, no Dieta row/footer, offline notice), Diet (Agora/Próxima hero, totals row, OutlineButtons, 60 s tick, Notices), Calendar (arrow boxes, green done mark, empty-month button, offline notice), Profile (auto-rest Segmented, `Sistema` label, bottom edge removed), Login (offline Notice).

## Deviations
- Bar and dock are IN FLOW (not overlays), so `useTimerInsets` was NOT changed (adding bar/dock padding would double the space). Timer bottom anchor does include bar + inset + dock.
- Bar destinations use `navigationRef.reset` ([Home] / [Home, Workout|Diet]) so Android back from Treino/Dieta goes to Início.
- `weeksAtGoal` not created (no streaks decided). Copy `semanas seguidas na meta` not used.
- Not animated: SetDots/progress/week markers fill (150 ms), Segmented cross-fade, row expand fade. Notice fade and route fade exist.
- Perfil theme option label changed `Automático` -> `Sistema` (per spec).
- Compact timer: `Pular` (running) / `Fechar` (finished) share one button that closes the timer.
- Native offline detection = request failures only (D14); Login offline notice on Android appears only after a failed request elsewhere.
- Minutes in the finish summary = first `Série feita` in this session to now (memory only); `–` if none. `duration_min` is not sent (no DB change).
- Not done: step 17 (docs sync of design-system/CLAUDE.md), step 18 (tests/qa scripts).

## Not verifiable here
tsc, web + android bundles pass; grep: no raw hex/fontWeight/rgba outside theme.ts/dayColor.ts. Not run: real rendering, Android (Kotlin, keep-awake, vibration, bar/dock insets, tab/bar text clipping), iPhone Safari (wake lock, audio unlock), contrast sampling, QA checklist.
