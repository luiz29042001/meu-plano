/**
 * # Contexto de tema (`ThemeContext.tsx`)
 * Guarda a escolha **Automático / Claro / Escuro** e entrega a paleta ativa a todas as telas. A escolha fica no aparelho (nunca no banco).
 *
 * Uso típico nas telas:
 * ```tsx
 * const useStyles = makeStyles(c => ({ root: { backgroundColor: c.bg } }));
 * function Tela() { const styles = useStyles(); const { colors } = useTheme(); }
 * ```
 * As telas nunca testam `scheme === 'light'`: toda diferença mora nos tokens de cor.
 */
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

/**
 * ## `ThemeValue`
 * O que `useTheme()` devolve: o tema efetivo (`scheme`), a escolha (`preference`), a paleta (`colors`), `ready`, `setPreference` e dois tradutores de cor (`dayColor`, `resolveAccent`).
 */
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

/**
 * Cria o contexto (começa `null`; o `useTheme` avisa se for usado fora do provider).
 */
const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * ## `ThemeProvider`
 * Componente que fornece o tema ao app.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Estados: escolha da pessoa e se a escolha salva já foi lida.
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);
  // `systemScheme`: o tema do aparelho (claro/escuro), atualizado automaticamente quando ele muda.
  // Android: só responde certo com userInterfaceStyle "automatic" + expo-system-ui.
  // Web: react-native-web usa matchMedia('(prefers-color-scheme: dark)') e escuta mudanças.
  const systemScheme = useColorScheme();

  // ### Efeito: ler a escolha salva
  // Lê a preferência do aparelho uma vez e marca `ready`. `alive` evita atualizar o estado se o componente já saiu.
  useEffect(() => {
    let alive = true;
    loadThemePreference().then(p => {
      if (!alive) return;
      setPreferenceState(p);
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  // ### `scheme` (tema efetivo)
  // Se a escolha é "sistema", usa o tema do aparelho (na dúvida, escuro); senão usa a escolha.
  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  // ### Efeito: pintar a moldura do sistema
  // Depois de ler a preferência, aplica o tema à janela/navegador (`applySystemChrome`). Esperar evita sobrescrever o que o script anti-piscada do `index.html` já aplicou.
  useEffect(() => {
    // Só depois de ler a preferência salva: evita pintar o tema do sistema
    // por cima do que o script anti-flash do index.html já aplicou.
    if (!ready) return;
    applySystemChrome(scheme, preference, palettes[scheme]);
  }, [ready, scheme, preference]);

  // ### `setPreference(p)`
  // Troca o tema na hora e grava no aparelho em segundo plano.
  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    void saveThemePreference(p);
  }, []);

  // ### `value`
  // Monta o objeto entregue às telas. `useMemo` só o recria quando algo muda, para não redesenhar o app à toa.
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

/**
 * ## `useTheme()`
 * Lê o tema. Lança erro claro se for usado fora do `ThemeProvider`.
 */
export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme precisa estar dentro de <ThemeProvider>');
  return ctx;
}

/**
 * ## `makeStyles(factory)`
 * Cria um hook de estilos que depende do tema.
 *
 * 1. Recebe uma função que, dada a paleta, devolve os estilos.
 * 2. Guarda **uma folha de estilos por tema** em cache.
 * 3. O hook devolvido lê o tema ativo, cria a folha na primeira vez e depois só reaproveita.
 *
 * Assim, trocar de tema redesenha uma vez, e o cronômetro (que redesenha a cada segundo) apenas lê o cache.
 *
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
