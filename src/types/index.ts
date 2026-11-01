/**
 * # Tipos do app (`types/index.ts`)
 * Descrevem o **formato dos dados** que circulam no app (linhas do banco, dados da dieta, estados das telas). O TypeScript usa isso para avisar de erros *antes* de o app rodar. Não há lógica aqui, só "moldes".
 */

/**
 * ## `Profile`
 * Linha da tabela `profiles` (um registro por pessoa).
 *
 * | Campo | Para que serve |
 * |---|---|
 * | `id` | identificador da conta (o mesmo do login) |
 * | `diet_variant` | variante da dieta escolhida: 'A' ou 'B' |
 * | `program_id` | qual programa de treino a pessoa segue |
 * | `diet_enabled` | a aba de dieta está liberada? |
 * | `diet_plan_id` | plano de dieta guardado no banco (se houver) |
 * | `diet_fixed` | usa a dieta fixa do código; só o banco altera |
 * | `program`, `diet_plan` | dados anexados pela consulta (join) |
 */
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

/**
 * ## `WorkoutProgram`
 * Um programa de treino (ex.: "Superior/Inferior 4x"). Agrupa vários dias.
 */
export interface WorkoutProgram {
  id: number;
  slug: string;
  name: string;
  description: string | null;
}

/**
 * ## `WorkoutDay`
 * Um dia da rotina (ex.: "Superior A"). `weekday_index` é a **ordem** na sequência, `color` é a cor guardada no banco, `is_rest` marca descanso e `exercises` vem anexado pela consulta.
 */
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

/**
 * ## `Exercise`
 * Um exercício de um dia: posição na lista, nome, séries, repetições, descanso em segundos e uma dica opcional.
 */
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

/**
 * ## `WorkoutCompletion`
 * Registro de que um treino foi concluído numa data. `completed_date` está no formato `AAAA-MM-DD` e `workout_day` vem anexado quando a consulta pede.
 */
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

/**
 * ## `ExerciseCheck`
 * Marcação de "exercício feito" em uma data.
 */
export interface ExerciseCheck {
  id: string;
  user_id: string;
  exercise_id: number;
  check_date: string;
  checked: boolean;
}

/**
 * ## `UserStats`
 * Totais do usuário, calculados por um gatilho no banco. Hoje o app exibe só `total_workouts`.
 */
export interface UserStats {
  id: string;
  user_id: string;
  total_workouts: number;
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
  updated_at: string;
}

/**
 * ## Tipos da dieta
 * Estrutura em camadas: plano → variantes → refeições → itens → substitutos.
 */
// Diet types (local data + user preference from DB)
/**
 * ### `DietItem`
 * Um alimento da refeição, com quantidade (`detail`), calorias, uma dica e a lista de substitutos.
 */
export interface DietItem {
  name: string;
  detail: string;
  kcal: number;
  tip: string;
  subs: Substitute[];
}

/**
 * ### `Substitute`
 * Um alimento que pode trocar o item original, com a quantidade equivalente.
 */
export interface Substitute {
  name: string;
  qty: string;
  kcal: number;
  note: string;
}

/**
 * ### `Meal`
 * Uma refeição. `macros` guarda proteína (`p`), carboidrato (`c`) e gordura (`g`) em gramas. `isAlternative` marca opções que **não somam** no total do dia. `color` pode ser o nome de uma cor do tema ou um hexadecimal.
 */
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

/**
 * ### `DietVariant`
 * Uma versão do dia alimentar (ex.: dia de treino × dia de descanso), com seu aviso (`banner`) e suas refeições.
 */
export interface DietVariant {
  key: 'A' | 'B';
  label: string;
  banner: string;
  meals: Meal[];
}

/**
 * ### `DietPlanData`
 * Conteúdo completo de um plano. É exatamente o JSON guardado na coluna `data` da tabela `diet_plans`.
 */
export interface DietPlanData {
  name: string;
  subtitle: string;
  note: string;
  variants: DietVariant[];
}

/**
 * ### `DietPlan`
 * Linha da tabela `diet_plans`: identificador, nome e o conteúdo (`DietPlanData`).
 */
export interface DietPlan {
  id: number;
  slug: string;
  name: string;
  data: DietPlanData;
}

/**
 * ## Estados das telas
 * Textos fixos que descrevem em que etapa cada tela está. Cada tela decide o que desenhar a partir deles.
 */
// ─── Estados expostos pelos hooks/contextos ──────────────────────────────────

/**
 * ### `ProfileStatus`
 * Etapa do carregamento do perfil: `idle` (sem login), `loading`, `ready` ou `error`.
 *
  * Situação do perfil no AuthContext. 'idle' = sem sessão.
  */
export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * ### `DietMode`
 * O que a área de dieta deve mostrar, decidido só com o perfil carregado: `loading`, `error`, `pending` ("dieta em criação"), `fixed` (dieta do código) ou `plan` (plano do banco). Em caso de erro, **nunca** cai na dieta fixa.
 *
 * O que a área de dieta deve mostrar, decidido só com o perfil CARREGADO:
 * - loading: perfil ainda carregando
 * - error:   perfil falhou (erro + "Tentar de novo"). Nunca cai na dieta fixa.
 * - pending: sem dieta liberada ("Dieta em criação")
 * - fixed:   dieta fixa do código (perfil com diet_fixed = true)
 * - plan:    plano do banco (perfil com diet_plan_id)
 */
export type DietMode = 'loading' | 'error' | 'pending' | 'fixed' | 'plan';

/**
 * ### `WorkoutStatus`
 * Etapas da tela de treino. `empty` = sem programa ou sem dias de treino.
 *
  * Estado da tela de treino. 'empty' = sem programa / nenhum dia de treino.
  */
export type WorkoutStatus = 'loading' | 'error' | 'empty' | 'ready';

/**
 * ### `CalendarStatus`
 * Etapas da tela de calendário.
 *
  * Estado da tela de calendário.
  */
export type CalendarStatus = 'loading' | 'error' | 'ready';

/**
 * ### `DietStatus`
 * Etapas da tela de dieta (igual ao `DietMode`, que já inclui o carregamento do plano).
 *
  * Estado da tela de dieta (inclui o carregamento do plano do banco).
  */
export type DietStatus = DietMode;

/**
 * ### `LoginErrorCode`
 * Códigos de falha do login. A tela compara pelo código, nunca pelo texto. `cancelled` = a pessoa fechou a janela do Google (não é erro para mostrar).
 */
export type LoginErrorCode =
  | 'cancelled'      // usuário fechou a janela do Google: não mostrar erro
  | 'in_progress'
  | 'play_services'
  | 'network'
  | 'unknown';

/**
 * ### `LoginError`
 * Código + mensagem já em português.
 *
  * Erro de login já com mensagem em pt-BR. Compare por `code`, nunca pelo texto.
  */
export interface LoginError {
  code: LoginErrorCode;
  message: string;
}

/**
 * ### `TimerState`
 * Estado do cronômetro de descanso: se está visível, segundos restantes, total, se está rodando, rótulo (nome do exercício) e a cor crua do dia.
 */
export interface TimerState {
  visible: boolean;
  seconds: number;
  total: number;
  running: boolean;
  label: string;
  /** Cor CRUA do banco (workout_days.color); '' = padrão (vira restColor). Exibir via useTheme().dayColor. */
  color: string;
}
