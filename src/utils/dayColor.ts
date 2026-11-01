/**
 * # Cores dos dias e refeições (`dayColor.ts`)
 * O banco guarda **uma cor fixa** por dia de treino e por refeição. O app traduz essa cor para o **tema ativo** (claro ou escuro), garantindo contraste legível (mínimo 4,5:1, padrão WCAG AA). Código puro: sem React e sem rede.
 */

// Tradução das cores vindas do banco (workout_days.color e refeições do
// diet_plans) para o tema ativo. O banco não muda: o app decide a cor final.
// Spec: docs/design/tema-claro-escuro.md §2.1 (mapa) e §2.2 (reserva).
// Puro, sem React e sem rede; resultado memorizado por tema + cor.
import { palettes, type ColorScheme, type ColorToken, type ThemeColors } from './theme';

/** Mapa fixo §2.1: cor do banco (maiúsculas, sem espaço) -> [claro, escuro]. */
/**
 * ## `DAY_COLOR_MAP`
 * Tabela fixa: cor do banco → `[versão para tema claro, versão para tema escuro]`. As cores antigas (versões anteriores do app) apontam para o mesmo par das novas, para nada mudar de aparência.
 */
const DAY_COLOR_MAP: Record<string, [string, string]> = {
  '#E07856': ['#9F4B2C', '#E4886A'], // Push (Luiz)
  '#E8572A': ['#9F4B2C', '#E4886A'], // Push antiga
  '#5A93D4': ['#34679E', '#73A3DA'], // Pull (Luiz), Superior A (Usuária 2)
  '#2A7BE8': ['#34679E', '#73A3DA'], // Pull antiga
  '#42B968': ['#297144', '#42B968'], // Legs (Luiz), Inferior B (Usuária 2)
  '#27AE60': ['#297144', '#42B968'], // Legs antiga
  '#E07A9A': ['#9F4567', '#E283A1'], // Inferior A (Usuária 2)
  '#A878D4': ['#7A4FA8', '#B790DC'], // Superior B (Usuária 2)
  '#E0A85A': ['#8A5A12', '#E0A85A'], // Glúteos C (Usuária 2)
  '#8E8E96': ['#646461', '#A2A09C'], // Descanso
  '#8E8E93': ['#646461', '#A2A09C'], // Descanso
};

/**
 * ## Constantes internas
 * - `MIN_CONTRAST`: contraste mínimo aceitável (4,5).
 * - `cache`: guarda o resultado por tema + cor, para não recalcular a cada renderização.
 */
const MIN_CONTRAST = 4.5;
const cache = new Map<string, string>();

/**
 * ## `normalizeHex(value)`
 * Padroniza qualquer escrita de cor para `#RRGGBB` maiúsculo.
 *
 * 1. Rejeita o que não é texto.
 * 2. Remove espaços e o `#`.
 * 3. Rejeita o que não for hexadecimal.
 * 4. Expande `#abc` para `#AABBCC`; descarta o canal alfa de `#AABBCCDD`.
 * 5. Qualquer outro tamanho é inválido → `null`.
 *
  * '#abc', 'abc', '#AABBCC', '#AABBCCDD' -> '#AABBCC'; inválida -> null.
  */
export function normalizeHex(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  let h = value.replace(/\s+/g, '').toUpperCase();
  if (h.startsWith('#')) h = h.slice(1);
  if (!/^[0-9A-F]+$/.test(h)) return null;
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map(ch => ch + ch).join('');
  else if (h.length === 8) h = h.slice(0, 6);
  else if (h.length !== 6) return null;
  return `#${h}`;
}

// ─── Cor: hex <-> rgb <-> hsl, contraste WCAG ────────────────────────────────
/**
 * ## Conversões de cor
 * Funções pequenas para trocar entre formatos. RGB = vermelho/verde/azul (0-255); HSL = matiz, saturação e luminosidade (mais fácil de clarear ou escurecer).
 */
type RGB = [number, number, number];

/**
 * ### `hexToRgb(hex)`
 * `#RRGGBB` → `[r, g, b]`. Lê o número hexadecimal e separa os três bytes com deslocamento de bits.
 */
function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * ### `rgbToHex(rgb)`
 * `[r, g, b]` → `#RRGGBB`. Limita cada canal a 0-255, arredonda e escreve em hexadecimal com 2 dígitos.
 */
function rgbToHex([r, g, b]: RGB): string {
  // `to(v)`: converte um canal (0-255) em dois dígitos hexadecimais, limitando ao intervalo válido.
  const to = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/**
 * ### `rgbToHsl(rgb)`
 * RGB → HSL. Calcula a luminosidade (média do maior e do menor canal), a saturação e o matiz (ângulo na roda de cores, 0-360).
 */
function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  // `l`: luminosidade = média entre o maior e o menor canal.
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

/**
 * ### `hslToRgb(h, s, l)`
 * HSL → RGB, pela fórmula padrão da especificação CSS.
 */
function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100, ln = l / 100;
  // Fórmula CSS de conversão HSL → RGB: `k` desloca o matiz em setores de 30°, `a` limita a saturação e `f` calcula cada canal.
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

/**
 * ### `luminance(rgb)`
 * Luminância relativa (o quanto a cor "parece clara" ao olho). Cada canal passa pela correção gama do padrão sRGB e é ponderado: o olho enxerga o verde mais forte que o vermelho e o azul.
 */
function luminance([r, g, b]: RGB): number {
  // `ch(v)`: aplica a correção gama do sRGB a um canal (curva linear para tons escuros, potência 2,4 para os demais).
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/**
 * ## `contrastRatio(hexA, hexB)`
 * Razão de contraste entre duas cores, de 1 a 21, pela fórmula WCAG: `(mais clara + 0,05) / (mais escura + 0,05)`.
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = luminance(hexToRgb(hexA));
  const lb = luminance(hexToRgb(hexB));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * ## Regras de reserva
 * Para cores que **não estão** no mapa (por exemplo, a cor escolhida em uma dieta nova), o app calcula uma versão legível.
 */
// ─── Regra de reserva §2.2 ───────────────────────────────────────────────────
/**
 * ### `fallbackLight(hex, bg)`
 * Para o tema **claro**: limita saturação (45%) e luminosidade (50%) e, passo a passo, escurece 1% por vez até atingir o contraste mínimo com o fundo.
 */
function fallbackLight(hex: string, bg: string): string {
  const [h, s0, l0] = rgbToHsl(hexToRgb(hex));
  const s = Math.min(s0, 45);
  let l = Math.min(l0, 50);
  let out = rgbToHex(hslToRgb(h, s, l));
  while (contrastRatio(out, bg) < MIN_CONTRAST && l > 0) {
    l -= 1;
    out = rgbToHex(hslToRgb(h, s, l));
  }
  return out;
}

/**
 * ### `fallbackDark(hex, bg)`
 * Para o tema **escuro**: se a cor já tem contraste, mantém. Se não, clareia 1% por vez até atingir o mínimo.
 */
function fallbackDark(hex: string, bg: string): string {
  if (contrastRatio(hex, bg) >= MIN_CONTRAST) return hex;
  const [h, s, l0] = rgbToHsl(hexToRgb(hex));
  let l = l0;
  let out = hex;
  while (contrastRatio(out, bg) < MIN_CONTRAST && l < 100) {
    l += 1;
    out = rgbToHex(hslToRgb(h, s, l));
  }
  return out;
}

/**
 * ## `dayColor(hex, scheme)`
 * Função principal. Devolve `#RRGGBB` já adequado ao tema.
 *
 * 1. Procura no cache.
 * 2. Cor vazia ou inválida → cor de "descanso" do tema.
 * 3. Cor conhecida → par fixo do `DAY_COLOR_MAP`.
 * 4. Cor desconhecida → regra de reserva do tema.
 * 5. Guarda no cache e devolve.
 *
 * Cor de um dia/refeição vinda do banco, traduzida para o tema.
 * Sempre devolve '#RRGGBB'. Inválida ou vazia -> `restColor` do tema.
 */
export function dayColor(hex: string | null | undefined, scheme: ColorScheme): string {
  const key = `${scheme}|${hex ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const palette = palettes[scheme];
  const norm = normalizeHex(hex);
  let out: string;
  if (!norm) {
    out = palette.restColor;
  } else if (DAY_COLOR_MAP[norm]) {
    out = DAY_COLOR_MAP[norm][scheme === 'light' ? 0 : 1];
  } else {
    out = scheme === 'light' ? fallbackLight(norm, palette.bg) : fallbackDark(norm, palette.bg);
  }
  cache.set(key, out);
  return out;
}

/**
 * ## `isColorToken(value, palette)`
 * Confere se um texto é o **nome** de uma cor da paleta (ex.: `'red'`). Usa `hasOwnProperty` para não confundir com propriedades herdadas dos objetos.
 */
function isColorToken(value: string, palette: ThemeColors): value is ColorToken {
  return Object.prototype.hasOwnProperty.call(palette, value);
}

/**
 * ## `resolveAccent(value, scheme)`
 * Cor de destaque de uma refeição. Aceita dois formatos:
 * - **nome de token** (`'red'`, `'pushColor'`...) → valor da paleta ativa;
 * - **hexadecimal** (dietas vindas do banco) → passa por `dayColor`.
 *
 * Cor de destaque de refeição: aceita NOME de token (`'pushColor'`, `'red'`…,
 * usado no dietData.ts do Luiz) ou hex (dietas do banco). Token -> valor da
 * paleta ativa; hex -> `dayColor`.
 */
export function resolveAccent(value: string | null | undefined, scheme: ColorScheme): string {
  if (typeof value === 'string') {
    const palette = palettes[scheme];
    const trimmed = value.trim();
    if (isColorToken(trimmed, palette)) return palette[trimmed];
  }
  return dayColor(value, scheme);
}
