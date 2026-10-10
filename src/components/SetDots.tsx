// Segmentos de séries (spec 2.3): feita = cheio na cor do dia (verde se todas),
// pendente = só contorno `textFaint` (a forma, não só a cor, diferencia).
import React from 'react';
import { View } from 'react-native';
import { makeStyles, useTheme } from '../contexts/ThemeContext';
import { Radius, Spacing } from '../utils/theme';

const useStyles = makeStyles(c => ({
  row: { flexDirection: 'row', gap: Spacing.xs },
  seg: { flex: 1, height: 8, borderRadius: Radius.pill },
  pending: { borderWidth: 1.5, borderColor: c.textFaint },
}));

export function SetDots({
  total, done, accent, label,
}: { total: number; done: number; accent: string; label: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const all = total > 0 && done >= total;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: Math.min(done, total) }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.seg,
            i < done ? { backgroundColor: all ? colors.green : accent } : styles.pending,
          ]}
        />
      ))}
    </View>
  );
}
