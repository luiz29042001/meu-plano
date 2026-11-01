/**
 * # Confirmação (`confirm.ts`)
 * Janela de "Tem certeza?" para ações que apagam ou desfazem algo.
 */

import { Alert } from 'react-native';

/**
 * ## `confirmAction(title, message, confirmLabel, onConfirm)`
 * Mostra um alerta com dois botões: **Cancelar** e o botão de confirmação (em vermelho, estilo `destructive`). A função `onConfirm` só roda se o usuário confirmar.
 *
 * > No navegador existe `confirm.web.ts`, porque `Alert.alert` não funciona na web. O Metro escolhe o arquivo certo pela extensão.
 *
  * Pergunta Sim/Não antes de uma ação. Na web existe confirm.web.ts (Alert.alert não funciona no navegador).
  */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
): void {
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
