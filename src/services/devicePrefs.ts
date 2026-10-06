// Preferências do APARELHO (não vão para o banco): tema, posição do
// cronômetro e controle dos avisos de permissão da notificação.
// AsyncStorage: no Android grava no armazenamento do app; na web grava no
// localStorage com a chave crua (o script do public/index.html lê
// 'meu-plano:tema' antes do React montar, para não piscar).
// Nenhuma função lança erro: falha de leitura -> padrão; falha de gravação -> ignora.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemePreference } from '../utils/theme';

export type TimerPosition = 'top' | 'bottom';

export const THEME_STORAGE_KEY = 'meu-plano:tema';
export const TIMER_POSITION_KEY = 'meu-plano:cronometro-posicao';
export const NOTIF_PROMPT_KEY = 'meu-plano:notif-pedida';
export const EXACT_ALARM_NOTICE_KEY = 'meu-plano:aviso-alarme-exato';

async function read(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Sem espaço / modo privado: segue só nesta sessão (spec §5.4).
  }
}

// ─── Tema ────────────────────────────────────────────────────────────────────
export async function loadThemePreference(): Promise<ThemePreference> {
  const v = await read(THEME_STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

export function saveThemePreference(p: ThemePreference): Promise<void> {
  return write(THEME_STORAGE_KEY, p);
}

// ─── Posição do cronômetro ───────────────────────────────────────────────────
export async function loadTimerPosition(): Promise<TimerPosition> {
  const v = await read(TIMER_POSITION_KEY);
  return v === 'top' ? 'top' : 'bottom';
}

export function saveTimerPosition(p: TimerPosition): Promise<void> {
  return write(TIMER_POSITION_KEY, p);
}

// ─── Pedido de permissão de notificação (Android) ────────────────────────────
// Guarda o instante (ms) em que o pedido foi feito, para permitir no futuro a
// regra "Agora não = 30 dias" da spec §13.4 sem trocar a chave.
export async function loadNotifPromptShown(): Promise<boolean> {
  return (await loadNotifPromptShownAt()) !== null;
}

export async function loadNotifPromptShownAt(): Promise<number | null> {
  const v = await read(NOTIF_PROMPT_KEY);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function saveNotifPromptShown(): Promise<void> {
  return write(NOTIF_PROMPT_KEY, String(Date.now()));
}

// ─── Aviso único "permita alarmes" (Android 14+, sem alarme exato) ───────────
export async function loadExactAlarmNoticeShown(): Promise<boolean> {
  return (await read(EXACT_ALARM_NOTICE_KEY)) !== null;
}

export function saveExactAlarmNoticeShown(): Promise<void> {
  return write(EXACT_ALARM_NOTICE_KEY, String(Date.now()));
}
