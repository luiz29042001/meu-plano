import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCalendar } from '../hooks/useCalendar';
import { Colors, Radius, FontSize, Spacing } from '../utils/theme';
import {
  MONTH_NAMES, WEEKDAY_SHORT,
  getDaysInMonth, getFirstDayOfMonth,
} from '../utils/date';

function slugColor(slug?: string): string {
  if (!slug) return Colors.textFaint;
  if (slug.startsWith('push')) return Colors.pushColor;
  if (slug.startsWith('pull')) return Colors.pullColor;
  if (slug.startsWith('legs')) return Colors.legsColor;
  return Colors.textFaint;
}

export function CalendarScreen() {
  const navigation = useNavigation<any>();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const { completionByDate, stats, loading } = useCalendar(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay = getFirstDayOfMonth(viewYear, viewMonth); // 0=Dom
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const completedThisMonth = Object.keys(completionByDate).length;

  // Monta a matriz de células: vazias antes do dia 1 + os dias do mês.
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSub}>Histórico</Text>
          <Text style={styles.headerTitle}>Treinos Concluídos</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Month navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <View style={styles.monthCenter}>
            <Text style={styles.monthName}>{MONTH_NAMES[viewMonth]}</Text>
            <Text style={styles.monthMeta}>
              {viewYear} · {completedThisMonth} treino{completedThisMonth !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar card */}
        <View style={styles.calendarCard}>
          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {WEEKDAY_SHORT.map((w, i) => (
              <View key={i} style={styles.weekCell}>
                <Text style={styles.weekLabel}>{w}</Text>
              </View>
            ))}
          </View>

          {loading
            ? <ActivityIndicator color={Colors.textMuted} style={{ marginVertical: 32 }} />
            : (
              <View style={styles.grid}>
                {cells.map((day, i) => {
                  if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const completion = completionByDate[dateStr];
                  const isToday = isCurrentMonth && day === now.getDate();
                  const cColor = slugColor(completion?.workout_day?.slug);
                  return (
                    <View key={dateStr} style={styles.cell}>
                      <View style={[
                        styles.cellInner,
                        completion && { backgroundColor: cColor + '26', borderColor: cColor, borderWidth: 1 },
                        isToday && !completion && styles.cellToday,
                      ]}>
                        <Text style={[
                          styles.cellDay,
                          completion && { color: cColor, fontWeight: '700' },
                          isToday && !completion && { color: Colors.green, fontWeight: '700' },
                        ]}>
                          {day}
                        </Text>
                        {completion?.workout_day && (
                          <Text style={[styles.cellLabel, { color: cColor }]} numberOfLines={1}>
                            {completion.workout_day.label}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
        </View>

        {/* Stats — 2 cards (removido "Sequência atual") */}
        {stats && (
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.green }]}>{stats.total_workouts}</Text>
              <Text style={styles.statLabel}>Total de treinos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.orange }]}>{completedThisMonth}</Text>
              <Text style={styles.statLabel}>Neste mês</Text>
            </View>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legenda</Text>
          {[
            { color: Colors.pushColor, label: 'Push A / Push B' },
            { color: Colors.pullColor, label: 'Pull A / Pull B' },
            { color: Colors.legsColor, label: 'Legs A / Legs B' },
          ].map(l => (
            <View key={l.label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendLabel}>{l.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 24, color: Colors.text, lineHeight: 28 },
  headerSub: { fontSize: FontSize.xs, color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  navArrow: { fontSize: 22, color: Colors.text },
  monthCenter: { alignItems: 'center' },
  monthName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  monthMeta: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  calendarCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: FontSize.xs, fontWeight: '600', color: Colors.textFaint,
    paddingVertical: Spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },
  cellInner: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellToday: {
    backgroundColor: Colors.green + '1A',
    borderWidth: 1,
    borderColor: Colors.green + '55',
  },
  cellDay: { fontSize: FontSize.md, color: Colors.textMuted },
  cellLabel: {
    fontSize: 7,
    fontWeight: '700',
    lineHeight: 9,
    marginTop: 2,
  },
  statRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800' },
  statLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  legend: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
  legendTitle: {
    fontSize: FontSize.xs, color: Colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { fontSize: FontSize.md, color: Colors.textMuted },
});
