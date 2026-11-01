/**
 * # `Skeleton`
 * "Esqueleto" de carregamento: um bloco cinza do tamanho do conteúdo final que pulsa suavemente. Evita a tela pular quando os dados chegam.
 */
import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo, Animated, Easing, Platform,
  type DimensionValue, type StyleProp, type ViewStyle,
} from 'react-native';
import { makeStyles } from '../contexts/ThemeContext';

/**
 * Estilo do bloco (cor `surface` do tema).
 */
const useStyles = makeStyles(c => ({
  block: { backgroundColor: c.surface },
}));

/**
 * ## `Skeleton({ width, height, style })`
 * Bloco pulsante.
 */
export function Skeleton({
  width = '100%', height, style,
}: { width?: DimensionValue; height: number; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const opacity = useRef(new Animated.Value(1)).current;

  // Efeito:
  // 1. Pergunta ao sistema se "reduzir movimento" está ligado; se estiver, fica parado.
  // 2. Senão, cria um laço (`Animated.loop`) que alterna a opacidade 1 ↔ 0,6 em 0,6 s cada.
  // 3. A limpeza para o laço.
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let alive = true;
    const native = Platform.OS !== 'web';
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!alive || reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.6, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: native }),
          Animated.timing(opacity, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: native }),
        ]),
      );
      loop.start();
    }).catch(() => {});
    // Escondido de leitores de tela (`no-hide-descendants`): não tem conteúdo a ler.
    return () => { alive = false; loop?.stop(); };
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { width, height, opacity }, style]}
    />
  );
}
