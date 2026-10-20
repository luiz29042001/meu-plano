# Verdict: is Splits59 the best direction? (2026-10-10)

Method: ui-ux-pro-max (style/color/typography searches + pro-rules), frontend-design critique, design-system token discipline, measured contrast, and the real usage context. Not a visual test: no browser/device available.

## Context that decides it
- Used mid-set, sweaty hands, phone on a bench ~1 m away, 6 am fasted (Luiz, Android) and at home/gym (Usuária 2, iPhone PWA).
- Jobs: (1) what is my next exercise and set, (2) log it fast, (3) rest timer, (4) see the diet for the next meal.
- Two users, two programs, two platforms; light + dark themes.

## Scorecard
| Aspect | Splits59 today | Verdict |
|---|---|---|
| Condensed numerals (Barlow Condensed) | Big "4 × 8–10" readable at 1 m. Search skill also ranks Barlow Condensed #1 for sports/fitness. | **Keep.** Best asset. |
| Inter body | Neutral, legible. | **Keep.** |
| Hairlines instead of cards | Calm, matches "less contrast". But light border is 1.31:1: rows blur in bright gym light; nothing says "tappable". | **Keep, strengthen** (border `#C8C8C3` light; tappable rows get a fill state, not only a hover). |
| Uppercase condensed on buttons/tabs | Fine ≥18px. Hurts scanning on small labels. | **Keep ≥18px only**; sentence case below. |
| Underlined links as actions (Anotar, Como fazer, Substitutos) | Look like text, 44px area but weak affordance; core actions hide here. | **Change**: outline/filled buttons for anything used every set. |
| Light primary = ink, dark primary = green | Two brand identities; light theme has no energy color; green ✓ only appears on done. | **Change**: one accent system. Keep ink button in light, but done/progress/active states use day color + green in both themes. |
| Day-color stripe + headline | Distinctive, carries identity. | **Keep.** This is the one memorable element. Do not add more decoration. |
| Info architecture (Home list as only hub) | 2 taps to anywhere, fine for Luiz; slow for Usuária 2's daily loop. | **Change** (3-item bottom bar) — needs Luiz OK. |
| Core loop (exercise-level check) | Check per exercise, finish disabled until all done. Misses the real unit of work: the set. | **Change**: set-by-set "Série feita" + auto rest timer (design-director #1/#2). |
| Progress feedback | Counter + thin 4px bar only. | **Add**: set dots/segments per exercise, weekly count + streak on Home. |
| Zero-radius, editorial feel | Signals "premium women's activewear brand", suits Usuária 2; neutral for Luiz. | **Keep**, radius token stays `sm`. |
| Spotify-style dark (previous) | Replaced already. | Do not go back. |

## Alternatives considered (rejected)
- **OLED black + neon (style search top hit):** high power saving, but the user asked for less contrast/darkness; neon accent is the generic fitness-app default.
- **Material/iOS native cards:** safest, zero identity, more rework, same ergonomics gain as the targeted fixes above.
- **Full redesign:** unjustified; the type system and day-color stripe already work. The gaps are interaction model and affordance, not aesthetics.

## Final answer
Splits59 (variation B + light theme) is the right base. It is not the best *as shipped*: the weaknesses are interaction model, tappable affordance, divider strength and progress feedback. Fix those inside the same language. No new fonts, no new palette family.

## Next
One locked spec (`docs/design/spec-final-2026-10-10.md`) merging this verdict with `revisao-ux-2026-10-10.md`, with an HTML mockup for Luiz to approve. Only after approval: implement everything in one pass (batches A+B+C together, one APK, one web publish).
