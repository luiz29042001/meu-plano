// Semana de treino: começa na segunda-feira, em datas LOCAIS (armadilha 2).
import { formatDate } from './date';

/** Segunda-feira da semana de `ref` (meia-noite local). */
export function weekStart(ref: Date = new Date()): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const offset = (d.getDay() + 6) % 7; // seg=0 ... dom=6
  d.setDate(d.getDate() - offset);
  return d;
}

/** Sete datas ISO da semana (segunda primeiro). */
export function weekDates(ref: Date = new Date()): string[] {
  const start = weekStart(ref);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return formatDate(d);
  });
}

/** Quantos dias distintos da semana atual têm treino concluído. */
export function weekCount(completedDates: string[], ref: Date = new Date()): number {
  const week = new Set(weekDates(ref));
  return new Set(completedDates.filter(d => week.has(d))).size;
}

/** Data ISO de `weeks` semanas atrás (para limitar a consulta). */
export function weeksAgoISO(weeks: number, ref: Date = new Date()): string {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - weeks * 7);
  return formatDate(d);
}
