// Web: Screen Wake Lock quando existir (Safari 16.4+); sem suporte, não faz nada.
import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';

export function useWorkoutKeepAwake(active: boolean): void {
  const focused = useIsFocused();
  const on = active && focused;

  useEffect(() => {
    if (!on || typeof navigator === 'undefined' || !(navigator as any).wakeLock) return;
    let alive = true;
    let lock: any = null;
    const acquire = async () => {
      try {
        if (document.visibilityState !== 'visible') return;
        const l = await (navigator as any).wakeLock.request('screen');
        if (!alive) { l.release?.().catch?.(() => {}); return; }
        lock = l;
      } catch {
        // Sem permissão / economia de bateria: segue sem manter a tela ligada.
      }
    };
    const onVis = () => { if (document.visibilityState === 'visible') void acquire(); };
    void acquire();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVis);
      try { lock?.release?.(); } catch {}
    };
  }, [on]);
}
