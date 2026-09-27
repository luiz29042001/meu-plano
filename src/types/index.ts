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
  color: string;
  kcal: number;
  macros: { p: number; c: number; g: number };
  items: DietItem[];
  isSupp?: boolean;
  isFasted?: boolean;
}

export interface TimerState {
  visible: boolean;
  seconds: number;
  total: number;
  running: boolean;
  label: string;
  color: string;
}
