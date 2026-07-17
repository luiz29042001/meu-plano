import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchWorkoutDays,
  fetchExerciseChecks,
  fetchTodayCompletion,
  upsertExerciseCheck,
  markWorkoutComplete,
  fetchUserStats,
} from '../services/workout';
import type { WorkoutDay, ExerciseCheck, WorkoutCompletion, UserStats } from '../types';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function useWorkout() {
  const { user } = useAuth();
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [todayCompletion, setTodayCompletion] = useState<WorkoutCompletion | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = todayStr();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [workoutDays, exerciseChecks, completion, userStats] = await Promise.all([
        fetchWorkoutDays(),
        fetchExerciseChecks(user.id, today),
        fetchTodayCompletion(user.id, today),
        fetchUserStats(user.id),
      ]);
      setDays(workoutDays);
      const checkMap: Record<number, boolean> = {};
      exerciseChecks.forEach((c: ExerciseCheck) => { checkMap[c.exercise_id] = c.checked; });
      setChecks(checkMap);
      setTodayCompletion(completion);
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
    // Optimistic update
    setChecks(prev => ({ ...prev, [exerciseId]: newValue }));
    try {
      await upsertExerciseCheck(user.id, exerciseId, today, newValue);
    } catch {
      // Rollback
      setChecks(prev => ({ ...prev, [exerciseId]: currentValue }));
    }
  }, [user, today]);

  const completeWorkout = useCallback(async (workoutDayId: number) => {
    if (!user) return;
    try {
      const completion = await markWorkoutComplete(user.id, workoutDayId, today);
      setTodayCompletion(completion);
      const updatedStats = await fetchUserStats(user.id);
      setStats(updatedStats);
    } catch (e: any) {
      setError(e.message);
    }
  }, [user, today]);

  // Today's workout day based on day of week
  const todayDayIndex = (() => {
    const d = new Date().getDay(); // 0=Sun..6=Sat
    return d === 0 ? 6 : d - 1;   // map to 0=Mon..6=Sun
  })();

  const todayWorkout = days.find(d => d.weekday_index === todayDayIndex) ?? null;

  return {
    days,
    checks,
    todayCompletion,
    todayWorkout,
    stats,
    loading,
    error,
    toggleCheck,
    completeWorkout,
    refresh: load,
  };
}
