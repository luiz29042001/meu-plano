/**
 * # `useOnline` (Android/iOS)
 * Informa se há internet, baseado nas falhas e sucessos reais de requisição (`networkStatus.ts`).
 */
import { useSyncExternalStore } from 'react';
import { getReportedOffline, subscribeNetwork } from '../utils/networkStatus';

/**
 * ## `useOnline()`
 * `useSyncExternalStore` liga o React ao estado externo; devolve o contrário de "offline reportado".
 */
export function useOnline(): boolean {
  return !useSyncExternalStore(subscribeNetwork, getReportedOffline, getReportedOffline);
}
