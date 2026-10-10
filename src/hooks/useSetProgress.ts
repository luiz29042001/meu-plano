// Séries feitas por exercício no dia (só neste aparelho; o banco guarda apenas
// "exercício feito"). Chave `sets:YYYY-MM-DD:<exerciseId>`; dias antigos são limpos.
import { useCallback, useEffect, useState } from 'react';
import { loadSetCounts, saveSetCount } from '../services/devicePrefs';

export function useSetProgress(today: string) {
  const [counts, setCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    let alive = true;
    setCounts({}); // virou o dia: séries de ontem não valem hoje
    loadSetCounts(today).then(loaded => {
      // Mantém o que o usuário já marcou antes da leitura terminar.
      if (alive) setCounts(prev => ({ ...loaded, ...prev }));
    });
    return () => { alive = false; };
  }, [today]);

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
