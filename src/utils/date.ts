export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function todayWeekdayIndex(): number {
  const d = new Date().getDay(); // 0=Dom
  return d === 0 ? 6 : d - 1;    // 0=Seg..6=Dom
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Cabeçalho do calendário: começa no Domingo (padrão getDay()=0).
// Abreviações de 3 letras evitam a ambiguidade de S/S e Q/Q.
export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Retorna 0=Dom .. 6=Sáb para o 1º dia do mês.
// Este valor é o número de células vazias antes do dia 1 no grid,
// já que o grid começa no Domingo.
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}
