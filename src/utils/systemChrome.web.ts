/**
 * # Cor do sistema, versão web (`systemChrome.web.ts`)
 * Mantém o navegador (barra do Safari, cor de fundo, rolagem) combinando com o tema do app.
 */

// Web/PWA: mantém <html>, `color-scheme` e as metas `theme-color` no tema
// efetivo. Complementa o script inline do public/index.html (primeira pintura).
// - Automático: duas metas com `media` (o navegador escolhe pelo sistema).
// - Escolha manual: uma meta só, com o `bg` do tema escolhido.
import { darkColors, lightColors, type ColorScheme, type ThemeColors, type ThemePreference } from './theme';

/**
 * ## `setThemeColorMetas(preference, bg)`
 * Atualiza as tags `<meta name="theme-color">` do HTML, que pintam a barra do navegador.
 *
 * 1. Apaga as tags antigas.
 * 2. Define o helper `add` para criar uma tag nova.
 * 3. Modo **automático**: cria duas tags com `media` (uma clara, uma escura) e o navegador escolhe conforme o sistema.
 * 4. Escolha **manual**: cria uma tag única com a cor do tema escolhido.
 */
function setThemeColorMetas(preference: ThemePreference, bg: string) {
  const head = document.head;
  if (!head) return;
  head.querySelectorAll('meta[name="theme-color"]').forEach(m => m.parentNode?.removeChild(m));

  // `add(content, media)`: cria uma tag `theme-color` (com condição `media` opcional) e a coloca no `<head>`.
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

/**
 * ## `applySystemChrome(scheme, preference, colors)`
 * Aplica o tema à página inteira.
 *
 * 1. Sai sem fazer nada se não houver `document` (execução fora do navegador).
 * 2. Pinta o fundo do `<html>`.
 * 3. Ajusta `color-scheme` para barras de rolagem e campos de texto usarem o tema certo.
 * 4. Define a variável CSS `--focus`, usada no anel de foco (acessibilidade).
 * 5. Atualiza as metas de cor da barra.
 * 6. O `try/catch` garante que um detalhe visual jamais derrube o app.
 */
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
    // Anel de foco visível: `borderStrong` do tema, lido pelo CSS do index.html.
    root.style.setProperty('--focus', colors.borderStrong);
    setThemeColorMetas(preference, colors.bg);
  } catch {
    // Nunca derrubar o app por causa da moldura do navegador.
  }
}
