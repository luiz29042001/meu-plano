import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchWorkoutDays,
  fetchExerciseChecks,
  fetchTodayCompletion,
  fetchLastCompletion,
  upsertExerciseCheck,
  markWorkoutComplete,
  fetchUserStats,
  fetchExerciseNotes,
  saveExerciseNote,
} from '../services/workout';
import { getNextWorkoutDay } from '../utils/workoutSequence';
import { todayISO } from '../utils/date';
import { friendlyError, isTimeoutError, withTimeout, MSG_NETWORK, isNetworkError } from '../utils/errors';
import type { WorkoutDay, ExerciseCheck, WorkoutCompletion, UserStats, WorkoutStatus } from '../types';

const SAVE_TIMEOUT_MS = 20000;

export interface UseWorkoutOptions {
  /**
   * Recarrega em silêncio (sem spinner de tela cheia) sempre que a tela volta
   * a ficar em foco. Use na Home, para refletir o treino recém-concluído.
   */
  refreshOnFocus?: boolean;
}

export function useWorkout(options: UseWorkoutOptions = {}) {
  const { refreshOnFocus = false } = options;
  // Depende de userId (string), nunca do objeto `user`: o supabase-js cria um
  // objeto novo a cada volta à aba / renovação de token, o que recarregava tudo.
  const { userId, profile, profileStatus } = useAuth();
  const profilePending = profileStatus === 'idle' || profileStatus === 'loading';
  // Programa só conta quando o perfil carregou. Perfil com erro → undefined (RLS decide).
  const programId: number | null | undefined =
    profileStatus === 'ready' ? (profile?.program_id ?? null) : undefined;

  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [todayCompletion, setTodayCompletion] = useState<WorkoutCompletion | null>(null);
  const [lastCompletion, setLastCompletion] = useState<WorkoutCompletion | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadReq = useRef(0);   // descarta respostas de cargas antigas
  const notesReq = useRef(0);  // descarta anotações antigas que chegam depois de um saveNote

  const today = todayISO();

  const load = useCallback(async () => {
    if (!userId || profilePending) return;
    const req = ++loadReq.current;
    setRefreshing(true);
    setError(null);
    try {
      const [workoutDays, exerciseChecks, completion, last, userStats] = await Promise.all([
        fetchWorkoutDays(programId),
        fetchExerciseChecks(userId, today),
        fetchTodayCompletion(userId, today),
        fetchLastCompletion(userId),
        fetchUserStats(userId),
      ]);
      if (req !== loadReq.current) return;
      setDays(workoutDays);
      const checkMap: Record<number, boolean> = {};
      exerciseChecks.forEach((c: ExerciseCheck) => { checkMap[c.exercise_id] = c.checked; });
      setChecks(checkMap);
      setTodayCompletion(completion);
      setLastCompletion(last);
      setStats(userStats);
      setHasLoaded(true);
      // Anotações à parte: uma falha aqui nunca impede o treino de abrir
      const nReq = ++notesReq.current;
      fetchExerciseNotes(userId)
        .then(n => { if (nReq === notesReq.current) setNotes(n); })
        .catch(() => {});
    } catch (e) {
      if (req !== loadReq.current) return;
      setError(friendlyError(e, 'Não foi possível carregar seus treinos.'));
    } finally {
      if (req === loadReq.current) setRefreshing(false);
    }
  }, [userId, profilePending, programId, today]);

  useEffect(() => { load(); }, [load]);

  // Recarga silenciosa ao voltar o foco (ignora o primeiro foco: o efeito acima já carrega).
  const loadRef = useRef(load);
  loadRef.current = load;
  const firstFocus = useRef(true);
  useFocusEffect(useCallback(() => {
    if (!refreshOnFocus) return;
    if (firstFocus.current) { firstFocus.current = false; return; }
    loadRef.current();
  }, [refreshOnFocus]));

  const toggleCheck = useCallback(async (exerciseId: number, currentValue: boolean) => {
    if (!userId) return;
    const newValue = !currentValue;
    setChecks(prev => ({ ...prev, [exerciseId]: newValue }));
    try {
      await upsertExerciseCheck(userId, exerciseId, today, newValue);
    } catch {
      setChecks(prev => ({ ...prev, [exerciseId]: currentValue }));
    }
  }, [userId, today]);

  /**
   * Marca o treino do dia. Devolve true se salvou. Em caso de falha, `saveError`
   * traz a mensagem em pt-BR (no timeout avisa que pode ter sido salvo; repetir é seguro).
   */
  const completeWorkout = useCallback(async (workoutDayId: number): Promise<boolean> => {
    if (!userId) return false;
    setSaveError(null);
    try {
      const completion = await withTimeout(markWorkoutComplete(userId, workoutDayId, today), SAVE_TIMEOUT_MS);
      setTodayCompletion(completion);
      // Atualizações secundárias não bloqueiam a confirmação
      fetchLastCompletion(userId).then(setLastCompletion).catch(() => {});
      fetchUserStats(userId).then(setStats).catch(() => {});
      return true;
    } catch (e) {
      setSaveError(
        isTimeoutError(e)
          ? 'A conexão demorou. O treino pode já ter sido salvo; tocar de novo é seguro.'
          : isNetworkError(e)
            ? MSG_NETWORK
            : 'Não foi possível salvar. Tente de novo.'
      );
      return false;
    }
  }, [userId, today]);

  const saveNote = useCallback(async (exerciseId: number, text: string): Promise<boolean> => {
    if (!userId) return false;
    notesReq.current++; // uma carga de anotações em andamento não sobrescreve esta
    try {
      await withTimeout(saveExerciseNote(userId, exerciseId, text), SAVE_TIMEOUT_MS);
      setNotes(prev => {
        const next = { ...prev };
        const t = text.trim();
        if (t) next[exerciseId] = t; else delete next[exerciseId];
        return next;
      });
      return true;
    } catch {
      return false;
    }
  }, [userId]);

  // Próximo treino sugerido: baseado no ÚLTIMO treino concluído (armadilha 9),
  // não no dia da semana. Se ainda não há treino registrado, começa no primeiro dia.
  const lastSlug = lastCompletion?.workout_day?.slug ?? null;
  const nextWorkout = getNextWorkoutDay(days, lastSlug);

  // Estado para a tela decidir o que mostrar. Depois da 1ª carga, uma recarga
  // (foco, "Tentar de novo") nunca volta para 'loading': os dados ficam na tela.
  const status: WorkoutStatus = !hasLoaded
    ? (error ? 'error' : 'loading')
    : days.length === 0 ? 'empty' : 'ready';

  return {
    status,
    days,
    checks,
    todayCompletion,
    lastCompletion,
    nextWorkout,
    stats,
    /** Compatibilidade: true só no primeiro carregamento (status === 'loading'). */
    loading: status === 'loading',
    /** Recarga em andamento (inclusive a primeira). Para indicador discreto. */
    refreshing,
    /** Erro de carregamento em pt-BR. Com status 'ready', foi só a recarga que falhou. */
    error,
    /** Erro ao concluir o treino, em pt-BR. */
    saveError,
    toggleCheck,
    completeWorkout,
    notes,
    saveNote,
    /** Recarrega em silêncio (sem spinner de tela cheia). */
    refresh: load,
    /** Mesmo que refresh; nome para o botão "Tentar de novo". */
    retry: load,
  };
}
