import type { WorkoutDay } from '../types';

// A sequência de treino PPL segue a ordem dos slugs abaixo (ignora DESCANSO).
// O "próximo treino" é definido pelo ÚLTIMO treino concluído — não pelo dia da
// semana. Se o último foi 'push-a', o próximo é 'pull-a', e assim por diante,
// dando a volta ao chegar no fim.
export const PPL_SEQUENCE = [
  'push-a',
  'pull-a',
  'legs-a',
  'push-b',
  'pull-b',
  'legs-b',
];

/**
 * Retorna o slug do próximo treino dado o slug do último treino concluído.
 * Se não houver treino anterior (usuário novo), começa em 'push-a'.
 */
export function getNextWorkoutSlug(lastSlug: string | null | undefined): string {
  if (!lastSlug) return PPL_SEQUENCE[0];
  const idx = PPL_SEQUENCE.indexOf(lastSlug);
  if (idx === -1) return PPL_SEQUENCE[0];
  const nextIdx = (idx + 1) % PPL_SEQUENCE.length;
  return PPL_SEQUENCE[nextIdx];
}

/**
 * Encontra o objeto WorkoutDay correspondente ao próximo treino da sequência.
 */
export function getNextWorkoutDay(
  days: WorkoutDay[],
  lastSlug: string | null | undefined
): WorkoutDay | null {
  const nextSlug = getNextWorkoutSlug(lastSlug);
  return days.find(d => d.slug === nextSlug) ?? null;
}

/**
 * Índice de um treino na aba (para pré-selecionar no seletor).
 */
export function getDayIndexBySlug(days: WorkoutDay[], slug: string): number {
  const idx = days.findIndex(d => d.slug === slug);
  return idx === -1 ? 0 : idx;
}
