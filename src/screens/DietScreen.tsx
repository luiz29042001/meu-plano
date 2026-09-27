import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { updateDietVariant } from '../services/profile';
import { makeMeals, calcTotals } from '../services/dietData';
import { Colors, Radius, FontSize } from '../utils/theme';
import type { Meal, DietItem } from '../types';

function SubsPanel({ item, color }: { item: DietItem; color: string }) {
  if (!item.subs.length) return null;
  return (
    <View style={styles.subsPanel}>
      <Text style={[styles.subsTitle, { color }]}>Substitutos possíveis</Text>
      {item.subs.map((sub, i) => (
        <View key={i} style={styles.subCard}>
          <View style={styles.subHeader}>
            <Text style={styles.subName}>{sub.name}</Text>
            <Text style={[styles.subKcal, { color }]}>{sub.kcal} kcal</Text>
          </View>
          <Text style={styles.subQty}>{sub.qty}</Text>
          <Text style={styles.subNote}>{sub.note}</Text>
        </View>
      ))}
    </View>
  );
}

function MealItem({ item, mealColor }: { item: DietItem; mealColor: string }) {
  const [showTip, setShowTip] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const hasSubs = item.subs.length > 0;

  return (
    <View style={styles.mealItem}>
      <View style={styles.mealItemRow}>
        <View style={styles.mealItemInfo}>
          <Text style={styles.mealItemName}>{item.name}</Text>
          <View style={styles.mealItemMeta}>
            <Text style={styles.mealItemDetail}>{item.detail}</Text>
            {item.kcal > 0 && (
              <Text style={[styles.mealItemKcal, { color: mealColor }]}>{item.kcal} kcal</Text>
            )}
          </View>
        </View>
        <View style={styles.mealItemActions}>
          {hasSubs && (
            <TouchableOpacity
              onPress={() => { setShowSubs(v => !v); setShowTip(false); }}
              style={[styles.mealItemBtn, showSubs && { backgroundColor: mealColor + '22' }]}
            >
              <Text style={[styles.mealItemBtnText, { color: showSubs ? mealColor : Colors.textFaint }]}>⇄</Text>
            </TouchableOpacity>
          )}
          {item.tip ? (
            <TouchableOpacity
              onPress={() => { setShowTip(v => !v); setShowSubs(false); }}
              style={[styles.mealItemBtn, showTip && { backgroundColor: Colors.surface }]}
            >
              <Text style={[styles.mealItemBtnText, { color: showTip ? mealColor : Colors.textFaint }]}>ℹ</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {showTip && (
        <View style={styles.tipPanel}>
          <Text style={styles.tipText}>{item.tip}</Text>
        </View>
      )}
      {showSubs && <SubsPanel item={item} color={mealColor} />}
    </View>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  const [open, setOpen] = useState(false);
  const isSpecial = meal.isSupp || meal.isFasted;

  return (
    <View style={styles.mealCardWrap}>
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        style={[styles.mealCard, open && { borderColor: meal.color + '44', borderWidth: 1 }]}
        activeOpacity={0.85}
      >
        <Text style={styles.mealIcon}>{meal.icon}</Text>
        <View style={styles.mealInfo}>
          <View style={styles.mealTitleRow}>
            <Text style={[styles.mealTitle, isSpecial && { color: meal.color }]}>{meal.label}</Text>
            {meal.kcal > 0
              ? <Text style={[styles.mealKcal, { color: meal.color }]}>{meal.kcal} kcal</Text>
              : <View style={[styles.badge, { backgroundColor: meal.color + '22' }]}>
                  <Text style={[styles.badgeText, { color: meal.color }]}>
                    {meal.isSupp ? 'DIÁRIO' : 'JEJUM'}
                  </Text>
                </View>
            }
          </View>
          {!isSpecial && (
            <View style={styles.mealMacros}>
              <Text style={styles.mealTime}>🕐 {meal.time}</Text>
              <Text style={[styles.mealMacro, { color: Colors.pushColor }]}>P {meal.macros.p}g</Text>
              <Text style={[styles.mealMacro, { color: Colors.pullColor }]}>C {meal.macros.c}g</Text>
              <Text style={[styles.mealMacro, { color: Colors.green }]}>G {meal.macros.g}g</Text>
            </View>
          )}
          {isSpecial && (
            <Text style={styles.mealSubtitle}>
              {meal.isSupp ? 'Creatina · Psyllium' : 'Água · Café pré-treino opcional'}
            </Text>
          )}
        </View>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.mealItems}>
          {meal.items.map((item, i) => (
            <MealItem key={i} item={item} mealColor={meal.color} />
          ))}
        </View>
      )}
    </View>
  );
}

export function DietScreen() {
  const navigation = useNavigation<any>();
  const { profile, refreshProfile } = useAuth();
  const [variant, setVariant] = useState<'A' | 'B'>(profile?.diet_variant ?? 'A');

  const meals = makeMeals(variant);
  const totals = calcTotals(meals);

  const handleVariantChange = async (v: 'A' | 'B') => {
    setVariant(v);
    if (profile) {
      await updateDietVariant(profile.id, v);
      refreshProfile();
    }
  };

  // Dieta ainda não criada para este usuário → tela de pendência
  if (profile && profile.diet_enabled === false) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerSub}>Plano Alimentar</Text>
            <Text style={styles.headerTitle}>Dieta</Text>
          </View>
        </View>
        <View style={styles.pendingWrap}>
          <View style={styles.pendingIconCircle}>
            <Text style={styles.pendingIcon}>🥗</Text>
          </View>
          <Text style={styles.pendingTitle}>Dieta em criação</Text>
          <Text style={styles.pendingText}>
            Seu plano alimentar personalizado ainda está sendo preparado.
            Assim que estiver pronto, ele aparecerá aqui automaticamente.
          </Text>
          <View style={styles.pendingPill}>
            <View style={styles.pendingDot} />
            <Text style={styles.pendingPillText}>Pendente</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>Déficit Calórico</Text>
          <Text style={styles.headerTitle}>Plano Alimentar</Text>
        </View>
        {/* Variant toggle */}
        <View style={styles.variantToggle}>
          {(['A', 'B'] as const).map(v => (
            <TouchableOpacity
              key={v}
              onPress={() => handleVariantChange(v)}
              style={[styles.variantBtn, variant === v && { backgroundColor: Colors.green }]}
            >
              <Text style={[styles.variantText, variant === v && { color: '#fff' }]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Variant banner */}
        <View style={[styles.variantBanner, { backgroundColor: variant === 'A' ? '#1A2A1A' : '#1A1A2A' }]}>
          <Text style={{ color: variant === 'A' ? Colors.green : Colors.pullColor, fontSize: FontSize.sm }}>
            {variant === 'A'
              ? '🫘 Dieta A — Com feijão ou lentilha no almoço'
              : '🌰 Dieta B — Com grão-de-bico (sem feijão/lentilha)'}
          </Text>
        </View>

        {/* Macro summary */}
        <View style={styles.macroCard}>
          <Text style={styles.macroTitle}>Meta Diária — Perda de Gordura</Text>
          <View style={styles.macroRow}>
            {[
              { label: 'Calorias', value: `${totals.kcal}`, unit: 'kcal', color: Colors.orange },
              { label: 'Proteína', value: `${totals.p}g`, unit: '2g/kg', color: Colors.pushColor },
              { label: 'Carbo', value: `${totals.c}g`, unit: '', color: Colors.pullColor },
              { label: 'Gordura', value: `${totals.g}g`, unit: '', color: Colors.green },
            ].map(m => (
              <View key={m.label} style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: m.color }]}>{m.value}</Text>
                {m.unit ? <Text style={styles.macroUnit}>{m.unit}</Text> : null}
                <Text style={styles.macroLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.macroNote}>
            <Text style={styles.macroNoteText}>
              💡 TMB Mifflin × 1.65 (ativo, 1h treino 6×/sem) − 20% ≈ {totals.kcal} kcal
            </Text>
          </View>
        </View>

        {/* Meals */}
        {meals.map(meal => <MealCard key={meal.id} meal={meal} />)}

        {/* Hydration */}
        <View style={styles.hydrationCard}>
          <Text style={styles.hydrationTitle}>💧 Hidratação</Text>
          <Text style={styles.hydrationText}>
            Mínimo 3,5L de água por dia. Em dias de treino, adicione 500ml por hora de exercício.
            Ao tomar psyllium, conte os 300ml de cada dose.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pendingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingBottom: 80,
  },
  pendingIconCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  pendingIcon: { fontSize: 44, opacity: 0.45 },
  pendingTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  pendingText: {
    fontSize: FontSize.base, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  pendingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: 500, paddingHorizontal: 14, paddingVertical: 7,
  },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.orange },
  pendingPillText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  backText: { fontSize: 22, color: Colors.text, lineHeight: 28 },
  headerCenter: { flex: 1 },
  headerSub: { fontSize: FontSize.xs, color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  variantToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  variantBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  variantText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textMuted },
  scroll: { padding: 16, gap: 8 },
  variantBanner: {
    borderRadius: Radius.md,
    padding: 10,
    paddingHorizontal: 14,
  },
  macroCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: 18,
  },
  macroTitle: { fontSize: FontSize.xs, color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  macroRow: { flexDirection: 'row', gap: 8 },
  macroItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  macroValue: { fontSize: FontSize.base, fontWeight: '800' },
  macroUnit: { fontSize: FontSize.xs, color: Colors.textFaint, marginTop: 2 },
  macroLabel: { fontSize: FontSize.xs, color: Colors.textFaint, marginTop: 2 },
  macroNote: { backgroundColor: Colors.surface, borderRadius: 10, padding: 10, marginTop: 12 },
  macroNoteText: { fontSize: FontSize.xs, color: Colors.textFaint, lineHeight: 16 },
  mealCardWrap: { borderRadius: Radius.lg, overflow: 'hidden' },
  mealCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mealIcon: { fontSize: 24, flexShrink: 0 },
  mealInfo: { flex: 1 },
  mealTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text, flex: 1 },
  mealKcal: { fontSize: FontSize.md, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  mealMacros: { flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  mealTime: { fontSize: FontSize.xs, color: Colors.textFaint },
  mealMacro: { fontSize: FontSize.xs, fontWeight: '600' },
  mealSubtitle: { fontSize: FontSize.sm, color: Colors.textFaint, marginTop: 3 },
  chevron: { fontSize: 18, color: Colors.textFaint },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  mealItems: { backgroundColor: Colors.cardAlt },
  mealItem: { borderTopWidth: 1, borderTopColor: Colors.card },
  mealItemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  mealItemInfo: { flex: 1 },
  mealItemName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  mealItemMeta: { flexDirection: 'row', gap: 10, marginTop: 3 },
  mealItemDetail: { fontSize: FontSize.sm, color: Colors.textFaint },
  mealItemKcal: { fontSize: FontSize.sm, fontWeight: '600' },
  mealItemActions: { flexDirection: 'row', gap: 4 },
  mealItemBtn: { padding: 6, borderRadius: 8 },
  mealItemBtnText: { fontSize: 14 },
  tipPanel: { paddingHorizontal: 12, paddingBottom: 12 },
  tipText: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 18 },
  subsPanel: { paddingHorizontal: 12, paddingBottom: 12 },
  subsTitle: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  subCard: { backgroundColor: Colors.card, borderRadius: 10, padding: 10, marginBottom: 6 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  subName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  subKcal: { fontSize: FontSize.sm, fontWeight: '700', flexShrink: 0 },
  subQty: { fontSize: FontSize.sm, color: Colors.textFaint, marginTop: 2 },
  subNote: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4, lineHeight: 16 },
  hydrationCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 16 },
  hydrationTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  hydrationText: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 18 },
});
