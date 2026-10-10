import React, {
  createContext, useContext, useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { Platform, Vibration, AppState } from 'react-native';
import type { TimerState } from '../types';
import {
  loadNotifPromptShown, loadTimerPosition, saveNotifPromptShown, saveTimerPosition,
  type TimerPosition,
} from '../services/devicePrefs';
import {
  cancelRestNotification, isNativeAlertArmed, requestNotificationPermission, startRestNotification,
} from '../services/restNotification';

export type { TimerPosition } from '../services/devicePrefs';

// ─── Contratos ───────────────────────────────────────────────────────────────
// O contexto é dividido em três para a tela de Treino não re-renderizar a cada
// segundo: só quem lê `timerState` (o FloatingTimer) acompanha o tick.

/** Ações estáveis (mesma referência durante toda a vida do app). */
export interface TimerActions {
  /** `color` = cor CRUA do banco (workout_days.color); o FloatingTimer traduz com dayColor. */
  launchTimer(label: string, seconds: number, color: string): void;
  closeTimer(): void;
  toggleTimer(): void;
  resetTimer(): void;
  setPreset(seconds: number): void;
  /** "+30 s": rodando, empurra o término; pausado/terminado, soma ao tempo parado. */
  addTime(seconds: number): void;
}

/** Posição e altura do painel. Muda só ao mover, medir, abrir ou fechar. */
export interface TimerLayout {
  position: TimerPosition;
  /** Atualiza na hora e salva no aparelho ('meu-plano:cronometro-posicao'). */
  setPosition(p: TimerPosition): void;
  /** Altura medida do painel; 0 quando o cronômetro está fechado. */
  panelHeight: number;
  /** Só o FloatingTimer chama (onLayout). */
  setPanelHeight(h: number): void;
  /** Altura de uma barra fixa acima da barra de abas (dock do treino); 0 quando não há. */
  bottomOffset: number;
  /** Só o WorkoutDock chama ao montar/desmontar. */
  setBottomOffset(h: number): void;
}

const ActionsContext = createContext<TimerActions | null>(null);
const StateContext = createContext<TimerState | null>(null);
const LayoutContext = createContext<TimerLayout | null>(null);

const DEFAULT: TimerState = {
  visible: false, seconds: 90, total: 90, running: false, label: '', color: '',
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
    // Android: se a notificação está armada com alarme exato, o próprio
    // sistema toca e vibra no horário (sem alerta duplicado, critério 35).
    if (isNativeAlertArmed()) return;
    // Sem notificação armada: vibração como hoje.
    Vibration.vibrate([0, 400, 200, 400, 200, 600]);
    // Com o app na frente, o aviso já foi dado: remove a contagem e o aviso
    // atrasado (alarme inexato) que ainda tocaria depois.
    if (AppState.currentState === 'active') void cancelRestNotification();
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

const remainingFrom = (endsAt: number) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

// ─── Provider ────────────────────────────────────────────────────────────────
// ARMADILHA 4: o tempo restante é sempre calculado a partir do horário de
// término (endsAtRef). Se o app for para segundo plano e o sistema congelar o
// intervalo, ao voltar o cronômetro mostra o tempo correto. A notificação do
// Android recebe apenas uma CÓPIA do endsAt; nada fora daqui o altera.
export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timerState, setTimerState] = useState<TimerState>(DEFAULT);
  // Espelho síncrono do estado: permite efeitos colaterais (notificação) fora
  // do updater do setState, sem depender de render.
  const stateRef = useRef<TimerState>(DEFAULT);
  const endsAtRef = useRef<number | null>(null);
  const firedRef = useRef(false);
  const notifAskedRef = useRef<boolean | null>(null); // null = ainda não lido

  const commit = useCallback((next: TimerState) => {
    stateRef.current = next;
    setTimerState(next);
  }, []);

  // ─── Notificação (Android; no-op na web) ──────────────────────────────────
  // Na primeira vez que um descanso começa, pede POST_NOTIFICATIONS (uma vez só).
  const armNotification = useCallback((endsAt: number, label: string) => {
    if (Platform.OS !== 'android') return;
    void (async () => {
      if (notifAskedRef.current === null) notifAskedRef.current = await loadNotifPromptShown();
      if (!notifAskedRef.current) {
        notifAskedRef.current = true;
        await saveNotifPromptShown();
        await requestNotificationPermission();
      }
      // O descanso pode ter sido pausado/fechado enquanto o diálogo estava aberto.
      if (endsAtRef.current !== endsAt) return;
      await startRestNotification({ endsAt, label });
    })();
  }, []);

  const disarmNotification = useCallback(() => {
    if (Platform.OS !== 'android') return;
    void cancelRestNotification();
  }, []);

  // ─── Tick ─────────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const endsAt = endsAtRef.current;
    if (endsAt === null) return;
    const prev = stateRef.current;
    if (!prev.running) return;
    const remaining = remainingFrom(endsAt);
    if (remaining <= 0) {
      endsAtRef.current = null;
      if (!firedRef.current) { firedRef.current = true; alertFinished(); }
      // Não cancela a notificação aqui: o alarme nativo pode estar tocando agora.
      commit({ ...prev, seconds: 0, running: false });
      return;
    }
    if (prev.seconds !== remaining) commit({ ...prev, seconds: remaining });
  }, [commit]);

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

  // ─── Ações ────────────────────────────────────────────────────────────────
  const launchTimer = useCallback((label: string, seconds: number, color: string) => {
    unlockAudio();
    firedRef.current = false;
    const endsAt = Date.now() + seconds * 1000;
    endsAtRef.current = endsAt;
    commit({ visible: true, seconds, total: seconds, running: true, label, color: color ?? '' });
    armNotification(endsAt, label);
  }, [commit, armNotification]);

  const closeTimer = useCallback(() => {
    endsAtRef.current = null;
    commit(DEFAULT);
    disarmNotification();
  }, [commit, disarmNotification]);

  const toggleTimer = useCallback(() => {
    unlockAudio();
    const prev = stateRef.current;
    if (prev.seconds === 0) {
      // Terminado → volta ao total, parado (remove o "Descanso terminado").
      endsAtRef.current = null;
      commit({ ...prev, seconds: prev.total, running: false });
      disarmNotification();
      return;
    }
    if (prev.running) {
      // Pausa congelando o tempo restante.
      const endsAt = endsAtRef.current;
      const seconds = endsAt === null ? prev.seconds : Math.max(1, remainingFrom(endsAt));
      endsAtRef.current = null;
      commit({ ...prev, seconds, running: false });
      disarmNotification();
      return;
    }
    firedRef.current = false;
    const endsAt = Date.now() + prev.seconds * 1000;
    endsAtRef.current = endsAt;
    commit({ ...prev, running: true });
    armNotification(endsAt, prev.label);
  }, [commit, armNotification, disarmNotification]);

  const resetTimer = useCallback(() => {
    endsAtRef.current = null;
    const prev = stateRef.current;
    commit({ ...prev, seconds: prev.total, running: false });
    disarmNotification();
  }, [commit, disarmNotification]);

  const setPreset = useCallback((seconds: number) => {
    endsAtRef.current = null;
    const prev = stateRef.current;
    commit({ ...prev, seconds, total: seconds, running: false });
    disarmNotification();
  }, [commit, disarmNotification]);

  const addTime = useCallback((seconds: number) => {
    if (!(seconds > 0)) return;
    const prev = stateRef.current;
    if (!prev.visible) return;
    if (prev.running && endsAtRef.current !== null) {
      const endsAt = endsAtRef.current + seconds * 1000;
      endsAtRef.current = endsAt;
      const remaining = remainingFrom(endsAt);
      commit({ ...prev, seconds: remaining, total: Math.max(prev.total + seconds, remaining) });
      armNotification(endsAt, prev.label); // reagenda o aviso e atualiza a contagem
      return;
    }
    // Pausado ou terminado: soma ao tempo parado (não inicia sozinho).
    firedRef.current = false;
    const next = prev.seconds + seconds;
    commit({ ...prev, seconds: next, total: Math.max(prev.total, next), running: false });
    if (prev.seconds === 0) disarmNotification(); // tira o "Descanso terminado"
  }, [commit, armNotification, disarmNotification]);

  const actions = useMemo<TimerActions>(() => ({
    launchTimer, closeTimer, toggleTimer, resetTimer, setPreset, addTime,
  }), [launchTimer, closeTimer, toggleTimer, resetTimer, setPreset, addTime]);

  // ─── Layout (posição salva no aparelho + altura medida) ────────────────────
  const [position, setPositionState] = useState<TimerPosition>('top');
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const [bottomOffset, setBottomOffsetState] = useState(0);
  const positionTouchedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    loadTimerPosition().then(p => {
      // Se o usuário já moveu antes da leitura terminar, vale a escolha dele.
      if (alive && !positionTouchedRef.current) setPositionState(p);
    });
    return () => { alive = false; };
  }, []);

  const setPosition = useCallback((p: TimerPosition) => {
    positionTouchedRef.current = true;
    setPositionState(p);
    void saveTimerPosition(p);
  }, []);

  const setPanelHeight = useCallback((h: number) => {
    const rounded = Math.max(0, Math.round(h));
    setMeasuredHeight(prev => (prev === rounded ? prev : rounded));
  }, []);

  const setBottomOffset = useCallback((h: number) => {
    const rounded = Math.max(0, Math.round(h));
    setBottomOffsetState(prev => (prev === rounded ? prev : rounded));
  }, []);

  const visible = timerState.visible;
  const layout = useMemo<TimerLayout>(() => ({
    position,
    setPosition,
    panelHeight: visible ? measuredHeight : 0,
    setPanelHeight,
    bottomOffset,
    setBottomOffset,
  }), [position, setPosition, visible, measuredHeight, setPanelHeight, bottomOffset, setBottomOffset]);

  return (
    <ActionsContext.Provider value={actions}>
      <LayoutContext.Provider value={layout}>
        <StateContext.Provider value={timerState}>
          {children}
        </StateContext.Provider>
      </LayoutContext.Provider>
    </ActionsContext.Provider>
  );
}

function required<T>(value: T | null, hook: string): T {
  if (value === null) throw new Error(`${hook} precisa estar dentro de <TimerProvider>`);
  return value;
}

/** Só as ações. Não re-renderiza com o tick (use na tela de Treino). */
export function useTimerActions(): TimerActions {
  return required(useContext(ActionsContext), 'useTimerActions');
}

/** Posição e altura do painel (para a tela reservar espaço em cima ou embaixo). */
export function useTimerLayout(): TimerLayout {
  return required(useContext(LayoutContext), 'useTimerLayout');
}

/** Estado do cronômetro (re-renderiza a cada segundo enquanto corre). */
export function useTimerState(): TimerState {
  return required(useContext(StateContext), 'useTimerState');
}

/** Compatível com o uso anterior: ações + estado (re-renderiza a cada segundo). */
export function useTimer(): TimerActions & { timerState: TimerState } {
  const actions = useTimerActions();
  const timerState = useTimerState();
  return useMemo(() => ({ ...actions, timerState }), [actions, timerState]);
}
