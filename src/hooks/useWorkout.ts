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
} from '../services/workout';
import { getNextWorkoutDay } from '../utils/workoutSequence';
import type { WorkoutDay, ExerciseCheck, WorkoutCompletion, UserStats } from '../types';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function useWorkout() {
  const { user } = useAuth();
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [todayCompletion, setTodayCompletion] = useState<WorkoutCompletion | null>(null);
  const [lastCompletion, setLastCompletion] = useState<WorkoutCompletion | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
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
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [user, today]);

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

  const completeWorkout = useCallback(async (workoutDayId: number) => {
    if (!user) return;
    try {
      const completion = await markWorkoutComplete(user.id, workoutDayId, today);
      setTodayCompletion(completion);
      // Atualiza o último treino também, para a sequência avançar na hora
      const last = await fetchLastCompletion(user.id);
      setLastCompletion(last);
      const updatedStats = await fetchUserStats(user.id);
      setStats(updatedStats);
    } catch (e: any) {
      setError(e.message);
    }
  }, [user, today]);

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
    refresh: load,
  };
}
