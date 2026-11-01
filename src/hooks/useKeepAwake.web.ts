/**
 * # `useWorkoutKeepAwake` (web)
 * Usa a *Screen Wake Lock API* quando o navegador tem (Safari 16.4+). Sem suporte, não faz nada.
 */
import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';

/**
 * ## `useWorkoutKeepAwake(active)`
 * Mesmo contrato da versão Android.
 */
export function useWorkoutKeepAwake(active: boolean): void {
  const focused = useIsFocused();
  const on = active && focused;

  // ### Efeito
  // 1. Sai se não deve ligar ou se o navegador não suporta.
  // 2. `acquire` pede o bloqueio de tela; se a tela já foi desmontada, libera na hora.
  // 3. Falha (sem permissão, economia de bateria) é ignorada.
  // 4. Ao voltar para a aba visível, pede de novo (o navegador solta ao esconder a aba).
  // 5. Na limpeza, libera o bloqueio.
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
