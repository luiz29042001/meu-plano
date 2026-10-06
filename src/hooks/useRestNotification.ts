// Status das notificações do descanso (só Android) para a tela Perfil e para o
// aviso único "permita alarmes" no painel do cronômetro.
// Na web devolve `supported: false` e nada aparece.
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

export function useRestNotification(): UseRestNotification {
  const [status, setStatus] = useState<RestNotificationStatus | null>(null);
  const [noticeShown, setNoticeShown] = useState(true); // true até ler: não pisca o aviso

  const refresh = useCallback(() => {
    getRestNotificationStatus().then(setStatus);
  }, []);

  useEffect(() => {
    let alive = true;
    refresh();
    loadExactAlarmNoticeShown().then(v => { if (alive) setNoticeShown(v); });
    // Volta dos Ajustes do Android: atualiza o status.
    const sub = AppState.addEventListener('change', s => { if (s === 'active') refresh(); });
    return () => { alive = false; sub.remove(); };
  }, [refresh]);

  const dismissExactAlarmNotice = useCallback(() => {
    setNoticeShown(true);
    void saveExactAlarmNoticeShown();
  }, []);

  const requestPermission = useCallback(async () => {
    const ok = await requestNotificationPermission();
    refresh();
    return ok;
  }, [refresh]);

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
