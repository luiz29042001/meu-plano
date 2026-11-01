/**
 * # Botões (`Buttons.tsx`)
 * Três botões padronizados, iguais nos dois temas: `PrimaryButton`, `OutlineButton` e `LinkButton`. Todos têm área de toque mínima e informam seu estado a leitores de tela.
 */
import React from 'react';
import { ActivityIndicator, Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../contexts/ThemeContext';
import { Font, FontSize, Radius, Spacing, Touch, Tracking } from '../utils/theme';

/**
 * Estilos dos três botões e seus estados (desativado, pressionado, "feito" em verde).
 */
const useStyles = makeStyles(c => ({
  primary: {
    minHeight: Touch.primary, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl,
    backgroundColor: c.primary, borderRadius: Radius.sm,
  },
  primaryDisabled: { backgroundColor: c.surface },
  done: { backgroundColor: c.green },
  doneHover: { backgroundColor: c.greenDim },
  doneText: { color: c.onGreen },
  primaryText: {
    fontFamily: Font.condSemi, fontSize: FontSize.title, color: c.onPrimary,
    textTransform: 'uppercase', letterSpacing: Tracking.caps, includeFontPadding: false,
  },
  primaryLead: {
    fontFamily: Font.condBold, fontSize: FontSize.xl, color: c.onPrimary, includeFontPadding: false,
  },
  primaryTextDisabled: { color: c.textFaint },
  outline: {
    minHeight: Touch.comfort, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, borderWidth: 1, borderColor: c.borderStrong,
    borderRadius: Radius.sm, backgroundColor: 'transparent',
  },
  outlineSoft: { borderColor: c.border },
  outlineHover: { backgroundColor: c.cardHover },
  outlineDisabled: { borderColor: c.border },
  outlineText: {
    fontFamily: Font.condSemi, fontSize: FontSize.lg, color: c.text,
    textTransform: 'uppercase', letterSpacing: Tracking.caps, includeFontPadding: false,
  },
  outlineTextRed: { color: c.red },
  outlineTextDisabled: { color: c.textFaint },
  link: { minHeight: Touch.min, justifyContent: 'center', paddingHorizontal: Spacing.xs },
  linkText: {
    fontFamily: Font.bodyMedium, fontSize: FontSize.base, color: c.text,
    textDecorationLine: 'underline', includeFontPadding: false,
  },
}));

/**
 * `BaseProps`: propriedades comuns — texto, ação ao tocar, desativado, descrição de acessibilidade e estilo extra.
 */
interface BaseProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * ## `PrimaryButton`
 * Ação principal da tela (tinta no tema claro, verde no escuro).
 *
 * - `loading` → mostra um indicador de carregamento e bloqueia o toque.
 * - `leadingText` → texto grande antes do rótulo (ex.: contador).
 * - `tone="done"` → versão verde para ações concluídas.
 * - Ao pressionar, escurece ligeiramente.
 *
  * Botão principal: tinta no claro, verde no escuro (token `primary`).
  */
export function PrimaryButton({
  label, onPress, disabled, loading, accessibilityLabel, style, leadingText, tone = 'default',
}: BaseProps & { loading?: boolean; leadingText?: string; tone?: 'default' | 'done' }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const off = !!disabled || !!loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: off, busy: !!loading }}
      style={({ pressed }) => [
        styles.primary,
        tone === 'done' && styles.done,
        disabled && !loading && styles.primaryDisabled,
        pressed && (tone === 'done' ? styles.doneHover : { opacity: 0.85 }),
        style,
      ]}
    >
      {loading && <ActivityIndicator color={tone === 'done' ? colors.onGreen : colors.onPrimary} />}
      {!loading && !!leadingText && <Text style={[styles.primaryLead, disabled && styles.primaryTextDisabled]}>{leadingText}</Text>}
      <Text
        style={[styles.primaryText, tone === 'done' && styles.doneText, disabled && !loading && styles.primaryTextDisabled]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * ## `OutlineButton`
 * Ação secundária, só com contorno. `tone="danger"` deixa o texto vermelho (ex.: "Sair da conta").
 *
  * Botão de contorno. `tone="danger"` = texto `red` e contorno discreto (Sair da conta).
  */
export function OutlineButton({
  label, onPress, disabled, accessibilityLabel, style, tone = 'default',
}: BaseProps & { tone?: 'default' | 'danger' }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.outline,
        tone === 'danger' && styles.outlineSoft,
        disabled && styles.outlineDisabled,
        pressed && styles.outlineHover,
        style,
      ]}
    >
      <Text
        style={[
          styles.outlineText,
          tone === 'danger' && styles.outlineTextRed,
          disabled && styles.outlineTextDisabled,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * ## `LinkButton`
 * Ação rara e discreta, no formato de link sublinhado, com área de toque de 44 px.
 *
  * Link de ação: Inter 500, sublinhado, área >= 44px. Só para ações raras e inline (nunca por série/refeição).
  */
export function LinkButton({ label, onPress, accessibilityLabel, style, disabled }: BaseProps) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }, style]}
    >
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}
