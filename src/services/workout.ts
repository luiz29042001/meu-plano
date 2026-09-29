import { supabase } from './supabase';
import type { WorkoutDay, WorkoutCompletion, ExerciseCheck, UserStats } from '../types';

// ─── WORKOUT DAYS & EXERCISES ─────────────────────────────────────────────────

export async function fetchWorkoutDays(): Promise<WorkoutDay[]> {
  const { data, error } = await supabase
    .from('workout_days')
    .select(`
      *,
      exercises (*)
    `)
    .order('weekday_index', { ascending: true })
    .order('position', { referencedTable: 'exercises', ascending: true });

  if (error) throw error;
  return data as WorkoutDay[];
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
    .select('*, workout_day:workout_days(*)')
    .eq('user_id', userId)
    .gte('completed_date', from)
    .lte('completed_date', to)
    .order('completed_date', { ascending: false });

  if (error) throw error;
  return data as WorkoutCompletion[];
}

export async function fetchAllCompletions(userId: string): Promise<WorkoutCompletion[]> {
  const { data, error } = await supabase
    .from('workout_completions')
    .select('*, workout_day:workout_days(*)')
    .eq('user_id', userId)
    .order('completed_date', { ascending: false });

  if (error) throw error;
  return data as WorkoutCompletion[];
}

export async function fetchTodayCompletion(
  userId: string,
  today: string
): Promise<WorkoutCompletion | null> {
  const { data, error } = await supabase
    .from('workout_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('completed_date', today)
    .maybeSingle();

  if (error) throw error;
  return data as WorkoutCompletion | null;
}

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
    .select()
    .single();

  if (error) throw error;
  return data as WorkoutCompletion;
}

export async function removeWorkoutCompletion(
  userId: string,
  date: string
): Promise<void> {
  const { error } = await supabase
    .from('workout_completions')
    .delete()
    .eq('user_id', userId)
    .eq('completed_date', date);

  if (error) throw error;
}

// ─── EXERCISE CHECKS ──────────────────────────────────────────────────────────

export async function fetchExerciseChecks(
  userId: string,
  date: string
): Promise<ExerciseCheck[]> {
  const { data, error } = await supabase
    .from('exercise_checks')
    .select('*')
    .eq('user_id', userId)
    .eq('check_date', date);

  if (error) throw error;
  return data as ExerciseCheck[];
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
    .select('*')
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
    .select('*, workout_day:workout_days(*)')
    .eq('user_id', userId)
    .order('completed_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as WorkoutCompletion | null;
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
