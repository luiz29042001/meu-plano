/** Versão web: Alert.alert do react-native-web não mostra nada, então usa o confirm do navegador. */
export function confirmAction(
  title: string,
  message: string,
  _confirmLabel: string,
  onConfirm: () => void,
): void {
  if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
    onConfirm();
  }
}
