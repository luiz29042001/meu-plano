import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTimer } from '../contexts/TimerContext';
import { Colors, Radius, FontSize } from '../utils/theme';

const PRESETS = [30, 60, 75, 90, 120];
const R = 36;
const CIRC = 2 * Math.PI * R;

export function FloatingTimer() {
  const { timerState, closeTimer, toggleTimer, resetTimer, setPreset } = useTimer();

  if (!timerState.visible) return null;

  const { seconds, total, running, label, color } = timerState;
  const finished = seconds === 0 && !running;
  const pct = total > 0 ? seconds / total : 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
  const strokeDashoffset = CIRC * (1 - pct);

  return (
    <View style={[styles.container, { borderColor: finished ? Colors.green : color + '55' }]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <View style={styles.presets}>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPreset(p)}
              style={[styles.preset, total === p && { backgroundColor: color + '33' }]}
            >
              <Text style={[styles.presetText, total === p && { color }]}>{p}s</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={closeTimer} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main row */}
      <View style={styles.mainRow}>
        {/* Arc */}
        <View style={styles.arcContainer}>
          <Svg width={84} height={84}>
            <Circle cx={42} cy={42} r={R} fill="none" stroke={Colors.surface} strokeWidth={6} />
            <Circle
              cx={42} cy={42} r={R}
              fill="none"
              stroke={finished ? Colors.green : color}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={`${CIRC}`}
              strokeDashoffset={strokeDashoffset}
              rotation={-90}
              origin="42, 42"
            />
          </Svg>
          <View style={styles.arcCenter}>
            {finished
              ? <Text style={styles.finishedEmoji}>✅</Text>
              : (
                <>
                  <Text style={styles.timeText}>{timeStr}</Text>
                  <Text style={styles.timeLabel}>restante</Text>
                </>
              )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {finished && (
            <Text style={styles.finishedMsg}>✓ Descansou! Próxima série.</Text>
          )}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: finished ? Colors.green : running ? Colors.surface : color }]}
              onPress={toggleTimer}
            >
              <Text style={styles.mainBtnText}>
                {finished ? '↺ Reiniciar' : running ? '⏸ Pausar' : '▶ Iniciar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={resetTimer}>
              <Text style={styles.resetBtnText}>↺</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#18181B',
    borderRadius: Radius.xxl,
    borderWidth: 1.5,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 999,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  presets: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  preset: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  presetText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textFaint,
  },
  closeBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 4,
  },
  closeBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textFaint,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  arcContainer: {
    width: 84,
    height: 84,
    position: 'relative',
    flexShrink: 0,
  },
  arcCenter: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedEmoji: { fontSize: 28 },
  timeText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 22,
  },
  timeLabel: {
    fontSize: 8,
    color: Colors.textFaint,
    marginTop: 1,
  },
  controls: { flex: 1 },
  finishedMsg: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.green,
    marginBottom: 8,
  },
  btnRow: { flexDirection: 'row', gap: 8 },
  mainBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  mainBtnText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  resetBtn: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  resetBtnText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
