// Notificação do descanso (Android): contagem regressiva ao vivo na gaveta e
// aviso com som/vibração no fim, mesmo com a tela bloqueada.
// Usa o módulo nativo local modules/rest-timer. Gêmeo web: restNotification.web.ts (no-op).
//
// Regra de ouro (armadilha 4): o TimerContext é o dono do `endsAt`. Aqui só
// chegam CÓPIAS; nenhuma função devolve ou altera o horário de término.
import { PermissionsAndroid, Platform } from 'react-native';
import { RestTimer } from '../../modules/rest-timer';

export interface RestNotificationStatus {
  /** false na web, no iOS e em APK sem o módulo (antigo). */
  supported: boolean;
  /** O app pode mostrar notificações (permissão + não bloqueado nos ajustes). */
  notifications: boolean;
  /** Pode agendar alarme exato (Android 12+ exige "Alarmes e lembretes"). */
  exactAlarm: boolean;
  /**
   * Canal "Fim do descanso" ligado e com som. false = o usuário desligou ou
   * silenciou só esse canal nos ajustes do Android; o app então vibra sozinho.
   */
  doneChannel: boolean;
}

let armed = false;

const native = Platform.OS === 'android' ? RestTimer : null;

export async function getRestNotificationStatus(): Promise<RestNotificationStatus> {
  if (!native) return { supported: false, notifications: false, exactAlarm: false, doneChannel: false };
  try {
    return {
      supported: true,
      notifications: native.areNotificationsEnabled(),
      exactAlarm: native.canScheduleExactAlarms(),
      doneChannel: doneChannelEnabled(),
    };
  } catch {
    return { supported: true, notifications: false, exactAlarm: false, doneChannel: false };
  }
}

/** Canal do fim ligado. Nunca lança; na dúvida, false (o app mantém o alerta próprio). */
function doneChannelEnabled(): boolean {
  if (!native || typeof native.isDoneChannelEnabled !== 'function') return false;
  try { return native.isDoneChannelEnabled(); } catch { return false; }
}

/**
 * Pede POST_NOTIFICATIONS (Android 13+). Em versões anteriores não há pedido:
 * devolve se as notificações estão ativas. Nunca lança.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!native) return false;
  try {
    if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
      const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return r === PermissionsAndroid.RESULTS.GRANTED;
    }
    return native.areNotificationsEnabled();
  } catch {
    return false;
  }
}

/** Abre "Alarmes e lembretes" do Android para este app. */
export function openExactAlarmSettings(): void {
  try { native?.openExactAlarmSettings(); } catch {}
}

/** Abre os ajustes de notificação do app. */
export function openAppNotificationSettings(): void {
  try { native?.openAppNotificationSettings(); } catch {}
}

/**
 * Mostra/atualiza a contagem até `endsAt` e agenda o aviso do fim.
 * Chamar de novo substitui (retomar, "+15 s"). Sem permissão: não faz nada.
 */
export async function startRestNotification(p: { endsAt: number; label: string }): Promise<void> {
  if (!native) { armed = false; return; }
  const label = p.label.trim();
  try {
    armed = native.start(p.endsAt, {
      title: 'Descanso',
      body: label || 'Meu Plano',
      doneTitle: 'Descanso terminado',
      doneBody: label ? `Próxima série: ${label}` : 'Hora da próxima série',
    });
  } catch {
    armed = false;
  }
}

/** Cancela o aviso agendado e remove a notificação. */
export async function cancelRestNotification(): Promise<void> {
  armed = false;
  if (!native) return;
  try { native.cancel(); } catch {}
}

/**
 * true se a notificação está armada com alarme exato E, neste momento, as
 * notificações do app estão permitidas E o canal "Fim do descanso" está ligado
 * com som. Só então o alerta do fim vem do sistema e o app não vibra por conta
 * própria (evita alerta duplicado). Reconfere na hora do fim porque o usuário
 * pode ter desligado algo durante o descanso (revisão S1). Na dúvida, false.
 */
export function isNativeAlertArmed(): boolean {
  if (!armed || !native) return false;
  try {
    return native.areNotificationsEnabled() && doneChannelEnabled();
  } catch {
    return false;
  }
}
