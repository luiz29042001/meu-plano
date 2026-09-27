import type { WorkoutDay } from '../types';

// O próximo treino é definido pelo ÚLTIMO treino concluído, seguindo a ordem
// dos dias de treino do programa do usuário (weekday_index), ignorando descanso.
// Funciona para qualquer programa: PPL 6x, Inferiores/Superiores 5x, etc.

export function getTrainingSequence(days: WorkoutDay[]): WorkoutDay[] {
  return days
    .filter(d => !d.is_rest)
    .sort((a, b) => a.weekday_index - b.weekday_index);
}

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

export function getDayIndexBySlug(days: WorkoutDay[], slug: string): number {
  const idx = days.findIndex(d => d.slug === slug);
  return idx === -1 ? 0 : idx;
}

/** Agrupa os dias de treino por cor para montar a legenda do calendário. */
export function buildLegend(days: WorkoutDay[]): { color: string; label: string }[] {
  const groups: Record<string, string[]> = {};
  const order: string[] = [];
  getTrainingSequence(days).forEach(d => {
    if (!groups[d.color]) { groups[d.color] = []; order.push(d.color); }
    groups[d.color].push(d.label);
  });
  return order.map(color => ({ color, label: groups[color].join(' / ') }));
}
