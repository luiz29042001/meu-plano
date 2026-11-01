/**
 * # `NumbersRow`
 * Linha com 2 ou 3 números grandes e seus rótulos (ex.: "12 treinos"), separados por linhas finas.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, Spacing, Tracking, numberLineHeight } from '../utils/theme';

/**
 * Estilos: células, separadores e o número em fonte condensada com algarismos de largura fixa (`tabular-nums`).
 */
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
  valueOk: { color: c.green },
  label: {
    marginTop: Spacing.xs, fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted,
  },
}));

/**
 * ## `NumbersRow({ items, valueSize })`
 * Para cada item desenha uma célula com número e rótulo. `ok` pinta o número de verde. Cada célula tem um rótulo único para leitores de tela ("12 treinos"), e `maxFontSizeMultiplier` limita o quanto o texto cresce com a fonte ampliada do sistema.
 */
export function NumbersRow({
  items, valueSize = FontSize.xxxl,
}: { items: { value: string; label: string; ok?: boolean }[]; valueSize?: number }) {
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
            style={[styles.value, it.ok && styles.valueOk, { fontSize: valueSize, lineHeight: numberLineHeight(valueSize) }]}
            numberOfLines={1} maxFontSizeMultiplier={1.2}>{it.value}</Text>
          <Text style={styles.label}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}
