// Web: o teclado virtual não dispara eventos; vale o foco em campo de texto.
import { useEffect, useState } from 'react';

const isField = (el: EventTarget | null) => {
  const t = (el as HTMLElement | null)?.tagName;
  return t === 'INPUT' || t === 'TEXTAREA';
};

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
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
