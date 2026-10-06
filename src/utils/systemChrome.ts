// Nativo (Android): pinta o fundo da janela raiz com o `bg` do tema, para não
// aparecer faixa da cor errada em transições e com o teclado aberto.
// A barra de status é tratada pelo <ThemedStatusBar> (App.tsx).
import * as SystemUI from 'expo-system-ui';
import type { ColorScheme, ThemeColors, ThemePreference } from './theme';

export function applySystemChrome(
  _scheme: ColorScheme,
  _preference: ThemePreference,
  colors: ThemeColors,
): void {
  SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
}
