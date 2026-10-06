// Espaço que o cronômetro flutuante ocupa sobre a tela, para topo e base.
// Todas as telas usam isto: `top` vira um espaçador no início da rolagem e
// `bottom` o paddingBottom do conteúdo.
import { useTimerLayout } from '../contexts/TimerContext';
import { Spacing } from '../utils/theme';

export function useTimerInsets(): { top: number; bottom: number } {
  const { position, panelHeight } = useTimerLayout();
  const hasPanel = panelHeight > 0;
  return {
    top: position === 'top' && hasPanel ? panelHeight : 0,
    bottom: position === 'bottom' && hasPanel ? panelHeight + Spacing.xl : Spacing.xxl,
  };
}
