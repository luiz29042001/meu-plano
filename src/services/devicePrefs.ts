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
export const AUTO_REST_KEY = 'meu-plano:descanso-auto';
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
  // Padrão 'top' para quem nunca moveu; a escolha salva continua valendo.
  return v === 'bottom' ? 'bottom' : 'top';
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

// ─── Descanso automático ao marcar série (padrão: ligado) ────────────────────
export async function loadAutoRest(): Promise<boolean> {
  return (await read(AUTO_REST_KEY)) !== 'off';
}

export function saveAutoRest(on: boolean): Promise<void> {
  return write(AUTO_REST_KEY, on ? 'on' : 'off');
}

// ─── Séries feitas por dia e exercício (só neste aparelho) ───────────────────
const SETS_PREFIX = 'sets:';

export async function loadSetCounts(date: string): Promise<Record<number, number>> {
  const out: Record<number, number> = {};
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter(k => k.startsWith(`${SETS_PREFIX}${date}:`));
    // Limpa dias antigos.
    const old = keys.filter(k => k.startsWith(SETS_PREFIX) && !k.startsWith(`${SETS_PREFIX}${date}:`));
    if (old.length) await AsyncStorage.multiRemove(old);
    if (mine.length) {
      const pairs = await AsyncStorage.multiGet(mine);
      pairs.forEach(([k, v]) => {
        const id = Number(k.slice(`${SETS_PREFIX}${date}:`.length));
        const n = Number(v);
        if (Number.isFinite(id) && Number.isFinite(n) && n > 0) out[id] = n;
      });
    }
  } catch {
    // Sem armazenamento: contagem vale só nesta sessão.
  }
  return out;
}

export async function saveSetCount(date: string, exerciseId: number, count: number): Promise<void> {
  const key = `${SETS_PREFIX}${date}:${exerciseId}`;
  try {
    if (count > 0) await AsyncStorage.setItem(key, String(count));
    else await AsyncStorage.removeItem(key);
  } catch {
    // ignora
  }
}
