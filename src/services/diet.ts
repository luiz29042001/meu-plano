import { supabase } from './supabase';
import type { DietPlan } from '../types';

/**
 * ## `fetchDietPlan(planId)`
 * Busca o plano alimentar guardado no banco. Segurança: o RLS só devolve o plano do **próprio** usuário. Sem permissão ou sem plano → `null`.
 */
export async function fetchDietPlan(planId: number): Promise<DietPlan | null> {
  const { data, error } = await supabase
    .from('diet_plans')
    .select('id, slug, name, data')
    .eq('id', planId)
    .maybeSingle();
  if (error) throw error;
  return data as DietPlan | null;
}
