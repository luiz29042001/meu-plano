/**
 * # `BottomBar`
 * Barra de navegação inferior (Início / Treino / Dieta). Fica **no fluxo da tela**, abaixo da navegação, então o conteúdo já termina acima dela.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles } from '../contexts/ThemeContext';
import { Font, FontSize, Layout, Tracking } from '../utils/theme';

/**
 * `BarItem`: os três destinos possíveis.
 */
export type BarItem = 'Home' | 'Workout' | 'Diet';

/**
 * `ITEMS`: nome da rota, texto exibido e descrição para leitores de tela.
 */
const ITEMS: { name: BarItem; label: string; a11y: string }[] = [
  { name: 'Home', label: 'Início', a11y: 'Ir para Início' },
  { name: 'Workout', label: 'Treino', a11y: 'Ir para Treino' },
  { name: 'Diet', label: 'Dieta', a11y: 'Ir para Dieta' },
];

/**
 * Estilos: faixa de 3 px no topo do item ativo e rótulos em maiúsculas.
 */
const useStyles = makeStyles(c => ({
  bar: { flexDirection: 'row', backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.border },
  cell: { flex: 1, minHeight: Layout.BAR_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  cellHover: { backgroundColor: c.cardHover },
  indicator: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: c.text },
  label: {
    fontFamily: Font.condSemi, fontSize: FontSize.lg, lineHeight: FontSize.lg + 4, color: c.textMuted,
    textTransform: 'uppercase', letterSpacing: Tracking.caps, includeFontPadding: false,
  },
  labelActive: { color: c.text },
}));

/**
 * ## `BottomBar({ active, onPress })`
 * 1. Lê a área segura do aparelho (`insets`) para não ficar atrás da barra de gestos.
 * 2. Desenha um botão por item; o ativo recebe o indicador e o texto forte.
 * 3. Ao tocar, chama `onPress` com o nome do destino.
 */
export function BottomBar({
  active, onPress,
}: { active: BarItem; onPress: (name: BarItem) => void }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
      {ITEMS.map(it => {
        const selected = it.name === active;
        return (
          <Pressable
            key={it.name}
            onPress={() => onPress(it.name)}
            accessibilityRole="button"
            accessibilityLabel={it.a11y}
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.cell, pressed && styles.cellHover]}
          >
            {selected ? <View style={styles.indicator} /> : null}
            <Text style={[styles.label, selected && styles.labelActive]} numberOfLines={1}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
