import React, { useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Radius, FontSize } from '../utils/theme';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signIn();
    if (error && error.message !== 'Sign in cancelled') {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
	<SafeAreaView style={styles.container}>
	  <ScrollView
 	   contentContainerStyle={styles.inner}
 	   showsVerticalScrollIndicator={false}
	  >
        <View style={styles.header}>
          <Text style={styles.emoji}>💪</Text>
          <Text style={styles.title}>Meu Plano</Text>
          <Text style={styles.subtitle}>Treino · Dieta · Resultados</Text>
        </View>

        <View style={styles.cards}>
          {[
            { icon: '🏋️', label: 'Push · Pull · Legs', sub: '6 dias/semana' },
            { icon: '🥗', label: 'Dieta personalizada', sub: '~2.400 kcal/dia' },
            { icon: '📅', label: 'Histórico completo', sub: 'Calendário e métricas' },
          ].map(item => (
            <View key={item.label} style={styles.card}>
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <View>
                <Text style={styles.cardLabel}>{item.label}</Text>
                <Text style={styles.cardSub}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.bg} />
            : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>Entrar com Google</Text>
              </>
            )}
        </TouchableOpacity>

        <Text style={styles.footnote}>
          Seus dados ficam salvos na nuvem e sincronizados automaticamente.
        </Text>
	</ScrollView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 24,
  },
  header: { alignItems: 'center', gap: 8 },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  cards: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
  },
  cardIcon: { fontSize: 28 },
  cardLabel: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text },
  cardSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  errorBox: {
    backgroundColor: '#2A1010',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C0392B44',
  },
  errorText: { color: '#E74C3C', fontSize: FontSize.sm },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.text,
    borderRadius: Radius.lg,
    paddingVertical: 16,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.bg,
    fontFamily: 'serif',
  },
  googleText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.bg,
  },
  footnote: {
    fontSize: FontSize.sm,
    color: Colors.textFaint,
    textAlign: 'center',
    lineHeight: 16,
  },
});
