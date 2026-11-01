/**
 * # Contexto do cronômetro de descanso (`TimerContext.tsx`)
 * Dono do cronômetro entre as séries. Calcula o tempo restante, toca o alerta no fim e conversa com a notificação do Android.
 *
 * > **Armadilha resolvida (4):** o tempo restante é sempre calculado a partir do **horário de término** (`endsAt`), nunca "subtraindo 1 a cada segundo". Se o app vai para segundo plano e o sistema congela o relógio, ao voltar o valor mostrado continua correto.
 */

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

/**
 * Reexporta o tipo da posição para quem importa deste arquivo.
 */
export type { TimerPosition } from '../services/devicePrefs';

/**
 * ## Contratos
 * O contexto é dividido em **três** (ações, estado, layout) para a tela de Treino não redesenhar a cada segundo: só quem lê o estado (`FloatingTimer`) acompanha o tique.
 */
// ─── Contratos ───────────────────────────────────────────────────────────────
// O contexto é dividido em três para a tela de Treino não re-renderizar a cada
// segundo: só quem lê `timerState` (o FloatingTimer) acompanha o tick.

/** Ações estáveis (mesma referência durante toda a vida do app). */
/**
 * ### `TimerActions`
 * Ações com referência estável (nunca mudam): `launchTimer` (iniciar), `closeTimer`, `toggleTimer` (pausar/retomar), `resetTimer`, `setPreset` (escolher duração) e `addTime` (somar segundos).
 */
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
/**
 * ### `TimerLayout`
 * Posição do painel (topo/rodapé), altura medida e deslocamento de uma barra fixa acima das abas (`bottomOffset`), com seus "setters".
 */
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

/**
 * Os três contextos: ações, estado e layout.
 */
const ActionsContext = createContext<TimerActions | null>(null);
const StateContext = createContext<TimerState | null>(null);
const LayoutContext = createContext<TimerLayout | null>(null);

/**
 * `DEFAULT`: estado inicial e estado "fechado" (90 s, parado, invisível).
 */
const DEFAULT: TimerState = {
  visible: false, seconds: 90, total: 90, running: false, label: '', color: '',
};

/**
 * ## Áudio e alerta
 * Um único `AudioContext` reaproveitado. No iPhone (Safari) o som só é liberado se for criado dentro de um **toque do usuário**; por isso `unlockAudio()` roda ao iniciar o cronômetro.
 */
let audioCtx: any = null;

/**
 * ### `unlockAudio()`
 * Só na web. Cria (ou retoma) o contexto de áudio durante um toque do usuário, requisito do Safari.
 */
function unlockAudio() {
  if (Platform.OS !== 'web') return;
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch {}
}

/**
 * ### `alertFinished()`
 * Avisa que o descanso acabou.
 *
 * **Android**
 * 1. Se a notificação nativa está armada, o sistema já toca e vibra: não faz nada (evita alerta duplicado).
 * 2. Senão, vibra com um padrão de pulsos.
 * 3. Com o app aberto, cancela a notificação para não tocar atrasada.
 *
 * **Web**
 * 1. Garante o áudio liberado.
 * 2. Define `beep` (oscilador + ganho com subida e descida suaves, com início e fim agendados).
 * 3. Toca três bipes (dois iguais e um mais agudo e longo) e vibra, se o aparelho permitir.
 */
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

/**
 * ### `remainingFrom(endsAt)`
 * Segundos que faltam até `endsAt`, arredondados para cima e nunca negativos.
 */
const remainingFrom = (endsAt: number) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

// ─── Provider ────────────────────────────────────────────────────────────────
// ARMADILHA 4: o tempo restante é sempre calculado a partir do horário de
// término (endsAtRef). Se o app for para segundo plano e o sistema congelar o
// intervalo, ao voltar o cronômetro mostra o tempo correto. A notificação do
// Android recebe apenas uma CÓPIA do endsAt; nada fora daqui o altera.
/**
 * ## `TimerProvider`
 * Componente que mantém o cronômetro e fornece os três contextos.
 */
export function TimerProvider({ children }: { children: React.ReactNode }) {
  // `timerState` é o que a tela mostra (segundos, rodando, rótulo...).
  const [timerState, setTimerState] = useState<TimerState>(DEFAULT);
  // `stateRef` é um espelho síncrono do estado: permite efeitos colaterais (notificação) fora do `setState`, sem depender de nova renderização.
  // Espelho síncrono do estado: permite efeitos colaterais (notificação) fora
  // do updater do setState, sem depender de render.
  const stateRef = useRef<TimerState>(DEFAULT);
  // `endsAtRef` guarda o **horário de término** em milissegundos (`null` = sem contagem). É a fonte da verdade do tempo.
  const endsAtRef = useRef<number | null>(null);
  // `firedRef` garante que o alerta de fim toque **uma vez** por contagem.
  const firedRef = useRef(false);
  // `notifAskedRef` lembra se a permissão de notificação já foi pedida (`null` = ainda não lido do aparelho).
  const notifAskedRef = useRef<boolean | null>(null); // null = ainda não lido

  // ### `commit(next)`
  // Atualiza espelho e estado juntos, mantendo-os sempre iguais.
  const commit = useCallback((next: TimerState) => {
    stateRef.current = next;
    setTimerState(next);
  }, []);

  // ## Notificação (Android; na web não faz nada)
  // ─── Notificação (Android; no-op na web) ──────────────────────────────────
  // Na primeira vez que um descanso começa, pede POST_NOTIFICATIONS (uma vez só).
  // ### `armNotification(endsAt, label)`
  // Liga a notificação com contagem.
  //
  // 1. Só no Android.
  // 2. Na **primeira vez** que um descanso começa, pede a permissão de notificação (uma única vez).
  // 3. Se o descanso foi pausado ou fechado enquanto o diálogo estava aberto, desiste.
  // 4. Inicia a notificação com o horário de término e o nome do exercício.
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

  // ### `disarmNotification()`
  // Cancela a notificação (só Android).
  const disarmNotification = useCallback(() => {
    if (Platform.OS !== 'android') return;
    void cancelRestNotification();
  }, []);

  // ## O "tique"
  // ─── Tick ─────────────────────────────────────────────────────────────────
  // ### `tick()`
  // Roda a cada 250 ms enquanto o cronômetro corre.
  //
  // 1. Sem horário de término ou parado → nada a fazer.
  // 2. Calcula o que falta.
  // 3. Chegou a zero → zera o horário, toca o alerta (uma vez) e para o cronômetro. A notificação **não** é cancelada aqui, porque o alarme nativo pode estar tocando agora.
  // 4. Senão, só atualiza a tela se o número de segundos mudou.
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

  // ### Efeito: relógio
  // Enquanto `running`, chama `tick` a cada 250 ms; ao parar, o `clearInterval` da limpeza desliga o relógio.
  useEffect(() => {
    if (!timerState.running) return;
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [timerState.running, tick]);

  // ### Efeito: voltar para o app
  // Quando o app volta ao primeiro plano (celular) ou a aba fica visível (navegador), chama `tick` na hora, em vez de esperar o próximo intervalo.
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

  // ## Ações
  // ─── Ações ────────────────────────────────────────────────────────────────
  // ### `launchTimer(label, seconds, color)`
  // Inicia uma contagem nova: libera o áudio, calcula o horário de término, abre o painel rodando e arma a notificação.
  const launchTimer = useCallback((label: string, seconds: number, color: string) => {
    unlockAudio();
    firedRef.current = false;
    const endsAt = Date.now() + seconds * 1000;
    endsAtRef.current = endsAt;
    commit({ visible: true, seconds, total: seconds, running: true, label, color: color ?? '' });
    armNotification(endsAt, label);
  }, [commit, armNotification]);

  // ### `closeTimer()`
  // Fecha o painel, volta ao estado inicial e cancela a notificação.
  const closeTimer = useCallback(() => {
    endsAtRef.current = null;
    commit(DEFAULT);
    disarmNotification();
  }, [commit, disarmNotification]);

  // ### `toggleTimer()`
  // Botão principal (pausar / retomar / reiniciar).
  //
  // 1. **Terminado** (0 s) → volta ao tempo total, parado, e remove o "Descanso terminado".
  // 2. **Rodando** → pausa congelando o tempo restante (mínimo 1 s) e cancela a notificação.
  // 3. **Parado** → retoma: calcula novo horário de término e rearma a notificação.
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

  // ### `resetTimer()`
  // Volta ao tempo total, parado.
  const resetTimer = useCallback(() => {
    endsAtRef.current = null;
    const prev = stateRef.current;
    commit({ ...prev, seconds: prev.total, running: false });
    disarmNotification();
  }, [commit, disarmNotification]);

  // ### `setPreset(seconds)`
  // Escolhe uma duração (ex.: 60, 90, 120 s) e para a contagem.
  const setPreset = useCallback((seconds: number) => {
    endsAtRef.current = null;
    const prev = stateRef.current;
    commit({ ...prev, seconds, total: seconds, running: false });
    disarmNotification();
  }, [commit, disarmNotification]);

  // ### `addTime(seconds)`
  // Soma tempo (botão "+30 s").
  //
  // 1. Ignora valores inválidos ou com o painel fechado.
  // 2. **Rodando** → empurra o horário de término, atualiza o total e reagenda a notificação.
  // 3. **Parado/terminado** → soma ao tempo parado (não inicia sozinho). Se estava em 0, remove o aviso de fim.
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

  // `actions` reúne as ações num objeto estável (`useMemo`), para quem as lê não redesenhar.
  const actions = useMemo<TimerActions>(() => ({
    launchTimer, closeTimer, toggleTimer, resetTimer, setPreset, addTime,
  }), [launchTimer, closeTimer, toggleTimer, resetTimer, setPreset, addTime]);

  // ## Layout (posição salva no aparelho e altura medida)
  // ─── Layout (posição salva no aparelho + altura medida) ────────────────────
  // Estados do layout: posição, altura medida do painel e deslocamento inferior.
  const [position, setPositionState] = useState<TimerPosition>('top');
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const [bottomOffset, setBottomOffsetState] = useState(0);
  // `positionTouchedRef` marca se a pessoa já moveu o painel antes de a leitura salva terminar.
  const positionTouchedRef = useRef(false);

  // ### Efeito: ler a posição salva
  // Se a pessoa já moveu o painel antes da leitura terminar, a escolha dela vale.
  useEffect(() => {
    let alive = true;
    loadTimerPosition().then(p => {
      // Se o usuário já moveu antes da leitura terminar, vale a escolha dele.
      if (alive && !positionTouchedRef.current) setPositionState(p);
    });
    return () => { alive = false; };
  }, []);

  // ### `setPosition(p)`
  // Move o painel e salva a escolha no aparelho.
  const setPosition = useCallback((p: TimerPosition) => {
    positionTouchedRef.current = true;
    setPositionState(p);
    void saveTimerPosition(p);
  }, []);

  // ### `setPanelHeight(h)`
  // Guarda a altura medida (arredondada). Só atualiza se mudou.
  const setPanelHeight = useCallback((h: number) => {
    const rounded = Math.max(0, Math.round(h));
    setMeasuredHeight(prev => (prev === rounded ? prev : rounded));
  }, []);

  // ### `setBottomOffset(h)`
  // Guarda o deslocamento inferior (arredondado). Só atualiza se mudou.
  const setBottomOffset = useCallback((h: number) => {
    const rounded = Math.max(0, Math.round(h));
    setBottomOffsetState(prev => (prev === rounded ? prev : rounded));
  }, []);

  // ### `layout`
  // Monta o objeto de layout. A altura do painel conta como 0 quando o cronômetro está fechado.
  const visible = timerState.visible;
  const layout = useMemo<TimerLayout>(() => ({
    position,
    setPosition,
    panelHeight: visible ? measuredHeight : 0,
    setPanelHeight,
    bottomOffset,
    setBottomOffset,
  }), [position, setPosition, visible, measuredHeight, setPanelHeight, bottomOffset, setBottomOffset]);

  // Aninha os três provedores; quem está dentro lê só o que precisa.
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

/**
 * ## `required(value, hook)`
 * Garante que o hook foi usado dentro do `TimerProvider`; senão lança um erro claro.
 */
function required<T>(value: T | null, hook: string): T {
  if (value === null) throw new Error(`${hook} precisa estar dentro de <TimerProvider>`);
  return value;
}

/**
 * ## `useTimerActions()`
 * Só as ações. Não redesenha com o tique (use na tela de Treino).
 *
  * Só as ações. Não re-renderiza com o tick (use na tela de Treino).
  */
export function useTimerActions(): TimerActions {
  return required(useContext(ActionsContext), 'useTimerActions');
}

/**
 * ## `useTimerLayout()`
 * Posição e altura do painel, para a tela reservar espaço.
 *
  * Posição e altura do painel (para a tela reservar espaço em cima ou embaixo).
  */
export function useTimerLayout(): TimerLayout {
  return required(useContext(LayoutContext), 'useTimerLayout');
}

/**
 * ## `useTimerState()`
 * O estado do cronômetro; redesenha a cada segundo enquanto corre.
 *
  * Estado do cronômetro (re-renderiza a cada segundo enquanto corre).
  */
export function useTimerState(): TimerState {
  return required(useContext(StateContext), 'useTimerState');
}

/**
 * ## `useTimer()`
 * Ações + estado juntos (compatível com o uso antigo). Redesenha a cada segundo.
 *
  * Compatível com o uso anterior: ações + estado (re-renderiza a cada segundo).
  */
export function useTimer(): TimerActions & { timerState: TimerState } {
  const actions = useTimerActions();
  const timerState = useTimerState();
  return useMemo(() => ({ ...actions, timerState }), [actions, timerState]);
}
