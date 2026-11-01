/**
 * # `SetDots`
 * Barra de progresso das séries: um segmento por série. Feita = preenchida na cor do dia (verde quando todas estão feitas); pendente = só contorno. A **forma**, e não só a cor, diferencia (acessibilidade).
 */
import React from 'react';
import { View } from 'react-native';
import { makeStyles, useTheme } from '../contexts/ThemeContext';
import { Radius, Spacing } from '../utils/theme';

/**
 * Estilos: linha de segmentos e o contorno da série pendente.
 */
const useStyles = makeStyles(c => ({
  row: { flexDirection: 'row', gap: Spacing.xs },
  seg: { flex: 1, height: 8, borderRadius: Radius.pill },
  pending: { borderWidth: 1.5, borderColor: c.textFaint },
}));

/**
 * ## `SetDots({ total, done, accent, label })`
 * 1. `all` → todas as séries já foram feitas?
 * 2. Marca o grupo como barra de progresso para leitores de tela (valor atual, máximo e descrição).
 * 3. Cria `total` segmentos; os `done` primeiros ficam preenchidos.
 */
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
