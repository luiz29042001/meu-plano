/**
 * # Notificação do descanso, Android (`restNotification.ts`)
 * Ponte entre o app e o módulo nativo em Kotlin (`modules/rest-timer`). Mostra a contagem regressiva ao vivo na gaveta de notificações e avisa no fim, mesmo com a tela bloqueada.
 *
 * > **Regra de ouro:** o `TimerContext` é o dono do horário de término (`endsAt`). Este arquivo só recebe **cópias** dele e nunca o altera.
 */

// Notificação do descanso (Android): contagem regressiva ao vivo na gaveta e
// aviso com som/vibração no fim, mesmo com a tela bloqueada.
// Usa o módulo nativo local modules/rest-timer. Gêmeo web: restNotification.web.ts (no-op).
//
// Regra de ouro (armadilha 4): o TimerContext é o dono do `endsAt`. Aqui só
// chegam CÓPIAS; nenhuma função devolve ou altera o horário de término.
import { PermissionsAndroid, Platform } from 'react-native';
import { RestTimer } from '../../modules/rest-timer';

/**
 * ## `RestNotificationStatus`
 * Retrato do que o aparelho permite:
 * - `supported` → há módulo nativo (falso na web, no iOS e em APK antigo);
 * - `notifications` → o app pode mostrar notificações;
 * - `exactAlarm` → pode agendar alarme exato (Android 12+);
 * - `doneChannel` → o canal "Fim do descanso" está ligado e com som.
 */
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

/**
 * ## `armed`
 * Lembra se há um aviso agendado no sistema neste momento.
 */
let armed = false;

/**
 * ## `native`
 * O módulo nativo, só no Android; nas outras plataformas fica `null` e todas as funções viram "não fazer nada".
 */
const native = Platform.OS === 'android' ? RestTimer : null;

/**
 * ## `getRestNotificationStatus()`
 * Consulta o módulo nativo e monta o `RestNotificationStatus`. Sem módulo ou com falha, devolve tudo como "não suportado" em vez de quebrar.
 */
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

/**
 * ## `doneChannelEnabled()`
 * Pergunta se o canal do fim do descanso está ligado. Nunca lança; na dúvida responde `false` (assim o app mantém o próprio alerta).
 *
  * Canal do fim ligado. Nunca lança; na dúvida, false (o app mantém o alerta próprio).
  */
function doneChannelEnabled(): boolean {
  if (!native || typeof native.isDoneChannelEnabled !== 'function') return false;
  try { return native.isDoneChannelEnabled(); } catch { return false; }
}

/**
 * ## `requestNotificationPermission()`
 * Pede ao usuário a permissão `POST_NOTIFICATIONS`.
 *
 * - Android 13 ou mais novo → abre o pedido do sistema.
 * - Versões anteriores → não existe pedido; apenas informa se as notificações estão ativas.
 * - Retorna `true`/`false`; nunca lança.
 *
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

/**
 * ## `openExactAlarmSettings()`
 * Abre a tela do Android "Alarmes e lembretes" para este app.
 *
  * Abre "Alarmes e lembretes" do Android para este app.
  */
export function openExactAlarmSettings(): void {
  try { native?.openExactAlarmSettings(); } catch {}
}

/**
 * ## `openAppNotificationSettings()`
 * Abre os ajustes de notificação do app.
 *
  * Abre os ajustes de notificação do app.
  */
export function openAppNotificationSettings(): void {
  try { native?.openAppNotificationSettings(); } catch {}
}

/**
 * ## `startRestNotification({ endsAt, label })`
 * Liga (ou substitui) a contagem regressiva até `endsAt` e agenda o aviso do fim.
 *
 * 1. Sem módulo nativo → nada a fazer.
 * 2. Monta os textos: título "Descanso", corpo com o nome do exercício, e o aviso final "Descanso terminado".
 * 3. Chama o módulo nativo e guarda em `armed` se o agendamento foi aceito.
 * 4. Chamar de novo **substitui** o anterior (usado ao retomar ou somar +30 s).
 *
 * Mostra/atualiza a contagem até `endsAt` e agenda o aviso do fim.
 * Chamar de novo substitui (retomar, "+30 s"). Sem permissão: não faz nada.
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

/**
 * ## `cancelRestNotification()`
 * Cancela o aviso agendado e remove a notificação da gaveta.
 *
  * Cancela o aviso agendado e remove a notificação.
  */
export async function cancelRestNotification(): Promise<void> {
  armed = false;
  if (!native) return;
  try { native.cancel(); } catch {}
}

/**
 * ## `isNativeAlertArmed()`
 * Responde: "o aviso do fim vai ser dado pelo sistema?". Só é `true` se:
 * 1. há aviso armado, **e**
 * 2. as notificações estão permitidas agora, **e**
 * 3. o canal do fim está ligado.
 *
 * Se for `true`, o app **não** vibra por conta própria (evita alerta duplicado). A checagem é refeita na hora porque a pessoa pode ter desligado algo durante o descanso.
 *
 * true se a notificação está armada com alarme exato E, neste momento, as
 * notificações do app estão permitidas E o canal "Fim do descanso" está ligado
 * com som. Só então o alerta do fim vem do sistema e o app não vibra por conta
 * própria (evita alerta duplicado). Reconfere na hora do fim porque o usuário
 * pode ter desligado algo durante o descanso. Na dúvida, false.
 */
export function isNativeAlertArmed(): boolean {
  if (!armed || !native) return false;
  try {
    return native.areNotificationsEnabled() && doneChannelEnabled();
  } catch {
    return false;
  }
}
