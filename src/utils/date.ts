/**
 * # Datas (`date.ts`)
 * Funções para trabalhar com datas **sempre no fuso horário do aparelho**.
 *
 * > **Por que isso importa:** `toISOString()` converte para UTC. No Brasil, um treino feito às 22h cairia no dia seguinte. Por isso o app nunca usa `toISOString()` para datas de treino.
 */

/**
 * ## `formatDate(date)`
 * Converte um objeto `Date` no texto `AAAA-MM-DD` (formato que o banco guarda).
 *
 * 1. Lê ano, mês e dia **locais** do aparelho.
 * 2. Soma 1 ao mês, porque o JavaScript conta meses de 0 a 11.
 * 3. Completa com zero à esquerda (`padStart`) para ficar sempre com 2 dígitos.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * ## `todayISO()`
 * Devolve a data de **hoje** no formato `AAAA-MM-DD`, no fuso local. Atalho para `formatDate(new Date())`.
 */
export function todayISO(): string {
  return formatDate(new Date());
}


/**
 * ## `MONTH_NAMES`
 * Nomes dos 12 meses em português, na ordem do índice do JavaScript (0 = Janeiro). Usado no título do calendário.
 */
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * ## `WEEKDAY_SHORT`
 * Abreviações dos dias da semana, começando no domingo (índice 0, igual ao `getDay()`).
 */
export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * ## `getDaysInMonth(year, month)`
 * Quantos dias o mês tem (28 a 31).
 *
 * > **Truque:** pedir o "dia 0" do mês seguinte devolve o último dia do mês atual.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * ## `getFirstDayOfMonth(year, month)`
 * Em qual dia da semana cai o dia 1 do mês (0 = domingo ... 6 = sábado).
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}
