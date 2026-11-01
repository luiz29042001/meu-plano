/**
 * # `useOnline` (web)
 * Informa se o app está online, combinando duas fontes: o aviso do navegador e as falhas reais de requisição.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { getReportedOffline, subscribeNetwork } from '../utils/networkStatus';

/**
 * ## `useOnline()`
 * Devolve `true` quando há internet.
 */
export function useOnline(): boolean {
  // Estado inicial: o que o navegador diz agora (`navigator.onLine`); fora do navegador, assume online.
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  );
  // Ouve os eventos `online`/`offline` da janela e atualiza o estado; remove os ouvintes na limpeza.
  useEffect(() => {
    const up = () => setBrowserOnline(true);
    const down = () => setBrowserOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  // Lê o estado compartilhado de falhas de rede (`networkStatus.ts`). `useSyncExternalStore` é o jeito do React de ler uma fonte externa com segurança.
  const reported = useSyncExternalStore(subscribeNetwork, getReportedOffline, getReportedOffline);
  // Só está online se o navegador **e** as requisições concordarem.
  return browserOnline && !reported;
}
