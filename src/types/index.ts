export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  weight_kg: number;
  height_cm: number;
  age: number;
  diet_variant: 'A' | 'B';
  program_id?: number | null;
  diet_enabled?: boolean;
  diet_plan_id?: number | null;
  /** true = usa a dieta fixa do código (dietData.ts). Só o banco altera (migração 20261005120000). */
  diet_fixed?: boolean;
  diet_plan?: { id: number; slug: string; name: string } | null;
  program?: WorkoutProgram | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutProgram {
  id: number;
  slug: string;
  name: string;
  description: string | null;
}

export interface WorkoutDay {
  id: number;
  slug: string;
  label: string;
  weekday: string;
  weekday_index: number;
  color: string;
  muscles: string;
  is_rest: boolean;
  program_id?: number;
  exercises?: Exercise[];
}

export interface Exercise {
  id: number;
  workout_day_id: number;
  position: number;
  name: string;
  sets: string;
  reps: string;
  rest_seconds: number;
  tip: string | null;
}

export interface WorkoutCompletion {
  id: string;
  user_id: string;
  workout_day_id: number;
  completed_date: string;
  duration_min: number | null;
  notes: string | null;
  created_at: string;
  workout_day?: WorkoutDay;
}

export interface ExerciseCheck {
  id: string;
  user_id: string;
  exercise_id: number;
  check_date: string;
  checked: boolean;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_workouts: number;
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
  updated_at: string;
}

// Diet types (local data + user preference from DB)
export interface DietItem {
  name: string;
  detail: string;
  kcal: number;
  tip: string;
  subs: Substitute[];
}

export interface Substitute {
  name: string;
  qty: string;
  kcal: number;
  note: string;
}

export interface Meal {
  id: string;
  time: string;
  label: string;
  icon: string;
  /** Nome de token ('pushColor', 'red'…, dietData.ts) ou hex (dieta do banco). Exibir sempre via resolveAccent (useTheme). */
  color: string;
  kcal: number;
  macros: { p: number; c: number; g: number };
  items: DietItem[];
  isSupp?: boolean;
  isFasted?: boolean;
  note?: string;           // observações da refeição (ex.: orientações da nutricionista)
  isAlternative?: boolean; // opção alternativa: aparece na lista, mas não soma no total do dia
}

export interface DietVariant {
  key: 'A' | 'B';
  label: string;
  banner: string;
  meals: Meal[];
}

export interface DietPlanData {
  name: string;
  subtitle: string;
  note: string;
  variants: DietVariant[];
}

export interface DietPlan {
  id: number;
  slug: string;
  name: string;
  data: DietPlanData;
}

// ─── Estados expostos pelos hooks/contextos ──────────────────────────────────

/** Situação do perfil no AuthContext. 'idle' = sem sessão. */
export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * O que a área de dieta deve mostrar, decidido só com o perfil CARREGADO:
 * - loading: perfil ainda carregando
 * - error:   perfil falhou (erro + "Tentar de novo"). Nunca cai na dieta fixa.
 * - pending: sem dieta liberada ("Dieta em criação")
 * - fixed:   dieta fixa do código (perfil com diet_fixed = true)
 * - plan:    plano do banco (perfil com diet_plan_id)
 */
export type DietMode = 'loading' | 'error' | 'pending' | 'fixed' | 'plan';

/** Estado da tela de treino. 'empty' = sem programa / nenhum dia de treino. */
export type WorkoutStatus = 'loading' | 'error' | 'empty' | 'ready';

/** Estado da tela de calendário. */
export type CalendarStatus = 'loading' | 'error' | 'ready';

/** Estado da tela de dieta (inclui o carregamento do plano do banco). */
export type DietStatus = DietMode;

export type LoginErrorCode =
  | 'cancelled'      // usuário fechou a janela do Google: não mostrar erro
  | 'in_progress'
  | 'play_services'
  | 'network'
  | 'unknown';

/** Erro de login já com mensagem em pt-BR. Compare por `code`, nunca pelo texto. */
export interface LoginError {
  code: LoginErrorCode;
  message: string;
}

export interface TimerState {
  visible: boolean;
  seconds: number;
  total: number;
  running: boolean;
  label: string;
  /** Cor CRUA do banco (workout_days.color); '' = padrão (vira restColor). Exibir via useTheme().dayColor. */
  color: string;
}
