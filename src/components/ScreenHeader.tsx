/**
 * # `ScreenHeader`
 * Cabeçalho de 56 px das telas internas: botão de voltar (44×44) e título.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, Radius, Spacing, Touch, Tracking } from '../utils/theme';

/**
 * `HEADER_HEIGHT`: altura fixa, exportada para as telas calcularem espaços.
 */
export const HEADER_HEIGHT = 56;

/**
 * Estilos do cabeçalho, botão voltar, título e subtítulo.
 */
const useStyles = makeStyles(c => ({
  header: {
    height: HEADER_HEIGHT, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, gap: Spacing.xs,
  },
  headerNoBack: { paddingHorizontal: Spacing.xl },
  back: {
    width: Touch.min, height: Touch.min, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  backHover: { backgroundColor: c.cardHover },
  backText: {
    fontFamily: Font.condMedium, fontSize: FontSize.xxl, color: c.text,
    includeFontPadding: false, lineHeight: FontSize.xxl,
  },
  titleWrap: { flex: 1 },
  sub: {
    fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted,
    includeFontPadding: false,
  },
  title: {
    fontFamily: Font.condSemi, fontSize: FontSize.xl, color: c.text,
    textTransform: 'uppercase', letterSpacing: Tracking.caps, includeFontPadding: false,
  },
  right: { alignItems: 'center', justifyContent: 'center' },
}));

/**
 * ## `ScreenHeader({ title, subtitle, right, back })`
 * - `back` (padrão `true`) → mostra a seta "‹" que volta uma tela.
 * - `subtitle` → linha pequena acima do título.
 * - `right` → elemento opcional à direita (ex.: um botão).
 */
export function ScreenHeader({
  title, subtitle, right, back = true,
}: { title: string; subtitle?: string; right?: React.ReactNode; back?: boolean }) {
  const styles = useStyles();
  const navigation = useNavigation<any>();
  return (
    <View style={[styles.header, !back && styles.headerNoBack]}>
      {back ? (
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={({ pressed }) => [styles.back, pressed && styles.backHover]}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      ) : null}
      <View style={styles.titleWrap}>
        {subtitle ? <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text> : null}
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">{title}</Text>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}
