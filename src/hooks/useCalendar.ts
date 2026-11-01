/**
 * # `useCalendar`
 * Carrega tudo o que o calendário precisa para um mês: treinos concluídos, totais e dias do programa.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchCompletions, fetchUserStats, fetchWorkoutDays } from '../services/workout';
import { friendlyError, isNetworkError } from '../utils/errors';
import { reportNetworkError, reportNetworkOk } from '../utils/networkStatus';
import type { WorkoutCompletion, UserStats, WorkoutDay, CalendarStatus } from '../types';

/**
 * ## `useCalendar(year, month)`
 * Devolve o estado da tela (`status`), os dados e as ações `refresh`/`retry`.
 */
export function useCalendar(year: number, month: number) {
  // ### Dados do usuário
  // Usa o `userId` (texto) em vez do objeto inteiro, para não recarregar à toa quando o login só renova o token.
  // userId (string) em vez do objeto `user`: não recarrega ao voltar à aba / renovar token.
  const { userId, profile, profileStatus } = useAuth();
  const profilePending = profileStatus === 'idle' || profileStatus === 'loading';
  // `programId`: número = filtra; `null` = sem programa; `undefined` = perfil ainda indisponível.
  const programId: number | null | undefined =
    profileStatus === 'ready' ? (profile?.program_id ?? null) : undefined;

  // Estados da tela: dados, carregando, já carregou alguma vez, mensagem de erro.
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [programDays, setProgramDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `req` numera as consultas: se a pessoa troca de mês rápido, só a resposta da **última** vale.
  // Trocar de mês rápido: só a resposta da última consulta vale.
  const req = useRef(0);

  // ### `load()`
  // 1. Não faz nada sem usuário ou com o perfil ainda carregando.
  // 2. Numera a consulta e entra em modo "carregando".
  // 3. Busca em paralelo (`Promise.all`): conclusões do mês, totais e dias do programa.
  // 4. Se já surgiu outra consulta mais nova, descarta esta resposta.
  // 5. Sucesso → avisa que a rede está ok e guarda os dados.
  // 6. Erro → marca rede ruim (se for o caso), limpa a lista e guarda a mensagem amigável.
  // 7. `finally` → sai do modo "carregando" (só se ainda for a consulta mais recente).
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
      reportNetworkOk();
      setCompletions(data);
      setStats(userStats);
      setProgramDays(days);
      setHasLoaded(true);
    } catch (e) {
      if (my !== req.current) return;
      if (isNetworkError(e)) reportNetworkError();
      setCompletions([]);
      setError(friendlyError(e, 'Não foi possível carregar o calendário.'));
    } finally {
      if (my === req.current) setLoading(false);
    }
  }, [userId, profilePending, programId, year, month]);

  // Dispara `load` na primeira vez e sempre que usuário, programa, ano ou mês mudarem.
  useEffect(() => { load(); }, [load]);

  // Indexa as conclusões por data (`AAAA-MM-DD`) para o calendário achar cada dia rapidamente.
  // Map date string -> completion for easy calendar lookup
  const completionByDate: Record<string, WorkoutCompletion> = {};
  completions.forEach(c => { completionByDate[c.completed_date] = c; });

  // `status` final da tela: erro > carregando > pronto.
  // 'error' sempre que a consulta do mês atual falhou (o mês mostrado estaria vazio sem motivo).
  const status: CalendarStatus = error ? 'error' : (!hasLoaded || loading) ? 'loading' : 'ready';

  // Entrega os dados e as ações para a tela.
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
