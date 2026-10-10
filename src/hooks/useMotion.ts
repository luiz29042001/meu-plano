// Durações de movimento (theme.Motion) já respeitando "reduzir movimento".
// useReducedMotion do reanimated funciona no Android e na web (prefers-reduced-motion).
import { useReducedMotion } from 'react-native-reanimated';
import { Motion } from '../utils/theme';

export function useMotion(): { reduce: boolean; ms: Record<keyof typeof Motion, number> } {
  const reduce = useReducedMotion();
  const ms = {} as Record<keyof typeof Motion, number>;
  (Object.keys(Motion) as (keyof typeof Motion)[]).forEach(k => { ms[k] = reduce ? 0 : Motion[k]; });
  return { reduce, ms };
}
