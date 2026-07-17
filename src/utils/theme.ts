// Design tokens — Spotify-inspired dark theme
// Base: charcoal #121212, elevated surfaces get progressively lighter,
// signature green accent, softened contrast (no pure black / pure white).

export const Colors = {
  // Backgrounds — layered elevation like Spotify
  bg: '#121212',          // app background (Spotify base)
  bgElevated: '#181818',  // slightly raised sections
  card: '#1E1E1E',        // cards
  cardHover: '#242424',   // pressed / hover
  surface: '#2A2A2A',     // inputs, pills, inner surfaces
  border: '#2E2E2E',      // subtle separators

  // Text — off-white, never pure white
  text: '#EDEDED',        // primary text
  textMuted: '#B3B3B3',   // Spotify's classic secondary grey
  textFaint: '#727272',   // tertiary / hints

  // Accent — Spotify green as the primary highlight
  green: '#1DB954',       // Spotify green
  greenDim: '#1AA34A',    // pressed green

  // Workout category colors — muted to fit the softer palette
  pushColor: '#E8734A',   // warm coral (Push)
  pullColor: '#4A90E8',   // soft blue (Pull)
  legsColor: '#1DB954',   // green (Legs) — aligns with accent
  restColor: '#8E8E93',   // neutral grey (Rest)

  // Semantic
  orange: '#F5A623',
  red: '#E22134',         // Spotify's error red
  purple: '#A96BE8',
  suppColor: '#E8A34A',
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
