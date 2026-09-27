import { supabase } from './supabase';
import type { DietPlan } from '../types';

// Plano alimentar individual guardado no banco (RLS: cada conta só lê o seu)
export async function fetchDietPlan(planId: number): Promise<DietPlan | null> {
  const { data, error } = await supabase
    .from('diet_plans')
    .select('id, slug, name, data')
    .eq('id', planId)
    .maybeSingle();
  if (error) throw error;
  return data as DietPlan | null;
}
