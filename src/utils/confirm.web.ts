/**
 * # `confirmAction` (web)
 * Na web, `Alert.alert` do react-native-web não mostra nada; usa o `confirm` nativo do navegador.
 *
  * Versão web: Alert.alert do react-native-web não mostra nada, então usa o confirm do navegador.
  */
/**
 * ## `confirmAction(title, message, _confirmLabel, onConfirm)`
 * Mostra a caixa Ok/Cancelar do navegador com título e mensagem; só chama `onConfirm` se a pessoa aceitar. O rótulo do botão não é usado (o navegador decide).
 */
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
