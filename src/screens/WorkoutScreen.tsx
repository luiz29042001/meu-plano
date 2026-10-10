import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useWorkout } from '../hooks/useWorkout';
import { useTimerActions } from '../contexts/TimerContext';
import { useTimerInsets } from '../hooks/useTimerInsets';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, LineHeight, Radius, Spacing, Touch, Tracking, numberLineHeight } from '../utils/theme';
import { getDayIndexBySlug } from '../utils/workoutSequence';
import { confirmAction } from '../utils/confirm';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton, OutlineButton, LinkButton } from '../components/Buttons';
import { DayHeadline } from '../components/DayHeadline';
import { ErrorBlock } from '../components/ErrorBlock';
import { Skeleton } from '../components/Skeleton';
import type { WorkoutDay, Exercise } from '../types';

type NoteStatus = 'idle' | 'saving' | 'saved' | 'error';

const TABS_HEIGHT = Touch.comfort;       // armadilha 7: altura fixa
const LONG_NUMBERS = 8;                  // "12–20/perna" cai de tamanho para caber
const LONG_NUMBERS_SIZE = Math.round(FontSize.display * 0.78);

const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  headerLink: { paddingHorizontal: Spacing.md },

  // Abas dos dias (armadilha 7: altura fixa, includeFontPadding false, 1 linha)
  tabsWrap: { height: TABS_HEIGHT, borderBottomWidth: 1, borderBottomColor: c.border },
  tabs: { paddingHorizontal: Spacing.sm, alignItems: 'stretch' },
  tab: {
    height: TABS_HEIGHT, paddingHorizontal: Spacing.lg, justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: Spacing.sm,
  },
  tabText: {
    fontFamily: Font.condSemi, fontSize: FontSize.lg, color: c.textMuted, textTransform: 'uppercase',
    letterSpacing: Tracking.caps, includeFontPadding: false, textAlignVertical: 'center',
    lineHeight: LineHeight.base,
  },
  tabTextActive: { color: c.text },
  tabUnderline: { position: 'absolute', left: Spacing.sm, right: Spacing.sm, bottom: 0, height: 3 },
  nextDot: { width: 6, height: 6, borderRadius: Radius.pill },

  // Manchete + contador
  count: { alignItems: 'flex-end' },
  countNum: {
    fontFamily: Font.condBold, fontSize: FontSize.xxxl, lineHeight: numberLineHeight(FontSize.xxxl),
    letterSpacing: Tracking.tight, color: c.text, includeFontPadding: false, fontVariant: ['tabular-nums'],
  },
  countNumDone: { color: c.green },
  countLabel: { fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted },
  bar: { height: 4, backgroundColor: c.surface, borderRadius: Radius.pill, marginTop: Spacing.lg, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.pill },

  // Lista
  list: { marginTop: Spacing.xl, borderTopWidth: 1, borderTopColor: c.border },
  row: {
    minHeight: Touch.primary, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  rowHover: { backgroundColor: c.cardHover },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowName: { flex: 1, fontFamily: Font.body, fontSize: FontSize.base, color: c.text, paddingVertical: Spacing.md },
  rowNameDone: { color: c.textFaint },
  rowSets: {
    fontFamily: Font.condSemi, fontSize: FontSize.xl, color: c.text, includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  doneTitle: { fontFamily: Font.condSemi, fontSize: FontSize.xl, color: c.text, includeFontPadding: false },
  doneNames: { fontFamily: Font.body, fontSize: FontSize.sm, color: c.textFaint },
  doneText: { flex: 1 },
  check: { width: Touch.primary, height: Touch.primary, alignItems: 'center', justifyContent: 'center' },
  checkBox: {
    width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: c.borderStrong,
  },
  checkBoxOn: { backgroundColor: c.green, borderColor: c.green },
  checkMark: { fontFamily: Font.bodySemi, fontSize: FontSize.base, color: c.onGreen, includeFontPadding: false },

  // Exercício atual
  current: { paddingTop: Spacing.xl, paddingBottom: Spacing.xl, borderBottomWidth: 1, borderBottomColor: c.border },
  pos: { fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, marginBottom: Spacing.xs },
  curRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  curName: { flex: 1, fontFamily: Font.bodySemi, fontSize: FontSize.lg, color: c.text, lineHeight: LineHeight.xl, paddingTop: Spacing.sm },
  big: {
    fontFamily: Font.condBold, color: c.text, includeFontPadding: false,
    letterSpacing: Tracking.tighter, fontVariant: ['tabular-nums'],
  },
  bigLabel: { fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted, marginTop: Spacing.xs },
  notePreview: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, lineHeight: LineHeight.md },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg, flexWrap: 'wrap' },
  restBtn: { alignSelf: 'auto', paddingHorizontal: Spacing.lg },
  tipBox: { marginTop: Spacing.md, borderLeftWidth: 3, borderLeftColor: c.border, paddingLeft: Spacing.md },
  tipText: { fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, lineHeight: LineHeight.md },
  noteBox: { marginTop: Spacing.md },
  noteLabel: { fontFamily: Font.bodyMedium, fontSize: FontSize.md, color: c.textMuted, marginBottom: Spacing.sm },
  noteInput: {
    minHeight: 96, backgroundColor: c.surface, borderRadius: Radius.sm, color: c.text,
    fontFamily: Font.body, fontSize: FontSize.base, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    lineHeight: LineHeight.base,
  },
  noteFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, marginTop: Spacing.md },
  noteStatus: { flex: 1, fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted },
  noteStatusOk: { color: c.green },
  noteStatusErr: { color: c.red },
  noteSave: { alignSelf: 'auto', minWidth: 120 },

  // Concluir
  completeSection: { marginTop: Spacing.xxl, gap: Spacing.md },
  doneMsg: { fontFamily: Font.bodySemi, fontSize: FontSize.base, color: c.text },
  doneMsgOk: { color: c.green },
  saveErrorText: { fontFamily: Font.body, fontSize: FontSize.md, color: c.red, lineHeight: LineHeight.md },
  restCard: { marginTop: Spacing.xl, gap: Spacing.sm },
  restTitle: { fontFamily: Font.condSemi, fontSize: FontSize.xl, color: c.text, textTransform: 'uppercase', letterSpacing: Tracking.caps },
  restDesc: { fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted, lineHeight: LineHeight.base },

  stateWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl, gap: Spacing.lg },
  stateText: { fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted, lineHeight: LineHeight.base },
  skelGap: { marginTop: Spacing.lg },
}));

function Check({
  checked, onPress, label,
}: { checked: boolean; onPress: () => void; label: string }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={styles.check}
    >
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
        {checked ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

function CurrentExercise({
  exercise, index, total, checked, onToggle, onLaunchTimer, note, onSaveNote, draftText, onDraftChange,
}: {
  exercise: Exercise;
  index: number;
  total: number;
  checked: boolean;
  onToggle: () => void;
  onLaunchTimer: () => void;
  note: string;
  onSaveNote: (text: string) => Promise<boolean>;
  /** Rascunho não salvo (undefined = sem rascunho, vale a anotação salva). */
  draftText: string | undefined;
  onDraftChange: (text: string | undefined) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [showTip, setShowTip] = useState(false);
  const [showNote, setShowNote] = useState(draftText !== undefined);
  const draft = draftText ?? note;
  const [status, setStatus] = useState<NoteStatus>('idle');
  const hasNote = note.length > 0;
  const dirty = draft.trim() !== note;

  const openNote = () => {
    setShowTip(false);
    setShowNote(v => {
      if (!v) setStatus('idle');
      return !v;
    });
  };

  const save = async () => {
    if (status === 'saving') return;
    setStatus('saving');
    const ok = await onSaveNote(draft);
    setStatus(ok ? 'saved' : 'error');
    if (ok) onDraftChange(undefined);
    if (ok) setTimeout(() => setStatus(s => (s === 'saved' ? 'idle' : s)), 2000);
  };

  const numbers = `${exercise.sets} × ${exercise.reps}`;
  const bigSize = numbers.length > LONG_NUMBERS ? LONG_NUMBERS_SIZE : FontSize.display;

  const statusText =
    status === 'saving' ? 'Salvando…'
      : status === 'saved' ? 'Salvo'
        : status === 'error' ? 'Não foi possível salvar. Tente de novo.'
          : draft.trim() === '' && hasNote ? 'Salvar em branco apaga a anotação'
            : '';

  return (
    <View style={styles.current}>
      <Text style={styles.pos}>Exercício {index} de {total}</Text>
      <View style={styles.curRow}>
        <Text style={styles.curName}>{exercise.name}</Text>
        <Check checked={checked} onPress={onToggle} label={`Marcar ${exercise.name} como feito`} />
      </View>
      <Text
        style={[styles.big, { fontSize: bigSize, lineHeight: numberLineHeight(bigSize) }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
      >
        {numbers}
      </Text>
      <Text style={styles.bigLabel}>séries × repetições</Text>
      {hasNote && !showNote && (
        <Text style={styles.notePreview} numberOfLines={2}>Anotação: {note}</Text>
      )}

      <View style={styles.actions}>
        <OutlineButton
          label={`Descanso ${exercise.rest_seconds} s`}
          accessibilityLabel={`Iniciar descanso de ${exercise.rest_seconds} segundos`}
          onPress={onLaunchTimer}
          style={styles.restBtn}
        />
        <LinkButton label={showNote ? 'Fechar anotação' : 'Anotar'} onPress={openNote} />
        {!!exercise.tip && (
          <LinkButton
            label="Como fazer"
            onPress={() => { setShowNote(false); setShowTip(v => !v); }}
          />
        )}
      </View>

      {showTip && !!exercise.tip && (
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
            onChangeText={t => { onDraftChange(t); if (status !== 'saving') setStatus('idle'); }}
            placeholder="Ex.: 12 kg por lado · subir carga na próxima · pegada fechada"
            placeholderTextColor={colors.textFaint}
            multiline
            maxLength={2000}
            textAlignVertical="top"
            accessibilityLabel="Anotação deste exercício"
          />
          <View style={styles.noteFooter}>
            <Text
              style={[
                styles.noteStatus,
                status === 'error' && styles.noteStatusErr,
                status === 'saved' && styles.noteStatusOk,
              ]}
            >
              {statusText}
            </Text>
            <OutlineButton
              label="Salvar"
              onPress={save}
              disabled={!dirty || status === 'saving'}
              style={styles.noteSave}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function CompactRow({
  exercise, checked, onToggle, onFocus,
}: { exercise: Exercise; checked: boolean; onToggle: () => void; onFocus: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onFocus}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${exercise.name}`}
        style={({ pressed }) => [styles.rowMain, pressed && styles.rowHover]}
      >
        <Text style={[styles.rowName, checked && styles.rowNameDone]} numberOfLines={2}>{exercise.name}</Text>
        <Text style={[styles.rowSets, checked && styles.rowNameDone]}>{exercise.sets} × {exercise.reps}</Text>
      </Pressable>
      <Check
        checked={checked}
        onPress={onToggle}
        label={checked ? `Desmarcar ${exercise.name}` : `Marcar ${exercise.name} como feito`}
      />
    </View>
  );
}

export function WorkoutScreen() {
  const styles = useStyles();
  const { colors, dayColor } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const requestedSlug: string | undefined = route.params?.daySlug;
  const {
    days, checks, todayCompletion, nextWorkout,
    status, error, retry, saveError, checkError, toggleCheck, completeWorkout, notes, saveNote,
  } = useWorkout();
  const { launchTimer } = useTimerActions();
  const timerInsets = useTimerInsets();
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
  const [focusId, setFocusId] = useState<number | null>(null);
  const [showDone, setShowDone] = useState(false);
  // Rascunhos de anotação por exercício: sobrevivem a marcar o exercício ou abrir outro.
  const [drafts, setDrafts] = useState<Record<number, string>>({});

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

  const doComplete = async () => {
    if (!activeDay || saving) return;
    setSaving(true);
    const ok = await completeWorkout(activeDay.id);
    setSaving(false);
    if (ok) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 3000);
    }
  };

  const handleComplete = () => {
    if (!activeDay || saving) return;
    // Já existe outro treino registrado hoje: concluir aqui substitui aquele.
    if (todayCompletion && todayCompletion.workout_day_id !== activeDay.id) {
      const otherLabel = todayCompletion.workout_day?.label ?? 'outro treino';
      confirmAction(
        'Substituir o treino de hoje?',
        `Hoje já foi registrado: ${otherLabel}. Concluir este treino substitui o registro anterior.`,
        'Substituir',
        () => { doComplete(); },
      );
      return;
    }
    doComplete();
  };

  const calendarLink = (
    <LinkButton
      label="Calendário"
      accessibilityLabel="Abrir calendário"
      onPress={() => navigation.navigate('Calendar')}
      style={styles.headerLink}
    />
  );

  // Espaço para o cronômetro: em cima (entre o cabeçalho e as abas) ou embaixo da lista.
  const topSpacer = timerInsets.top > 0 ? <View style={{ height: timerInsets.top }} /> : null;

  if (status === 'loading' || status === 'error' || status === 'empty') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Treinos" subtitle={programName} />
        {topSpacer}
        {status === 'loading' ? (
          <View style={styles.stateWrap}>
            <Skeleton width={220} height={64} />
            <Skeleton height={4} />
            <Skeleton height={160} style={styles.skelGap} />
            <Skeleton height={56} />
            <Skeleton height={56} />
          </View>
        ) : (
          <View style={styles.stateWrap}>
            {status === 'error' ? (
              <ErrorBlock
                title="Não foi possível carregar seu treino."
                cause={error}
                onRetry={retry}
              />
            ) : (
              <>
                <Text style={styles.stateText}>Você ainda não tem um programa de treino.</Text>
                <LinkButton label="Voltar ao início" onPress={() => navigation.navigate('Home')} />
              </>
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  const done = exercises.filter(e => checks[e.id]);
  const pending = exercises.filter(e => !checks[e.id]);
  const focused = focusId != null ? exercises.find(e => e.id === focusId) : undefined;
  const current = focused ?? pending[0];
  const doneRows = done.filter(e => e.id !== current?.id);
  const nextRows = pending.filter(e => e.id !== current?.id);
  const accent = activeDay ? dayColor(activeDay.color) : colors.restColor;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Treinos" subtitle={programName} right={calendarLink} />
      {topSpacer}

      {/* Abas dos dias */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {days.map((d, i) => {
            const active = resolvedIdx === i;
            const isNext = nextWorkout?.slug === d.slug;
            const c = dayColor(d.color);
            return (
              <Pressable
                key={d.id}
                onPress={() => { setActiveDayIdx(i); setJustCompleted(false); setFocusId(null); setShowDone(false); }}
                accessibilityRole="button"
                accessibilityLabel={`${d.label}${isNext ? ', próximo treino' : ''}`}
                accessibilityState={{ selected: active }}
                style={styles.tab}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                  {d.label}
                </Text>
                {isNext && !active && <View style={[styles.nextDot, { backgroundColor: c }]} />}
                {active && <View style={[styles.tabUnderline, { backgroundColor: c }]} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: timerInsets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeDay && (
          <View>
            <DayHeadline
              label={activeDay.label}
              color={accent}
              size="display"
              muscles={activeDay.muscles}
              tag={alreadyMarked ? 'Feito hoje' : undefined}
              right={!activeDay.is_rest ? (
                <View style={styles.count} accessible accessibilityLabel={`${checkedCount} de ${total} exercícios feitos`}>
                  <Text style={[styles.countNum, progress === 1 && styles.countNumDone]} maxFontSizeMultiplier={1.2}>
                    {checkedCount}/{total}
                  </Text>
                  <Text style={styles.countLabel}>exercícios</Text>
                </View>
              ) : undefined}
            />
            {!activeDay.is_rest && (
              <View style={styles.bar}>
                <View style={[styles.barFill, {
                  width: `${progress * 100}%`,
                  backgroundColor: progress === 1 ? colors.green : accent,
                }]} />
              </View>
            )}
          </View>
        )}

        {activeDay?.is_rest && (
          <View style={styles.restCard}>
            <Text style={styles.restTitle}>Recuperação ativa</Text>
            <Text style={styles.restDesc}>
              Caminhada leve, mobilidade articular ou alongamento.{'\n'}
              O crescimento muscular acontece no descanso.
            </Text>
          </View>
        )}

        {!activeDay?.is_rest && (
          <View style={styles.list}>
            {/* Feitos recolhidos */}
            {doneRows.length > 0 && (
              <>
                <View style={styles.row}>
                  <View style={[styles.checkBox, styles.checkBoxOn, { marginLeft: Spacing.md }]}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                  <View style={styles.doneText}>
                    <Text style={styles.doneTitle}>
                      {doneRows.length} {doneRows.length === 1 ? 'feito' : 'feitos'}
                    </Text>
                    {!showDone && (
                      <Text style={styles.doneNames} numberOfLines={1}>
                        {doneRows.map(e => e.name).join(', ')}
                      </Text>
                    )}
                  </View>
                  <LinkButton
                    label={showDone ? 'Recolher' : 'Ver'}
                    accessibilityLabel={showDone ? 'Recolher exercícios feitos' : 'Ver exercícios feitos'}
                    onPress={() => setShowDone(v => !v)}
                  />
                </View>
                {showDone && doneRows.map(ex => (
                  <CompactRow
                    key={ex.id}
                    exercise={ex}
                    checked
                    onToggle={() => toggleCheck(ex.id, true)}
                    onFocus={() => setFocusId(ex.id)}
                  />
                ))}
              </>
            )}

            {/* Exercício atual */}
            {current && (
              <CurrentExercise
                key={current.id}
                exercise={current}
                index={exercises.findIndex(e => e.id === current.id) + 1}
                total={total}
                checked={!!checks[current.id]}
                onToggle={() => {
                  const was = !!checks[current.id];
                  toggleCheck(current.id, was);
                  setFocusId(null);
                }}
                onLaunchTimer={() => launchTimer(current.name, current.rest_seconds, activeDay?.color ?? '')}
                note={notes[current.id] ?? ''}
                onSaveNote={text => saveNote(current.id, text)}
                draftText={drafts[current.id]}
                onDraftChange={t => setDrafts(prev => {
                  const next = { ...prev };
                  if (t === undefined) delete next[current.id]; else next[current.id] = t;
                  return next;
                })}
              />
            )}

            {/* Próximos */}
            {nextRows.map(ex => (
              <CompactRow
                key={ex.id}
                exercise={ex}
                checked={false}
                onToggle={() => toggleCheck(ex.id, false)}
                onFocus={() => setFocusId(ex.id)}
              />
            ))}
          </View>
        )}

        {!activeDay?.is_rest && (
          <View style={styles.completeSection}>
            {justCompleted ? (
              <Text style={[styles.doneMsg, styles.doneMsgOk]}>Treino registrado! Continue assim.</Text>
            ) : alreadyMarked ? (
              <Text style={styles.doneMsg}>Treino de hoje concluído.</Text>
            ) : (
              <PrimaryButton
                label={
                  saving
                    ? 'Salvando…'
                    : allDone ? 'Marcar como concluído' : `Conclua os exercícios (${checkedCount}/${total})`
                }
                onPress={handleComplete}
                disabled={!allDone || saving}
              />
            )}
            {checkError && (
              <Text style={styles.saveErrorText} accessibilityLiveRegion="polite">{checkError}</Text>
            )}
            {saveError && !justCompleted && (
              <Text style={styles.saveErrorText}>{saveError}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
