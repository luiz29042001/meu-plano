import { supabase } from './supabase';
import type { Profile } from '../types';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, program:workout_programs(*)')
    .eq('id', userId)
    .maybeSingle();

  // Compatibilidade: se a relação com programas ainda não existir, cai no select simples
  if (error && /workout_programs|relationship/i.test(error.message)) {
    const fallback = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (fallback.error) throw fallback.error;
    return fallback.data as Profile | null;
  }

  if (error) throw error;
  return data as Profile | null;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ ...profile, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

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
