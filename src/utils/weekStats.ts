/**
 * # Estatísticas da semana (`weekStats.ts`)
 * Cálculos da semana de treino, que **começa na segunda-feira**. Tudo em datas locais.
 */

// Semana de treino: começa na segunda-feira, em datas LOCAIS (armadilha 2).
import { formatDate } from './date';

/**
 * ## `weekStart(ref)`
 * Devolve a segunda-feira (à meia-noite) da semana da data `ref`.
 *
 * - `getDay()` dá domingo = 0; a conta `(dia + 6) % 7` transforma em segunda = 0 ... domingo = 6.
 * - Basta voltar essa quantidade de dias.
 *
  * Segunda-feira da semana de `ref` (meia-noite local).
  */
export function weekStart(ref: Date = new Date()): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  // `offset`: quantos dias voltar até a segunda-feira (segunda = 0 ... domingo = 6).
  const offset = (d.getDay() + 6) % 7; // seg=0 ... dom=6
  d.setDate(d.getDate() - offset);
  return d;
}

/**
 * ## `weekDates(ref)`
 * As 7 datas (`AAAA-MM-DD`) da semana, de segunda a domingo. Usada para desenhar a faixa da semana na tela inicial.
 *
  * Sete datas ISO da semana (segunda primeiro).
  */
export function weekDates(ref: Date = new Date()): string[] {
  const start = weekStart(ref);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return formatDate(d);
  });
}

/**
 * ## `weekCount(completedDates, ref)`
 * Quantos **dias diferentes** da semana atual têm treino concluído.
 *
 * Usa `Set` duas vezes: uma para consultar rápido as datas da semana, outra para não contar o mesmo dia duas vezes.
 *
  * Quantos dias distintos da semana atual têm treino concluído.
  */
export function weekCount(completedDates: string[], ref: Date = new Date()): number {
  const week = new Set(weekDates(ref));
  return new Set(completedDates.filter(d => week.has(d))).size;
}

/**
 * ## `weeksAgoISO(weeks, ref)`
 * Data de N semanas atrás. Serve de limite inferior nas consultas, para o app não buscar histórico demais.
 *
  * Data ISO de `weeks` semanas atrás (para limitar a consulta).
  */
export function weeksAgoISO(weeks: number, ref: Date = new Date()): string {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - weeks * 7);
  return formatDate(d);
}
