// Cabeçalho de 56px das telas internas: voltar (44x44) + título Barlow.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, Radius, Spacing, Touch, Tracking } from '../utils/theme';

export const HEADER_HEIGHT = 56;

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
