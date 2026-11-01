/**
 * # Perfil (`profile.ts`)
 * Leitura e gravação do perfil do usuário no banco.
 */

import { supabase } from './supabase';
import type { Profile } from '../types';

/**
 * ## `fetchProfile(userId)`
 * Busca o perfil **com o programa de treino e o plano de dieta já anexados** (join do Supabase), em uma só consulta.
 *
 * - `maybeSingle()` devolve `null` em vez de erro quando não há perfil.
 * - Se der erro, ele é lançado para quem chamou decidir o que mostrar.
 * - O `*` é proposital: se uma coluna nova ainda não existir no banco, ela só vem ausente, sem quebrar o login.
 */
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
 * ## `updateDietVariant(userId, variant)`
 * Único campo do perfil que o app grava: a variante da dieta ('A' ou 'B').
 *
 * O banco só permite ao usuário alterar `full_name`, `diet_variant` e `updated_at` (trava na migração `20261005120000`). Mesmo que alguém modificasse o app, não conseguiria se dar acesso a outra dieta.
 *
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
