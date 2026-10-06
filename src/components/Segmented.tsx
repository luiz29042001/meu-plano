// Escolha em segmentos colados (spec §4): 48px, contorno `border`;
// selecionado = contorno `borderStrong`, fundo `surface`, texto `text`.
// `radiogroup` + `radio` com estado `checked` para leitores de tela.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, Spacing, Touch, Tracking } from '../utils/theme';

const useStyles = makeStyles(c => ({
  group: { flexDirection: 'row' },
  segment: {
    flex: 1, height: Touch.comfort, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border, paddingHorizontal: Spacing.xs,
  },
  segmentNext: { marginLeft: -1 },
  segmentSelected: { borderColor: c.borderStrong, backgroundColor: c.surface, zIndex: 1 },
  text: {
    fontFamily: Font.condSemi, fontSize: FontSize.base, color: c.textMuted,
    textTransform: 'uppercase', letterSpacing: Tracking.caps, includeFontPadding: false,
  },
  textSelected: { color: c.text },
}));

export function Segmented<T extends string>({
  options, value, onChange, label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ checked: selected }}
            style={[styles.segment, i > 0 && styles.segmentNext, selected && styles.segmentSelected]}
          >
            <Text style={[styles.text, selected && styles.textSelected]} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
