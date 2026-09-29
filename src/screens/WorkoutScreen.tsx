import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useWorkout } from '../hooks/useWorkout';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Radius, FontSize, Spacing } from '../utils/theme';
import { getDayIndexBySlug } from '../utils/workoutSequence';
import type { WorkoutDay, Exercise } from '../types';

type NoteStatus = 'idle' | 'saving' | 'saved' | 'error';

function ExerciseCard({
  exercise, dayColor, checked, onToggle, onLaunchTimer, note, onSaveNote,
}: {
  exercise: Exercise;
  dayColor: string;
  checked: boolean;
  onToggle: () => void;
  onLaunchTimer: () => void;
  note: string;
  onSaveNote: (text: string) => Promise<boolean>;
}) {
  const [showTip, setShowTip] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [draft, setDraft] = useState(note);
  const [status, setStatus] = useState<NoteStatus>('idle');
  const hasNote = note.length > 0;
  const dirty = draft.trim() !== note;

  const openNote = () => {
    setShowTip(false);
    setShowNote(v => {
      if (!v) { setDraft(note); setStatus('idle'); }
      return !v;
    });
  };

  const save = async () => {
    if (status === 'saving') return;
    setStatus('saving');
    const ok = await onSaveNote(draft);
    setStatus(ok ? 'saved' : 'error');
    if (ok) setTimeout(() => setStatus(s => (s === 'saved' ? 'idle' : s)), 2000);
  };

  return (
    <View style={[styles.exCard, checked && styles.exCardDone]}>
      <View style={styles.exRow}>
        <TouchableOpacity onPress={onToggle} style={styles.checkBtn}>
          {checked
            ? <View style={styles.checkFilled}><Text style={styles.checkMark}>✓</Text></View>
            : <View style={styles.checkEmpty} />}
        </TouchableOpacity>
        <View style={styles.exInfo}>
          <Text style={[styles.exName, checked && styles.exNameDone]}>{exercise.name}</Text>
          <View style={styles.exMeta}>
            <Text style={[styles.exSets, { color: dayColor }]}>{exercise.sets} séries</Text>
            <Text style={styles.exReps}>{exercise.reps} reps</Text>
            <Text style={styles.exRest}>⏱ {exercise.rest_seconds}s</Text>
          </View>
          {hasNote && !showNote && (
            <Text style={styles.notePreview} numberOfLines={2}>📝 {note}</Text>
          )}
        </View>
        <View style={styles.exActions}>
          <TouchableOpacity onPress={onLaunchTimer} style={styles.iconBtn}>
            <Text style={{ fontSize: 16, color: Colors.textMuted }}>⏱</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openNote} style={[styles.iconBtn, showNote && { backgroundColor: dayColor + '22' }]}>
            <Text style={{ fontSize: 15, color: showNote || hasNote ? dayColor : Colors.textMuted }}>✎</Text>
            {hasNote && !showNote && <View style={[styles.noteDot, { backgroundColor: dayColor }]} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowNote(false); setShowTip(v => !v); }} style={styles.iconBtn}>
            <Text style={{ fontSize: 16, color: showTip ? dayColor : Colors.textMuted }}>ⓘ</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showTip && exercise.tip && (
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>{exercise.tip}</Text>
        </View>
      )}
      {showNote && (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Anotação deste exercício</Text>
          <TextInput
            style={styles.noteInput}
            value={draft}
            onChangeText={t => { setDraft(t); if (status !== 'saving') setStatus('idle'); }}
            placeholder="Ex.: 12 kg por lado · subir carga na próxima · pegada fechada"
            placeholderTextColor={Colors.textFaint}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          <View style={styles.noteFooter}>
            <Text style={[styles.noteStatus, status === 'error' && { color: Colors.red }, status === 'saved' && { color: Colors.green }]}>
              {status === 'saving' ? 'Salvando…'
                : status === 'saved' ? '✓ Salvo'
                : status === 'error' ? 'Não foi possível salvar. Tente de novo.'
                : draft.trim() === '' && hasNote ? 'Salvar em branco apaga a anotação'
                : ''}
            </Text>
            <TouchableOpacity
              onPress={save}
              disabled={!dirty || status === 'saving'}
              style={[styles.noteSaveBtn, { backgroundColor: dirty ? Colors.green : Colors.surface }]}
            >
              <Text style={[styles.noteSaveText, { color: dirty ? '#000' : Colors.textFaint }]}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export function WorkoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const requestedSlug: string | undefined = route.params?.daySlug;
  const {
    days, checks, todayCompletion, nextWorkout,
    loading, toggleCheck, completeWorkout, notes, saveNote,
  } = useWorkout();
  const { launchTimer } = useTimer();
  const { profile } = useAuth();
  const programName = profile?.program?.name ?? 'Meu treino';

  // Seleção do treino ativo, nesta ordem de prioridade:
  // 1) daySlug vindo por navegação (ex: card "Próximo treino" da Home)
  // 2) próximo treino da sequência PPL (fallback quando se chega sem parâmetro)
  // O usuário pode sempre trocar manualmente nas abas depois.
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  // Guarda o último slug já aplicado, para re-sincronizar caso a Home mande
  // um slug diferente em uma nova navegação (tela permanece montada na stack).
  const [appliedSlug, setAppliedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (days.length === 0) return;

    if (requestedSlug && requestedSlug !== appliedSlug) {
      setActiveDayIdx(getDayIndexBySlug(days, requestedSlug));
      setAppliedSlug(requestedSlug);
      return;
    }

    if (!requestedSlug && activeDayIdx === null) {
      setActiveDayIdx(nextWorkout ? getDayIndexBySlug(days, nextWorkout.slug) : 0);
    }
  }, [days, nextWorkout, requestedSlug, appliedSlug, activeDayIdx]);

  const resolvedIdx = activeDayIdx ?? 0;
  const activeDay: WorkoutDay | undefined = days[resolvedIdx];
  const exercises = activeDay?.exercises ?? [];

  const checkedCount = exercises.filter(e => checks[e.id]).length;
  const total = exercises.length;
  const progress = total > 0 ? checkedCount / total : 0;
  const allDone = total > 0 && checkedCount === total;

  const alreadyMarked = !!todayCompletion && todayCompletion.workout_day_id === activeDay?.id;

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const handleComplete = async () => {
    if (!activeDay || saving) return;
    setSaving(true);
    setSaveError(false);
    const ok = await completeWorkout(activeDay.id);
    setSaving(false);
    if (ok) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 3000);
    } else {
      setSaveError(true);
    }
  };

  if (loading || activeDayIdx === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator color={Colors.textMuted} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSub}>{programName}</Text>
          <Text style={styles.headerTitle}>Treinos</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Calendar')} style={styles.calBtn}>
          <Text style={styles.calBtnText}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* Day tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {days.map((d, i) => {
          const active = resolvedIdx === i;
          const isNext = nextWorkout?.slug === d.slug;
          return (
            <TouchableOpacity
              key={d.id}
              onPress={() => { setActiveDayIdx(i); setJustCompleted(false); }}
              style={[styles.tab, active && { backgroundColor: d.color }]}
            >
              <Text style={[styles.tabDay, active && styles.tabActiveText]} numberOfLines={1}>
                {d.label}
              </Text>
              {isNext && !active && <View style={[styles.nextDot, { backgroundColor: d.color }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {activeDay && (
          <View style={styles.dayCard}>
            <View style={[styles.dayAccent, { backgroundColor: activeDay.color }]} />
            <View style={styles.dayCardContent}>
              <View style={styles.dayCardRow}>
                <View style={{ flex: 1 }}>
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
                  <View style={[styles.progressFill, {
                    width: `${progress * 100}%`,
                    backgroundColor: progress === 1 ? Colors.green : activeDay.color,
                  }]} />
                </View>
              )}
            </View>
          </View>
        )}

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

        {!activeDay?.is_rest && exercises.map(ex => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            dayColor={activeDay?.color ?? Colors.text}
            checked={!!checks[ex.id]}
            onToggle={() => toggleCheck(ex.id, !!checks[ex.id])}
            onLaunchTimer={() => launchTimer(ex.name, ex.rest_seconds, activeDay?.color ?? Colors.pushColor)}
            note={notes[ex.id] ?? ''}
            onSaveNote={text => saveNote(ex.id, text)}
          />
        ))}

        {!activeDay?.is_rest && (
          <View style={styles.completeSection}>
            {justCompleted ? (
              <View style={styles.successCard}>
                <Text style={styles.successEmoji}>✅</Text>
                <Text style={styles.successTitle}>Treino registrado!</Text>
                <Text style={styles.successSub}>Continue assim.</Text>
              </View>
            ) : alreadyMarked ? (
              <View style={styles.alreadyCard}>
                <Text style={styles.alreadyText}>✓ Treino de hoje já registrado</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleComplete}
                disabled={!allDone || saving}
                style={[styles.completeBtn, { backgroundColor: allDone ? Colors.green : Colors.surface }]}
              >
                <Text style={[styles.completeBtnText, { color: allDone ? '#000' : Colors.textFaint }]}>
                  {saving
                    ? 'Salvando…'
                    : allDone ? '✓ Marcar como concluído' : `Conclua os exercícios (${checkedCount}/${total})`}
                </Text>
              </TouchableOpacity>
            )}
            {saveError && !justCompleted && (
              <Text style={styles.saveErrorText}>
                Não foi possível salvar agora. Verifique a conexão e toque novamente.
              </Text>
            )}
          </View>
        )}

        {!activeDay?.is_rest && (
          <Text style={styles.hint}>
            ⏱ Toque o relógio em cada exercício para o cronômetro flutuante
          </Text>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  notePreview: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 6, lineHeight: 17 },
  noteDot: { position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: 3 },
  noteBox: { borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  noteLabel: { fontSize: FontSize.xs, color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  noteInput: {
    minHeight: 76, backgroundColor: Colors.bgElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, fontSize: FontSize.base, paddingHorizontal: 12, paddingVertical: 10, lineHeight: 20,
  },
  noteFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 10 },
  noteStatus: { flex: 1, fontSize: FontSize.sm, color: Colors.textFaint },
  noteSaveBtn: { borderRadius: Radius.pill, paddingHorizontal: 20, paddingVertical: 9 },
  noteSaveText: { fontSize: FontSize.md, fontWeight: '700' },
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, gap: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.pill, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 24, color: Colors.text, lineHeight: 28 },
  headerSub: { fontSize: FontSize.xs, color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  calBtn: {
    marginLeft: 'auto', width: 40, height: 40, borderRadius: Radius.pill, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  calBtnText: { fontSize: 18 },
  tabs: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    paddingRight: Spacing.xxl,
    alignItems: 'center',
  },
  tab: {
    height: 40,
    backgroundColor: Colors.card,
    borderRadius: Radius.pill,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabDay: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textMuted,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
  },
  tabActiveText: { color: '#000' },
  nextDot: { width: 6, height: 6, borderRadius: 3 },
  scroll: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingTop: Spacing.xs },
  dayCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    flexDirection: 'row', overflow: 'hidden',
  },
  dayAccent: { width: 4, alignSelf: 'stretch' },
  dayCardContent: { flex: 1, padding: Spacing.xl },
  dayCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dayLabel: { fontSize: FontSize.xl, fontWeight: '800', letterSpacing: -0.5 },
  dayMuscles: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: 3 },
  dayCount: { alignItems: 'flex-end' },
  dayCountNum: { fontSize: FontSize.xxl, fontWeight: '800' },
  dayCountLabel: { fontSize: FontSize.xs, color: Colors.textFaint },
  progressBar: { height: 4, backgroundColor: Colors.surface, borderRadius: 2, marginTop: Spacing.lg, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  restCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: 32, alignItems: 'center' },
  restEmoji: { fontSize: 40, marginBottom: 12 },
  restTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  restDesc: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  exCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, overflow: 'hidden' },
  exCardDone: { backgroundColor: Colors.bgElevated },
  exRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  checkBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  checkFilled: {
    width: 24, height: 24, borderRadius: Radius.pill, backgroundColor: Colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#000', fontSize: 13, fontWeight: '700' },
  checkEmpty: { width: 24, height: 24, borderRadius: Radius.pill, borderWidth: 2, borderColor: Colors.surface },
  exInfo: { flex: 1 },
  exName: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text, lineHeight: 19 },
  exNameDone: { color: Colors.textFaint, textDecorationLine: 'line-through' },
  exMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: 4, flexWrap: 'wrap' },
  exSets: { fontSize: FontSize.sm, fontWeight: '700' },
  exReps: { fontSize: FontSize.sm, color: Colors.textMuted },
  exRest: { fontSize: FontSize.sm, color: Colors.textFaint },
  exActions: { flexDirection: 'row', gap: 2 },
  iconBtn: { padding: 8, borderRadius: Radius.sm },
  tipBox: { borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  tipText: { fontSize: FontSize.md, color: Colors.textMuted, lineHeight: 20 },
  completeSection: { marginTop: Spacing.sm },
  successCard: {
    backgroundColor: Colors.bgElevated, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.green + '44',
  },
  successEmoji: { fontSize: 28, marginBottom: 6 },
  successTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.green },
  successSub: { fontSize: FontSize.md, color: Colors.textFaint, marginTop: 4 },
  alreadyCard: {
    backgroundColor: Colors.bgElevated, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.green + '22',
  },
  alreadyText: { fontSize: FontSize.md, color: Colors.green, fontWeight: '600' },
  completeBtn: { borderRadius: Radius.pill, padding: Spacing.lg, alignItems: 'center' },
  saveErrorText: {
    fontSize: FontSize.sm, color: Colors.red, textAlign: 'center', marginTop: 10, lineHeight: 18,
  },
  completeBtnText: { fontSize: FontSize.base, fontWeight: '700' },
  hint: { fontSize: FontSize.sm, color: Colors.textFaint, textAlign: 'center', lineHeight: 18, marginTop: 4 },
});
