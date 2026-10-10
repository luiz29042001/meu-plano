import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDietPlan } from '../services/diet';
import { updateDietVariant } from '../services/profile';
import { friendlyError } from '../utils/errors';
import type { DietPlan, DietStatus } from '../types';

type PlanState = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Dados da tela de dieta. Regra (src/utils/dietAccess.ts):
 * a dieta fixa do código só aparece com status 'fixed' (perfil carregado e
 * diet_fixed = true). Perfil com erro → status 'error', nunca a dieta do Luiz.
 */
export function useDiet() {
  const { userId, profile, profileError, dietMode, refreshProfile } = useAuth();
  const planId = dietMode === 'plan' ? (profile?.diet_plan_id ?? null) : null;

  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [planState, setPlanState] = useState<PlanState>('idle');
  const [planError, setPlanError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedPlanId = useRef<number | null>(null);

  useEffect(() => {
    if (planId == null) {
      loadedPlanId.current = null;
      setPlan(null);
      setPlanState('idle');
      setPlanError(null);
      return;
    }
    let alive = true;
    // Recarregar o mesmo plano não volta para o spinner.
    if (loadedPlanId.current !== planId) setPlanState('loading');
    setPlanError(null);
    fetchDietPlan(planId)
      .then(p => {
        if (!alive) return;
        if (!p) {
          loadedPlanId.current = null;
          setPlan(null);
          setPlanState('error');
          setPlanError('Não encontramos o seu plano alimentar. Tente de novo.');
          return;
        }
        loadedPlanId.current = planId;
        setPlan(p);
        setPlanState('ready');
      })
      .catch(e => {
        if (!alive) return;
        if (loadedPlanId.current === planId) return; // mantém o plano já exibido
        setPlanState('error');
        setPlanError(friendlyError(e, 'Não foi possível carregar o seu plano alimentar.'));
      });
    return () => { alive = false; };
  }, [planId, reloadKey]);

  // Variante A/B (ou Treino/Descanso): escolha local imediata, gravada no perfil.
  const [variant, setVariant] = useState<'A' | 'B'>(profile?.diet_variant ?? 'A');
  const profileVariant = profile?.diet_variant;
  useEffect(() => { if (profileVariant) setVariant(profileVariant); }, [profileVariant]);

  /** Troca a variante. Devolve false se não conseguiu salvar (a escolha continua na tela). */
  const changeVariant = useCallback(async (v: 'A' | 'B'): Promise<boolean> => {
    const previous = variant;
    setVariant(v);
    if (!userId) { setVariant(previous); return false; }
    try {
      await updateDietVariant(userId, v);
      refreshProfile();
      return true;
    } catch {
      setVariant(previous); // o banco manteve a anterior: a tela volta para ela
      return false;
    }
  }, [userId, variant, refreshProfile]);

  let status: DietStatus;
  if (dietMode === 'plan') {
    status = planState === 'ready' ? 'plan' : planState === 'error' ? 'error' : 'loading';
  } else {
    status = dietMode;
  }

  const error = status !== 'error'
    ? null
    : dietMode === 'error'
      ? (profileError ?? 'Não foi possível carregar o seu perfil.')
      : planError;

  /** Para o botão "Tentar de novo". */
  const retry = useCallback(() => {
    if (dietMode === 'error') { refreshProfile(); return; }
    setReloadKey(k => k + 1);
  }, [dietMode, refreshProfile]);

  return {
    status,
    error,
    /** Plano do banco; preenchido só quando status === 'plan'. */
    plan: status === 'plan' ? plan : null,
    variant,
    changeVariant,
    retry,
  };
}
