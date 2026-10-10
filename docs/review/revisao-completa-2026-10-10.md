# Full review — 2026-10-10 (app + web)

Method: static read of src/, App.tsx, public/, app.json, migrations, native module; `tsc`, `expo export` web + android; contrast computed from theme tokens; skills used: ui-ux-pro-max (pro-rules checklist), web-design-guidelines (Vercel rules), design-system (token discipline). Not done: visual QA in a browser (Playwright MCP failed to connect: `cmd` not found, Windows config on Linux), Android device, Kotlin compile.

## Automated checks
| Check | Result |
|---|---|
| `tsc --noEmit` | pass |
| `expo export` web | pass (JS 1.8 MB, fonts 1.3 MB) |
| `expo export` android | pass |
| `expo-doctor` | 14/17; 3 need network. `react-native` 0.74.3 vs expected 0.74.5 |
| Raw hex / `fontWeight` / `service_role` / `toISOString` for dates in src | none (clean) |
| Previous review items I1–I4 | all confirmed fixed in code |

## Findings (ranked)

### High
1. **No in-app account deletion / privacy policy.** Blocks Play publication (Roadmap 3) and LGPD for health data. No "excluir conta" or privacy link anywhere in src. (Roadmap items 1–3 prerequisite.)
2. **`.mcp.json` and `google-services.json` are tracked in git** though `.gitignore` lists both. `.mcp.json` must be checked for secrets/local paths (Windows `cmd` launcher is what broke Playwright here). `google-services.json` is client config (not secret) but untrack for consistency. Fix: `git rm --cached` both.
3. **`SCHEDULE_EXACT_ALARM` permission** (app.json + module manifest). Play restricts it to alarm/calendar apps; a rest timer needs a declaration/justification, otherwise review rejection. Alternative: `USE_EXACT_ALARM` is stricter still; or fall back to inexact + foreground notification countdown. Decide before Play submission.

### Medium
4. **Zoom disabled on web:** `public/index.html:6` `maximum-scale=1` (a11y anti-pattern; WCAG 1.4.4). Remove it; keep `viewport-fit=cover`. iOS input zoom is avoided by font-size ≥16px (inputs use `FontSize.base`, verify = 16).
5. **Contrast below 4.5:1 for colored text on `surface`** (light: restColor 4.01, push 4.25, pull 4.27, orange 4.32; dark: pullColor 3.78, push 4.03, rest 4.20, red 4.28). On `bg`/`card` all pass (≥4.5, rest 4.52 light). Only an issue if day-colored text is rendered on `surface` (skeletons/bars/tags); audit where `dayColor()` text sits on `c.surface`, or darken light accents ~5%.
6. **Silent failures:** `useWorkout.toggleCheck` reverts the check on network error with no message (src/hooks/useWorkout.ts:~104); `useDiet.changeVariant` shows the new variant while DB kept the old one after a failed save (only a text warning; selection not reverted).
7. **Stale "today" after midnight:** `useWorkout` and `CalendarScreen` compute `todayISO()` at render/closure; a session left open across midnight checks/completes against yesterday until a reload. Recompute on `AppState` active / focus.
8. **Dead dependencies (8):** `@gorhom/bottom-sheet`, `@react-navigation/bottom-tabs`, `expo-haptics`, `react-native-svg`, `@expo/vector-icons`, `expo-web-browser`, `expo-linking`, `expo-router` (+ `expo-router` plugin and `typedRoutes` in app.json) have zero imports. Removing shrinks APK/web and the attack surface. Needs one EAS build to verify; do not touch `package-lock` casually (pitfall 6).
9. **No automated QA assets:** CLAUDE.md promises `tests/qa/` (Supabase simulator via `page.route`); it does not exist. Every QA round restarts from zero.

### Low
10. Login button uses a plain "G" glyph as the Google mark (`LoginScreen.tsx`, `leadingText="G"`); Google branding rules want the official logo (needed for Play/OAuth verification review).
11. `DietScreen`: `legacyVariants()`/`makeMeals` rebuilt every render; `nextMealId` computed once per render so "Próxima" does not advance without interaction. Memoize + minute tick.
12. PWA: manifest has no maskable icon, static dark `theme_color`, no service worker (no offline shell). Acceptable for now; add maskable 512.
13. `react-native` 0.74.3 → 0.74.5 patch per Expo doctor (`npx expo install --check`).
14. Light theme `border` on `bg` is 1.31:1 (dividers only; interactive controls use `borderStrong` — OK by the non-text rule, but list dividers are faint on bright screens).
15. `fetchProfile` uses `select('*')` (documented, intentional); fine, but revisit once `diet_fixed` is live everywhere.

## Checked and OK
- Security: RLS on all 9 tables; profile columns protected (grant + trigger); no `service_role`; anon key only in app.json; stats written only by trigger.
- Pitfalls 1–10 respected (auth callback deferral, local dates, opentelemetry shim, endsAt-based timer, safe-area import, tabs fixed height, `daySlug`, sequence-based next workout, diet totals).
- A11y: roles/labels/state on all Pressables (55 labels/16 pressables), checkbox + expanded + selected states, live region for theme help, `useReducedMotion` in timer/skeleton, touch targets ≥44 (checkbox hit area 56 around 32 visual).
- Theme: token-only styling, flash-of-wrong-theme fixed (`ready` gate), web `color-scheme`/`theme-color` handled, focus-visible outline defined for web.
- Timer: Android native alert dedupe, separate notification ids (I4 fix), position-aware inset spacing on all screens.

## Needs a human / device
Browser visual QA of both themes at 375px; APK check (tabs clipping, notification, exact-alarm prompt); Kotlin compile via EAS preview.

## Suggested order
(1) untrack `.mcp.json`/`google-services.json`, remove `maximum-scale`, midnight/`toggleCheck`/variant fixes, drop dead deps — one small batch, I can do it now. (2) Account deletion + privacy policy (new feature, needs `/nova-feature` + Edge Function; Opus for security review). (3) Decide exact-alarm strategy before Play. (4) Create `tests/qa/`.
