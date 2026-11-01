/**
 * # Preferências do aparelho (`devicePrefs.ts`)
 * Configurações que ficam **só neste aparelho**: tema, posição do cronômetro, descanso automático, avisos de permissão e séries feitas no dia.
 *
 * > Regra: nenhuma função lança erro. Falha ao ler → usa o padrão; falha ao gravar → ignora e segue só na sessão atual.
 */

// Preferências do APARELHO (não vão para o banco): tema, posição do
// cronômetro e controle dos avisos de permissão da notificação.
// AsyncStorage: no Android grava no armazenamento do app; na web grava no
// localStorage com a chave crua (o script do public/index.html lê
// 'meu-plano:tema' antes do React montar, para não piscar).
// Nenhuma função lança erro: falha de leitura -> padrão; falha de gravação -> ignora.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemePreference } from '../utils/theme';

/**
 * ## `TimerPosition`
 * Onde o cronômetro flutuante aparece: no `'top'` (topo) ou no `'bottom'` (rodapé).
 */
export type TimerPosition = 'top' | 'bottom';

/**
 * ## Chaves de armazenamento
 * Nomes sob os quais cada preferência é guardada. O prefixo `meu-plano:` evita colidir com outros dados. A chave do tema também é lida por um script do `index.html` antes do React iniciar, para a tela não piscar na cor errada.
 */
export const THEME_STORAGE_KEY = 'meu-plano:tema';
export const TIMER_POSITION_KEY = 'meu-plano:cronometro-posicao';
export const AUTO_REST_KEY = 'meu-plano:descanso-auto';
export const NOTIF_PROMPT_KEY = 'meu-plano:notif-pedida';
export const EXACT_ALARM_NOTICE_KEY = 'meu-plano:aviso-alarme-exato';

/**
 * ## `read(key)`
 * Lê um texto do armazenamento; em qualquer erro devolve `null`.
 */
async function read(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * ## `write(key, value)`
 * Grava um texto; se não houver espaço ou o navegador estiver em modo privado, ignora.
 */
async function write(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Sem espaço / modo privado: segue só nesta sessão.
  }
}

// ─── Tema ────────────────────────────────────────────────────────────────────
/**
 * ## `loadThemePreference()`
 * Lê a escolha de tema. Só aceita `'light'`, `'dark'` ou `'system'`; qualquer outro valor vira `'system'` (segue o sistema).
 */
export async function loadThemePreference(): Promise<ThemePreference> {
  const v = await read(THEME_STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

/**
 * ## `saveThemePreference(p)`
 * Grava a escolha de tema.
 */
export function saveThemePreference(p: ThemePreference): Promise<void> {
  return write(THEME_STORAGE_KEY, p);
}

// ─── Posição do cronômetro ───────────────────────────────────────────────────
/**
 * ## `loadTimerPosition()`
 * Lê onde o cronômetro fica. Padrão: topo.
 */
export async function loadTimerPosition(): Promise<TimerPosition> {
  const v = await read(TIMER_POSITION_KEY);
  // Padrão 'top' para quem nunca moveu; a escolha salva continua valendo.
  return v === 'bottom' ? 'bottom' : 'top';
}

/**
 * ## `saveTimerPosition(p)`
 * Grava a posição do cronômetro.
 */
export function saveTimerPosition(p: TimerPosition): Promise<void> {
  return write(TIMER_POSITION_KEY, p);
}

// ─── Pedido de permissão de notificação (Android) ────────────────────────────
// Guarda o instante (ms) em que o pedido foi feito, para permitir no futuro a
// regra "Agora não = 30 dias" sem trocar a chave.
/**
 * ## `loadNotifPromptShown()`
 * Responde se o app já pediu permissão de notificação alguma vez (evita pedir de novo a cada abertura).
 */
export async function loadNotifPromptShown(): Promise<boolean> {
  return (await loadNotifPromptShownAt()) !== null;
}

/**
 * ## `loadNotifPromptShownAt()`
 * Devolve **quando** (em milissegundos) o pedido foi feito, ou `null` se nunca. Guardar o instante permite criar depois a regra "esperar 30 dias" sem trocar a chave.
 */
export async function loadNotifPromptShownAt(): Promise<number | null> {
  const v = await read(NOTIF_PROMPT_KEY);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * ## `saveNotifPromptShown()`
 * Registra que o pedido foi feito agora.
 */
export function saveNotifPromptShown(): Promise<void> {
  return write(NOTIF_PROMPT_KEY, String(Date.now()));
}

// ─── Aviso único "permita alarmes" (Android 14+, sem alarme exato) ───────────
/**
 * ## `loadExactAlarmNoticeShown()`
 * Responde se o aviso "permita alarmes" (Android 14+) já foi exibido.
 */
export async function loadExactAlarmNoticeShown(): Promise<boolean> {
  return (await read(EXACT_ALARM_NOTICE_KEY)) !== null;
}

/**
 * ## `saveExactAlarmNoticeShown()`
 * Marca esse aviso como exibido, para aparecer uma única vez.
 */
export function saveExactAlarmNoticeShown(): Promise<void> {
  return write(EXACT_ALARM_NOTICE_KEY, String(Date.now()));
}

// ─── Descanso automático ao marcar série (padrão: DESLIGADO; a pessoa liga no Perfil) ────────────────────
/**
 * ## `loadAutoRest()`
 * Lê se o **descanso automático** (cronômetro dispara ao marcar uma série) está ligado. Padrão: desligado.
 */
export async function loadAutoRest(): Promise<boolean> {
  return (await read(AUTO_REST_KEY)) === 'on';
}

/**
 * ## `saveAutoRest(on)`
 * Grava essa preferência.
 */
export function saveAutoRest(on: boolean): Promise<void> {
  return write(AUTO_REST_KEY, on ? 'on' : 'off');
}

// ─── Séries feitas por dia e exercício (só neste aparelho) ───────────────────
/**
 * ## Séries feitas no dia
 * Contagem de séries concluídas por exercício. Fica só no aparelho e é descartada no dia seguinte. A chave segue o formato `sets:AAAA-MM-DD:idDoExercício`.
 */
const SETS_PREFIX = 'sets:';

/**
 * ## `loadSetCounts(date)`
 * Carrega as séries feitas na data informada.
 *
 * 1. Lista todas as chaves guardadas.
 * 2. Separa as de hoje (`mine`) das de dias antigos (`old`).
 * 3. Apaga as antigas, para o armazenamento não crescer.
 * 4. Lê as de hoje e converte para `{ id do exercício: quantidade }`, ignorando valores inválidos.
 */
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

/**
 * ## `saveSetCount(date, exerciseId, count)`
 * Salva a quantidade de séries de um exercício. Se for zero, **remove** a chave em vez de gravar "0".
 */
export async function saveSetCount(date: string, exerciseId: number, count: number): Promise<void> {
  const key = `${SETS_PREFIX}${date}:${exerciseId}`;
  try {
    if (count > 0) await AsyncStorage.setItem(key, String(count));
    else await AsyncStorage.removeItem(key);
  } catch {
    // ignora
  }
}
