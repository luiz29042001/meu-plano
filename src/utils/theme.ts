/**
 * # Tema e design tokens (`theme.ts`)
 * "Tokens" são os valores de design nomeados (cores, fontes, espaçamentos). Em vez de escrever `#262626` solto no código, as telas usam nomes como `c.text`. Trocar o visual do app inteiro vira alterar um arquivo.
 *
 * > **Regra do projeto:** nenhuma cor, fonte ou espaçamento solto nas telas.
 */

// Design tokens — dois temas (Claro e Escuro suave).
// Fonte dos valores: docs/design/tema-claro-escuro.md (§1, §3, §12.8).
//
// Regra: as telas NÃO importam paleta estática. Leem a paleta ativa com
// `useTheme()` e criam estilos com `makeStyles(c => ({ ... }))`
// (src/contexts/ThemeContext.tsx). Font, FontSize, Tracking, Radius, Spacing
// e Touch são iguais nos dois temas e podem ser importados direto daqui.
import { Platform } from 'react-native';

/**
 * ## Tipos de tema
 * - `ColorScheme` → o tema em uso: `'light'` ou `'dark'`.
 * - `ThemePreference` → a escolha da pessoa: claro, escuro ou **seguir o sistema**.
 */
export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * ## `ThemeColors`
 * Lista das 27 cores que **todo tema** precisa ter, com os mesmos nomes. Agrupadas por função: fundos (`bg`, `card`...), bordas, textos (`text`, `textMuted`...), ação principal (`primary`), verdes e as cores de cada tipo de dia (`pushColor`, `legsColor`...).
 *
  * As 27 cores obrigatórias de todo tema (inclui `dragShadow`). Mesmos nomes nos dois temas.
  */
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

/**
 * ## `ColorToken`
 * Um dos nomes de cor acima (por exemplo `"bg"`). Serve para validar nomes em tempo de compilação.
 */
export type ColorToken = keyof ThemeColors;

/**
 * ## `lightColors`
 * Paleta do tema **claro**. Todas as cores de texto sobre fundo seguem contraste mínimo de 4,5:1.
 */
export const lightColors: ThemeColors = {
  bg: '#F1F1EF',
  bgElevated: '#F7F7F5',
  card: '#FAFAF9',
  cardHover: '#E9E9E6',
  cardAlt: '#ECECE9',
  surface: '#E4E4E1',
  border: '#C8C8C3',
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
  pushColor: '#9F4B2C',
  pullColor: '#34679E',
  legsColor: '#297144',
  restColor: '#646461',
  pinkColor: '#9F4567',
  orange: '#895B0F',
  red: '#B03944',
  purple: '#7A4FA8',
  suppColor: '#8A5A12',
};

/**
 * ## `darkColors`
 * Paleta do tema **escuro suave**: fundo cinza-quente (não preto puro) e verde `#1DB954` como cor de ação.
 */
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
  pushColor: '#E4886A',
  pullColor: '#73A3DA',
  legsColor: '#42B968',
  restColor: '#A2A09C',
  pinkColor: '#E283A1',
  orange: '#E8A94A',
  red: '#EA8188',
  purple: '#B790DC',
  suppColor: '#E0A85A',
};

/**
 * ## `palettes`
 * Dicionário que entrega a paleta pelo nome do tema: `palettes[scheme]`.
 */
export const palettes: Record<ColorScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

/**
 * ## `NotificationColors`
 * Cor de destaque da notificação do cronômetro no Android. Fica fora das paletas porque a gaveta de notificações segue o tema do **aparelho**, não o do app. O módulo nativo usa o mesmo valor.
 *
 * Cor de destaque da notificação do cronômetro (Android). Fixa, fora das
 * paletas: a gaveta segue o tema do APARELHO, não o do app.
 * O módulo nativo usa o mesmo valor (modules/rest-timer).
 */
export const NotificationColors = { accent: '#1A9348' } as const;

/**
 * ## Fontes
 * O peso da fonte vem do **nome da família** (Barlow Condensed para títulos e números, Inter para texto). Não se usa `fontWeight` junto, porque no Android isso faria a fonte cair na padrão.
 *
 * Famílias. O peso vem do NOME da família: nunca usar `fontWeight` junto de
 * `Font.*` (no Android, fontWeight com fonte customizada cai na Roboto).
 * Os nomes são as chaves registradas no `useFonts` (App.tsx). Na web vai uma
 * pilha de reserva (DIN Condensed / -apple-system no iPhone).
 *
 * ### `webStack(name, fallback)`
 * Monta o nome da fonte. Na web acrescenta fontes de reserva (caso a fonte principal ainda não tenha carregado); no celular usa só o nome.
 */
const webStack = (name: string, fallback: string) =>
  Platform.select({ web: `${name}, ${fallback}`, default: name }) as string;

/**
 * Fontes de reserva para a família condensada (títulos) e para a de texto.
 */
const COND_FALLBACK = '"DIN Condensed", "Arial Narrow", sans-serif-condensed, sans-serif';
const BODY_FALLBACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

/**
 * ### `Font`
 * As 6 fontes disponíveis: 3 pesos condensados (`cond*`) e 3 de texto (`body*`).
 */
export const Font = {
  condMedium: webStack('BarlowCondensed_500Medium', COND_FALLBACK),
  condSemi: webStack('BarlowCondensed_600SemiBold', COND_FALLBACK),
  condBold: webStack('BarlowCondensed_700Bold', COND_FALLBACK),
  body: webStack('Inter_400Regular', BODY_FALLBACK),
  bodyMedium: webStack('Inter_500Medium', BODY_FALLBACK),
  bodySemi: webStack('Inter_600SemiBold', BODY_FALLBACK),
} as const;

/**
 * ## `FontSize`
 * Escala de tamanhos de texto, do menor (`sm` = 13, o mínimo legível) ao maior (`timer` = 80, o número do cronômetro).
 */
export const FontSize = {
  /** Deprecated: nenhum uso (tamanho mínimo de texto = sm 13). */
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

/**
 * ## `Tracking`
 * Espaçamento entre letras: positivo para maiúsculas pequenas, negativo (apertado) para números grandes.
 *
  * letterSpacing: caps até 18px; tight 32–40; tighter 64–80.
  */
export const Tracking = {
  caps: 0.5,
  tight: -0.5,
  tighter: -1.5,
} as const;

/**
 * ## `LineHeight`
 * Altura de linha para texto corrido, em pixels.
 *
  * Entrelinha de texto corrido em px: 18, 20, 22, 24 e 26.
  */
export const LineHeight = {
  sm: 18,
  md: 20,
  base: 22,
  lg: 24,
  xl: 26,
} as const;

/**
 * ## `numberLineHeight(size)`
 * Altura de linha para números grandes: 92% do tamanho da fonte, arredondado.
 *
  * Entrelinha dos números grandes = 0,92 × tamanho.
  */
export const numberLineHeight = (size: number) => Math.round(size * 0.92);

/**
 * ## `Radius`
 * Arredondamento dos cantos. O visual é quase reto (2 a 4 px), exceto `pill` (totalmente arredondado).
 */
export const Radius = {
  sm: 2,
  md: 2,
  lg: 4,
  xl: 4,
  xxl: 4,
  pill: 500,
} as const;

/**
 * ## `Spacing`
 * Escala de espaçamentos (4, 8, 12, 16, 20, 24, 32, 48 px). Usar sempre estes valores mantém o ritmo visual consistente.
 */
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

/**
 * ## `Touch`
 * Tamanhos mínimos de áreas tocáveis (44 a 56 px), para o dedo acertar facilmente. Segue a recomendação de acessibilidade.
 *
  * Áreas de toque mínimas.
  */
export const Touch = {
  min: 44,
  comfort: 48,
  primary: 56,
} as const;

/**
 * ## `Layout`
 * Medidas fixas: altura da barra inferior, do "dock" de ações, largura máxima da coluna na web e altura do cronômetro no topo.
 *
  * Medidas de layout fixas (barra inferior, dock, coluna web, cronômetro no topo).
  */
export const Layout = {
  BAR_HEIGHT: 56,
  DOCK_HEIGHT: 72,
  COLUMN_MAX: 560,
  TIMER_TOP_HEIGHT: 112,
} as const;

/**
 * ## `Motion`
 * Duração das animações em milissegundos. Viram 0 quando a pessoa ativa "reduzir movimento" no sistema.
 *
  * Durações de movimento em ms. Viram 0 com "reduzir movimento" (useMotion).
  */
export const Motion = {
  press: 80,
  fill: 150,
  enter: 200,
  route: 150,
  timer: 220,
  pulse: 300,
} as const;
