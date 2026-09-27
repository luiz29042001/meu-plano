import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useWorkout } from '../hooks/useWorkout';
import { Colors, Radius, FontSize, Spacing } from '../utils/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { profile, signOut } = useAuth();
  const { nextWorkout, lastCompletion, todayCompletion, stats, loading } = useWorkout();

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Atleta';
  const programName = profile?.program?.name ?? 'Meu treino';
  const programDesc = profile?.program?.description ?? '';
  // Antes da migração o campo não existe (undefined) → dieta ativa por compatibilidade
  const dietEnabled = profile?.diet_enabled !== false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.avatarBtn}>
            <Text style={styles.avatarText}>
              {firstName[0]?.toUpperCase() ?? '?'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Next workout card (baseado no último treino, não no dia) */}
        {nextWorkout && (
          <TouchableOpacity
            style={styles.nextCard}
            onPress={() => navigation.navigate('Workout', { daySlug: nextWorkout.slug })}
            activeOpacity={0.9}
          >
            <View style={[styles.nextAccent, { backgroundColor: nextWorkout.color }]} />
            <View style={styles.nextContent}>
              <Text style={styles.nextLabel}>PRÓXIMO TREINO</Text>
              <Text style={[styles.nextTitle, { color: nextWorkout.color }]}>
                {nextWorkout.label}
              </Text>
              <Text style={styles.nextMuscles}>{nextWorkout.muscles}</Text>
              {lastCompletion?.workout_day && (
                <Text style={styles.nextHint}>
                  Último: {lastCompletion.workout_day.label}
                </Text>
              )}
            </View>
            <View style={[styles.playBtn, { backgroundColor: nextWorkout.color }]}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Stats — 2 cards (Total + status de hoje) */}
        {loading
          ? <ActivityIndicator color={Colors.textMuted} style={{ marginVertical: 16 }} />
          : (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: Colors.green }]}>
                  {stats?.total_workouts ?? 0}
                </Text>
                <Text style={styles.statLabel}>Treinos no total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: todayCompletion ? Colors.green : Colors.textMuted }]}>
                  {todayCompletion ? '✓' : '—'}
                </Text>
                <Text style={styles.statLabel}>
                  {todayCompletion ? 'Treinou hoje' : 'Sem treino hoje'}
                </Text>
              </View>
            </View>
          )}

        {/* Nav cards */}
        <Text style={styles.sectionTitle}>Explorar</Text>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate('Workout')}
          activeOpacity={0.9}
        >
          <View style={[styles.navIcon, { backgroundColor: Colors.pushColor + '26' }]}>
            <Text style={styles.navIconEmoji}>💪</Text>
          </View>
          <View style={styles.navInfo}>
            <Text style={styles.navTitle}>Treinos</Text>
            <Text style={styles.navSub}>{programDesc ? `${programName} · ${programDesc}` : programName}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, !dietEnabled && styles.navBtnDisabled]}
          onPress={() => navigation.navigate('Diet')}
          activeOpacity={0.9}
        >
          <View style={[styles.navIcon, { backgroundColor: dietEnabled ? Colors.green + '26' : Colors.surface }]}>
            <Text style={[styles.navIconEmoji, !dietEnabled && styles.dimmed]}>🥗</Text>
          </View>
          <View style={styles.navInfo}>
            <Text style={[styles.navTitle, !dietEnabled && { color: Colors.textFaint }]}>Dieta</Text>
            <Text style={styles.navSub}>
              {dietEnabled ? (profile?.diet_plan ? `${profile.diet_plan.name} · treino e descanso` : 'Dietas A e B · déficit calórico') : 'Pendente · em criação'}
            </Text>
          </View>
          {dietEnabled
            ? <Text style={styles.chevron}>›</Text>
            : <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>EM BREVE</Text></View>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate('Calendar')}
          activeOpacity={0.9}
        >
          <View style={[styles.navIcon, { backgroundColor: Colors.pullColor + '26' }]}>
            <Text style={styles.navIconEmoji}>📅</Text>
          </View>
          <View style={styles.navInfo}>
            <Text style={styles.navTitle}>Calendário</Text>
            <Text style={styles.navSub}>Histórico completo de treinos</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: 40, gap: Spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { fontSize: FontSize.md, color: Colors.textMuted },
  name: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, letterSpacing: -0.5, marginTop: 2 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.green },
  nextCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  nextAccent: { width: 4, alignSelf: 'stretch' },
  nextContent: { flex: 1, padding: Spacing.xl },
  nextLabel: {
    fontSize: FontSize.xs, color: Colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
  },
  nextTitle: { fontSize: FontSize.xl, fontWeight: '800', letterSpacing: -0.5 },
  nextMuscles: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: 3 },
  nextHint: { fontSize: FontSize.sm, color: Colors.textFaint, marginTop: 8 },
  playBtn: {
    width: 52, height: 52, borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.xl,
  },
  playIcon: { fontSize: 18, color: '#000', marginLeft: 3 },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800' },
  statLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.text,
    marginTop: Spacing.xs, marginBottom: -4,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  navBtnDisabled: { backgroundColor: Colors.bgElevated },
  dimmed: { opacity: 0.35 },
  pendingBadge: {
    backgroundColor: Colors.surface, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pendingBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textFaint, letterSpacing: 0.5 },
  navIcon: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  navIconEmoji: { fontSize: 26 },
  navInfo: { flex: 1 },
  navTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  navSub: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.textFaint },
});
