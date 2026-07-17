import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCalendar } from '../hooks/useCalendar';
import { Colors, Radius, FontSize } from '../utils/theme';
import {
  MONTH_NAMES, WEEKDAY_SHORT,
  getDaysInMonth, getFirstDayOfMonth,
} from '../utils/date';

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

  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const completedThisMonth = Object.keys(completionByDate).length;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <SafeAreaView style={styles.container}>
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

        {/* Weekday headers */}
        <View style={styles.weekRow}>
          {WEEKDAY_SHORT.map((w, i) => (
            <Text key={i} style={styles.weekLabel}>{w}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        {loading
          ? <ActivityIndicator color={Colors.textMuted} style={{ marginVertical: 32 }} />
          : (
            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const completion = completionByDate[dateStr];
                const isToday = isCurrentMonth && day === now.getDate();
                return (
                  <View
                    key={dateStr}
                    style={[
                      styles.cell,
                      styles.cellFilled,
                      completion && styles.cellDone,
                      isToday && styles.cellToday,
                    ]}
                  >
                    <Text style={[
                      styles.cellDay,
                      completion && { color: Colors.green },
                      isToday && !completion && { color: Colors.pullColor },
                    ]}>
                      {day}
                    </Text>
                    {completion?.workout_day && (
                      <Text style={styles.cellLabel} numberOfLines={1}>
                        {completion.workout_day.label}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

        {/* Stats summary */}
        {stats && (
          <View style={styles.statsSection}>
            <View style={styles.statRow}>
              {[
                { label: 'Total de treinos', value: stats.total_workouts, color: Colors.green },
                { label: 'Sequência atual', value: stats.current_streak, color: Colors.orange },
                { label: 'Maior sequência', value: stats.longest_streak, color: Colors.pullColor },
              ].map(s => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 22, color: Colors.text, lineHeight: 28 },
  headerSub: { fontSize: FontSize.xs, color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  scroll: { padding: 16, gap: 12 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  navArrow: { fontSize: 20, color: Colors.text },
  monthCenter: { alignItems: 'center' },
  monthName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  monthMeta: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekLabel: {
    flex: 1, textAlign: 'center',
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textFaint,
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  cellFilled: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDone: {
    backgroundColor: '#1A2A1A',
    borderWidth: 1,
    borderColor: Colors.green + '44',
  },
  cellToday: {
    backgroundColor: '#1A1A2A',
    borderWidth: 1,
    borderColor: Colors.pullColor + '44',
  },
  cellDay: { fontSize: 12, fontWeight: '400', color: Colors.textMuted },
  cellLabel: {
    fontSize: 6,
    color: Colors.green,
    fontWeight: '700',
    lineHeight: 8,
    marginTop: 1,
  },
  statsSection: { marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800' },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 3, textAlign: 'center' },
  legend: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, gap: 8 },
  legendTitle: {
    fontSize: FontSize.xs, color: Colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
});
