import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchCompletions, fetchUserStats, fetchWorkoutDays } from '../services/workout';
import type { WorkoutCompletion, UserStats, WorkoutDay } from '../types';

export function useCalendar(year: number, month: number) {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [programDays, setProgramDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [data, userStats, days] = await Promise.all([
        fetchCompletions(user.id, year, month),
        fetchUserStats(user.id),
        fetchWorkoutDays(),
      ]);
      setCompletions(data);
      setStats(userStats);
      setProgramDays(days);
    } finally {
      setLoading(false);
    }
  }, [user, year, month]);

  useEffect(() => { load(); }, [load]);

  // Map date string -> completion for easy calendar lookup
  const completionByDate: Record<string, WorkoutCompletion> = {};
  completions.forEach(c => { completionByDate[c.completed_date] = c; });

  return { completions, completionByDate, stats, programDays, loading, refresh: load };
}
