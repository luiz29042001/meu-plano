/**
 * # Serviço de treino (`workout.ts`)
 * Todas as conversas do app com o banco sobre **treinos**: dias e exercícios, conclusões, marcações, estatísticas e anotações.
 *
 * > Padrão de todas as funções: consulta ao Supabase → se houver `error`, ele é **lançado** (`throw`) para a tela decidir a mensagem → senão devolve os dados. A segurança real mora no RLS do banco: cada usuário só enxerga as próprias linhas.
 */

import { supabase } from './supabase';
import type { WorkoutDay, WorkoutCompletion, ExerciseCheck, UserStats } from '../types';

/**
 * ## Listas de colunas
 * Constantes com os nomes das colunas pedidas em cada tabela. Pedir colunas explícitas (em vez de `select('*')`) evita trazer dados novos por acidente e deixa a consulta mais leve. `COMPLETION_WITH_DAY` anexa o dia de treino à conclusão (join).
 */
const DAY_COLS = 'id, slug, label, weekday, weekday_index, color, muscles, is_rest, program_id';
const EXERCISE_COLS = 'id, workout_day_id, position, name, sets, reps, rest_seconds, tip';
const COMPLETION_COLS = 'id, user_id, workout_day_id, completed_date, duration_min, notes, created_at';
const COMPLETION_WITH_DAY = `${COMPLETION_COLS}, workout_day:workout_days(${DAY_COLS})`;
const CHECK_COLS = 'id, user_id, exercise_id, check_date, checked';
const STATS_COLS = 'id, user_id, total_workouts, current_streak, longest_streak, last_workout_date, updated_at';

// ─── WORKOUT DAYS & EXERCISES ─────────────────────────────────────────────────

/**
 * ## `fetchWorkoutDays(programId)`
 * Busca os dias do programa **junto com seus exercícios** em uma só consulta.
 *
 * 1. `programId === null` → pessoa sem programa: devolve lista vazia sem consultar.
 * 2. Monta a consulta pedindo os dias e, aninhados, os exercícios.
 * 3. Se `programId` foi informado, filtra por ele (defesa extra além do RLS).
 * 4. Ordena os dias por `weekday_index` e os exercícios por `position`.
 * 5. Erro → lança; sucesso → lista (ou vazia).
 *
 * Dias do programa com exercícios.
 * - programId número: filtra por ele (defesa extra além da RLS).
 * - programId null: o perfil não tem programa → lista vazia, sem consultar.
 * - programId undefined: perfil indisponível → sem filtro, a RLS decide.
 */
export async function fetchWorkoutDays(programId?: number | null): Promise<WorkoutDay[]> {
  if (programId === null) return [];
  let query = supabase
    .from('workout_days')
    .select(`${DAY_COLS}, exercises (${EXERCISE_COLS})`);
  if (programId !== undefined) query = query.eq('program_id', programId);

  const { data, error } = await query
    .order('weekday_index', { ascending: true })
    .order('position', { referencedTable: 'exercises', ascending: true });

  if (error) throw error;
  return (data ?? []) as WorkoutDay[];
}

// ─── COMPLETIONS ──────────────────────────────────────────────────────────────

/**
 * ## `fetchCompletions(userId, year, month)`
 * Treinos concluídos de **um mês**, para o calendário.
 *
 * 1. Monta o primeiro e o último dia do mês (`month` vem de 0 a 11, por isso `+ 1`).
 * 2. Filtra pelo usuário e pelo intervalo de datas.
 * 3. Ordena do mais recente para o mais antigo.
 */
export async function fetchCompletions(
  userId: string,
  year: number,
  month: number
): Promise<WorkoutCompletion[]> {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

  const { data, error } = await supabase
    .from('workout_completions')
    .select(COMPLETION_WITH_DAY)
    .eq('user_id', userId)
    .gte('completed_date', from)
    .lte('completed_date', to)
    .order('completed_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as WorkoutCompletion[];
}

/**
 * ## `fetchTodayCompletion(userId, today)`
 * Devolve a conclusão de hoje, ou `null` se ainda não treinou. Usa `maybeSingle()`: zero linhas não é erro.
 */
export async function fetchTodayCompletion(
  userId: string,
  today: string
): Promise<WorkoutCompletion | null> {
  const { data, error } = await supabase
    .from('workout_completions')
    .select(COMPLETION_WITH_DAY)
    .eq('user_id', userId)
    .eq('completed_date', today)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as WorkoutCompletion | null;
}

/**
 * ## `markWorkoutComplete(userId, workoutDayId, date, durationMin)`
 * Registra que o treino do dia foi concluído.
 *
 * Usa `upsert` (inserir ou atualizar): existe **uma conclusão por usuário por dia**. Se já havia uma hoje, ela é substituída, por isso a tela confirma antes quando for outro dia de treino. Devolve a linha gravada já com o dia anexado.
 *
 * Grava a conclusão do dia. Uma por usuário por dia (unique user_id+completed_date):
 * se já existir uma hoje, ela é SUBSTITUÍDA. A tela deve confirmar antes
 * quando `todayCompletion` for de outro dia de treino.
 */
export async function markWorkoutComplete(
  userId: string,
  workoutDayId: number,
  date: string,
  durationMin?: number
): Promise<WorkoutCompletion> {
  const { data, error } = await supabase
    .from('workout_completions')
    .upsert({
      user_id: userId,
      workout_day_id: workoutDayId,
      completed_date: date,
      duration_min: durationMin ?? null,
    }, { onConflict: 'user_id,completed_date' })
    .select(COMPLETION_WITH_DAY)
    .single();

  if (error) throw error;
  return data as unknown as WorkoutCompletion;
}

/**
 * ## `fetchRecentCompletionDates(userId, fromISO)`
 * Só as datas dos treinos concluídos desde `fromISO`. Leve: não traz o resto da linha. Usada nas estatísticas da semana.
 *
  * Só as datas (YYYY-MM-DD) de treinos concluídos desde `fromISO`.
  */
export async function fetchRecentCompletionDates(userId: string, fromISO: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('workout_completions')
    .select('completed_date')
    .eq('user_id', userId)
    .gte('completed_date', fromISO);
  if (error) throw error;
  return (data ?? []).map((r: { completed_date: string }) => r.completed_date);
}

// ─── EXERCISE CHECKS ──────────────────────────────────────────────────────────

/**
 * ## `fetchExerciseChecks(userId, date)`
 * Quais exercícios o usuário já marcou como feitos naquela data.
 */
export async function fetchExerciseChecks(
  userId: string,
  date: string
): Promise<ExerciseCheck[]> {
  const { data, error } = await supabase
    .from('exercise_checks')
    .select(CHECK_COLS)
    .eq('user_id', userId)
    .eq('check_date', date);

  if (error) throw error;
  return (data ?? []) as ExerciseCheck[];
}

/**
 * ## `upsertExerciseCheck(userId, exerciseId, date, checked)`
 * Marca ou desmarca um exercício.
 *
 * - `checked = true` → grava (`upsert`, sem duplicar).
 * - `checked = false` → **apaga** a linha, em vez de gravar "falso". Assim a tabela guarda só o que foi feito.
 */
export async function upsertExerciseCheck(
  userId: string,
  exerciseId: number,
  date: string,
  checked: boolean
): Promise<void> {
  if (checked) {
    const { error } = await supabase
      .from('exercise_checks')
      .upsert({
        user_id: userId,
        exercise_id: exerciseId,
        check_date: date,
        checked: true,
      }, { onConflict: 'user_id,exercise_id,check_date' });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('exercise_checks')
      .delete()
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .eq('check_date', date);
    if (error) throw error;
  }
}

// ─── USER STATS ───────────────────────────────────────────────────────────────

/**
 * ## `fetchUserStats(userId)`
 * Lê os totais do usuário. Quem escreve nessa tabela é um **gatilho do banco** (trigger), nunca o app, então os números não podem ser falsificados.
 */
export async function fetchUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select(STATS_COLS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserStats | null;
}

// ─── LAST COMPLETION (para sugerir o próximo treino pela sequência) ──────────

/**
 * ## `fetchLastCompletion(userId)`
 * O treino concluído mais recente. É a base para sugerir o **próximo treino** pela sequência: ordena por data decrescente e pega só 1.
 */
export async function fetchLastCompletion(
  userId: string
): Promise<WorkoutCompletion | null> {
  const { data, error } = await supabase
    .from('workout_completions')
    .select(COMPLETION_WITH_DAY)
    .eq('user_id', userId)
    .order('completed_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as WorkoutCompletion | null;
}

// ─── EXERCISE NOTES (uma anotação por usuário + exercício) ───────────────────

/**
 * ## `fetchExerciseNotes(userId)`
 * Todas as anotações do usuário, convertidas num dicionário `{ id do exercício: texto }` para consulta direta pela tela.
 */
export async function fetchExerciseNotes(userId: string): Promise<Record<number, string>> {
  const { data, error } = await supabase
    .from('exercise_notes')
    .select('exercise_id, note')
    .eq('user_id', userId);
  if (error) throw error;
  const map: Record<number, string> = {};
  (data ?? []).forEach((r: { exercise_id: number; note: string }) => { map[r.exercise_id] = r.note; });
  return map;
}

/**
 * ## `saveExerciseNote(userId, exerciseId, note)`
 * Salva a anotação de um exercício (peso usado, observações).
 *
 * 1. Tira espaços das pontas.
 * 2. Texto vazio → apaga a anotação e encerra.
 * 3. Caso contrário, `upsert` pela chave (usuário + exercício), registrando a hora da alteração.
 *
  * Salva (sobrescreve) a anotação do exercício. Texto vazio apaga a anotação.
  */
export async function saveExerciseNote(userId: string, exerciseId: number, note: string): Promise<void> {
  const text = note.trim();
  if (!text) {
    const { error } = await supabase
      .from('exercise_notes')
      .delete()
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('exercise_notes')
    .upsert(
      { user_id: userId, exercise_id: exerciseId, note: text, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,exercise_id' }
    );
  if (error) throw error;
}
