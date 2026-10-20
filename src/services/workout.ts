import { supabase } from './supabase';
import type { WorkoutDay, WorkoutCompletion, ExerciseCheck, UserStats } from '../types';

// Colunas explícitas (nada de select('*')): evita trazer colunas futuras sem querer.
const DAY_COLS = 'id, slug, label, weekday, weekday_index, color, muscles, is_rest, program_id';
const EXERCISE_COLS = 'id, workout_day_id, position, name, sets, reps, rest_seconds, tip';
const COMPLETION_COLS = 'id, user_id, workout_day_id, completed_date, duration_min, notes, created_at';
const COMPLETION_WITH_DAY = `${COMPLETION_COLS}, workout_day:workout_days(${DAY_COLS})`;
const CHECK_COLS = 'id, user_id, exercise_id, check_date, checked';
const STATS_COLS = 'id, user_id, total_workouts, current_streak, longest_streak, last_workout_date, updated_at';

// ─── WORKOUT DAYS & EXERCISES ─────────────────────────────────────────────────

/**
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

/** Só as datas (YYYY-MM-DD) de treinos concluídos desde `fromISO`. */
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

/** Salva (sobrescreve) a anotação do exercício. Texto vazio apaga a anotação. */
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
