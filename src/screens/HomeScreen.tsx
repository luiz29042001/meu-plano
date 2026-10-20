import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useWorkout } from '../hooks/useWorkout';
import { useTheme, makeStyles } from '../contexts/ThemeContext';
import { MONTH_NAMES, todayISO } from '../utils/date';
import { Font, FontSize, LineHeight, Radius, Spacing, Touch, Tracking } from '../utils/theme';
import { PrimaryButton, OutlineButton } from '../components/Buttons';
import { DayHeadline } from '../components/DayHeadline';
import { NumbersRow } from '../components/NumbersRow';
import { ErrorBlock } from '../components/ErrorBlock';
import { Skeleton } from '../components/Skeleton';
import { Notice } from '../components/Notice';
import { WeekStrip } from '../components/WeekStrip';
import { useOnline } from '../hooks/useOnline';
import { useTimerInsets } from '../hooks/useTimerInsets';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const SECONDS_PER_SET = 45; // execução da série, para a estimativa de minutos

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function todayLabel(): string {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()}.`;
}

const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: Touch.min },
  brand: {
    fontFamily: Font.condBold, fontSize: FontSize.xl, color: c.text,
    textTransform: 'uppercase', letterSpacing: Tracking.caps, includeFontPadding: false,
  },
  avatar: {
    width: Touch.min, height: Touch.min, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border, borderRadius: Radius.sm,
  },
  avatarHover: { backgroundColor: c.cardHover },
  avatarText: {
    fontFamily: Font.condSemi, fontSize: FontSize.title, color: c.text, includeFontPadding: false, textTransform: 'uppercase',
  },
  hello: { marginTop: Spacing.xs, fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted },
  block: { marginTop: Spacing.xxxl },
  gap: { marginTop: Spacing.xl },
  note: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted },
  emptyText: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted, lineHeight: LineHeight.base },
  list: { marginTop: Spacing.xxxl, borderTopWidth: 1, borderTopColor: c.border },
  row: {
    minHeight: Touch.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  rowHover: { backgroundColor: c.cardHover },
  rowLabel: { fontFamily: Font.bodyMedium, fontSize: FontSize.base, color: c.text },
  rowRight: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.sm },
  rowValue: { flexShrink: 1, textAlign: 'right', fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted },
  rowValueFaint: { color: c.textFaint },
  chevron: { fontFamily: Font.condMedium, fontSize: FontSize.xl, color: c.textMuted, includeFontPadding: false },
  kicker: { fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted, marginBottom: Spacing.md },
  weekNums: { marginTop: Spacing.xl },
  notice: { marginTop: Spacing.lg },
  retry: { marginTop: Spacing.lg },
}));

function ListRow({
  label, value, onPress, faint,
}: { label: string; value: string; onPress?: () => void; faint?: boolean }) {
  const styles = useStyles();
  const content = (
    <>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, faint && styles.rowValueFaint]} numberOfLines={2}>{value}</Text>
        {onPress ? <Text style={styles.chevron}>›</Text> : null}
      </View>
    </>
  );
  if (!onPress) {
    return <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowHover]}
    >
      {content}
    </Pressable>
  );
}

export function HomeScreen() {
  const styles = useStyles();
  const { colors, dayColor } = useTheme();
  const navigation = useNavigation<any>();
  const { profile } = useAuth();
  const {
    status, error, retry, nextWorkout, lastCompletion, todayCompletion,
    weekDone, weekGoal, weekDays, weekDoneDates,
  } = useWorkout({ refreshOnFocus: true });
  const online = useOnline();
  const timerInsets = useTimerInsets();

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Atleta';

  // Números do próximo treino (estimativa, só para dar noção ao usuário)
  const exercises = nextWorkout?.exercises ?? [];
  const setsTotal = exercises.reduce((s, e) => s + (parseInt(e.sets, 10) || 0), 0);
  const minutes = Math.round(
    exercises.reduce((s, e) => s + (parseInt(e.sets, 10) || 0) * (e.rest_seconds + SECONDS_PER_SET), 0) / 60,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: timerInsets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {timerInsets.top > 0 && <View style={{ height: timerInsets.top }} />}
        {/* Topo */}
        <View style={styles.header}>
          <Text style={styles.brand} accessibilityRole="header">Meu Plano</Text>
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil e ajustes"
            style={({ pressed }) => [styles.avatar, pressed && styles.avatarHover]}
          >
            <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() ?? '?'}</Text>
          </Pressable>
        </View>
        <Text style={styles.hello}>{greeting()}, {firstName}. {todayLabel()}</Text>
        {!online && status === 'ready' && (
          <View style={styles.notice}>
            <Notice tone="neutral" text="Sem internet. Mostrando o último treino carregado." />
          </View>
        )}

        {/* Próximo treino (definido pelo último concluído, não pelo dia) */}
        {status === 'loading' && (
          <View style={styles.block}>
            <Skeleton width={220} height={64} />
            <Skeleton height={88} style={styles.gap} />
            <Skeleton height={56} style={styles.gap} />
          </View>
        )}

        {status === 'error' && (
          <View style={styles.block}>
            <ErrorBlock
              title="Não foi possível carregar seu treino."
              cause={error ?? 'Confira a internet.'}
              onRetry={retry}
            />
          </View>
        )}

        {status === 'empty' && (
          <View style={styles.block}>
            <DayHeadline label="Sem programa" color={colors.restColor} />
            <Text style={styles.emptyText}>Você ainda não tem um programa de treino.</Text>
            <OutlineButton label="Atualizar" onPress={retry} style={styles.retry} />
          </View>
        )}

        {status === 'ready' && nextWorkout && (
          <View style={styles.block}>
            <DayHeadline
              kicker="Próximo treino"
              tag={todayCompletion ? 'Feito hoje' : undefined}
              label={nextWorkout.label}
              muscles={nextWorkout.muscles}
              color={dayColor(nextWorkout.color)}
            />
            <View style={styles.gap}>
              <NumbersRow items={[
                { value: String(exercises.length), label: 'exercícios' },
                { value: String(setsTotal), label: 'séries' },
                { value: String(minutes), label: 'minutos, aprox.' },
              ]} />
            </View>
            <View style={styles.gap}>
              <PrimaryButton
                label={todayCompletion ? 'Ver próximo treino' : 'Começar treino'}
                onPress={() => navigation.navigate('Workout', { daySlug: nextWorkout.slug })}
              />
            </View>
            {lastCompletion?.workout_day ? (
              <Text style={styles.note}>Último treino: {lastCompletion.workout_day.label}.</Text>
            ) : (
              <Text style={styles.note}>Seu primeiro treino começa aqui.</Text>
            )}
          </View>
        )}

        {/* Semana: dias treinados (semana começa na segunda), sem sequência */}
        {status === 'loading' && (
          <View style={styles.block}>
            <Skeleton width={120} height={18} />
            <Skeleton height={56} style={styles.gap} />
          </View>
        )}
        {status === 'ready' && weekGoal > 0 && (
          <View style={styles.block}>
            <Text style={styles.kicker}>Esta semana</Text>
            <WeekStrip dates={weekDays} doneDates={weekDoneDates} today={todayISO()} goal={weekGoal} />
            <View style={styles.weekNums}>
              <NumbersRow items={[{
                value: `${weekDone > 99 ? '99+' : weekDone}/${weekGoal > 99 ? '99+' : weekGoal}`,
                label: 'treinos na semana',
                ok: weekDone >= weekGoal,
              }]} />
            </View>
          </View>
        )}

        {/* Navegação */}
        <View style={styles.list}>
          <ListRow
            label="Calendário"
            value="Histórico de treinos"
            onPress={() => navigation.navigate('Calendar')}
          />
          <ListRow
            label="Perfil"
            value="Aparência, avisos e conta"
            onPress={() => navigation.navigate('Profile')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
