// true = online. Nativo: baseado nas falhas/sucessos de requisição (networkStatus).
import { useSyncExternalStore } from 'react';
import { getReportedOffline, subscribeNetwork } from '../utils/networkStatus';

export function useOnline(): boolean {
  return !useSyncExternalStore(subscribeNetwork, getReportedOffline, getReportedOffline);
}
