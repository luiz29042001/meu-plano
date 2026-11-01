/**
 * # `HomeScreen` — tela Início
 * Mostra o **próximo treino**, o resumo da **semana** e atalhos para Calendário e Perfil.
 */

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

/**
 * Nomes dos dias da semana e o tempo estimado de execução de uma série (45 s), usado no cálculo de minutos.
 */
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const SECONDS_PER_SET = 45; // execução da série, para a estimativa de minutos

/**
 * ## `greeting()`
 * Saudação pelo horário: antes das 12 h "Bom dia"; até 18 h "Boa tarde"; depois "Boa noite".
 */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * ## `todayLabel()`
 * Texto da data de hoje, ex.: "Segunda, 3 de novembro.".
 */
function todayLabel(): string {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()}.`;
}

/**
 * Estilos da tela (cabeçalho com avatar, blocos, linhas de lista).
 */
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

/**
 * ## `ListRow({ label, value, onPress, faint })`
 * Linha de lista com rótulo e valor. Sem `onPress` é só informação (um bloco legível por leitores de tela); com `onPress` vira botão com seta "›" e destaque ao pressionar.
 */
function ListRow({
  label, value, onPress, faint,
}: { label: string; value: string; onPress?: () => void; faint?: boolean }) {
  const styles = useStyles();
  // `content`: o miolo da linha (rótulo à esquerda, valor e seta à direita), reaproveitado nas duas versões (com e sem toque).
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

/**
 * ## `HomeScreen()`
 */
export function HomeScreen() {
  const styles = useStyles();
  // Dados da tela: tema, navegação, perfil e o hook `useWorkout` (com recarga ao voltar o foco, para refletir o treino recém-concluído).
  const { colors, dayColor } = useTheme();
  const navigation = useNavigation<any>();
  const { profile } = useAuth();
  const {
    status, error, retry, nextWorkout, lastCompletion, todayCompletion,
    weekDone, weekGoal, weekDays, weekDoneDates,
  } = useWorkout({ refreshOnFocus: true });
  const online = useOnline();
  const timerInsets = useTimerInsets();

  // Primeiro nome da pessoa; sem nome, "Atleta".
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Atleta';

  // ### Estimativa do próximo treino
  // 1. `exercises` → lista de exercícios do próximo dia.
  // 2. `setsTotal` → soma das séries (converte o texto `sets` em número).
  // 3. `minutes` → para cada exercício: séries × (descanso + 45 s de execução), somado e convertido para minutos.
  // É só uma estimativa para dar noção à pessoa.
  // Números do próximo treino (estimativa, só para dar noção ao usuário)
  const exercises = nextWorkout?.exercises ?? [];
  const setsTotal = exercises.reduce((s, e) => s + (parseInt(e.sets, 10) || 0), 0);
  const minutes = Math.round(
    exercises.reduce((s, e) => s + (parseInt(e.sets, 10) || 0) * (e.rest_seconds + SECONDS_PER_SET), 0) / 60,
  );

  // ### O que a tela desenha
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: timerInsets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {timerInsets.top > 0 && <View style={{ height: timerInsets.top }} />}
        {/* Cabeçalho com o nome do app e o avatar (inicial do nome) que abre o Perfil, mais a saudação. */}
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

        {/* Estados do bloco "Próximo treino": **carregando** (esqueletos), **erro** (com "tentar de novo"), **vazio** (sem programa) e **pronto** (manchete do dia, números, botão e último treino). */}
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

        {/* Bloco da semana: faixa com os dias treinados e o contador `feitos/meta`. Números acima de 99 viram "99+" para não estourar o layout. */}
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

        {/* Atalhos para o Calendário e o Perfil. */}
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
