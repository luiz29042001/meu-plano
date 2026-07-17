import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useWorkout } from '../hooks/useWorkout';
import { Colors, Radius, FontSize } from '../utils/theme';
import { MONTH_NAMES } from '../utils/date';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { profile, signOut } = useAuth();
  const { todayWorkout, todayCompletion, stats, loading } = useWorkout();

  const now = new Date();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bem-vindo de volta</Text>
            <Text style={styles.name}>{profile?.full_name?.split(' ')[0] ?? 'Atleta'}</Text>
            <Text style={styles.meta}>85 kg · 1,80 m · 25 anos</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.avatarBtn}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today card */}
        {todayWorkout && (
          <TouchableOpacity
            style={[styles.todayCard, { borderColor: todayWorkout.color + '44' }]}
            onPress={() => navigation.navigate('Workout')}
            activeOpacity={0.85}
          >
            <View style={[styles.todayGlow, { backgroundColor: todayWorkout.color + '18' }]} />
            <Text style={styles.todayLabel}>HOJE</Text>
            <View style={styles.todayRow}>
              <View>
                <Text style={[styles.todayTitle, { color: todayWorkout.color }]}>
                  {todayWorkout.label}
                </Text>
                <Text style={styles.todayMuscles}>{todayWorkout.muscles}</Text>
              </View>
              {todayCompletion
                ? <Text style={styles.checkmark}>✅</Text>
                : <View style={[styles.checkBox, { borderColor: todayWorkout.color + '66' }]} />
              }
            </View>
            {todayCompletion && (
              <Text style={styles.completedMsg}>✓ Concluído hoje</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Stats row */}
        {loading
          ? <ActivityIndicator color={Colors.textMuted} style={{ marginVertical: 16 }} />
          : (
            <View style={styles.statsRow}>
              {[
                { label: 'Total de treinos', value: String(stats?.total_workouts ?? 0), color: Colors.green },
                { label: 'Sequência atual', value: `${stats?.current_streak ?? 0}🔥`, color: Colors.orange },
                { label: 'Maior sequência', value: String(stats?.longest_streak ?? 0), color: Colors.pullColor },
              ].map(s => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}

        {/* Month summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{MONTH_NAMES[now.getMonth()]}</Text>
        </View>

        {/* Nav buttons */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate('Workout')}
          activeOpacity={0.85}
        >
          <View style={[styles.navIcon, { backgroundColor: Colors.pushColor + '22' }]}>
            <Text style={styles.navIconEmoji}>💪</Text>
          </View>
          <View style={styles.navInfo}>
            <Text style={styles.navTitle}>Treinos</Text>
            <Text style={styles.navSub}>Push · Pull · Legs — 6 dias/semana</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate('Diet')}
          activeOpacity={0.85}
        >
          <View style={[styles.navIcon, { backgroundColor: Colors.green + '22' }]}>
            <Text style={styles.navIconEmoji}>🥗</Text>
          </View>
          <View style={styles.navInfo}>
            <Text style={styles.navTitle}>Dieta</Text>
            <Text style={styles.navSub}>
              Dietas A e B · ~2.400 kcal/dia
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate('Calendar')}
          activeOpacity={0.85}
        >
          <View style={[styles.navIcon, { backgroundColor: Colors.pullColor + '22' }]}>
            <Text style={styles.navIconEmoji}>📅</Text>
          </View>
          <View style={styles.navInfo}>
            <Text style={styles.navTitle}>Calendário</Text>
            <Text style={styles.navSub}>Histórico completo de treinos</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingBottom: 40, gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  greeting: { fontSize: FontSize.sm, color: Colors.textFaint, letterSpacing: 0.5, textTransform: 'uppercase' },
  name: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5, marginTop: 4 },
  meta: { fontSize: FontSize.sm, color: Colors.textFaint, marginTop: 2 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  todayCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xxl,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  todayGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  todayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  todayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  todayMuscles: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 3 },
  checkmark: { fontSize: 28 },
  checkBox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2 },
  completedMsg: { fontSize: FontSize.sm, color: Colors.green, fontWeight: '600', marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800' },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 3, textAlign: 'center' },
  sectionHeader: { marginTop: 4, marginBottom: 0 },
  sectionTitle: { fontSize: FontSize.sm, color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: 18,
  },
  navIcon: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  navIconEmoji: { fontSize: 24 },
  navInfo: { flex: 1 },
  navTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  navSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 20, color: Colors.textFaint },
});
