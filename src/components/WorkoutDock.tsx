/**
 * # `WorkoutDock`
 * Faixa fixa acima da barra inferior, com um botão grande (56 px) na zona do polegar. Informa sua altura ao `TimerContext`, para o cronômetro (quando está embaixo) ficar acima dela.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useTimerLayout } from '../contexts/TimerContext';
import { makeStyles } from '../contexts/ThemeContext';
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';
import { Layout, Spacing } from '../utils/theme';

/**
 * Estilos do dock, criados a partir das cores do tema ativo (`makeStyles`).
 */
const useStyles = makeStyles(c => ({
  dock: {
    minHeight: Layout.DOCK_HEIGHT, justifyContent: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
    backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.border,
  },
}));

/**
 * ## `WorkoutDock({ children })`
 * Mostra os filhos (o botão) dentro da faixa.
 *
 * 1. Lê se o teclado está aberto.
 * 2. Efeito: com o teclado fechado, informa a altura do dock ao contexto; na limpeza devolve 0.
 * 3. Com o teclado aberto, **não desenha** o dock (retorna `null`) para ele não cobrir o campo de texto.
 */
export function WorkoutDock({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const keyboard = useKeyboardVisible();
  const { setBottomOffset } = useTimerLayout();

  useEffect(() => {
    if (keyboard) return;
    setBottomOffset(Layout.DOCK_HEIGHT);
    return () => setBottomOffset(0);
  }, [keyboard, setBottomOffset]);

  if (keyboard) return null;
  return <View style={styles.dock}>{children}</View>;
}
