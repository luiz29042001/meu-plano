import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Vibration, AppState } from 'react-native';
import type { TimerState } from '../types';

interface TimerContextValue {
  timerState: TimerState;
  launchTimer: (label: string, seconds: number, color: string) => void;
  closeTimer: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  setPreset: (seconds: number) => void;
}

const TimerContext = createContext<TimerContextValue>({} as TimerContextValue);

const DEFAULT: TimerState = {
  visible: false, seconds: 90, total: 90, running: false, label: '', color: '#E8572A',
};

// ─── Áudio ───────────────────────────────────────────────────────────────────
// Um único AudioContext reaproveitado. No iPhone (Safari) o áudio só é liberado
// se o contexto for criado/retomado durante um toque do usuário, por isso
// chamamos unlockAudio() ao iniciar o cronômetro.
let audioCtx: any = null;

function unlockAudio() {
  if (Platform.OS !== 'web') return;
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch {}
}

function alertFinished() {
  if (Platform.OS !== 'web') {
    // Android/iOS nativo: vibração como alerta
    Vibration.vibrate([0, 400, 200, 400, 200, 600]);
    return;
  }
  try {
    unlockAudio();
    const ctx = audioCtx;
    if (!ctx) return;
    const beep = (freq: number, start: number, dur: number, vol = 0.4) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.01);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    beep(880, 0, 0.12);
    beep(880, 0.18, 0.12);
    beep(1100, 0.36, 0.25, 0.5);
    (navigator as any).vibrate?.([300, 150, 300]);
  } catch {}
}

// ─── Provider ────────────────────────────────────────────────────────────────
// O tempo restante é sempre calculado a partir do horário de término (endsAt).
// Assim, se o app for para segundo plano e o sistema congelar o intervalo,
// ao voltar o cronômetro mostra o tempo correto em vez de ficar "atrasado".
export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timerState, setTimerState] = useState<TimerState>(DEFAULT);
  const endsAtRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const tick = useCallback(() => {
    const endsAt = endsAtRef.current;
    if (endsAt === null) return;
    const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    setTimerState(prev => {
      if (!prev.running) return prev;
      if (remaining <= 0) {
        endsAtRef.current = null;
        if (!firedRef.current) { firedRef.current = true; alertFinished(); }
        return { ...prev, seconds: 0, running: false };
      }
      return prev.seconds === remaining ? prev : { ...prev, seconds: remaining };
    });
  }, []);

  useEffect(() => {
    if (!timerState.running) return;
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [timerState.running, tick]);

  // Recalcula imediatamente ao voltar para o app (nativo e web)
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s === 'active') tick(); });
    let onVis: (() => void) | null = null;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      onVis = () => { if (document.visibilityState === 'visible') tick(); };
      document.addEventListener('visibilitychange', onVis);
    }
    return () => {
      sub.remove();
      if (onVis) document.removeEventListener('visibilitychange', onVis);
    };
  }, [tick]);

  const launchTimer = useCallback((label: string, seconds: number, color: string) => {
    unlockAudio();
    firedRef.current = false;
    endsAtRef.current = Date.now() + seconds * 1000;
    setTimerState({ visible: true, seconds, total: seconds, running: true, label, color });
  }, []);

  const closeTimer = useCallback(() => {
    endsAtRef.current = null;
    setTimerState(DEFAULT);
  }, []);

  const toggleTimer = useCallback(() => {
    unlockAudio();
    setTimerState(prev => {
      if (prev.seconds === 0) {
        // Terminado → volta ao total, parado
        endsAtRef.current = null;
        return { ...prev, seconds: prev.total, running: false };
      }
      if (prev.running) {
        endsAtRef.current = null; // pausa congelando o tempo restante
        return { ...prev, running: false };
      }
      firedRef.current = false;
      endsAtRef.current = Date.now() + prev.seconds * 1000;
      return { ...prev, running: true };
    });
  }, []);

  const resetTimer = useCallback(() => {
    endsAtRef.current = null;
    setTimerState(prev => ({ ...prev, seconds: prev.total, running: false }));
  }, []);

  const setPreset = useCallback((seconds: number) => {
    endsAtRef.current = null;
    setTimerState(prev => ({ ...prev, seconds, total: seconds, running: false }));
  }, []);

  return (
    <TimerContext.Provider value={{ timerState, launchTimer, closeTimer, toggleTimer, resetTimer, setPreset }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
