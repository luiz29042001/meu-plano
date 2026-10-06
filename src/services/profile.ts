import { supabase } from './supabase';
import type { Profile } from '../types';

// Observação: `*` em profiles é proposital. Se o app for publicado antes da
// migração que cria `diet_fixed`, a coluna só vem ausente (sem quebrar o login).
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, program:workout_programs(id, slug, name, description), diet_plan:diet_plans(id, slug, name)')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

/**
 * Único campo do perfil que o app grava. O banco só permite ao usuário
 * alterar full_name, diet_variant e updated_at (migração 20261005120000).
 */
export async function updateDietVariant(
  userId: string,
  variant: 'A' | 'B'
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ diet_variant: variant, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}
