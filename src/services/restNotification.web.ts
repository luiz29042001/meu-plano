/**
 * # Notificação do descanso, web (`restNotification.web.ts`)
 * Versão "vazia" para o navegador/iPhone: o Safari não permite notificação com contagem nem alarme local. As funções existem com os **mesmos nomes** do arquivo Android, mas não fazem nada, para o resto do app chamá-las sem se preocupar com a plataforma.
 */

// Web/PWA (iPhone): não existe notificação com contagem nem alarme local no
// Safari. Mesmas funções do nativo, sem efeito, para o TimerContext chamar
// igual nas duas plataformas. Nenhum pedido de permissão na web.
/**
 * Mesmo formato do arquivo Android (ver `restNotification.ts`).
 */
export interface RestNotificationStatus {
  supported: boolean;
  notifications: boolean;
  exactAlarm: boolean;
  doneChannel: boolean;
}

/**
 * Sempre "não suportado" na web.
 */
export async function getRestNotificationStatus(): Promise<RestNotificationStatus> {
  return { supported: false, notifications: false, exactAlarm: false, doneChannel: false };
}

/**
 * Na web nunca pedimos permissão: devolve `false`.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

/**
 * Sem efeito na web.
 */
export function openExactAlarmSettings(): void {}

/**
 * Sem efeito na web.
 */
export function openAppNotificationSettings(): void {}

/**
 * Sem efeito na web: o cronômetro visual do app cuida de tudo.
 */
export async function startRestNotification(_p: { endsAt: number; label: string }): Promise<void> {}

/**
 * Sem efeito na web.
 */
export async function cancelRestNotification(): Promise<void> {}

/**
 * Na web o app sempre faz o próprio alerta (som/vibração), então responde `false`.
 */
export function isNativeAlertArmed(): boolean {
  return false;
}
