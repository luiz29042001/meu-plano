/**
 * # `useWorkout`
 * O hook mais importante do app. Reúne tudo da tela de **Treino** e da **Início**: dias, exercícios, marcações do dia, conclusão, estatísticas da semana, próximo treino e anotações.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
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
  fetchRecentCompletionDates,
} from '../services/workout';
import { getNextWorkoutDay } from '../utils/workoutSequence';
import { todayISO } from '../utils/date';
import { weekCount, weekDates, weeksAgoISO } from '../utils/weekStats';
import { reportNetworkError, reportNetworkOk } from '../utils/networkStatus';
import { friendlyError, isTimeoutError, withTimeout, MSG_NETWORK, isNetworkError } from '../utils/errors';
import type { WorkoutDay, ExerciseCheck, WorkoutCompletion, UserStats, WorkoutStatus } from '../types';

/**
 * `SAVE_TIMEOUT_MS`: prazo máximo (20 s) para salvar antes de avisar que a conexão está lenta.
 */
const SAVE_TIMEOUT_MS = 20000;

/**
 * ## `UseWorkoutOptions`
 * - `refreshOnFocus` → recarrega em silêncio (sem spinner) cada vez que a tela volta ao foco. Usado na Início para refletir o treino recém-concluído.
 */
export interface UseWorkoutOptions {
  /**
   * Recarrega em silêncio (sem spinner de tela cheia) sempre que a tela volta
   * a ficar em foco. Use na Home, para refletir o treino recém-concluído.
   */
  refreshOnFocus?: boolean;
}

/**
 * ## `useWorkout(options)`
 * Devolve estado e ações. As seções abaixo seguem a ordem do código.
 */
export function useWorkout(options: UseWorkoutOptions = {}) {
  const { refreshOnFocus = false } = options;
  // ### Quem é o usuário
  // Depende do `userId` (texto), nunca do objeto `user`: o supabase-js cria um objeto novo a cada volta à aba, o que recarregava tudo.
  // Depende de userId (string), nunca do objeto `user`: o supabase-js cria um
  // objeto novo a cada volta à aba / renovação de token, o que recarregava tudo.
  const { userId, profile, profileStatus } = useAuth();
  // `profilePending`: o perfil ainda está carregando?
  const profilePending = profileStatus === 'idle' || profileStatus === 'loading';
  // `programId`: só conta com o perfil carregado. Perfil com erro → `undefined` (o RLS decide).
  // Programa só conta quando o perfil carregou. Perfil com erro → undefined (RLS decide).
  const programId: number | null | undefined =
    profileStatus === 'ready' ? (profile?.program_id ?? null) : undefined;

  // ### Estados
  // Dados da tela (dias, marcações, conclusões, totais, datas, anotações) e flags (`hasLoaded`, `refreshing`) e mensagens de erro separadas para carregar, salvar e marcar.
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [todayCompletion, setTodayCompletion] = useState<WorkoutCompletion | null>(null);
  const [lastCompletion, setLastCompletion] = useState<WorkoutCompletion | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentDates, setRecentDates] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Contadores de requisição: respostas de cargas antigas são **descartadas**.
  const loadReq = useRef(0);   // descarta respostas de cargas antigas
  const notesReq = useRef(0);  // descarta anotações antigas que chegam depois de um saveNote

  // ### Virada do dia
  // Ao voltar para o app, força nova renderização. Se virou o dia, `today` muda e os dados recarregam.
  // Re-renderiza ao voltar para o app: se virou o dia, `today` muda e os dados recarregam.
  const [, setDayTick] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s === 'active') setDayTick(n => n + 1); });
    return () => sub.remove();
  }, []);
  // `today`: data de hoje no fuso local.
  const today = todayISO();

  // ### `load()`
  // Carrega tudo da tela.
  //
  // 1. Sai se não há usuário ou o perfil ainda carrega.
  // 2. Numera a carga e liga o indicador de recarga.
  // 3. Busca **em paralelo** (`Promise.all`): dias, marcações, conclusão de hoje, última conclusão e totais.
  // 4. Descarta se uma carga mais nova começou.
  // 5. Converte as marcações para o formato `{ exercício: feito }`.
  // 6. Guarda tudo e marca `hasLoaded`.
  // 7. Em paralelo, mas **separadas**: datas recentes (para a semana) e anotações. Se falharem, a tela abre mesmo assim.
  // 8. Erro → avisa a rede e guarda a mensagem amigável.
  // 9. `finally` → desliga o indicador.
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
      reportNetworkOk();
      setDays(workoutDays);
      const checkMap: Record<number, boolean> = {};
      exerciseChecks.forEach((c: ExerciseCheck) => { checkMap[c.exercise_id] = c.checked; });
      setChecks(checkMap);
      setTodayCompletion(completion);
      setLastCompletion(last);
      setStats(userStats);
      setHasLoaded(true);
      // Datas recentes à parte (semana na Home): falha aqui não derruba a tela.
      fetchRecentCompletionDates(userId, weeksAgoISO(12))
        .then(d => { if (req === loadReq.current) setRecentDates(d); })
        .catch(() => {});
      // Anotações à parte: uma falha aqui nunca impede o treino de abrir
      const nReq = ++notesReq.current;
      fetchExerciseNotes(userId)
        .then(n => { if (nReq === notesReq.current) setNotes(n); })
        .catch(() => {});
    } catch (e) {
      if (req !== loadReq.current) return;
      if (isNetworkError(e)) reportNetworkError();
      setError(friendlyError(e, 'Não foi possível carregar seus treinos.'));
    } finally {
      if (req === loadReq.current) setRefreshing(false);
    }
  }, [userId, profilePending, programId, today]);

  // Carrega na primeira vez e sempre que algo de que `load` depende mudar.
  useEffect(() => { load(); }, [load]);

  // ### Recarga ao voltar o foco
  // `useFocusEffect` roda quando a tela ganha foco. Pula o primeiro foco (o efeito acima já carrega) e depois recarrega em silêncio. `loadRef` guarda sempre a versão mais nova de `load`.
  // Recarga silenciosa ao voltar o foco (ignora o primeiro foco: o efeito acima já carrega).
  const loadRef = useRef(load);
  loadRef.current = load;
  const firstFocus = useRef(true);
  useFocusEffect(useCallback(() => {
    if (!refreshOnFocus) return;
    if (firstFocus.current) { firstFocus.current = false; return; }
    loadRef.current();
  }, [refreshOnFocus]));

  // ### `toggleCheck(exerciseId, currentValue)`
  // Marca/desmarca um exercício.
  //
  // 1. Atualiza a tela **na hora** (otimista).
  // 2. Grava no banco.
  // 3. Se falhar, **desfaz** a mudança visual e mostra o aviso.
  const toggleCheck = useCallback(async (exerciseId: number, currentValue: boolean) => {
    if (!userId) return;
    const newValue = !currentValue;
    setCheckError(null);
    setChecks(prev => ({ ...prev, [exerciseId]: newValue }));
    try {
      await upsertExerciseCheck(userId, exerciseId, today, newValue);
      reportNetworkOk();
    } catch (e) {
      if (isNetworkError(e)) reportNetworkError();
      setChecks(prev => ({ ...prev, [exerciseId]: currentValue }));
      setCheckError('Não foi possível salvar a marcação. Confira a internet.');
    }
  }, [userId, today]);

  // ### `completeWorkout(workoutDayId)`
  // Conclui o treino do dia. Devolve `true` se salvou.
  //
  // 1. Grava com prazo de 20 s (`withTimeout`).
  // 2. Sucesso → guarda a conclusão e inclui hoje nas datas da semana.
  // 3. Atualiza "último treino" e totais em segundo plano, sem atrasar a confirmação.
  // 4. Falha → mensagem específica: lentidão (pode já ter salvo; tocar de novo é seguro), sem rede, ou erro genérico.
  /**
   * Marca o treino do dia. Devolve true se salvou. Em caso de falha, `saveError`
   * traz a mensagem em pt-BR (no timeout avisa que pode ter sido salvo; repetir é seguro).
   */
  const completeWorkout = useCallback(async (workoutDayId: number): Promise<boolean> => {
    if (!userId) return false;
    setSaveError(null);
    try {
      const completion = await withTimeout(markWorkoutComplete(userId, workoutDayId, today), SAVE_TIMEOUT_MS);
      reportNetworkOk();
      setTodayCompletion(completion);
      setRecentDates(prev => (prev.includes(today) ? prev : [...prev, today]));
      // Atualizações secundárias não bloqueiam a confirmação
      fetchLastCompletion(userId).then(setLastCompletion).catch(() => {});
      fetchUserStats(userId).then(setStats).catch(() => {});
      return true;
    } catch (e) {
      if (isNetworkError(e)) reportNetworkError();
      setSaveError(
        isTimeoutError(e)
          ? 'A conexão demorou. O treino pode já ter sido salvo; tocar de novo é seguro.'
          : isNetworkError(e)
            ? MSG_NETWORK
            : 'Não foi possível registrar o treino. Tente de novo.'
      );
      return false;
    }
  }, [userId, today]);

  // ### `saveNote(exerciseId, text)`
  // Salva a anotação de um exercício.
  //
  // 1. Invalida qualquer carga de anotações em andamento, para ela não sobrescrever esta.
  // 2. Grava com prazo.
  // 3. Atualiza o dicionário local (texto vazio remove).
  // 4. Devolve `false` em caso de falha.
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

  // ### Próximo treino
  // Baseado no **último treino concluído** (armadilha 9), não no dia da semana. Sem histórico, começa pelo primeiro dia.
  // Próximo treino sugerido: baseado no ÚLTIMO treino concluído (armadilha 9),
  // não no dia da semana. Se ainda não há treino registrado, começa no primeiro dia.
  // `lastSlug`: identificador do dia do último treino concluído.
  const lastSlug = lastCompletion?.workout_day?.slug ?? null;
  // `nextWorkout`: o dia sugerido, pela regra de `workoutSequence.ts`.
  const nextWorkout = getNextWorkoutDay(days, lastSlug);

  // ### Semana
  // Segunda a domingo. Conta dias distintos treinados; a meta é o número de dias de treino do programa.
  // Semana (segunda a domingo): conclusões com exercícios pulados contam como dia normal.
  const weekDays = weekDates();
  const weekDone = weekCount(recentDates);
  const weekGoal = days.filter(d => !d.is_rest).length;
  const weekDoneDates = recentDates.filter(d => weekDays.includes(d));

  // ### `status`
  // Etapa da tela: `loading` na primeira carga, `error` se a primeira falhou, `empty` sem dias, `ready` caso contrário. Depois da primeira carga, recargas **nunca** voltam ao `loading` (os dados ficam na tela).
  // Estado para a tela decidir o que mostrar. Depois da 1ª carga, uma recarga
  // (foco, "Tentar de novo") nunca volta para 'loading': os dados ficam na tela.
  const status: WorkoutStatus = !hasLoaded
    ? (error ? 'error' : 'loading')
    : days.length === 0 ? 'empty' : 'ready';

  // Valor devolvido: estados derivados, dados e ações.
  return {
    status,
    days,
    checks,
    todayCompletion,
    lastCompletion,
    nextWorkout,
    stats,
    /** Dias treinados nesta semana (semana começa na segunda). */
    weekDone,
    /** Meta semanal = dias de treino (não descanso) do programa. */
    weekGoal,
    weekDays,
    weekDoneDates,
    /** Compatibilidade: true só no primeiro carregamento (status === 'loading'). */
    loading: status === 'loading',
    /** Recarga em andamento (inclusive a primeira). Para indicador discreto. */
    refreshing,
    /** Erro de carregamento em pt-BR. Com status 'ready', foi só a recarga que falhou. */
    error,
    /** Erro ao concluir o treino, em pt-BR. */
    saveError,
    /** Erro ao marcar/desmarcar um exercício, em pt-BR. */
    checkError,
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
