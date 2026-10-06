import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, LineHeight, Spacing, Tracking, Touch, numberLineHeight } from '../utils/theme';
import { PrimaryButton } from '../components/Buttons';
import { ErrorBlock } from '../components/ErrorBlock';

const BENEFITS = [
  'Treino do seu programa',
  'Dieta da sua nutricionista',
  'Calendário dos seus treinos',
];

const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.bg },
  inner: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxxl },
  topSpace: { flexGrow: 38 },
  bottomSpace: { flexGrow: 62 },
  title: {
    fontFamily: Font.condSemi, fontSize: FontSize.hero, lineHeight: numberLineHeight(FontSize.hero),
    letterSpacing: Tracking.tighter, color: c.text, textTransform: 'uppercase', includeFontPadding: false,
  },
  lead: { marginTop: Spacing.lg, fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted, lineHeight: LineHeight.lg },
  list: { marginTop: Spacing.xxxl, borderTopWidth: 1, borderTopColor: c.border },
  item: {
    minHeight: Touch.comfort, justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  itemText: { fontFamily: Font.body, fontSize: FontSize.base, color: c.text },
  error: { marginTop: Spacing.xxl },
  button: { marginTop: Spacing.xxl },
  footnote: { marginTop: Spacing.lg, fontFamily: Font.body, fontSize: FontSize.md, color: c.textFaint },
}));

export function LoginScreen() {
  const styles = useStyles();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signIn();
    // Cancelou o Google: volta ao normal, sem mensagem.
    if (error && error.code !== 'cancelled') {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.topSpace} />

        <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.2} accessibilityRole="header">
          Meu Plano
        </Text>
        <Text style={styles.lead}>Seu treino, sua dieta e seu histórico, no seu celular.</Text>

        <View style={styles.list}>
          {BENEFITS.map(b => (
            <View key={b} style={styles.item}>
              <Text style={styles.itemText}>{b}</Text>
            </View>
          ))}
        </View>

        {error && (
          <View style={styles.error}>
            <ErrorBlock title="Não foi possível entrar." cause={error} />
          </View>
        )}

        <PrimaryButton
          style={styles.button}
          label={loading ? 'Entrando…' : 'Entrar com Google'}
          leadingText="G"
          loading={loading}
          onPress={handleSignIn}
        />

        <Text style={styles.footnote}>Seus dados ficam salvos na nuvem.</Text>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}
