import { Alert } from 'react-native';

/** Pergunta Sim/Não antes de uma ação. Na web existe confirm.web.ts (Alert.alert não funciona no navegador). */
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
