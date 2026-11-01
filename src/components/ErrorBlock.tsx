/**
 * # `ErrorBlock`
 * Bloco padrão de erro: frase em destaque, causa em cinza, faixa vermelha à esquerda e botão "Tentar de novo".
 */
import React from 'react';
import { Text, View } from 'react-native';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, LineHeight, Spacing } from '../utils/theme';
import { OutlineButton } from './Buttons';

/**
 * Estilos: faixa vermelha de 6 px, título e causa com as fontes do tema.
 */
const useStyles = makeStyles(c => ({
  wrap: { flexDirection: 'row', gap: Spacing.lg },
  stripe: { width: 6, alignSelf: 'stretch', backgroundColor: c.red },
  body: { flex: 1, gap: Spacing.sm },
  title: { fontFamily: Font.bodySemi, fontSize: FontSize.lg, color: c.text },
  cause: { fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted, lineHeight: LineHeight.base },
  retry: { marginTop: Spacing.sm },
}));

/**
 * ## `ErrorBlock({ title, cause, onRetry })`
 * - `title` → o que deu errado.
 * - `cause` → detalhe opcional.
 * - `onRetry` → se informado, aparece o botão de nova tentativa.
 *
 * `accessibilityRole="alert"` faz leitores de tela anunciarem o erro.
 */
export function ErrorBlock({
  title, cause, onRetry,
}: { title: string; cause?: string | null; onRetry?: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <View style={styles.stripe} />
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {cause ? <Text style={styles.cause}>{cause}</Text> : null}
        {onRetry ? <OutlineButton label="Tentar de novo" onPress={onRetry} style={styles.retry} /> : null}
      </View>
    </View>
  );
}
