// Dock fixo acima da barra inferior (spec 2.5): um botão de 56px na zona do polegar.
// Avisa o TimerContext da altura para o cronômetro (se estiver embaixo) ficar acima.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useTimerLayout } from '../contexts/TimerContext';
import { makeStyles } from '../contexts/ThemeContext';
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';
import { Layout, Spacing } from '../utils/theme';

const useStyles = makeStyles(c => ({
  dock: {
    minHeight: Layout.DOCK_HEIGHT, justifyContent: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
    backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.border,
  },
}));

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
