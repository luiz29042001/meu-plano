/**
 * # Ponte JavaScript do módulo nativo `RestTimer` (Android)
 * O módulo é escrito em Kotlin (pasta `android/`) e exposto ao app por aqui, com a *Expo Modules API*. Use **sempre** via `src/services/restNotification.ts`, que tem um "gêmeo" vazio para a web.
 *
 * O valor exportado é `null` quando o módulo não existe no aplicativo instalado (web, Expo Go ou APK antigo); por isso o código que o usa sempre confere antes.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * ## `RestTexts`
 * Os quatro textos da notificação, montados no JavaScript (em português): título e corpo da contagem, e título e corpo do aviso de fim.
 */
export interface RestTexts {
  /** Título da notificação fixa. Ex.: "Descanso". */
  title: string;
  /** Texto da notificação fixa. Ex.: nome do exercício. */
  body: string;
  /** Título do aviso de fim. Ex.: "Descanso terminado". */
  doneTitle: string;
  /** Texto do aviso de fim. Ex.: "Próxima série: Supino". */
  doneBody: string;
}

/**
 * ## `RestTimerNativeModule`
 * O "contrato" do módulo: as funções que o Kotlin oferece ao JavaScript.
 *
 * | Função | O que faz |
 * |---|---|
 * | `start(endsAtMs, texts)` | mostra a contagem até o horário de término e agenda o aviso do fim; devolve `true` se o aviso é confiável (alarme exato + notificações permitidas + canal com som) |
 * | `cancel()` | cancela o alarme e remove as notificações |
 * | `areNotificationsEnabled()` | o app pode mostrar notificações? |
 * | `canScheduleExactAlarms()` | pode agendar alarme exato? (Android 12+) |
 * | `isDoneChannelEnabled()` | o canal "Fim do descanso" está ligado e com som? |
 * | `openExactAlarmSettings()` | abre a tela de alarmes do Android |
 * | `openAppNotificationSettings()` | abre os ajustes de notificação do app |
 */
export interface RestTimerNativeModule {
  /**
   * Mostra a contagem até endsAtMs (epoch ms) e agenda o aviso do fim.
   * true = alarme exato armado E notificações permitidas E canal "descanso-fim" ligado com som.
   */
  start(endsAtMs: number, texts: RestTexts): boolean;
  /** Cancela o alarme e remove a notificação. */
  cancel(): void;
  areNotificationsEnabled(): boolean;
  canScheduleExactAlarms(): boolean;
  /** Canal "Fim do descanso" ligado e com som (Android 8+; antes disso, true). */
  isDoneChannelEnabled(): boolean;
  openExactAlarmSettings(): void;
  openAppNotificationSettings(): void;
}

/**
 * ## `RestTimer`
 * Carrega o módulo nativo de forma **opcional**: se não existir, vira `null` em vez de quebrar o app.
 */
export const RestTimer = requireOptionalNativeModule<RestTimerNativeModule>('RestTimer');
