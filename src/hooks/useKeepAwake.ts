/**
 * # `useWorkoutKeepAwake` (Android)
 * Mantém a tela ligada durante o treino. Solta ao sair da tela, ao ir para segundo plano ou quando `active` fica falso.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

/**
 * `TAG`: nome do "pedido de tela ligada", usado para ligar e desligar o mesmo pedido.
 */
const TAG = 'meu-plano-treino';

/**
 * ## `useWorkoutKeepAwake(active)`
 * 1. Só liga se `active` **e** a tela está em foco (`useIsFocused`).
 */
export function useWorkoutKeepAwake(active: boolean): void {
  const focused = useIsFocused();
  const on = active && focused;

  // ### Efeito
  // 1. Define `hold` (liga) e `release` (desliga), ignorando erros.
  // 2. Se o app já está ativo, liga agora.
  // 3. Escuta mudanças de estado do app: ativo → liga; fundo → desliga.
  // 4. Na limpeza, cancela a escuta e desliga.
  useEffect(() => {
    if (!on) return;
    let alive = true;
    const hold = () => { if (alive) activateKeepAwakeAsync(TAG).catch(() => {}); };
    const release = () => { deactivateKeepAwake(TAG).catch(() => {}); };
    if (AppState.currentState === 'active') hold();
    const sub = AppState.addEventListener('change', s => (s === 'active' ? hold() : release()));
    return () => { alive = false; sub.remove(); release(); };
  }, [on]);
}
