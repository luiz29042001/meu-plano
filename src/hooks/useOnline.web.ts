// Web: navigator.onLine + eventos, combinado com as falhas de requisição.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { getReportedOffline, subscribeNetwork } from '../utils/networkStatus';

export function useOnline(): boolean {
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  );
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
  const reported = useSyncExternalStore(subscribeNetwork, getReportedOffline, getReportedOffline);
  return browserOnline && !reported;
}
