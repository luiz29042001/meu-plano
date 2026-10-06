// Tema do app: Automático (segue o aparelho), Claro ou Escuro.
// A escolha fica no aparelho (devicePrefs), nunca no banco, e este contexto
// NÃO chama o Supabase (armadilha 1 não se aplica, mas fica registrado).
//
// Uso nas telas:
//   const useStyles = makeStyles(c => ({ root: { backgroundColor: c.bg } }));
//   function Tela() { const styles = useStyles(); const { colors, dayColor } = useTheme(); ... }
// As telas nunca testam `scheme === 'light'`: toda diferença mora nos tokens.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import {
  palettes,
  type ColorScheme,
  type ThemeColors,
  type ThemePreference,
} from '../utils/theme';
import { dayColor as translateDayColor, resolveAccent as translateAccent } from '../utils/dayColor';
import { loadThemePreference, saveThemePreference } from '../services/devicePrefs';
import { applySystemChrome } from '../utils/systemChrome';

export interface ThemeValue {
  /** Tema efetivo (Automático já resolvido). */
  scheme: ColorScheme;
  /** O que o usuário escolheu no Perfil. */
  preference: ThemePreference;
  /** Paleta ativa = palettes[scheme]. */
  colors: ThemeColors;
  /** true depois que a preferência salva foi lida (o AppGate espera por isso). */
  ready: boolean;
  /** Troca na hora e grava no aparelho em segundo plano. */
  setPreference(p: ThemePreference): void;
  /** Cor do banco (dia de treino) traduzida para o tema ativo. */
  dayColor(hex: string | null | undefined): string;
  /** Nome de token ('pushColor', 'red'…) ou hex do banco -> cor do tema ativo. */
  resolveAccent(value: string | null | undefined): string;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);
  // Android: só responde certo com userInterfaceStyle "automatic" + expo-system-ui.
  // Web: react-native-web usa matchMedia('(prefers-color-scheme: dark)') e escuta mudanças.
  const systemScheme = useColorScheme();

  useEffect(() => {
    let alive = true;
    loadThemePreference().then(p => {
      if (!alive) return;
      setPreferenceState(p);
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  useEffect(() => {
    // Só depois de ler a preferência salva: evita pintar o tema do sistema
    // por cima do que o script anti-flash do index.html já aplicou.
    if (!ready) return;
    applySystemChrome(scheme, preference, palettes[scheme]);
  }, [ready, scheme, preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    void saveThemePreference(p);
  }, []);

  const value = useMemo<ThemeValue>(() => ({
    scheme,
    preference,
    colors: palettes[scheme],
    ready,
    setPreference,
    dayColor: (hex) => translateDayColor(hex, scheme),
    resolveAccent: (v) => translateAccent(v, scheme),
  }), [scheme, preference, ready, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme precisa estar dentro de <ThemeProvider>');
  return ctx;
}

/**
 * Cria um hook de estilos dependente do tema. Uma StyleSheet por tema por
 * arquivo, guardada em cache: trocar o tema re-renderiza uma vez; o
 * cronômetro (re-render a cada segundo) só lê o cache.
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (c: ThemeColors) => T,
): () => T {
  const cache: Partial<Record<ColorScheme, T>> = {};
  return function useStyles(): T {
    const { scheme } = useTheme();
    let styles = cache[scheme];
    if (!styles) {
      styles = StyleSheet.create(factory(palettes[scheme]));
      cache[scheme] = styles;
    }
    return styles;
  };
}
