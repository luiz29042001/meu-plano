/**
 * # Progresso de séries (`useSetProgress.ts`)
 * Hook (função especial do React que guarda estado) que lembra **quantas séries** de cada exercício foram feitas hoje. Fica só no aparelho; o banco guarda apenas "exercício feito".
 */

// Séries feitas por exercício no dia (só neste aparelho; o banco guarda apenas
// "exercício feito"). Chave `sets:YYYY-MM-DD:<exerciseId>`; dias antigos são limpos.
import { useCallback, useEffect, useState } from 'react';
import { loadSetCounts, saveSetCount } from '../services/devicePrefs';

/**
 * ## `useSetProgress(today)`
 * Devolve `{ counts, setCount }`.
 *
 * - `counts` → dicionário `{ id do exercício: séries feitas }`.
 * - `setCount(id, n)` → altera a contagem.
 */
export function useSetProgress(today: string) {
  // `counts` é o estado; `setCounts` o atualiza e redesenha a tela.
  const [counts, setCounts] = useState<Record<number, number>>({});

  // ### Efeito: carregar ao abrir ou ao virar o dia
  // 1. `alive` evita atualizar a tela se o componente já saiu.
  // 2. Zera a contagem: séries de ontem não valem hoje.
  // 3. Lê o que estava salvo.
  // 4. Une o lido com o que a pessoa já marcou enquanto lia (o marcado agora vence).
  // 5. A função devolvida no fim é a **limpeza**: marca `alive = false`.
  useEffect(() => {
    let alive = true;
    setCounts({}); // virou o dia: séries de ontem não valem hoje
    loadSetCounts(today).then(loaded => {
      // Mantém o que o usuário já marcou antes da leitura terminar.
      if (alive) setCounts(prev => ({ ...loaded, ...prev }));
    });
    return () => { alive = false; };
  }, [today]);

  // ### `setCount(exerciseId, count)`
  // 1. Impede valores negativos.
  // 2. Atualiza a tela na hora (otimista): zero **remove** a entrada do dicionário.
  // 3. Salva no aparelho em segundo plano (`void` = não esperamos terminar).
  const setCount = useCallback((exerciseId: number, count: number) => {
    const next = Math.max(0, count);
    setCounts(prev => {
      const copy = { ...prev };
      if (next > 0) copy[exerciseId] = next; else delete copy[exerciseId];
      return copy;
    });
    void saveSetCount(today, exerciseId, next);
  }, [today]);

  return { counts, setCount };
}
