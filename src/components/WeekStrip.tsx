/**
 * # `WeekStrip`
 * Faixa da semana (segunda a domingo) com um marcador por dia. Não é tocável: só mostra o que foi feito.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, Radius, Spacing } from '../utils/theme';

/**
 * Constantes: iniciais exibidas, nomes por extenso (para leitores de tela) e o tamanho do marcador.
 */
const INITIALS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const FULL = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
const MARKER = 12;

/**
 * Estilos dos marcadores: cheio verde = treinou; contorno forte = hoje; contorno fraco = dia passado sem treino; contorno claro = futuro.
 */
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

/**
 * ## `WeekStrip({ dates, doneDates, today, goal })`
 * 1. Monta um conjunto com as datas treinadas (consulta rápida).
 * 2. Escreve a frase de acessibilidade, ex.: "treinou segunda, quarta e sexta. 3 de 4." (junta com vírgulas e "e" no fim).
 * 3. Para cada data, escolhe o estilo: feito (e se for hoje, com anel), hoje, passado ou futuro.
 */
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
