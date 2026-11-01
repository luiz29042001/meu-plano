/**
 * # `DietScreen` — tela Dieta
 * Mostra o plano alimentar do dia: refeição em destaque ("Agora" / "Próxima"), lista de todas as refeições (com itens, dicas e substitutos), total do dia e hidratação.
 *
 * A tela tem quatro situações, decididas pelo hook `useDiet`: `pending` (em preparação), `loading`, `error` e pronta (`plan` do banco ou `fixed` do código).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
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
import { OutlineButton } from '../components/Buttons';
import { Notice } from '../components/Notice';
import { useOnline } from '../hooks/useOnline';
import { Skeleton } from '../components/Skeleton';
import type { Meal, DietItem, DietVariant } from '../types';

/**
 * ## `fmt(n)`
 * Formata um número no padrão brasileiro: `2150` → `"2.150"`. Feito à mão com expressão regular para não depender do `Intl`, que não existe completo no Android.
 *
  * 2150 -> "2.150" (padrão pt-BR, sem depender de Intl no Android).
  */
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/**
 * ## `plain(s)`
 * Remove emojis e símbolos do começo de um texto vindo dos dados (o design não usa emojis).
 *
  * Tira emoji/símbolos do começo de textos vindos dos dados (spec: sem emoji).
  */
const plain = (s: string) => s.replace(/^[^A-Za-zÀ-ÿ0-9]+/, '').trim();

/**
 * ## `variantLabel(label)`
 * Texto do botão de variante: `"A"` → `"Variante A"`; `"Treino"` → `"Dia de treino"`.
 *
  * Rótulo do segmento: "A" -> "Variante A"; "Treino" -> "Dia de treino".
  */
const variantLabel = (label: string) =>
  label.length <= 2 ? `Variante ${label}` : `Dia de ${label.toLowerCase()}`;

/**
 * ## `minutesOf(time)`
 * Converte `"08:30"` em minutos desde a meia-noite (510). Horário ilegível → `null`.
 *
  * Minutos desde 00:00 de "08:00"; null se o horário não for legível.
  */
function minutesOf(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * ## Constantes
 * - `NOW_WINDOW_MIN` → uma refeição conta como "Agora" até 45 minutos depois do horário.
 * - `isRegular(m)` → refeição "de verdade": não é alternativa, suplemento nem jejum.
 */
const NOW_WINDOW_MIN = 45; // refeição conta como "Agora" até 45 min depois do horário

const isRegular = (m: Meal) => !m.isAlternative && !m.isSupp && !m.isFasted;

/**
 * ## `pickHero(meals, nowMin)`
 * Escolhe a refeição em destaque.
 *
 * 1. Considera só refeições regulares com horário legível.
 * 2. Se alguma está na janela de 45 min → `{ kind: 'now' }`.
 * 3. Senão, a primeira ainda por vir → `{ kind: 'next', inMin }` (minutos até ela).
 * 4. Se todas já passaram → `{ kind: 'done' }` com a primeira de amanhã.
 * 5. Sem horários legíveis → `null`.
 *
 * Refeição em destaque: "Agora" (horário <= agora < horário + 45 min) ou a próxima
 * ainda por vir. `done` = passou da última refeição do dia. Sem horários legíveis -> null.
 */
function pickHero(meals: Meal[], nowMin: number):
  | { kind: 'now' | 'next'; meal: Meal; inMin: number }
  | { kind: 'done'; first: Meal }
  | null {
  const timed = meals.filter(isRegular).map(m => ({ m, t: minutesOf(m.time) })).filter(x => x.t !== null) as { m: Meal; t: number }[];
  if (timed.length === 0) return null;
  const current = timed.find(x => x.t <= nowMin && nowMin < x.t + NOW_WINDOW_MIN);
  if (current) return { kind: 'now', meal: current.m, inMin: 0 };
  const next = timed.find(x => x.t > nowMin);
  if (next) return { kind: 'next', meal: next.m, inMin: next.t - nowMin };
  return { kind: 'done', first: timed[0].m };
}

/**
 * ## `relative(min)`
 * Texto de tempo restante: `20` → "daqui a 20 min", `80` → "daqui a 1 h 20", `120` → "daqui a 2 h".
 *
  * 80 -> "daqui a 1 h 20"; 20 -> "daqui a 20 min"; 120 -> "daqui a 2 h".
  */
function relative(min: number): string {
  if (min < 60) return `daqui a ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `daqui a ${h} h` : `daqui a ${h} h ${m}`;
}

/**
 * Estilos da tela (refeições, cartão de destaque, totais).
 */
const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  block: { marginTop: Spacing.xl },
  stateWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl },
  pendingText: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted, lineHeight: LineHeight.base },
  banner: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, lineHeight: LineHeight.md },
  kcalRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  kcal: {
    fontFamily: Font.condSemi, fontSize: FontSize.hero, lineHeight: numberLineHeight(FontSize.hero),
    letterSpacing: Tracking.tighter, color: c.text, includeFontPadding: false, fontVariant: ['tabular-nums'],
  },
  kcalUnit: { fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted, paddingBottom: Spacing.sm },
  macroNote: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted, lineHeight: LineHeight.sm },
  meals: { borderTopWidth: 1, borderTopColor: c.border },
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
  mealNamePast: { color: c.textMuted },
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
  note: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, lineHeight: LineHeight.md },
  item: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: c.border },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: Font.bodyMedium, fontSize: FontSize.base, color: c.text },
  itemDetail: { fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, marginTop: 2 },
  itemKcal: { fontFamily: Font.condSemi, fontSize: FontSize.lg, color: c.text, includeFontPadding: false },
  itemActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  itemBtn: { alignSelf: 'auto', flexGrow: 1, minWidth: 104 },
  panel: { marginTop: Spacing.sm, gap: Spacing.sm },
  panelTitle: { fontFamily: Font.bodySemi, fontSize: FontSize.base, color: c.text },
  sub: { backgroundColor: c.card, padding: Spacing.md, gap: 2 },
  subTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  subName: { flex: 1, fontFamily: Font.bodyMedium, fontSize: FontSize.md, color: c.text },
  subKcal: { fontFamily: Font.condSemi, fontSize: FontSize.lg, color: c.text },
  subQty: { fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted },
  subNote: { fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, lineHeight: LineHeight.md },
  tipText: { marginTop: Spacing.sm, fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, lineHeight: LineHeight.md },
  hydration: { marginTop: Spacing.xxxl, gap: Spacing.sm },
  hydrationTitle: {
    fontFamily: Font.condSemi, fontSize: FontSize.xl, color: c.text,
    textTransform: 'uppercase', letterSpacing: Tracking.caps,
  },
  hydrationText: { fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted, lineHeight: LineHeight.base },
  skel: { marginTop: Spacing.md },
  notice: { marginTop: Spacing.md },
  kicker: { fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted, marginTop: Spacing.xxxl, marginBottom: Spacing.md },
  hero: { marginTop: Spacing.xl },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  heroRel: { fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted },
  heroName: {
    marginTop: Spacing.sm, fontFamily: Font.condSemi, fontSize: FontSize.xxl, lineHeight: numberLineHeight(FontSize.xxl) + 4,
    color: c.text, textTransform: 'uppercase', letterSpacing: Tracking.caps, includeFontPadding: false,
  },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.lg, marginTop: Spacing.xs },
  heroTime: {
    fontFamily: Font.condBold, fontSize: FontSize.xxxl, lineHeight: numberLineHeight(FontSize.xxxl),
    color: c.text, includeFontPadding: false, fontVariant: ['tabular-nums'],
  },
  heroKcal: {
    fontFamily: Font.condSemi, fontSize: FontSize.numeral, lineHeight: numberLineHeight(FontSize.numeral),
    color: c.textMuted, includeFontPadding: false, fontVariant: ['tabular-nums'],
  },
  heroMacros: { marginTop: Spacing.sm, fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted },
  heroItems: { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: c.border },
  totalRow: {
    minHeight: Touch.primary, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border, paddingVertical: Spacing.sm,
  },
  totalLabel: { fontFamily: Font.bodyMedium, fontSize: FontSize.base, color: c.text },
  totalValue: { flex: 1, textAlign: 'right', fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted },
}));

/**
 * ## `MealItem({ item })`
 * Um alimento da refeição, com botões para mostrar **Dica** ou **Substitutos**. Abrir um fecha o outro.
 *
 * - `showTip` e `showSubs` controlam o que está aberto.
 * - Calorias só aparecem se forem maiores que zero.
 */
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
            <OutlineButton
              label={showSubs ? 'Ocultar substitutos' : 'Substitutos'}
              onPress={() => { setShowSubs(v => !v); setShowTip(false); }}
              style={styles.itemBtn}
            />
          )}
          {!!item.tip && (
            <OutlineButton
              label={showTip ? 'Ocultar dica' : 'Dica'}
              onPress={() => { setShowTip(v => !v); setShowSubs(false); }}
              style={styles.itemBtn}
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
                {/* Armadilha 10: substituto sem calorias (valor 0) não exibe a linha de kcal. */}
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

/**
 * ## `MealCard({ meal, past })`
 * Cartão de uma refeição, recolhido por padrão; tocar abre os itens.
 *
 * 1. `accent` → cor da faixa lateral (traduzida para o tema).
 * 2. `sub` → subtítulo: para suplementos e jejum um texto fixo; para as demais, os macros (P/C/G) e "Opção alternativa" quando for o caso.
 * 3. `past` → refeição já passada fica com o nome mais apagado.
 * 4. Sem calorias, mostra uma etiqueta ("Diário" ou "Jejum") no lugar.
 */
function MealCard({ meal, past }: { meal: Meal; past: boolean }) {
  const styles = useStyles();
  const { resolveAccent } = useTheme();
  const [open, setOpen] = useState(false);
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
            <Text style={[styles.mealName, past && styles.mealNamePast]}>{meal.label}</Text>
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

/**
 * ## `legacyVariants()`
 * Monta as variantes A e B da dieta fixa do código no mesmo formato dos planos do banco, para a tela tratar os dois casos igual.
 */
function legacyVariants(): DietVariant[] {
  return [
    { key: 'A', label: 'A', banner: 'Dieta A — Com feijão ou lentilha no almoço', meals: makeMeals('A') },
    { key: 'B', label: 'B', banner: 'Dieta B — Com grão-de-bico (sem feijão/lentilha)', meals: makeMeals('B') },
  ];
}

/**
 * ## `DietScreen()`
 */
export function DietScreen() {
  const styles = useStyles();
  // Dados: tema, hook `useDiet` (estado, plano, variante), conexão e se a tela está em foco.
  const { colors, resolveAccent } = useTheme();
  const { status, error, plan: dbPlan, variant, changeVariant, retry, refresh } = useDiet();
  const timerInsets = useTimerInsets();
  const online = useOnline();
  const focused = useIsFocused();
  // `saveFailed`: falhou ao salvar a variante? `showTotals`: bloco de totais aberto?
  const [saveFailed, setSaveFailed] = useState(false);
  const [showTotals, setShowTotals] = useState(false);

  // ### Relógio de 60 s
  // Enquanto a tela está em foco, atualiza `now` a cada minuto para o destaque "Agora/Próxima" acompanhar o horário. Fora de foco, o relógio para (economiza bateria).
  // Relógio de 60 s enquanto a tela está em foco: atualiza Agora/Próxima.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!focused) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, [focused]);

  // ### Escolha das variantes
  // A dieta fixa do código só vale com `status === 'fixed'`. Caso contrário usa o plano do banco. `current` é a variante selecionada (ou a primeira).
  // Dieta fixa do código só com status 'fixed' (perfil carregado e diet_fixed = true)
  const isLegacy = status === 'fixed';
  const legacy = useMemo(() => (isLegacy ? legacyVariants() : null), [isLegacy]);
  const variants: DietVariant[] = legacy ?? (dbPlan?.data.variants ?? []);
  const current = variants.find(v => v.key === variant) ?? variants[0];
  const meals = current?.meals ?? [];
  // Totais do dia: `calcTotals` já ignora refeições alternativas (armadilha 10).
  // Totais ignoram refeições com isAlternative (armadilha 10): calcTotals já filtra.
  const totals = calcTotals(meals);

  // ### `handleVariantChange(v)`
  // Troca a variante; se não conseguir salvar, mostra o aviso "Mantivemos a anterior".
  const handleVariantChange = async (v: 'A' | 'B') => {
    setSaveFailed(false);
    const ok = await changeVariant(v);
    if (!ok) setSaveFailed(true);
  };

  // ### Estados especiais
  // Antes da tela principal, três saídas antecipadas: **em preparação** (botão Atualizar), **carregando** (esqueletos) e **erro** (botão de nova tentativa).
  // Dieta ainda não criada para este usuário
  if (status === 'pending') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Dieta" back={false} />
        <View style={styles.stateWrap}>
          <DayHeadline label="Em preparação" color={colors.restColor} />
          <Text style={styles.pendingText}>Sua dieta ainda está sendo preparada pela nutricionista.</Text>
          <OutlineButton label="Atualizar" onPress={refresh} style={styles.skel} />
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Dieta" back={false} />
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
        <ScreenHeader title="Dieta" back={false} />
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

  // ### Destaque
  // 1. `nowMin` → minutos desde a meia-noite agora.
  // 2. `hero` → refeição em destaque (ou "concluído").
  // 3. `listMeals` → as demais refeições (a destacada sai da lista).
  // 4. `isPast(m)` → a refeição já passou da janela de "Agora"?
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const hero = pickHero(meals, nowMin);
  const heroMeal = hero && hero.kind !== 'done' ? hero.meal : null;
  const listMeals = meals.filter(m => m.id !== heroMeal?.id);
  // `isPast(m)`: a refeição já passou? É regular e o horário dela + 45 min já ficou para trás.
  const isPast = (m: Meal) => {
    const t = minutesOf(m.time);
    return t !== null && isRegular(m) && t + NOW_WINDOW_MIN <= nowMin;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Dieta"
        subtitle={isLegacy ? 'Déficit calórico' : (dbPlan?.data.name ?? 'Plano alimentar')}
        back={false}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: timerInsets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {timerInsets.top > 0 && <View style={{ height: timerInsets.top }} />}
        {!online && (
          <View style={styles.notice}>
            <Notice tone="neutral" text="Sem internet. Mostrando a última dieta carregada." />
          </View>
        )}
        {saveFailed && (
          <View style={styles.notice}>
            <Notice text="Não foi possível salvar sua escolha. Mantivemos a anterior." />
          </View>
        )}
        {variants.length > 1 && (
          <View style={{ marginTop: Spacing.sm }}>
            <Segmented
              label="Variante da dieta"
              options={variants.map(v => ({ value: v.key, label: variantLabel(v.label) }))}
              value={current.key}
              onChange={handleVariantChange}
            />
          </View>
        )}
        {!!current.banner && <Text style={styles.banner}>{plain(current.banner)}</Text>}

        {/* Cartão de destaque: etiqueta "Agora"/"Próxima", nome, horário, calorias, macros, observação e itens. */}
        {/* Refeição em destaque */}
        {heroMeal && hero && hero.kind !== 'done' && (
          <View
            style={styles.hero}
            accessible={false}
          >
            <View
              style={styles.heroTop}
              accessible
              accessibilityLabel={`${hero.kind === 'now' ? 'Agora' : 'Próxima refeição'}: ${heroMeal.label}, ${heroMeal.time}${heroMeal.kcal > 0 ? `, ${heroMeal.kcal} quilocalorias` : ''}`}
            >
              <Tag label={hero.kind === 'now' ? 'Agora' : 'Próxima'} />
              {hero.kind === 'next' && <Text style={styles.heroRel}>{relative(hero.inMin)}</Text>}
            </View>
            <Text style={styles.heroName} numberOfLines={2} maxFontSizeMultiplier={1.2}>{heroMeal.label}</Text>
            <View style={styles.heroRow}>
              <Text style={styles.heroTime} maxFontSizeMultiplier={1.2}>{heroMeal.time}</Text>
              {heroMeal.kcal > 0 && <Text style={styles.heroKcal} maxFontSizeMultiplier={1.2}>{fmt(heroMeal.kcal)} kcal</Text>}
            </View>
            <Text style={styles.heroMacros}>
              P {heroMeal.macros.p}g · C {heroMeal.macros.c}g · G {heroMeal.macros.g}g
            </Text>
            {heroMeal.note ? <Text style={styles.note}>{heroMeal.note}</Text> : null}
            <View style={styles.heroItems}>
              {heroMeal.items.map((item, i) => <MealItem key={`${current.key}-${heroMeal.id}-${i}`} item={item} />)}
            </View>
          </View>
        )}
        {hero && hero.kind === 'done' && (
          <View style={styles.hero}>
            <Text style={styles.heroName} numberOfLines={2} accessibilityRole="header">Refeições de hoje concluídas</Text>
            <Text style={styles.heroMacros}>Amanhã, {hero.first.time} · {hero.first.label}</Text>
          </View>
        )}

        {/* Lista das demais refeições. */}
        {/* Todas as refeições */}
        <Text style={styles.kicker}>Todas as refeições</Text>
        <View style={styles.meals}>
          {listMeals.map(meal => (
            <MealCard key={`${current.key}-${meal.id}`} meal={meal} past={isPast(meal)} />
          ))}
        </View>

        {/* Linha "Total do dia" (toque para expandir) e, expandida, as calorias grandes e os macros. Para a dieta fixa mostra a meta calculada; para planos do banco, o subtítulo e a nota da nutricionista. */}
        {/* Total do dia */}
        <Pressable
          onPress={() => setShowTotals(v => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showTotals }}
          accessibilityLabel={`Total do dia: ${fmt(totals.kcal)} quilocalorias, proteína ${totals.p} gramas, carboidrato ${totals.c} gramas, gordura ${totals.g} gramas`}
          style={({ pressed }) => [styles.totalRow, pressed && styles.mealHover]}
        >
          <Text style={styles.totalLabel}>Total do dia</Text>
          <Text style={styles.totalValue} numberOfLines={2}>
            {fmt(totals.kcal)} kcal · P {totals.p}g · C {totals.c}g · G {totals.g}g
          </Text>
          <Text style={styles.mealPlus}>{showTotals ? '−' : '+'}</Text>
        </Pressable>
        {showTotals && (
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
        )}

        {/* Orientação de hidratação (texto específico para a dieta fixa). */}
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
