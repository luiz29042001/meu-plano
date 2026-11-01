/**
 * # `useDiet`
 * Reúne os dados da tela de dieta: qual plano mostrar, a variante escolhida (A/B) e o carregamento.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDietPlan } from '../services/diet';
import { updateDietVariant } from '../services/profile';
import { reportNetworkError, reportNetworkOk } from '../utils/networkStatus';
import { friendlyError, isNetworkError } from '../utils/errors';
import type { DietPlan, DietStatus } from '../types';

/**
 * `PlanState`: etapas de carregamento do plano guardado no banco.
 */
type PlanState = 'idle' | 'loading' | 'ready' | 'error';

/**
 * ## `useDiet()`
 * Regra central (`dietAccess.ts`): a dieta fixa do código só aparece quando o perfil está carregado e marcado como `diet_fixed`. Perfil com erro → `error`, **nunca** a dieta de outra pessoa.
 *
 * Dados da tela de dieta. Regra (src/utils/dietAccess.ts):
 * a dieta fixa do código só aparece com status 'fixed' (perfil carregado e
 * diet_fixed = true). Perfil com erro → status 'error', nunca a dieta do Luiz.
 */
export function useDiet() {
  // Lê da conta: usuário, perfil, erro, modo de dieta e a função de recarregar.
  const { userId, profile, profileError, dietMode, refreshProfile } = useAuth();
  // `planId` só existe no modo `plan` (plano vindo do banco).
  const planId = dietMode === 'plan' ? (profile?.diet_plan_id ?? null) : null;

  // Estados do plano: dados, etapa, erro, "chave de recarga" e o último plano carregado com sucesso.
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [planState, setPlanState] = useState<PlanState>('idle');
  const [planError, setPlanError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedPlanId = useRef<number | null>(null);

  // ### Efeito: carregar o plano
  // 1. Sem `planId` → zera tudo e sai.
  // 2. Mostra o "carregando" só na primeira vez; recarregar o mesmo plano não volta ao spinner.
  // 3. Busca o plano.
  // 4. Plano inexistente → estado de erro com mensagem.
  // 5. Sucesso → guarda e marca pronto.
  // 6. Falha → se já havia plano exibido, **mantém** (não apaga o que a pessoa vê); senão mostra erro.
  // 7. `alive` ignora respostas de efeitos antigos.
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
        reportNetworkOk();
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
        if (isNetworkError(e)) reportNetworkError();
        if (loadedPlanId.current === planId) return; // mantém o plano já exibido
        setPlanState('error');
        setPlanError(friendlyError(e, 'Não foi possível carregar o seu plano alimentar.'));
      });
    return () => { alive = false; };
  }, [planId, reloadKey]);

  // ### Variante A/B
  // Estado local para a troca ser instantânea; o valor vem do perfil e é gravado no banco.
  // Variante A/B (ou Treino/Descanso): escolha local imediata, gravada no perfil.
  const [variant, setVariant] = useState<'A' | 'B'>(profile?.diet_variant ?? 'A');
  const profileVariant = profile?.diet_variant;
  // Sempre que o perfil trouxer outra variante, sincroniza a tela.
  useEffect(() => { if (profileVariant) setVariant(profileVariant); }, [profileVariant]);

  // ### `changeVariant(v)`
  // 1. Guarda a anterior e troca na tela na hora.
  // 2. Sem usuário → desfaz e devolve `false`.
  // 3. Grava no banco e recarrega o perfil; devolve `true`.
  // 4. Falha → volta para a anterior (o banco manteve a antiga) e devolve `false`.
  /** Troca a variante. Devolve false se não conseguiu salvar (a escolha continua na tela). */
  const changeVariant = useCallback(async (v: 'A' | 'B'): Promise<boolean> => {
    const previous = variant;
    setVariant(v);
    if (!userId) { setVariant(previous); return false; }
    try {
      await updateDietVariant(userId, v);
      refreshProfile();
      return true;
    } catch (e) {
      if (isNetworkError(e)) reportNetworkError();
      setVariant(previous); // o banco manteve a anterior: a tela volta para ela
      return false;
    }
  }, [userId, variant, refreshProfile]);

  // ### `status` final
  // No modo `plan`, depende do carregamento do plano; nos outros modos, é o próprio modo.
  let status: DietStatus;
  if (dietMode === 'plan') {
    status = planState === 'ready' ? 'plan' : planState === 'error' ? 'error' : 'loading';
  } else {
    status = dietMode;
  }

  // Mensagem de erro: do perfil, se o problema foi nele; do plano, caso contrário.
  const error = status !== 'error'
    ? null
    : dietMode === 'error'
      ? (profileError ?? 'Não foi possível carregar o seu perfil.')
      : planError;

  // ### `retry()`
  // Botão "Tentar de novo": recarrega o perfil (se o erro foi nele) ou o plano.
  /** Para o botão "Tentar de novo". */
  const retry = useCallback(() => {
    if (dietMode === 'error') { refreshProfile(); return; }
    setReloadKey(k => k + 1);
  }, [dietMode, refreshProfile]);

  // Entrega estado, dados e ações.
  return {
    status,
    error,
    /** Plano do banco; preenchido só quando status === 'plan'. */
    plan: status === 'plan' ? plan : null,
    variant,
    changeVariant,
    retry,
    /** Relê o perfil (botão "Atualizar" da dieta em preparação). */
    refresh: refreshProfile,
  };
}
