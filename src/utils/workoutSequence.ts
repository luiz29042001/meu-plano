/**
 * # Sequência de treinos (`workoutSequence.ts`)
 * Regras puras (sem rede, sem React) para descobrir **qual é o próximo treino**.
 *
 * > O próximo treino **não** depende do dia da semana: depende do **último treino concluído**. Quem faltou um dia continua de onde parou.
 */

import type { WorkoutDay } from '../types';

// O próximo treino é definido pelo ÚLTIMO treino concluído, seguindo a ordem
// dos dias de treino do programa do usuário (weekday_index), ignorando descanso.
// Funciona para qualquer programa: PPL 6x, Inferiores/Superiores 5x, etc.

/**
 * ## `getTrainingSequence(days)`
 * Devolve só os dias de treino, na ordem do programa.
 *
 * 1. Remove os dias de descanso (`is_rest`).
 * 2. Ordena por `weekday_index`, que é a posição do dia na rotina.
 */
export function getTrainingSequence(days: WorkoutDay[]): WorkoutDay[] {
  return days
    .filter(d => !d.is_rest)
    .sort((a, b) => a.weekday_index - b.weekday_index);
}

/**
 * ## `getNextWorkoutDay(days, lastSlug)`
 * Decide o próximo treino a partir do último concluído (`lastSlug`).
 *
 * - Sem treinos no programa → `null`.
 * - Nunca treinou, ou o último treino não está mais no programa → começa pelo primeiro.
 * - Caso normal → o dia seguinte da lista; depois do último, volta ao primeiro (o `%` faz o ciclo).
 */
export function getNextWorkoutDay(
  days: WorkoutDay[],
  lastSlug: string | null | undefined
): WorkoutDay | null {
  const seq = getTrainingSequence(days);
  if (seq.length === 0) return null;
  const idx = lastSlug ? seq.findIndex(d => d.slug === lastSlug) : -1;
  if (idx === -1) return seq[0];
  return seq[(idx + 1) % seq.length];
}

/**
 * ## `getDayIndexBySlug(days, slug)`
 * Posição de um dia na lista, pelo identificador (`slug`). Se não achar, devolve 0 (primeira aba) para a tela nunca abrir vazia.
 */
export function getDayIndexBySlug(days: WorkoutDay[], slug: string): number {
  const idx = days.findIndex(d => d.slug === slug);
  return idx === -1 ? 0 : idx;
}

/**
 * ## `buildLegend(days)`
 * Monta a legenda do calendário agrupando dias que usam a **mesma cor** (ex.: "Superior A / Superior B").
 *
 * 1. Percorre os dias de treino em ordem.
 * 2. Guarda os nomes por cor, mantendo a ordem em que cada cor apareceu.
 * 3. Junta os nomes de cada cor com " / ".
 *
  * Agrupa os dias de treino por cor para montar a legenda do calendário.
  */
export function buildLegend(days: WorkoutDay[]): { color: string; label: string }[] {
  const groups: Record<string, string[]> = {};
  const order: string[] = [];
  getTrainingSequence(days).forEach(d => {
    if (!groups[d.color]) { groups[d.color] = []; order.push(d.color); }
    groups[d.color].push(d.label);
  });
  return order.map(color => ({ color, label: groups[color].join(' / ') }));
}
