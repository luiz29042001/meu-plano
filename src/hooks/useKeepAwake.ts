// Mantém a tela ligada durante o treino (Android: expo-keep-awake).
// Solta ao sair da tela (blur), ao ir para segundo plano ou quando `active` fica false.
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const TAG = 'meu-plano-treino';

export function useWorkoutKeepAwake(active: boolean): void {
  const focused = useIsFocused();
  const on = active && focused;

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
