import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  visible: false,
  seconds: 90,
  total: 90,
  running: false,
  label: '',
  color: '#E8572A',
};

function playBeep() {
  // Web Audio API beep — works in Expo web/bare
  try {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
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
  } catch {}
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timerState, setTimerState] = useState<TimerState>(DEFAULT);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerState.running) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (!prev.running) return prev;
          if (prev.seconds <= 1) {
            clearInterval(intervalRef.current!);
            playBeep();
            return { ...prev, seconds: 0, running: false };
          }
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState.running]);

  const launchTimer = useCallback((label: string, seconds: number, color: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState({ visible: true, seconds, total: seconds, running: true, label, color });
  }, []);

  const closeTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState(DEFAULT);
  }, []);

  const toggleTimer = useCallback(() => {
    setTimerState(prev => {
      if (prev.seconds === 0) return { ...prev, seconds: prev.total, running: false };
      return { ...prev, running: !prev.running };
    });
  }, []);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState(prev => ({ ...prev, seconds: prev.total, running: false }));
  }, []);

  const setPreset = useCallback((seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState(prev => ({ ...prev, seconds, total: seconds, running: false }));
  }, []);

  return (
    <TimerContext.Provider value={{ timerState, launchTimer, closeTimer, toggleTimer, resetTimer, setPreset }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
