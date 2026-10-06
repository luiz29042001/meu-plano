// Data no fuso horário do aparelho (YYYY-MM-DD). toISOString() usa UTC e,
// no Brasil, jogaria treinos feitos após as 21h para o dia seguinte.
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return formatDate(new Date());
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
