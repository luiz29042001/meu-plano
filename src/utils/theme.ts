// Design tokens — linguagem Splits59, dois temas (Claro e Escuro suave).
// Fonte dos valores: docs/design/tema-claro-escuro.md (§1, §3, §12.8).
//
// Regra: as telas NÃO importam paleta estática. Leem a paleta ativa com
// `useTheme()` e criam estilos com `makeStyles(c => ({ ... }))`
// (src/contexts/ThemeContext.tsx). Font, FontSize, Tracking, Radius, Spacing
// e Touch são iguais nos dois temas e podem ser importados direto daqui.
import { Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

/** As 27 chaves da spec §1 (26 + `dragShadow` da §12). Mesmos nomes nos dois temas. */
export interface ThemeColors {
  bg: string;
  bgElevated: string;
  card: string;
  cardHover: string;
  cardAlt: string;
  surface: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  onPrimary: string;
  onAccent: string;
  green: string;
  greenDim: string;
  onGreen: string;
  /** Sombra do cronômetro só enquanto é arrastado (rgba). */
  dragShadow: string;
  pushColor: string;
  pullColor: string;
  legsColor: string;
  restColor: string;
  pinkColor: string;
  orange: string;
  red: string;
  purple: string;
  suppColor: string;
}

export type ColorToken = keyof ThemeColors;

export const lightColors: ThemeColors = {
  bg: '#F1F1EF',
  bgElevated: '#F7F7F5',
  card: '#FAFAF9',
  cardHover: '#E9E9E6',
  cardAlt: '#ECECE9',
  surface: '#E4E4E1',
  border: '#D4D4D0',
  borderStrong: '#262626',
  text: '#262626',
  textMuted: '#4D4D4B',
  textFaint: '#646461',
  primary: '#262626',
  onPrimary: '#F1F1EF',
  onAccent: '#F1F1EF',
  green: '#137036',
  greenDim: '#0F5E2D',
  onGreen: '#F1F1EF',
  dragShadow: 'rgba(38,38,38,0.18)',
  pushColor: '#A9502F',
  pullColor: '#376CA6',
  legsColor: '#2A7546',
  restColor: '#6E6E6B',
  pinkColor: '#A6486B',
  orange: '#8F5F10',
  red: '#B23A45',
  purple: '#7A4FA8',
  suppColor: '#8A5A12',
};

export const darkColors: ThemeColors = {
  bg: '#222221',
  bgElevated: '#272726',
  card: '#2A2A29',
  cardHover: '#323231',
  cardAlt: '#262625',
  surface: '#363634',
  border: '#3E3E3B',
  borderStrong: '#E9E7E3',
  text: '#E9E7E3',
  textMuted: '#B5B3AE',
  textFaint: '#A3A19C',
  primary: '#1DB954',
  onPrimary: '#222221',
  onAccent: '#222221',
  green: '#1DB954',
  greenDim: '#1AA34A',
  onGreen: '#222221',
  dragShadow: 'rgba(0,0,0,0.45)',
  pushColor: '#E07856',
  pullColor: '#5A93D4',
  legsColor: '#42B968',
  restColor: '#9A9893',
  pinkColor: '#E07A9A',
  orange: '#E8A94A',
  red: '#E8787F',
  purple: '#B48BDB',
  suppColor: '#E0A85A',
};

export const palettes: Record<ColorScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

/**
 * Cor de destaque da notificação do cronômetro (Android). Fixa, fora das
 * paletas: a gaveta segue o tema do APARELHO, não o do app (spec §13.2).
 * O módulo nativo usa o mesmo valor (modules/rest-timer).
 */
export const NotificationColors = { accent: '#1A9348' } as const;

/**
 * Famílias. O peso vem do NOME da família: nunca usar `fontWeight` junto de
 * `Font.*` (no Android, fontWeight com fonte customizada cai na Roboto).
 * Os nomes são as chaves registradas no `useFonts` (App.tsx). Na web vai uma
 * pilha de reserva (DIN Condensed / -apple-system no iPhone).
 */
const webStack = (name: string, fallback: string) =>
  Platform.select({ web: `${name}, ${fallback}`, default: name }) as string;

const COND_FALLBACK = '"DIN Condensed", "Arial Narrow", sans-serif-condensed, sans-serif';
const BODY_FALLBACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const Font = {
  condMedium: webStack('BarlowCondensed_500Medium', COND_FALLBACK),
  condSemi: webStack('BarlowCondensed_600SemiBold', COND_FALLBACK),
  condBold: webStack('BarlowCondensed_700Bold', COND_FALLBACK),
  body: webStack('Inter_400Regular', BODY_FALLBACK),
  bodyMedium: webStack('Inter_500Medium', BODY_FALLBACK),
  bodySemi: webStack('Inter_600SemiBold', BODY_FALLBACK),
} as const;

export const FontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 16,
  lg: 18,
  title: 20,
  xl: 24,
  numeral: 28,
  xxl: 32,
  xxxl: 40,
  display: 64,
  hero: 72,
  timer: 80,
} as const;

/** letterSpacing: caps até 18px; tight 32–40; tighter 64–80. */
export const Tracking = {
  caps: 0.5,
  tight: -0.5,
  tighter: -1.5,
} as const;

/** Entrelinha de texto corrido em px: 18, 20, 22, 24 e 26. */
export const LineHeight = {
  sm: 18,
  md: 20,
  base: 22,
  lg: 24,
  xl: 26,
} as const;

/** Entrelinha dos números grandes = 0,92 × tamanho. */
export const numberLineHeight = (size: number) => Math.round(size * 0.92);

export const Radius = {
  sm: 2,
  md: 2,
  lg: 4,
  xl: 4,
  xxl: 4,
  pill: 500,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 48,
} as const;

/** Áreas de toque mínimas. */
export const Touch = {
  min: 44,
  comfort: 48,
  primary: 56,
} as const;
