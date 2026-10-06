// Web/PWA (iPhone): não existe notificação com contagem nem alarme local no
// Safari. Mesmas funções do nativo, sem efeito, para o TimerContext chamar
// igual nas duas plataformas. Nenhum pedido de permissão na web.
export interface RestNotificationStatus {
  supported: boolean;
  notifications: boolean;
  exactAlarm: boolean;
  doneChannel: boolean;
}

export async function getRestNotificationStatus(): Promise<RestNotificationStatus> {
  return { supported: false, notifications: false, exactAlarm: false, doneChannel: false };
}

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export function openExactAlarmSettings(): void {}

export function openAppNotificationSettings(): void {}

export async function startRestNotification(_p: { endsAt: number; label: string }): Promise<void> {}

export async function cancelRestNotification(): Promise<void> {}

export function isNativeAlertArmed(): boolean {
  return false;
}
