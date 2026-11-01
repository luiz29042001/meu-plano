/**
 * # `Notice`
 * Aviso fixo no topo do conteúdo. Não é *toast* (que some sozinho): fica até o problema ser resolvido.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Text } from 'react-native';
import { makeStyles } from '../contexts/ThemeContext';
import { useMotion } from '../hooks/useMotion';
import { Font, FontSize, LineHeight, Spacing, Touch } from '../utils/theme';
import { LinkButton } from './Buttons';

/**
 * Estilos: faixa lateral vermelha (erro) ou cinza (neutro).
 */
const useStyles = makeStyles(c => ({
  wrap: {
    minHeight: Touch.min, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: c.surface, borderLeftWidth: 3, borderLeftColor: c.red,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  neutral: { borderLeftColor: c.textFaint },
  text: { flex: 1, fontFamily: Font.body, fontSize: FontSize.md, color: c.text, lineHeight: LineHeight.md },
}));

/**
 * ## `Notice({ text, tone, actionLabel, onAction })`
 * - `tone` → `'error'` (padrão) ou `'neutral'`.
 * - `actionLabel`/`onAction` → link de ação opcional (ex.: "Tentar de novo").
 */
export function Notice({
  text, tone = 'error', actionLabel, onAction,
}: { text: string; tone?: 'error' | 'neutral'; actionLabel?: string; onAction?: () => void }) {
  const styles = useStyles();
  // `ms` traz as durações de animação; elas valem 0 se a pessoa pediu "reduzir movimento".
  const { ms } = useMotion();
  // `opacity` começa em 0 (ou 1 sem animação) para o aviso aparecer suavemente.
  const opacity = useRef(new Animated.Value(ms.enter === 0 ? 1 : 0)).current;

  // Efeito: anima a entrada (fade-in). Sem animação, mostra direto.
  useEffect(() => {
    if (ms.enter === 0) { opacity.setValue(1); return; }
    Animated.timing(opacity, { toValue: 1, duration: ms.enter, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [opacity, ms.enter]);

  // `accessibilityLiveRegion="polite"` faz o leitor de tela anunciar o aviso sem interromper.
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
