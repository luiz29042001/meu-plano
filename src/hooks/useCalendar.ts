import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchCompletions, fetchUserStats, fetchWorkoutDays } from '../services/workout';
import { friendlyError } from '../utils/errors';
import type { WorkoutCompletion, UserStats, WorkoutDay, CalendarStatus } from '../types';

export function useCalendar(year: number, month: number) {
  // userId (string) em vez do objeto `user`: não recarrega ao voltar à aba / renovar token.
  const { userId, profile, profileStatus } = useAuth();
  const profilePending = profileStatus === 'idle' || profileStatus === 'loading';
  const programId: number | null | undefined =
    profileStatus === 'ready' ? (profile?.program_id ?? null) : undefined;

  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [programDays, setProgramDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trocar de mês rápido: só a resposta da última consulta vale.
  const req = useRef(0);

  const load = useCallback(async () => {
    if (!userId || profilePending) return;
    const my = ++req.current;
    setLoading(true);
    setError(null);
    try {
      const [data, userStats, days] = await Promise.all([
        fetchCompletions(userId, year, month),
        fetchUserStats(userId),
        fetchWorkoutDays(programId),
      ]);
      if (my !== req.current) return;
      setCompletions(data);
      setStats(userStats);
      setProgramDays(days);
      setHasLoaded(true);
    } catch (e) {
      if (my !== req.current) return;
      setCompletions([]);
      setError(friendlyError(e, 'Não foi possível carregar o calendário.'));
    } finally {
      if (my === req.current) setLoading(false);
    }
  }, [userId, profilePending, programId, year, month]);

  useEffect(() => { load(); }, [load]);

  // Map date string -> completion for easy calendar lookup
  const completionByDate: Record<string, WorkoutCompletion> = {};
  completions.forEach(c => { completionByDate[c.completed_date] = c; });

  // 'error' sempre que a consulta do mês atual falhou (o mês mostrado estaria vazio sem motivo).
  const status: CalendarStatus = error ? 'error' : (!hasLoaded || loading) ? 'loading' : 'ready';

  return {
    status,
    completions,
    completionByDate,
    stats,
    programDays,
    /** Consulta do mês em andamento (inclusive ao trocar de mês). */
    loading,
    /** Mensagem em pt-BR quando status === 'error'. */
    error,
    refresh: load,
    retry: load,
  };
}
