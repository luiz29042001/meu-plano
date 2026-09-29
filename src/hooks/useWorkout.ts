import { useState, useEffect, useCallback } from 'react';
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
import type { WorkoutDay, ExerciseCheck, WorkoutCompletion, UserStats } from '../types';

import { todayISO } from '../utils/date';

function todayStr() {
  return todayISO();
}

export function useWorkout() {
  const { user, profile } = useAuth();
  const programKey = profile?.program_id ?? 'default';
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [todayCompletion, setTodayCompletion] = useState<WorkoutCompletion | null>(null);
  const [lastCompletion, setLastCompletion] = useState<WorkoutCompletion | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = todayStr();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [workoutDays, exerciseChecks, completion, last, userStats] = await Promise.all([
        fetchWorkoutDays(),
        fetchExerciseChecks(user.id, today),
        fetchTodayCompletion(user.id, today),
        fetchLastCompletion(user.id),
        fetchUserStats(user.id),
      ]);
      setDays(workoutDays);
      const checkMap: Record<number, boolean> = {};
      exerciseChecks.forEach((c: ExerciseCheck) => { checkMap[c.exercise_id] = c.checked; });
      setChecks(checkMap);
      setTodayCompletion(completion);
      setLastCompletion(last);
      setStats(userStats);
      // Anotações carregadas à parte: uma falha aqui nunca impede o treino de abrir
      fetchExerciseNotes(user.id).then(setNotes).catch(() => {});
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [user, today, programKey]);

  useEffect(() => { load(); }, [load]);

  const toggleCheck = useCallback(async (exerciseId: number, currentValue: boolean) => {
    if (!user) return;
    const newValue = !currentValue;
    setChecks(prev => ({ ...prev, [exerciseId]: newValue }));
    try {
      await upsertExerciseCheck(user.id, exerciseId, today, newValue);
    } catch {
      setChecks(prev => ({ ...prev, [exerciseId]: currentValue }));
    }
  }, [user, today]);

  const completeWorkout = useCallback(async (workoutDayId: number): Promise<boolean> => {
    if (!user) return false;
    try {
      // Limite de 20s: se a rede travar, o usuário recebe aviso em vez de ficar sem resposta
      const completion = await Promise.race([
        markWorkoutComplete(user.id, workoutDayId, today),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)),
      ]);
      setTodayCompletion(completion);
      // Atualizações secundárias não bloqueiam a confirmação
      fetchLastCompletion(user.id).then(setLastCompletion).catch(() => {});
      fetchUserStats(user.id).then(setStats).catch(() => {});
      return true;
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao salvar');
      return false;
    }
  }, [user, today]);

  const saveNote = useCallback(async (exerciseId: number, text: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await Promise.race([
        saveExerciseNote(user.id, exerciseId, text),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)),
      ]);
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
  }, [user]);

  // Próximo treino sugerido: baseado no ÚLTIMO treino concluído (sequência PPL),
  // não no dia da semana. Se ainda não há treino registrado, começa em Push A.
  const lastSlug = lastCompletion?.workout_day?.slug ?? null;
  const nextWorkout = getNextWorkoutDay(days, lastSlug);

  return {
    days,
    checks,
    todayCompletion,
    lastCompletion,
    nextWorkout,
    stats,
    loading,
    error,
    toggleCheck,
    completeWorkout,
    notes,
    saveNote,
    refresh: load,
  };
}
