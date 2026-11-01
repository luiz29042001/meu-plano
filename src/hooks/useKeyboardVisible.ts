/**
 * # `useKeyboardVisible` (Android/iOS)
 * Hook que informa se o teclado está aberto, para esconder a barra inferior e o dock.
 */
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * ## `useKeyboardVisible()`
 * Devolve `true` com o teclado aberto.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // 1. Escolhe os nomes dos eventos: o iOS avisa *antes* (`Will`), o Android *depois* (`Did`).
    // 2. Assina os dois eventos, ligando e desligando o estado.
    // 3. A função devolvida cancela as duas assinaturas ao sair.
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(showEvt, () => setVisible(true));
    const b = Keyboard.addListener(hideEvt, () => setVisible(false));
    return () => { a.remove(); b.remove(); };
  }, []);
  return visible;
}
