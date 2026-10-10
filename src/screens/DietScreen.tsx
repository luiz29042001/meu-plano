import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDiet } from '../hooks/useDiet';
import { useTheme, makeStyles } from '../contexts/ThemeContext';
import { useTimerInsets } from '../hooks/useTimerInsets';
import { makeMeals, calcTotals } from '../services/dietData';
import { Font, FontSize, LineHeight, Spacing, Touch, Tracking, numberLineHeight } from '../utils/theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { DayHeadline, Tag } from '../components/DayHeadline';
import { NumbersRow } from '../components/NumbersRow';
import { Segmented } from '../components/Segmented';
import { ErrorBlock } from '../components/ErrorBlock';
import { LinkButton } from '../components/Buttons';
import { Skeleton } from '../components/Skeleton';
import type { Meal, DietItem, DietVariant } from '../types';

/** 2150 -> "2.150" (padrão pt-BR, sem depender de Intl no Android). */
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Tira emoji/símbolos do começo de textos vindos dos dados (spec: sem emoji). */
const plain = (s: string) => s.replace(/^[^A-Za-zÀ-ÿ0-9]+/, '').trim();

/** Rótulo do segmento: "A" -> "Variante A"; "Treino" -> "Dia de treino". */
const variantLabel = (label: string) =>
  label.length <= 2 ? `Variante ${label}` : `Dia de ${label.toLowerCase()}`;

/** Minutos desde 00:00 de "08:00"; null se o horário não for legível. */
function minutesOf(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Id da próxima refeição (primeira com horário ainda por vir). */
function nextMealId(meals: Meal[]): string | null {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const next = meals.find(m => {
    if (m.isAlternative || m.isSupp || m.isFasted) return false;
    const t = minutesOf(m.time);
    return t !== null && t >= nowMin;
  });
  return next?.id ?? null;
}

const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  block: { marginTop: Spacing.xl },
  stateWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl },
  pendingText: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted, lineHeight: LineHeight.base },
  banner: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, lineHeight: LineHeight.md },
  saveFailed: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.md, color: c.red },
  kcalRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  kcal: {
    fontFamily: Font.condSemi, fontSize: FontSize.hero, lineHeight: numberLineHeight(FontSize.hero),
    letterSpacing: Tracking.tighter, color: c.text, includeFontPadding: false, fontVariant: ['tabular-nums'],
  },
  kcalUnit: { fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted, paddingBottom: Spacing.sm },
  macroNote: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted, lineHeight: LineHeight.sm },
  meals: { marginTop: Spacing.xxl, borderTopWidth: 1, borderTopColor: c.border },
  meal: { borderBottomWidth: 1, borderBottomColor: c.border },
  mealHead: { minHeight: Touch.primary, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  mealHover: { backgroundColor: c.cardHover },
  stripe: { width: 3, alignSelf: 'stretch' },
  mealTime: {
    width: 48, fontFamily: Font.condMedium, fontSize: FontSize.lg, color: c.textMuted,
    includeFontPadding: false, fontVariant: ['tabular-nums'],
  },
  mealInfo: { flex: 1, gap: 2 },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  mealName: { fontFamily: Font.bodyMedium, fontSize: FontSize.base, color: c.text },
  mealSub: { fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted },
  mealKcal: {
    fontFamily: Font.condSemi, fontSize: FontSize.lg, color: c.text, includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  mealPlus: {
    width: 28, textAlign: 'center', fontFamily: Font.condMedium, fontSize: FontSize.xl,
    color: c.textMuted, includeFontPadding: false,
  },
  items: { backgroundColor: c.cardAlt, marginBottom: Spacing.sm },
  note: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted, lineHeight: LineHeight.sm },
  item: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: c.border },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: Font.bodyMedium, fontSize: FontSize.md, color: c.text },
  itemDetail: { fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
  itemKcal: { fontFamily: Font.condSemi, fontSize: FontSize.base, color: c.text, includeFontPadding: false },
  itemActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  panel: { marginTop: Spacing.sm, gap: Spacing.sm },
  panelTitle: {
    fontFamily: Font.condSemi, fontSize: FontSize.base, color: c.text,
    textTransform: 'uppercase', letterSpacing: Tracking.caps,
  },
  sub: { backgroundColor: c.card, padding: Spacing.md, gap: 2 },
  subTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  subName: { flex: 1, fontFamily: Font.bodyMedium, fontSize: FontSize.sm, color: c.text },
  subKcal: { fontFamily: Font.condSemi, fontSize: FontSize.md, color: c.text },
  subQty: { fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted },
  subNote: { fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted, lineHeight: LineHeight.sm },
  tipText: { fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted, lineHeight: LineHeight.sm },
  hydration: { marginTop: Spacing.xxl, gap: Spacing.sm },
  hydrationTitle: {
    fontFamily: Font.condSemi, fontSize: FontSize.xl, color: c.text,
    textTransform: 'uppercase', letterSpacing: Tracking.caps,
  },
  hydrationText: { fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted, lineHeight: LineHeight.base },
  skel: { marginTop: Spacing.md },
}));

function MealItem({ item }: { item: DietItem }) {
  const styles = useStyles();
  const [showTip, setShowTip] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const hasSubs = item.subs.length > 0;

  return (
    <View style={styles.item}>
      <View style={styles.itemTop}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDetail}>{item.detail}</Text>
        </View>
        {item.kcal > 0 && <Text style={styles.itemKcal}>{item.kcal} kcal</Text>}
      </View>
      {(hasSubs || !!item.tip) && (
        <View style={styles.itemActions}>
          {hasSubs && (
            <LinkButton
              label={showSubs ? 'Ocultar substitutos' : 'Substitutos'}
              onPress={() => { setShowSubs(v => !v); setShowTip(false); }}
            />
          )}
          {!!item.tip && (
            <LinkButton
              label={showTip ? 'Ocultar dica' : 'Dica'}
              onPress={() => { setShowTip(v => !v); setShowSubs(false); }}
            />
          )}
        </View>
      )}
      {showTip && <Text style={styles.tipText}>{item.tip}</Text>}
      {showSubs && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Substitutos possíveis</Text>
          {item.subs.map((sub, i) => (
            <View key={i} style={styles.sub}>
              <View style={styles.subTop}>
                <Text style={styles.subName}>{sub.name}</Text>
                {/* Substituto com kcal 0 não mostra calorias (armadilha 10) */}
                {sub.kcal > 0 && <Text style={styles.subKcal}>{sub.kcal} kcal</Text>}
              </View>
              <Text style={styles.subQty}>{sub.qty}</Text>
              <Text style={styles.subNote}>{sub.note}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MealCard({ meal, isNext }: { meal: Meal; isNext: boolean }) {
  const styles = useStyles();
  const { resolveAccent } = useTheme();
  const [open, setOpen] = useState(isNext);
  const isSpecial = meal.isSupp || meal.isFasted;
  const accent = resolveAccent(meal.color);

  const sub = isSpecial
    ? (meal.isSupp ? 'Creatina · Psyllium' : 'Água · Café pré-treino opcional')
    : `P ${meal.macros.p}g · C ${meal.macros.c}g · G ${meal.macros.g}g${meal.isAlternative ? ' · Opção alternativa' : ''}`;

  return (
    <View style={styles.meal}>
      <Pressable
        onPress={() => setOpen(v => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${meal.label}, ${meal.time}${meal.kcal > 0 ? `, ${meal.kcal} quilocalorias` : ''}`}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.mealHead, pressed && styles.mealHover]}
      >
        <View style={[styles.stripe, { backgroundColor: accent }]} />
        <Text style={styles.mealTime}>{meal.time}</Text>
        <View style={styles.mealInfo}>
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealName}>{meal.label}</Text>
            {isNext && <Tag label="Próxima" />}
          </View>
          <Text style={styles.mealSub}>{sub}</Text>
        </View>
        {meal.kcal > 0
          ? <Text style={styles.mealKcal}>{meal.kcal} kcal</Text>
          : <Tag label={meal.isSupp ? 'Diário' : 'Jejum'} />}
        <Text style={styles.mealPlus}>{open ? '−' : '+'}</Text>
      </Pressable>

      {open && (
        <View style={styles.items}>
          {meal.note ? <Text style={styles.note}>{meal.note}</Text> : null}
          {meal.items.map((item, i) => <MealItem key={i} item={item} />)}
        </View>
      )}
    </View>
  );
}

// Dieta do Luiz (definida no código) no mesmo formato dos planos do banco
function legacyVariants(): DietVariant[] {
  return [
    { key: 'A', label: 'A', banner: 'Dieta A — Com feijão ou lentilha no almoço', meals: makeMeals('A') },
    { key: 'B', label: 'B', banner: 'Dieta B — Com grão-de-bico (sem feijão/lentilha)', meals: makeMeals('B') },
  ];
}

export function DietScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { status, error, plan: dbPlan, variant, changeVariant, retry } = useDiet();
  const timerInsets = useTimerInsets();
  const [saveFailed, setSaveFailed] = useState(false);

  // Dieta fixa do código só com status 'fixed' (perfil carregado e diet_fixed = true)
  const isLegacy = status === 'fixed';
  const variants: DietVariant[] = isLegacy ? legacyVariants() : (dbPlan?.data.variants ?? []);
  const current = variants.find(v => v.key === variant) ?? variants[0];
  const meals = current?.meals ?? [];
  // Totais ignoram refeições com isAlternative (armadilha 10): calcTotals já filtra.
  const totals = calcTotals(meals);

  const handleVariantChange = async (v: 'A' | 'B') => {
    setSaveFailed(false);
    const ok = await changeVariant(v);
    if (!ok) setSaveFailed(true);
  };

  // Dieta ainda não criada para este usuário
  if (status === 'pending') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Dieta" />
        <View style={styles.stateWrap}>
          <DayHeadline label="Em preparação" color={colors.restColor} />
          <Text style={styles.pendingText}>Sua dieta ainda está sendo preparada pela nutricionista.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Dieta" />
        <View style={styles.stateWrap}>
          <Skeleton width={220} height={72} />
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} height={56} style={styles.skel} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error' || !current) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Dieta" />
        <View style={styles.stateWrap}>
          <ErrorBlock
            title="Não foi possível carregar sua dieta."
            cause={error ?? 'Tente novamente em instantes.'}
            onRetry={retry}
          />
        </View>
      </SafeAreaView>
    );
  }

  const nextId = nextMealId(meals);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Dieta"
        subtitle={isLegacy ? 'Déficit calórico' : (dbPlan?.data.name ?? 'Plano alimentar')}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: timerInsets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {timerInsets.top > 0 && <View style={{ height: timerInsets.top }} />}
        {variants.length > 1 && (
          <Segmented
            label="Variante da dieta"
            options={variants.map(v => ({ value: v.key, label: variantLabel(v.label) }))}
            value={current.key}
            onChange={handleVariantChange}
          />
        )}
        {saveFailed && <Text style={styles.saveFailed}>Não foi possível salvar sua escolha. Mantivemos a anterior.</Text>}
        {!!current.banner && <Text style={styles.banner}>{plain(current.banner)}</Text>}

        {/* Total do dia */}
        <View style={styles.block}>
          <View style={styles.kcalRow}>
            <Text style={styles.kcal} numberOfLines={1} maxFontSizeMultiplier={1.2}>{fmt(totals.kcal)}</Text>
            <Text style={styles.kcalUnit}>kcal no dia</Text>
          </View>
          <View style={styles.block}>
            <NumbersRow
              valueSize={FontSize.xxl}
              items={[
                { value: `${totals.p}g`, label: isLegacy ? 'proteína (2 g/kg)' : 'proteína' },
                { value: `${totals.c}g`, label: 'carboidrato' },
                { value: `${totals.g}g`, label: 'gordura' },
              ]}
            />
          </View>
          <Text style={styles.macroNote}>
            {isLegacy
              ? `Meta diária de perda de gordura: TMB Mifflin × 1,65 (ativo, 1h de treino 6×/semana) − 20% ≈ ${fmt(totals.kcal)} kcal.`
              : `${dbPlan?.data.subtitle ? `${dbPlan.data.subtitle}. ` : ''}${dbPlan?.data.note ?? ''}`}
          </Text>
        </View>

        {/* Refeições */}
        <View style={styles.meals}>
          {meals.map(meal => (
            <MealCard key={`${current.key}-${meal.id}`} meal={meal} isNext={meal.id === nextId} />
          ))}
        </View>

        {/* Hidratação */}
        <View style={styles.hydration}>
          <Text style={styles.hydrationTitle}>Hidratação</Text>
          <Text style={styles.hydrationText}>
            {isLegacy
              ? 'Mínimo 3,5L de água por dia. Em dias de treino, adicione 500ml por hora de exercício. Ao tomar psyllium, conte os 300ml de cada dose.'
              : 'Beba água ao longo do dia e reforce nos dias de treino.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
