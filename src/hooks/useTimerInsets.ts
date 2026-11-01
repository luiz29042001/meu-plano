/**
 * # `useTimerInsets`
 * Calcula quanto espaço o cronômetro flutuante ocupa, para o conteúdo das telas não ficar escondido embaixo dele.
 */
import { useTimerLayout } from '../contexts/TimerContext';
import { Spacing } from '../utils/theme';

/**
 * ## `useTimerInsets()`
 * Devolve `{ top, bottom }`:
 * - `top` → altura do painel, se o cronômetro está no topo e aberto; senão 0.
 * - `bottom` → altura do painel + folga, se está embaixo e aberto; senão uma folga padrão.
 */
export function useTimerInsets(): { top: number; bottom: number } {
  const { position, panelHeight } = useTimerLayout();
  const hasPanel = panelHeight > 0;
  return {
    top: position === 'top' && hasPanel ? panelHeight : 0,
    bottom: position === 'bottom' && hasPanel ? panelHeight + Spacing.xl : Spacing.xxl,
  };
}
