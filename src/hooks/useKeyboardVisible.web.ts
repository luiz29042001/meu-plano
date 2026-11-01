/**
 * # `useKeyboardVisible` (web)
 * No navegador não há evento de teclado virtual. Considera-se "teclado aberto" quando um campo de texto está com foco.
 */
import { useEffect, useState } from 'react';

/**
 * ### `isField(el)`
 * Diz se o elemento é um `<input>` ou `<textarea>`.
 */
const isField = (el: EventTarget | null) => {
  // Lê o nome da tag do elemento (`INPUT`, `TEXTAREA`...).
  const t = (el as HTMLElement | null)?.tagName;
  return t === 'INPUT' || t === 'TEXTAREA';
};

/**
 * ## `useKeyboardVisible()`
 * Devolve `true` enquanto um campo de texto tem foco.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // 1. `focusin`: algum elemento ganhou foco; se for campo de texto, marca aberto.
    // 2. `focusout`: perdeu foco, marca fechado.
    // 3. Registra os dois ouvintes e os remove na limpeza.
    const onIn = (e: FocusEvent) => { if (isField(e.target)) setVisible(true); };
    const onOut = () => setVisible(false);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);
  return visible;
}
