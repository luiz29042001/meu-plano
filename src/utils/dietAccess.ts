import type { DietMode, Profile, ProfileStatus } from '../types';

/**
 * Regra única de qual dieta mostrar. Só decide com o perfil CARREGADO.
 * - Perfil carregando/sem sessão → 'loading'; perfil com erro → 'error'.
 * - diet_enabled precisa ser exatamente true (sem o antigo "!== false").
 * - Plano do banco tem prioridade; a dieta fixa do código só com diet_fixed = true.
 * - Dieta liberada mas sem plano nem flag → 'pending' (nunca a dieta do Luiz).
 */
export function resolveDietMode(profile: Profile | null, status: ProfileStatus): DietMode {
  if (status === 'error') return 'error';
  if (status !== 'ready' || !profile) return 'loading';
  if (profile.diet_enabled !== true) return 'pending';
  if (profile.diet_plan_id != null) return 'plan';
  if (profile.diet_fixed === true) return 'fixed';
  return 'pending';
}
