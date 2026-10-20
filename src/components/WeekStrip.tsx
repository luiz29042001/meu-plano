// Semana de treino (spec 2.6): 7 células, segunda primeiro. Não é tocável.
import React from 'react';
import { Text, View } from 'react-native';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, Radius, Spacing } from '../utils/theme';

const INITIALS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const FULL = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
const MARKER = 12;

const useStyles = makeStyles(c => ({
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  initial: { fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted, includeFontPadding: false },
  marker: { width: MARKER, height: MARKER, borderRadius: Radius.sm },
  done: { backgroundColor: c.green },
  today: { borderWidth: 2, borderColor: c.borderStrong },
  past: { borderWidth: 1, borderColor: c.textFaint },
  future: { borderWidth: 1, borderColor: c.border },
}));

export function WeekStrip({
  dates, doneDates, today, goal,
}: { dates: string[]; doneDates: string[]; today: string; goal: number }) {
  const styles = useStyles();
  const done = new Set(doneDates);
  const trained = dates.map((d, i) => (done.has(d) ? FULL[i] : null)).filter(Boolean) as string[];
  const list = trained.length === 0
    ? 'nenhum treino ainda'
    : `treinou ${trained.length === 1 ? trained[0] : `${trained.slice(0, -1).join(', ')} e ${trained[trained.length - 1]}`}`;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Esta semana: ${list}. ${trained.length} de ${goal}.`}
    >
      {dates.map((d, i) => {
        const isDone = done.has(d);
        const isToday = d === today;
        const style = isDone ? (isToday ? [styles.done, styles.today] : styles.done)
          : isToday ? styles.today
          : d < today ? styles.past : styles.future;
        return (
          <View key={d} style={styles.cell}>
            <Text style={styles.initial}>{INITIALS[i]}</Text>
            <View style={[styles.marker, style]} />
          </View>
        );
      })}
    </View>
  );
}
