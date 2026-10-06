// Esqueleto de carregamento: bloco `surface` com o tamanho do conteúdo final,
// opacidade 0,6 <-> 1 em 1,2s. Parado se "reduzir movimento" estiver ligado.
import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo, Animated, Easing, Platform,
  type DimensionValue, type StyleProp, type ViewStyle,
} from 'react-native';
import { makeStyles } from '../contexts/ThemeContext';

const useStyles = makeStyles(c => ({
  block: { backgroundColor: c.surface },
}));

export function Skeleton({
  width = '100%', height, style,
}: { width?: DimensionValue; height: number; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const opacity = useRef(new Animated.Value(1)).current;

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
