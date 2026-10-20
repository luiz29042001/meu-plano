// Cronômetro de descanso, flutuante sobre todas as telas (spec §6.3 e §12).
// - Duas posições fixas: base (padrão, completo) ou topo (compacto, abaixo do cabeçalho).
// - Mover: segurar ~350 ms e arrastar na vertical, ou o botão ↑/↓ (alternativa sem gesto).
// - ARMADILHA 4: aqui só se LÊ o estado. O tempo vem de `endsAt` no TimerContext;
//   mover o painel nunca toca nele. A cor do dia é traduzida na renderização.
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Platform, Pressable, Text, Vibration, View, type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useTimerActions, useTimerLayout, useTimerState, type TimerPosition,
} from '../contexts/TimerContext';
import { makeStyles, useTheme } from '../contexts/ThemeContext';
import { useRestNotification } from '../hooks/useRestNotification';
import { HEADER_HEIGHT } from './ScreenHeader';
import { OutlineButton, LinkButton } from './Buttons';
import { Font, FontSize, LineHeight, Radius, Spacing, Touch, Tracking, numberLineHeight } from '../utils/theme';

const PRESETS = [30, 60, 90, 120];
const LONG_PRESS_MS = 350;
const FLING_VELOCITY = 500; // px/s (= 0,5 px/ms)
const SNAP_MS = 220;
const PICK_SCALE = 1.02;
// Alturas aproximadas de cada posição, usadas só até a primeira medição real.
const EST_HEIGHT: Record<TimerPosition, number> = { bottom: 225, top: 112 };

type Geo = {
  H: number; h: number; pos: TimerPosition; topAnchor: number; hTop: number; hBottom: number; reduce: boolean;
};

/** Zona (topo/base) mais próxima do centro do painel. Roda na thread de UI. */
function nearestZone(center: number, g: Geo): TimerPosition {
  'worklet';
  const topCenter = g.topAnchor + g.hTop / 2;
  const bottomCenter = g.H - g.hBottom / 2;
  return Math.abs(center - topCenter) < Math.abs(center - bottomCenter) ? 'top' : 'bottom';
}

const webOnly: any = Platform.OS === 'web'
  ? { userSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'none' }
  : null;

const useStyles = makeStyles(c => ({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
  panel: {
    position: 'absolute', left: 0, right: 0,
    backgroundColor: c.bgElevated,
    paddingHorizontal: Spacing.xl,
    borderColor: c.border,
  },
  panelBottom: { bottom: 0, borderTopWidth: 1, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  panelTop: { borderBottomWidth: 1, paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  panelLifted: {
    borderColor: c.borderStrong, // só a cor muda: a espessura fica a mesma (altura estável no arraste)
    shadowColor: c.dragShadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24,
    elevation: 12,
  },
  progress: { position: 'absolute', left: 0, height: 3 },
  progressTop: { top: 0 },
  progressBottom: { bottom: 0 },
  handle: {
    position: 'absolute', alignSelf: 'center', width: 32, height: 4,
    borderRadius: Radius.pill, backgroundColor: c.textFaint, opacity: 0.6,
  },
  handleOnTop: { top: 6 },
  handleOnBottom: { bottom: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, includeFontPadding: false },
  labelDone: { fontFamily: Font.bodySemi, color: c.green },
  exercise: { flex: 1, fontFamily: Font.bodyMedium, fontSize: FontSize.md, color: c.text, includeFontPadding: false },
  time: {
    fontFamily: Font.condBold, fontSize: FontSize.timer, lineHeight: numberLineHeight(FontSize.timer),
    letterSpacing: Tracking.tighter, color: c.text, includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  timeCompact: { fontSize: FontSize.display, lineHeight: numberLineHeight(FontSize.display) },
  timeBlock: { marginTop: Spacing.xs, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1, alignSelf: 'auto' },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  compactBtn: { minWidth: 64, paddingHorizontal: Spacing.md, alignSelf: 'auto' },
  spacer: { flex: 1 },
  presetsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  preset: {
    flex: 1, maxWidth: Touch.primary, height: Touch.comfort, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border, borderRadius: Radius.sm,
  },
  presetOn: { borderColor: c.borderStrong, backgroundColor: c.surface },
  presetText: {
    fontFamily: Font.condSemi, fontSize: FontSize.lg, color: c.textMuted, includeFontPadding: false,
  },
  presetTextOn: { color: c.text },
  moveBtn: {
    width: Touch.min, height: Touch.comfort, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border, borderRadius: Radius.sm,
  },
  moveText: { fontFamily: Font.condSemi, fontSize: FontSize.xl, color: c.text, includeFontPadding: false },
  notice: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md,
    paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  noticeText: { flex: 1, fontFamily: Font.body, fontSize: FontSize.sm, color: c.textMuted, lineHeight: LineHeight.sm },
  zone: {
    position: 'absolute', left: Spacing.sm, right: Spacing.sm, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.borderStrong, borderRadius: Radius.lg, opacity: 0.45,
  },
  zoneActive: { opacity: 1, backgroundColor: c.surface },
  zoneText: {
    fontFamily: Font.condSemi, fontSize: FontSize.lg, color: c.textMuted,
    textTransform: 'uppercase', letterSpacing: Tracking.caps, includeFontPadding: false,
  },
}));

export function FloatingTimer() {
  const timerState = useTimerState();
  const { closeTimer, toggleTimer, setPreset, addTime } = useTimerActions();
  const { position, setPosition, setPanelHeight } = useTimerLayout();
  const styles = useStyles();
  const { colors, dayColor } = useTheme();
  const insets = useSafeAreaInsets();
  const rest = useRestNotification();
  const reduceMotion = useReducedMotion();

  const [layerH, setLayerH] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [activeZone, setActiveZone] = useState<TimerPosition | null>(null);
  const heights = useRef<Record<TimerPosition, number>>({ ...EST_HEIGHT });

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);
  const progress = useSharedValue(1);
  const lastZone = useSharedValue<TimerPosition | ''>('');
  const topAnchor = insets.top + HEADER_HEIGHT;
  const geo = useSharedValue<Geo>({
    H: 0, h: EST_HEIGHT[position], pos: position, topAnchor,
    hTop: EST_HEIGHT.top, hBottom: EST_HEIGHT.bottom, reduce: false,
  });

  const { visible, seconds, total, running, label, color } = timerState;
  const finished = seconds === 0 && !running;
  const compact = position === 'top';

  // Geometria para o gesto (thread de UI).
  useEffect(() => {
    geo.value = {
      H: layerH, h: heights.current[position], pos: position, topAnchor,
      hTop: heights.current.top, hBottom: heights.current.bottom, reduce: reduceMotion,
    };
  }, [geo, layerH, position, topAnchor, reduceMotion, visible]);

  // Mudou de posição: o painel já está na nova âncora, zera o deslocamento do arraste.
  useLayoutEffect(() => {
    translateY.value = 0;
    scale.value = 1;
    setDragging(false);
    setActiveZone(null);
  }, [position, translateY, scale]);

  // Linha de progresso: encolhe de forma contínua (1 s linear por tick enquanto corre).
  useEffect(() => {
    const pct = total > 0 ? seconds / total : 0;
    if (running && !reduceMotion) {
      const next = total > 0 ? Math.max(0, (seconds - 1) / total) : 0;
      progress.value = withTiming(next, { duration: 1000, easing: Easing.linear });
    } else {
      progress.value = withTiming(pct, { duration: reduceMotion ? 0 : 150 });
    }
  }, [seconds, total, running, reduceMotion, progress]);

  // Pulso único ao terminar (300 ms).
  useEffect(() => {
    if (finished && !reduceMotion) {
      pulse.value = withSequence(withTiming(0.4, { duration: 150 }), withTiming(1, { duration: 150 }));
    }
  }, [finished, reduceMotion, pulse]);

  const announce = useCallback((p: TimerPosition) => {
    AccessibilityInfo.announceForAccessibility(p === 'top' ? 'Cronômetro no topo' : 'Cronômetro na base');
  }, []);

  const moveTo = useCallback((p: TimerPosition) => {
    if (p === position) return;
    setPosition(p);
    announce(p);
  }, [position, setPosition, announce]);

  // ─── Callbacks chamados pelo gesto (JS) ────────────────────────────────────
  const onPick = useCallback((from: TimerPosition) => {
    setDragging(true);
    setActiveZone(from);
    if (Platform.OS === 'android') Vibration.vibrate(15);
  }, []);
  const onZone = useCallback((z: TimerPosition) => {
    setActiveZone(z);
    if (Platform.OS === 'android') Vibration.vibrate(10);
  }, []);
  const onDropped = useCallback((target: TimerPosition) => {
    if (Platform.OS === 'android') Vibration.vibrate(10);
    if (target === position) {
      // Ficou onde estava: só limpa o realce (a posição não muda, o layout effect não roda).
      scale.value = 1;
      setDragging(false);
      setActiveZone(null);
      return;
    }
    setPosition(target);
    announce(target);
  }, [position, setPosition, announce, scale]);
  const onCancelled = useCallback(() => {
    setDragging(false);
    setActiveZone(null);
  }, []);

  const pan = React.useMemo(() => Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .onStart(() => {
      scale.value = withTiming(PICK_SCALE, { duration: 120 });
      lastZone.value = geo.value.pos;
      runOnJS(onPick)(geo.value.pos);
    })
    .onUpdate(e => {
      translateY.value = e.translationY;
      const g = geo.value;
      const y0 = g.pos === 'top' ? g.topAnchor : g.H - g.h;
      const zone = nearestZone(y0 + g.h / 2 + e.translationY, g);
      if (zone !== lastZone.value) {
        lastZone.value = zone;
        runOnJS(onZone)(zone);
      }
    })
    .onEnd(e => {
      const g = geo.value;
      const y0 = g.pos === 'top' ? g.topAnchor : g.H - g.h;
      let target = nearestZone(y0 + g.h / 2 + e.translationY, g);
      // Soltou rápido: vale a direção do movimento.
      if (Math.abs(e.velocityY) > FLING_VELOCITY) target = e.velocityY < 0 ? 'top' : 'bottom';
      const goal = target === 'top' ? g.topAnchor - y0 : (g.H - g.h) - y0;
      if (g.reduce) {
        translateY.value = goal;
        scale.value = 1;
        runOnJS(onDropped)(target);
      } else {
        scale.value = withTiming(1, { duration: SNAP_MS });
        translateY.value = withTiming(goal, { duration: SNAP_MS, easing: Easing.out(Easing.cubic) }, done => {
          if (done) runOnJS(onDropped)(target);
        });
      }
    })
    .onFinalize((_e, success) => {
      if (!success) {
        scale.value = withTiming(1, { duration: 120 });
        translateY.value = withTiming(0, { duration: 120 });
        runOnJS(onCancelled)();
      }
    }), [geo, translateY, scale, lastZone, onPick, onZone, onDropped, onCancelled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));
  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, progress.value)) * 100}%`,
  }));
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const onPanelLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    heights.current[position] = h;
    setPanelHeight(h);
    geo.value = { ...geo.value, h, hTop: heights.current.top, hBottom: heights.current.bottom };
  };

  if (!visible) return null;

  const accent = finished ? colors.green : dayColor(color);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
  const timeA11y = `${mins} minutos e ${secs} segundos`;

  const moveLabel = compact ? 'Mover cronômetro para baixo' : 'Mover cronômetro para cima';
  const moveGlyph = compact ? '↓' : '↑';
  const doMove = () => moveTo(compact ? 'bottom' : 'top');

  const mainLabel = finished ? 'De novo' : running ? 'Pausar' : 'Continuar';
  const onMain = () => {
    // Terminado: o 1º toque volta ao total (parado), o 2º inicia de novo.
    if (finished) { toggleTimer(); toggleTimer(); return; }
    toggleTimer();
  };

  const title = finished ? 'Descanso terminado' : 'Descanso';

  const notice = rest.exactAlarmNoticePending ? (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>
        Para avisar na hora certa com a tela bloqueada, permita alarmes.
      </Text>
      <LinkButton
        label="Permitir"
        onPress={() => { rest.openExactAlarmSettings(); rest.dismissExactAlarmNotice(); }}
      />
      <LinkButton label="Dispensar" onPress={rest.dismissExactAlarmNotice} />
    </View>
  ) : null;

  const labelRow = (
    <View style={styles.labelRow}>
      <Text style={[styles.label, finished && styles.labelDone]}>{title}</Text>
      {!!label && <Text style={styles.exercise} numberOfLines={1}>{label}</Text>}
      <LinkButton label="Fechar" accessibilityLabel="Fechar cronômetro" onPress={closeTimer} />
    </View>
  );

  const moveButton = (
    <Pressable
      onPress={doMove}
      accessibilityRole="button"
      accessibilityLabel={moveLabel}
      style={({ pressed }) => [styles.moveBtn, pressed && { backgroundColor: colors.cardHover }]}
    >
      <Text style={styles.moveText}>{moveGlyph}</Text>
    </Pressable>
  );

  const timeText = (
    <Reanimated.Text
      style={[styles.time, compact && styles.timeCompact, pulseStyle]}
      maxFontSizeMultiplier={1.2}
      accessibilityRole="timer"
      accessibilityLabel={timeA11y}
      numberOfLines={1}
    >
      {timeStr}
    </Reanimated.Text>
  );

  return (
    <View
      style={styles.layer}
      pointerEvents="box-none"
      onLayout={e => setLayerH(Math.round(e.nativeEvent.layout.height))}
    >
      {dragging && layerH > 0 && (
        <>
          <View
            pointerEvents="none"
            style={[styles.zone, { top: topAnchor, height: heights.current.top }, activeZone === 'top' && styles.zoneActive]}
          >
            <Text style={styles.zoneText}>Soltar em cima</Text>
          </View>
          <View
            pointerEvents="none"
            style={[styles.zone, { bottom: 0, height: heights.current.bottom }, activeZone === 'bottom' && styles.zoneActive]}
          >
            <Text style={styles.zoneText}>Soltar embaixo</Text>
          </View>
        </>
      )}

      <GestureDetector gesture={pan}>
        <Reanimated.View
          onLayout={onPanelLayout}
          accessible={false}
          style={[
            styles.panel,
            compact
              ? [styles.panelTop, { top: topAnchor }]
              : [styles.panelBottom, { paddingBottom: Spacing.lg + insets.bottom }],
            dragging && styles.panelLifted,
            webOnly,
            animatedStyle,
          ]}
        >
          {/* Linha de progresso na borda que encosta no conteúdo */}
          <Reanimated.View
            pointerEvents="none"
            style={[
              styles.progress,
              compact ? styles.progressBottom : styles.progressTop,
              { backgroundColor: accent },
              progressStyle,
            ]}
          />
          <View
            pointerEvents="none"
            style={[styles.handle, compact ? styles.handleOnBottom : styles.handleOnTop]}
          />

          {notice}
          {labelRow}

          {compact ? (
            <View style={styles.compactRow}>
              {timeText}
              <View style={styles.spacer} />
              <OutlineButton label="+15 s" onPress={() => addTime(15)} style={styles.compactBtn} />
              <OutlineButton label={mainLabel} onPress={onMain} style={styles.compactBtn} />
              {moveButton}
            </View>
          ) : (
            <>
              <View style={styles.timeBlock}>{timeText}</View>
              <View style={styles.actions}>
                <OutlineButton label="+15 s" onPress={() => addTime(15)} style={styles.actionBtn} />
                <OutlineButton label={mainLabel} onPress={onMain} style={styles.actionBtn} />
              </View>
              <View style={styles.presetsRow}>
                {PRESETS.map(p => {
                  const on = total === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPreset(p)}
                      accessibilityRole="button"
                      accessibilityLabel={`Descanso de ${p} segundos`}
                      accessibilityState={{ selected: on }}
                      style={[styles.preset, on && styles.presetOn]}
                    >
                      <Text style={[styles.presetText, on && styles.presetTextOn]}>{p}s</Text>
                    </Pressable>
                  );
                })}
                <View style={styles.spacer} />
                {moveButton}
              </View>
            </>
          )}
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
}
