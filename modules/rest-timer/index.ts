// Ponte JS do módulo nativo local "RestTimer" (Android, Expo Modules API).
// Use SEMPRE via src/services/restNotification.ts (que tem o gêmeo .web.ts no-op).
// `null` quando o módulo não existe no binário (web, Expo Go, APK antigo).
import { requireOptionalNativeModule } from 'expo-modules-core';

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

export const RestTimer = requireOptionalNativeModule<RestTimerNativeModule>('RestTimer');
