/**
 * # `useMotion`
 * Entrega as durações de animação já ajustadas à acessibilidade: se a pessoa ativou "reduzir movimento" no sistema, todas viram 0.
 */
import { useReducedMotion } from 'react-native-reanimated';
import { Motion } from '../utils/theme';

/**
 * ## `useMotion()`
 * Devolve `{ reduce, ms }`.
 *
 * 1. `reduce` → o sistema pediu menos movimento? (`useReducedMotion` funciona no Android e na web.)
 * 2. Cria `ms` copiando cada duração de `Motion`, ou 0 quando `reduce` é verdadeiro.
 */
export function useMotion(): { reduce: boolean; ms: Record<keyof typeof Motion, number> } {
  const reduce = useReducedMotion();
  const ms = {} as Record<keyof typeof Motion, number>;
  (Object.keys(Motion) as (keyof typeof Motion)[]).forEach(k => { ms[k] = reduce ? 0 : Motion[k]; });
  return { reduce, ms };
}
