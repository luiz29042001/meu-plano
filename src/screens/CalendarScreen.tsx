/**
 * # `CalendarScreen` — tela Calendário
 * Calendário mensal com os treinos concluídos. Cada dia treinado ganha um marcador verde e uma barra na cor do dia (ex.: Superior A). Mostra também o total do mês, o total geral e a legenda de cores.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCalendar } from '../hooks/useCalendar';
import { useNavigation } from '@react-navigation/native';
import { useTheme, makeStyles } from '../contexts/ThemeContext';
import { useTimerInsets } from '../hooks/useTimerInsets';
import { Font, FontSize, Radius, Spacing, Touch, Tracking, numberLineHeight } from '../utils/theme';
import {
  MONTH_NAMES, WEEKDAY_SHORT,
  getDaysInMonth, getFirstDayOfMonth, todayISO,
} from '../utils/date';
import { buildLegend } from '../utils/workoutSequence';
import { ScreenHeader } from '../components/ScreenHeader';
import { NumbersRow } from '../components/NumbersRow';
import { ErrorBlock } from '../components/ErrorBlock';
import { Skeleton } from '../components/Skeleton';
import { OutlineButton } from '../components/Buttons';
import { Notice } from '../components/Notice';
import { useOnline } from '../hooks/useOnline';

/**
 * Medidas: altura da célula do dia, espessura da barra colorida e tamanho do marcador de "feito".
 */
const CELL_HEIGHT = 56;
const BAR_HEIGHT = 4;
const DONE_MARK = 8;

/**
 * Estilos da tela. `weekCell` ocupa 1/7 da largura; `grid` quebra linha (`flexWrap`) para formar semanas.
 */
const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: Touch.min, height: Touch.min, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm, borderWidth: 1, borderColor: c.border },
  arrowHover: { backgroundColor: c.cardHover },
  arrowText: { fontFamily: Font.condMedium, fontSize: FontSize.xxl, color: c.text, includeFontPadding: false, lineHeight: FontSize.xxl },
  monthCenter: { alignItems: 'center' },
  monthName: {
    fontFamily: Font.condSemi, fontSize: FontSize.xxxl, lineHeight: numberLineHeight(FontSize.xxxl),
    letterSpacing: Tracking.tight, color: c.text, textTransform: 'uppercase', includeFontPadding: false,
  },
  monthYear: { fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted },
  block: { marginTop: Spacing.xl },
  weekRow: { flexDirection: 'row', marginTop: Spacing.xl },
  weekCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: Spacing.xs },
  weekLabel: {
    fontFamily: Font.condMedium, fontSize: FontSize.sm, color: c.textFaint,
    textTransform: 'uppercase', includeFontPadding: false,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: c.border },
  cell: {
    width: `${100 / 7}%`, height: CELL_HEIGHT, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  cellToday: { borderWidth: 1.5, borderColor: c.borderStrong },
  day: {
    fontFamily: Font.condSemi, fontSize: FontSize.title, color: c.textMuted, includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  dayDone: { color: c.text, fontFamily: Font.condBold },
  dayFuture: { color: c.textFaint },
  doneMark: { position: 'absolute', top: Spacing.xs, right: Spacing.xs, width: DONE_MARK, height: DONE_MARK, backgroundColor: c.green, borderRadius: Radius.sm },
  dayBar: { position: 'absolute', left: Spacing.sm, right: Spacing.sm, bottom: Spacing.xs, height: BAR_HEIGHT },
  emptyMonth: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted },
  emptyBtn: { marginTop: Spacing.md },
  legend: { marginTop: Spacing.xxl },
  legendTitle: {
    fontFamily: Font.condSemi, fontSize: FontSize.lg, color: c.text, textTransform: 'uppercase',
    letterSpacing: Tracking.caps, marginBottom: Spacing.xs, includeFontPadding: false,
  },
  legendRow: { minHeight: Touch.min, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  legendBar: { width: 16, height: BAR_HEIGHT },
  legendLabel: { flex: 1, fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted },
  skelRow: { flexDirection: 'row', gap: Spacing.md },
}));

/**
 * ## `CalendarScreen()`
 */
export function CalendarScreen() {
  const styles = useStyles();
  const { dayColor } = useTheme();
  // Mês exibido: começa no mês atual e muda com as setas.
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const timerInsets = useTimerInsets();
  const navigation = useNavigation<any>();
  const online = useOnline();

  // `useCalendar` busca os dados do mês exibido. `buildLegend` agrupa os dias do programa por cor para a legenda.
  const { completionByDate, stats, programDays, loading, status, error, retry } = useCalendar(viewYear, viewMonth);
  const legend = buildLegend(programDays);

  // ### `prevMonth()` e `nextMonth()`
  // Navegam entre os meses. Na virada (janeiro ← → dezembro) ajustam também o ano.
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // ### Contas do mês
  // - `firstDay` → quantas células vazias antes do dia 1 (a grade começa no domingo).
  // - `daysInMonth` → quantos dias o mês tem.
  // - `completedThisMonth` → quantos dias com treino.
  // - `isLoading` → carregando (inclusive ao trocar de mês).
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth); // 0=Dom
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const today = todayISO();
  const completedThisMonth = Object.keys(completionByDate).length;
  const isLoading = loading || status === 'loading';
  const monthName = MONTH_NAMES[viewMonth];

  // ### `cells`
  // Lista que forma a grade: `null` para cada célula vazia antes do dia 1, seguida de 1, 2, 3... até o último dia.
  // Monta a matriz de células: vazias antes do dia 1 + os dias do mês.
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Calendário" subtitle="Histórico de treinos" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: timerInsets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {timerInsets.top > 0 && <View style={{ height: timerInsets.top }} />}
        {!online && status !== 'error' && (
          <View style={{ marginBottom: Spacing.md }}>
            <Notice tone="neutral" text="Sem internet. Histórico do último carregamento." />
          </View>
        )}
        {/* Navegação do mês: seta anterior, nome do mês e ano, seta seguinte. */}
        {/* Mês */}
        <View style={styles.monthNav}>
          <Pressable
            onPress={prevMonth}
            accessibilityRole="button"
            accessibilityLabel="Mês anterior"
            style={({ pressed }) => [styles.arrow, pressed && styles.arrowHover]}
          >
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <View style={styles.monthCenter} accessible accessibilityRole="header" accessibilityLabel={`${monthName} de ${viewYear}`}>
            <Text style={styles.monthName} numberOfLines={1}>{monthName}</Text>
            <Text style={styles.monthYear}>{viewYear}</Text>
          </View>
          <Pressable
            onPress={nextMonth}
            accessibilityRole="button"
            accessibilityLabel="Próximo mês"
            style={({ pressed }) => [styles.arrow, pressed && styles.arrowHover]}
          >
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>

        {/* Totais (neste mês e no total). Enquanto carrega mostra esqueletos; em caso de erro, nada. */}
        {/* Números */}
        <View style={styles.block}>
          {stats && !isLoading ? (
            <NumbersRow items={[
              { value: String(completedThisMonth), label: 'neste mês' },
              { value: String(stats.total_workouts), label: 'no total' },
            ]} />
          ) : status === 'error' ? null : (
            <View style={styles.skelRow}>
              <Skeleton width={120} height={72} />
              <Skeleton width={120} height={72} />
            </View>
          )}
        </View>

        {/* Grade do calendário. Em erro, bloco de erro com "tentar de novo". Senão:
           1. Linha com os dias da semana abreviados.
           2. Para cada célula: monta a data `AAAA-MM-DD`, procura a conclusão, e marca se é hoje ou futuro. Cada célula tem descrição para leitores de tela ("3 de novembro, Superior A concluído").
           3. Mês sem treinos → frase e botão para ver o treino de hoje.
        */}
        {/* Grade */}
        {status === 'error' ? (
          <View style={styles.block}>
            <ErrorBlock
              title="Não foi possível carregar o calendário."
              cause={error ?? 'Confira a internet.'}
              onRetry={retry}
            />
          </View>
        ) : (
          <>
            <View style={styles.weekRow}>
              {WEEKDAY_SHORT.map((w, i) => (
                <View key={i} style={styles.weekCell}>
                  <Text style={styles.weekLabel} numberOfLines={1}>{w}</Text>
                </View>
              ))}
            </View>
            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const completion = isLoading ? undefined : completionByDate[dateStr];
                const isToday = dateStr === today;
                const isFuture = dateStr > today;
                const dayLabel = completion?.workout_day?.label;
                return (
                  <View
                    key={dateStr}
                    style={[styles.cell, isToday && styles.cellToday]}
                    accessible
                    accessibilityLabel={
                      completion
                        ? `${day} de ${monthName.toLowerCase()}, ${dayLabel ?? 'treino'} concluído`
                        : `${day} de ${monthName.toLowerCase()}, sem treino`
                    }
                  >
                    <Text style={[
                      styles.day,
                      isFuture && styles.dayFuture,
                      completion && styles.dayDone,
                    ]}>
                      {day}
                    </Text>
                    {completion && <View style={styles.doneMark} />}
                    {completion && (
                      <View style={[styles.dayBar, { backgroundColor: dayColor(completion.workout_day?.color) }]} />
                    )}
                  </View>
                );
              })}
            </View>
            {!isLoading && completedThisMonth === 0 && (
              <>
                <Text style={styles.emptyMonth}>Nenhum treino em {monthName.toLowerCase()}.</Text>
                <OutlineButton
                  label="Ver o treino de hoje"
                  onPress={() => navigation.navigate('Workout')}
                  style={styles.emptyBtn}
                />
              </>
            )}
          </>
        )}

        {/* Legenda: uma linha por cor, com os nomes dos dias que a usam. */}
        {/* Legenda */}
        {legend.length > 0 && (
          <View style={styles.legend}>
            <Text style={styles.legendTitle} accessibilityRole="header">Legenda</Text>
            {legend.map(l => (
              <View key={l.label} style={styles.legendRow}>
                <View style={[styles.legendBar, { backgroundColor: dayColor(l.color) }]} />
                <Text style={styles.legendLabel}>{l.label}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
