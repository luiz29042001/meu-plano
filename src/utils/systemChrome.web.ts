// Web/PWA: mantém <html>, `color-scheme` e as metas `theme-color` no tema
// efetivo. Complementa o script inline do public/index.html (primeira pintura).
// - Automático: duas metas com `media` (o navegador escolhe pelo sistema).
// - Escolha manual: uma meta só, com o `bg` do tema escolhido.
import { darkColors, lightColors, type ColorScheme, type ThemeColors, type ThemePreference } from './theme';

function setThemeColorMetas(preference: ThemePreference, bg: string) {
  const head = document.head;
  if (!head) return;
  head.querySelectorAll('meta[name="theme-color"]').forEach(m => m.parentNode?.removeChild(m));

  const add = (content: string, media?: string) => {
    const m = document.createElement('meta');
    m.setAttribute('name', 'theme-color');
    m.setAttribute('content', content);
    if (media) m.setAttribute('media', media);
    head.appendChild(m);
  };

  if (preference === 'system') {
    add(lightColors.bg, '(prefers-color-scheme: light)');
    add(darkColors.bg, '(prefers-color-scheme: dark)');
  } else {
    add(bg);
  }
}

export function applySystemChrome(
  scheme: ColorScheme,
  preference: ThemePreference,
  colors: ThemeColors,
): void {
  if (typeof document === 'undefined') return;
  try {
    const root = document.documentElement;
    root.style.backgroundColor = colors.bg;
    // Caret, barras de rolagem e autofill do campo de anotação no tema certo.
    root.style.colorScheme = scheme;
    // Anel de foco visível (spec §9): `borderStrong` do tema, lido pelo CSS do index.html.
    root.style.setProperty('--focus', colors.borderStrong);
    setThemeColorMetas(preference, colors.bg);
  } catch {
    // Nunca derrubar o app por causa da moldura do navegador.
  }
}
