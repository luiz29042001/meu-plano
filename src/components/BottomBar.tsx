// Barra inferior (spec 2.4): Início / Treino / Dieta em todas as telas logadas.
// Fica NO FLUXO (abaixo do Stack), então o conteúdo das telas já termina acima dela.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, Layout, Tracking } from '../utils/theme';

export type BarItem = 'Home' | 'Workout' | 'Diet';

const ITEMS: { name: BarItem; label: string; a11y: string }[] = [
  { name: 'Home', label: 'Início', a11y: 'Ir para Início' },
  { name: 'Workout', label: 'Treino', a11y: 'Ir para Treino' },
  { name: 'Diet', label: 'Dieta', a11y: 'Ir para Dieta' },
];

const useStyles = makeStyles(c => ({
  bar: { flexDirection: 'row', backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.border },
  cell: { flex: 1, minHeight: Layout.BAR_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  cellHover: { backgroundColor: c.cardHover },
  indicator: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: c.text },
  label: {
    fontFamily: Font.condSemi, fontSize: FontSize.lg, lineHeight: FontSize.lg + 4, color: c.textMuted,
    textTransform: 'uppercase', letterSpacing: Tracking.caps, includeFontPadding: false,
  },
  labelActive: { color: c.text },
}));

export function BottomBar({
  active, onPress,
}: { active: BarItem; onPress: (name: BarItem) => void }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
      {ITEMS.map(it => {
        const selected = it.name === active;
        return (
          <Pressable
            key={it.name}
            onPress={() => onPress(it.name)}
            accessibilityRole="button"
            accessibilityLabel={it.a11y}
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.cell, pressed && styles.cellHover]}
          >
            {selected ? <View style={styles.indicator} /> : null}
            <Text style={[styles.label, selected && styles.labelActive]} numberOfLines={1}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
