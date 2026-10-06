// Manchete do dia (spec §4): faixa de 6px na cor do dia + nome em Barlow caixa alta.
// A cor chega JÁ traduzida (dayColor do useTheme); aqui não se mexe em cor.
import React from 'react';
import { Text, View } from 'react-native';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, Spacing, Tracking, numberLineHeight } from '../utils/theme';

const LONG_LABEL = 10; // acima disso o nome cai de tamanho para caber
const LONG_RATIO = 0.78; // 72 -> 56

const useStyles = makeStyles(c => ({
  wrap: { flexDirection: 'row', gap: Spacing.lg },
  stripe: { width: 6, alignSelf: 'stretch' },
  body: { flex: 1 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  kicker: { fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, includeFontPadding: false },
  tag: {
    backgroundColor: c.text, paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  tagText: {
    fontFamily: Font.condSemi, fontSize: FontSize.sm, color: c.bg,
    textTransform: 'uppercase', letterSpacing: Tracking.caps, includeFontPadding: false,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.md },
  title: {
    flexShrink: 1, fontFamily: Font.condSemi, color: c.text, textTransform: 'uppercase',
    letterSpacing: Tracking.tighter, includeFontPadding: false,
  },
  muscles: {
    marginTop: Spacing.xs, fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted,
  },
}));

export function Tag({ label }: { label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

export function DayHeadline({
  label, color, muscles, kicker, tag, size = 'hero', right,
}: {
  label: string;
  color: string;
  muscles?: string;
  kicker?: string;
  tag?: string;
  size?: 'hero' | 'display';
  right?: React.ReactNode;
}) {
  const styles = useStyles();
  const base = size === 'hero' ? FontSize.hero : FontSize.display;
  const fontSize = label.length > LONG_LABEL ? Math.round(base * LONG_RATIO) : base;
  return (
    <View style={styles.wrap}>
      <View style={[styles.stripe, { backgroundColor: color }]} />
      <View style={styles.body}>
        {(kicker || tag) ? (
          <View style={styles.tagRow}>
            {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
            {tag ? <Tag label={tag} /> : null}
          </View>
        ) : null}
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { fontSize, lineHeight: numberLineHeight(fontSize) }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
            accessibilityRole="header"
          >
            {label}
          </Text>
          {right}
        </View>
        {muscles ? <Text style={styles.muscles}>{muscles}</Text> : null}
      </View>
    </View>
  );
}
