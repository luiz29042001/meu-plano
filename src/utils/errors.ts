// Mensagens de erro em pt-BR para mostrar ao usuário.
// Nunca exibir error.message cru: Supabase e Google respondem em inglês.

export const MSG_NETWORK = 'Sem conexão com a internet. Confira e tente de novo.';
export const MSG_TIMEOUT = 'A conexão está lenta. Tente de novo em instantes.';

export class TimeoutError extends Error {
  constructor() {
    super('timeout');
    this.name = 'TimeoutError';
  }
}

export function isTimeoutError(e: unknown): boolean {
  return !!e && typeof e === 'object' && (e as { name?: string }).name === 'TimeoutError';
}

export function isNetworkError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const { name, message } = e as { name?: string; message?: string };
  if (name === 'AuthRetryableFetchError') return true;
  return /network request failed|failed to fetch|networkerror|load failed|fetch failed/i.test(message ?? '');
}

/** Converte qualquer erro numa frase em pt-BR. `fallback` descreve a ação que falhou. */
export function friendlyError(e: unknown, fallback: string): string {
  if (isTimeoutError(e)) return MSG_TIMEOUT;
  if (isNetworkError(e)) return MSG_NETWORK;
  return fallback;
}

/**
 * Corre a promessa com limite de tempo e SEMPRE limpa o timer.
 * Atenção: a requisição original não é cancelada; ela pode terminar depois.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
