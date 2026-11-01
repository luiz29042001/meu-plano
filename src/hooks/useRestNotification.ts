/**
 * # `useRestNotification`
 * Entrega às telas o estado das notificações de descanso (só Android) e as ações para ajustá-las.
 */
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  getRestNotificationStatus,
  openAppNotificationSettings,
  openExactAlarmSettings,
  requestNotificationPermission,
  type RestNotificationStatus,
} from '../services/restNotification';
import { loadExactAlarmNoticeShown, saveExactAlarmNoticeShown } from '../services/devicePrefs';

/**
 * ## `UseRestNotification`
 * O que o hook devolve: `status`, se o aviso de alarme está pendente, e as funções `dismissExactAlarmNotice`, `refresh`, `requestPermission` e atalhos para os ajustes do Android.
 */
export interface UseRestNotification {
  /** null enquanto carrega. */
  status: RestNotificationStatus | null;
  /**
   * true quando vale mostrar, UMA vez, o aviso "Para avisar na hora certa com a
   * tela bloqueada, permita alarmes" (notificações ativas, alarme exato negado).
   */
  exactAlarmNoticePending: boolean;
  /** Marca o aviso como visto (some e não volta). */
  dismissExactAlarmNotice(): void;
  /** Relê o status (já é chamado ao voltar para o app). */
  refresh(): void;
  /** Pede a permissão de notificação (Android 13+) e relê o status. */
  requestPermission(): Promise<boolean>;
  openExactAlarmSettings(): void;
  openAppNotificationSettings(): void;
}

/**
 * ## `useRestNotification()`
 */
export function useRestNotification(): UseRestNotification {
  // 1. `status` → começa `null` (carregando).
  // 2. `noticeShown` → começa `true` de propósito, para o aviso não piscar antes de lermos o valor salvo.
  const [status, setStatus] = useState<RestNotificationStatus | null>(null);
  const [noticeShown, setNoticeShown] = useState(true); // true até ler: não pisca o aviso

  // ### `refresh()`
  // Relê o status das notificações no módulo nativo.
  const refresh = useCallback(() => {
    getRestNotificationStatus().then(setStatus);
  }, []);

  // ### Efeito inicial
  // 1. Lê o status e se o aviso já foi mostrado.
  // 2. Quando a pessoa volta dos Ajustes do Android (app volta a `active`), relê o status.
  // 3. Limpeza: cancela a escuta.
  useEffect(() => {
    let alive = true;
    refresh();
    loadExactAlarmNoticeShown().then(v => { if (alive) setNoticeShown(v); });
    // Volta dos Ajustes do Android: atualiza o status.
    const sub = AppState.addEventListener('change', s => { if (s === 'active') refresh(); });
    return () => { alive = false; sub.remove(); };
  }, [refresh]);

  // ### `dismissExactAlarmNotice()`
  // Esconde o aviso na hora e grava que já foi visto, para nunca voltar.
  const dismissExactAlarmNotice = useCallback(() => {
    setNoticeShown(true);
    void saveExactAlarmNoticeShown();
  }, []);

  // ### `requestPermission()`
  // Pede a permissão ao sistema, relê o status e devolve se foi concedida.
  const requestPermission = useCallback(async () => {
    const ok = await requestNotificationPermission();
    refresh();
    return ok;
  }, [refresh]);

  // ### `exactAlarmNoticePending`
  // O aviso só aparece se: há suporte, as notificações estão ativas, o alarme exato está **negado** e ele ainda não foi visto.
  const exactAlarmNoticePending =
    !!status && status.supported && status.notifications && !status.exactAlarm && !noticeShown;

  return {
    status,
    exactAlarmNoticePending,
    dismissExactAlarmNotice,
    refresh,
    requestPermission,
    openExactAlarmSettings,
    openAppNotificationSettings,
  };
}
