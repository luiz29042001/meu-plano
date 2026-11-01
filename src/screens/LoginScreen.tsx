/**
 * # `LoginScreen` — tela de entrada
 * Primeira tela para quem ainda não fez login: apresentação curta do app e o botão **Entrar com Google**.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, LineHeight, Spacing, Tracking, Touch, numberLineHeight } from '../utils/theme';
import { PrimaryButton } from '../components/Buttons';
import { ErrorBlock } from '../components/ErrorBlock';
import { Notice } from '../components/Notice';
import { useOnline } from '../hooks/useOnline';

/**
 * `BENEFITS`: os três benefícios listados na tela.
 */
const BENEFITS = [
  'Treino do seu programa',
  'Dieta da sua nutricionista',
  'Calendário dos seus treinos',
];

/**
 * Estilos da tela. `topSpace` e `bottomSpace` usam proporções (38/62) para centralizar o bloco um pouco acima do meio.
 */
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

/**
 * ## `LoginScreen()`
 * Estados: `loading` (login em andamento) e `error` (mensagem em português).
 */
export function LoginScreen() {
  const styles = useStyles();
  const { signIn } = useAuth();
  // `online` vem do hook `useOnline`: sem internet, a tela avisa antes de a pessoa tentar.
  const online = useOnline();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ### `handleSignIn()`
  // 1. Liga o carregamento e limpa o erro anterior.
  // 2. Chama o login com Google.
  // 3. Se a pessoa **cancelou**, volta ao normal sem mensagem; qualquer outro erro é exibido.
  // 4. Desliga o carregamento.
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

  // Estrutura: título, frase de apresentação, lista de benefícios, avisos (sem internet / erro), botão de login e nota de rodapé.
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

        {!online && (
          <View style={styles.error}>
            <Notice tone="neutral" text="Sem internet. Conecte-se para entrar." />
          </View>
        )}

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
