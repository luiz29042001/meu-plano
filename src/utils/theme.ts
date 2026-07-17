// Design tokens — softer dark theme (lighter, less harsh than pure-black).
// Backgrounds sit in the "elevated charcoal" range so the app feels calmer
// and less high-contrast, while keeping good legibility.

export const Colors = {
  // Backgrounds — noticeably lighter than before, layered by elevation
  bg: '#1A1A1C',          // app background (soft charcoal, not black)
  bgElevated: '#212124',  // raised sections
  card: '#26262A',        // cards
  cardHover: '#2E2E33',   // pressed / hover
  surface: '#33333A',     // inputs, pills, inner surfaces
  border: '#3A3A40',      // subtle separators

  // Text — off-white, comfortable secondary greys
  text: '#F2F2F4',        // primary text
  textMuted: '#A8A8B0',   // secondary
  textFaint: '#7A7A82',   // tertiary / hints

  // Accent — Spotify green
  green: '#1DB954',
  greenDim: '#1AA34A',

  // Workout category colors — desaturated so they don't "scream"
  pushColor: '#E07856',   // muted coral (Push)
  pullColor: '#5A93D4',   // muted blue (Pull)
  legsColor: '#42B968',   // muted green (Legs)
  restColor: '#8E8E96',   // neutral grey (Rest)

  // Semantic
  orange: '#E8A94A',
  red: '#E0525E',
  purple: '#A878D4',
  suppColor: '#E0A85A',
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 500,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const FontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 15,
  lg: 17,
  xl: 22,
  xxl: 26,
  xxxl: 32,
};
