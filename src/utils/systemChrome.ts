/**
 * # Cor do sistema, versão Android/iOS (`systemChrome.ts`)
 * "Chrome" aqui é a moldura do sistema em volta do app. Esta versão pinta o fundo da janela raiz.
 */

// Nativo (Android): pinta o fundo da janela raiz com o `bg` do tema, para não
// aparecer faixa da cor errada em transições e com o teclado aberto.
// A barra de status é tratada pelo <ThemedStatusBar> (App.tsx).
import * as SystemUI from 'expo-system-ui';
import type { ColorScheme, ThemeColors, ThemePreference } from './theme';

/**
 * ## `applySystemChrome(scheme, preference, colors)`
 * Pinta o fundo da janela com a cor `bg` do tema, evitando uma faixa de cor errada durante transições ou com o teclado aberto. Os parâmetros `scheme` e `preference` existem só para manter a mesma assinatura da versão web (por isso o `_`). Erros são ignorados de propósito: é um detalhe visual.
 */
export function applySystemChrome(
  _scheme: ColorScheme,
  _preference: ThemePreference,
  colors: ThemeColors,
): void {
  SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
}
