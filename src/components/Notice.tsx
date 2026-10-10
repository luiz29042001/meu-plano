// Aviso fixo no topo do conteúdo (spec 2.2): não é toast, fica até resolver.
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Text } from 'react-native';
import { makeStyles } from '../contexts/ThemeContext';
import { useMotion } from '../hooks/useMotion';
import { Font, FontSize, LineHeight, Spacing, Touch } from '../utils/theme';
import { LinkButton } from './Buttons';

const useStyles = makeStyles(c => ({
  wrap: {
    minHeight: Touch.min, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: c.surface, borderLeftWidth: 3, borderLeftColor: c.red,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  neutral: { borderLeftColor: c.textFaint },
  text: { flex: 1, fontFamily: Font.body, fontSize: FontSize.md, color: c.text, lineHeight: LineHeight.md },
}));

export function Notice({
  text, tone = 'error', actionLabel, onAction,
}: { text: string; tone?: 'error' | 'neutral'; actionLabel?: string; onAction?: () => void }) {
  const styles = useStyles();
  const { ms } = useMotion();
  const opacity = useRef(new Animated.Value(ms.enter === 0 ? 1 : 0)).current;

  useEffect(() => {
    if (ms.enter === 0) { opacity.setValue(1); return; }
    Animated.timing(opacity, { toValue: 1, duration: ms.enter, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [opacity, ms.enter]);

  return (
    <Animated.View
      style={[styles.wrap, tone === 'neutral' && styles.neutral, { opacity }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{text}</Text>
      {actionLabel && onAction ? <LinkButton label={actionLabel} onPress={onAction} /> : null}
    </Animated.View>
  );
}
