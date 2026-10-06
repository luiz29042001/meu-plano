// Linha de números (spec §4): 2-3 números Barlow 700 xxxl + rótulo Inter sm,
// separadores verticais de 1px e linha fina em cima e embaixo.
import React from 'react';
import { Text, View } from 'react-native';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, Spacing, Tracking, numberLineHeight } from '../utils/theme';

const useStyles = makeStyles(c => ({
  row: {
    flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border,
  },
  cell: { flex: 1, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md },
  cellSep: { borderLeftWidth: 1, borderLeftColor: c.border },
  value: {
    fontFamily: Font.condBold, fontSize: FontSize.xxxl, lineHeight: numberLineHeight(FontSize.xxxl),
    letterSpacing: Tracking.tight, color: c.text, includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  label: {
    marginTop: Spacing.xs, fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted,
  },
}));

export function NumbersRow({
  items, valueSize = FontSize.xxxl,
}: { items: { value: string; label: string }[]; valueSize?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {items.map((it, i) => (
        <View
          key={it.label}
          style={[styles.cell, i > 0 && styles.cellSep]}
          accessible
          accessibilityLabel={`${it.value} ${it.label}`}
        >
          <Text
            style={[styles.value, { fontSize: valueSize, lineHeight: numberLineHeight(valueSize) }]}
            numberOfLines={1} maxFontSizeMultiplier={1.2}>{it.value}</Text>
          <Text style={styles.label}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}
