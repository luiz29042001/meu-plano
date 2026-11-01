/**
 * # Acesso à dieta (`dietAccess.ts`)
 * Regra única que decide **qual dieta a tela mostra**. Fica isolada e pura para ser fácil de testar e de auditar.
 */

import type { DietMode, Profile, ProfileStatus } from '../types';

/**
 * ## `resolveDietMode(profile, status)`
 * Devolve um destes modos (`DietMode`):
 *
 * | Modo | Significado |
 * |---|---|
 * | `loading` | perfil ainda carregando |
 * | `error` | falhou ao carregar o perfil |
 * | `pending` | dieta ainda não liberada ou sem plano |
 * | `plan` | usa o plano guardado no banco |
 * | `fixed` | usa a dieta fixa do código |
 *
 * Ordem das decisões:
 * 1. Erro no perfil → `error`.
 * 2. Perfil ainda não pronto → `loading`.
 * 3. `diet_enabled` precisa ser **exatamente** `true`; senão → `pending`.
 * 4. Há `diet_plan_id` → `plan` (o banco tem prioridade).
 * 5. `diet_fixed === true` → `fixed`.
 * 6. Caso contrário → `pending`. Nunca se mostra a dieta de outra pessoa por engano.
 *
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
