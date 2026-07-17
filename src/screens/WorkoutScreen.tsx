import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWorkout } from '../hooks/useWorkout';
import { useTimer } from '../contexts/TimerContext';
import { Colors, Radius, FontSize } from '../utils/theme';
import type { WorkoutDay, Exercise } from '../types';

function InfoIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 14, color }}>ℹ</Text>;
}
function TimerIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 14, color }}>⏱</Text>;
}

function ExerciseCard({
  exercise,
  dayColor,
  checked,
  onToggle,
  onLaunchTimer,
}: {
  exercise: Exercise;
  dayColor: string;
  checked: boolean;
  onToggle: () => void;
  onLaunchTimer: () => void;
}) {
  const [showTip, setShowTip] = useState(false);

  return (
    <View style={[
      styles.exCard,
      checked && { backgroundColor: '#1A2A1A', borderColor: Colors.green + '33', borderWidth: 1 },
    ]}>
      <View style={styles.exRow}>
        <TouchableOpacity onPress={onToggle} style={styles.checkBtn}>
          {checked
            ? <View style={styles.checkFilled}><Text style={styles.checkMark}>✓</Text></View>
            : <View style={styles.checkEmpty} />
          }
        </TouchableOpacity>

        <View style={styles.exInfo}>
          <Text style={[styles.exName, checked && { color: Colors.textFaint, textDecorationLine: 'line-through' }]}>
            {exercise.name}
          </Text>
          <View style={styles.exMeta}>
            <Text style={[styles.exSets, { color: dayColor }]}>{exercise.sets} séries</Text>
            <Text style={styles.exReps}>{exercise.reps} reps</Text>
            <Text style={styles.exRest}>⏱ {exercise.rest_seconds}s</Text>
          </View>
        </View>

        <View style={styles.exActions}>
          <TouchableOpacity onPress={onLaunchTimer} style={styles.iconBtn}>
            <TimerIcon color={Colors.textFaint} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowTip(v => !v)} style={styles.iconBtn}>
            <InfoIcon color={showTip ? dayColor : Colors.textFaint} />
          </TouchableOpacity>
        </View>
      </View>

      {showTip && exercise.tip && (
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>{exercise.tip}</Text>
        </View>
      )}
    </View>
  );
}

export function WorkoutScreen() {
  const navigation = useNavigation<any>();
  const { days, checks, todayCompletion, todayWorkout, loading, toggleCheck, completeWorkout } = useWorkout();
  const { launchTimer } = useTimer();
  const [activeDayIdx, setActiveDayIdx] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });
  const [justCompleted, setJustCompleted] = useState(false);

  const activeDay: WorkoutDay | undefined = days[activeDayIdx];
  const exercises = activeDay?.exercises ?? [];

  const checkedCount = exercises.filter(e => checks[e.id]).length;
  const total = exercises.length;
  const progress = total > 0 ? checkedCount / total : 0;
  const allDone = total > 0 && checkedCount === total;

  const isTodaySelected = activeDay?.weekday_index === ((() => {
    const d = new Date().getDay(); return d === 0 ? 6 : d - 1;
  })());
  const alreadyMarked = isTodaySelected && !!todayCompletion;

  const handleComplete = async () => {
    if (!activeDay) return;
    await completeWorkout(activeDay.id);
    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 3000);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.textMuted} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSub}>Push · Pull · Legs</Text>
          <Text style={styles.headerTitle}>Treinos</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Calendar')} style={styles.calBtn}>
          <Text style={styles.calBtnText}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {days.map((d, i) => (
          <TouchableOpacity
            key={d.id}
            onPress={() => setActiveDayIdx(i)}
            style={[styles.tab, activeDayIdx === i && { backgroundColor: d.color }]}
          >
            <Text style={[styles.tabDay, activeDayIdx === i && { color: '#fff' }]}>
              {d.weekday.slice(0, 3)}
            </Text>
            <Text style={[styles.tabLabel, activeDayIdx === i && { color: '#ffffffcc' }]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Day header card */}
        {activeDay && (
          <View style={[styles.dayCard, { borderLeftColor: activeDay.color }]}>
            <View style={styles.dayCardRow}>
              <View>
                <Text style={[styles.dayLabel, { color: activeDay.color }]}>{activeDay.label}</Text>
                <Text style={styles.dayMuscles}>{activeDay.muscles}</Text>
              </View>
              {!activeDay.is_rest && (
                <View style={styles.dayCount}>
                  <Text style={[styles.dayCountNum, { color: progress === 1 ? Colors.green : Colors.text }]}>
                    {checkedCount}/{total}
                  </Text>
                  <Text style={styles.dayCountLabel}>exercícios</Text>
                </View>
              )}
            </View>
            {!activeDay.is_rest && (
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: progress === 1 ? Colors.green : activeDay.color },
                ]} />
              </View>
            )}
          </View>
        )}

        {/* Rest day */}
        {activeDay?.is_rest && (
          <View style={styles.restCard}>
            <Text style={styles.restEmoji}>🧘</Text>
            <Text style={styles.restTitle}>Recuperação Ativa</Text>
            <Text style={styles.restDesc}>
              Caminhada leve, mobilidade articular ou alongamento.{'\n'}
              O crescimento muscular acontece no descanso.
            </Text>
          </View>
        )}

        {/* Exercises */}
        {!activeDay?.is_rest && exercises.map(ex => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            dayColor={activeDay?.color ?? Colors.text}
            checked={!!checks[ex.id]}
            onToggle={() => toggleCheck(ex.id, !!checks[ex.id])}
            onLaunchTimer={() => launchTimer(ex.name, ex.rest_seconds, activeDay?.color ?? Colors.pushColor)}
          />
        ))}

        {/* Complete button */}
        {!activeDay?.is_rest && (
          <View style={styles.completeSection}>
            {justCompleted ? (
              <View style={styles.successCard}>
                <Text style={styles.successEmoji}>✅</Text>
                <Text style={styles.successTitle}>Treino registrado!</Text>
                <Text style={styles.successSub}>Continue assim. Consistência é tudo.</Text>
              </View>
            ) : alreadyMarked ? (
              <View style={styles.alreadyCard}>
                <Text style={styles.alreadyText}>✓ Treino de hoje já registrado</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleComplete}
                disabled={!allDone}
                style={[
                  styles.completeBtn,
                  { backgroundColor: allDone ? (activeDay?.color ?? Colors.green) : Colors.card },
                ]}
              >
                <Text style={[styles.completeBtnText, { color: allDone ? '#fff' : Colors.textFaint }]}>
                  {allDone
                    ? '✓ Marcar treino como concluído'
                    : `Conclua todos os exercícios (${checkedCount}/${total})`
                  }
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!activeDay?.is_rest && (
          <Text style={styles.hint}>
            ⏱ Toque o relógio em cada exercício para lançar o cronômetro flutuante
          </Text>
        )}

        <View style={{ height: 120 }} />
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
  calBtn: {
    marginLeft: 'auto',
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  calBtnText: { fontSize: 18 },
  tabs: { paddingHorizontal: 16, paddingVertical: 8, gap: 6 },
  tab: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 56,
  },
  tabDay: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textFaint, textTransform: 'uppercase' },
  tabLabel: { fontSize: 9, color: Colors.textFaint, marginTop: 2, textTransform: 'uppercase' },
  scroll: { paddingHorizontal: 16, gap: 8, paddingTop: 4 },
  dayCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: 20,
    borderLeftWidth: 3,
  },
  dayCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dayLabel: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  dayMuscles: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 3 },
  dayCount: { alignItems: 'flex-end' },
  dayCountNum: { fontSize: FontSize.xxl, fontWeight: '800' },
  dayCountLabel: { fontSize: FontSize.xs, color: Colors.textFaint },
  progressBar: {
    height: 3, backgroundColor: Colors.border, borderRadius: 2,
    marginTop: 14, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  restCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: 32, alignItems: 'center',
  },
  restEmoji: { fontSize: 40, marginBottom: 12 },
  restTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  restDesc: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  exCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  exRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  checkBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  checkFilled: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: Colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  checkEmpty: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#444' },
  exInfo: { flex: 1 },
  exName: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text, lineHeight: 18 },
  exMeta: { flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  exSets: { fontSize: FontSize.sm, fontWeight: '700' },
  exReps: { fontSize: FontSize.sm, color: Colors.textMuted },
  exRest: { fontSize: FontSize.sm, color: Colors.textFaint },
  exActions: { flexDirection: 'row', gap: 2 },
  iconBtn: { padding: 7, borderRadius: 8 },
  tipBox: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  tipText: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 18 },
  completeSection: { marginTop: 8 },
  successCard: {
    backgroundColor: '#1A2A1A',
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.green + '44',
  },
  successEmoji: { fontSize: 28, marginBottom: 6 },
  successTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.green },
  successSub: { fontSize: FontSize.sm, color: Colors.textFaint, marginTop: 4 },
  alreadyCard: {
    backgroundColor: '#1A2A1A',
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.green + '22',
  },
  alreadyText: { fontSize: FontSize.sm, color: Colors.green, fontWeight: '600' },
  completeBtn: {
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'center',
  },
  completeBtnText: { fontSize: FontSize.base, fontWeight: '700' },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textFaint,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
});
