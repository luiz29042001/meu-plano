/**
 * # Erros amigáveis (`errors.ts`)
 * Transforma erros técnicos (em inglês, vindos do Supabase ou do Google) em frases curtas em português.
 *
 * > **Regra do projeto:** nunca mostrar `error.message` cru ao usuário.
 */

// Mensagens de erro em pt-BR para mostrar ao usuário.
// Nunca exibir error.message cru: Supabase e Google respondem em inglês.

/**
 * ## `MSG_NETWORK` e `MSG_TIMEOUT`
 * Mensagens padrão para falta de internet e para conexão lenta.
 */
export const MSG_NETWORK = 'Sem conexão com a internet. Confira e tente de novo.';
export const MSG_TIMEOUT = 'A conexão está lenta. Tente de novo em instantes.';

/**
 * ## `TimeoutError`
 * Erro próprio para "demorou demais". Ter uma classe própria deixa o app distinguir lentidão de qualquer outro erro.
 */
export class TimeoutError extends Error {
  constructor() {
    super('timeout');
    this.name = 'TimeoutError';
  }
}

/**
 * ## `isTimeoutError(e)`
 * Responde se `e` é um `TimeoutError`. Compara o `name` em vez de `instanceof`, que pode falhar entre bundles diferentes.
 */
export function isTimeoutError(e: unknown): boolean {
  return !!e && typeof e === 'object' && (e as { name?: string }).name === 'TimeoutError';
}

/**
 * ## `isNetworkError(e)`
 * Responde se o erro é falta de rede.
 *
 * 1. Ignora o que não for objeto.
 * 2. Reconhece o erro do Supabase `AuthRetryableFetchError`.
 * 3. Procura, na mensagem, os textos que cada navegador/sistema usa para "sem rede" (`Failed to fetch`, `Network request failed`...).
 */
export function isNetworkError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const { name, message } = e as { name?: string; message?: string };
  if (name === 'AuthRetryableFetchError') return true;
  return /network request failed|failed to fetch|networkerror|load failed|fetch failed/i.test(message ?? '');
}

/**
 * ## `friendlyError(e, fallback)`
 * Devolve a frase certa para mostrar ao usuário: lentidão, falta de internet, ou o `fallback` (texto que descreve a ação que falhou, ex.: "Não foi possível salvar").
 *
  * Converte qualquer erro numa frase em pt-BR. `fallback` descreve a ação que falhou.
  */
export function friendlyError(e: unknown, fallback: string): string {
  if (isTimeoutError(e)) return MSG_TIMEOUT;
  if (isNetworkError(e)) return MSG_NETWORK;
  return fallback;
}

/**
 * ## `withTimeout(promise, ms)`
 * Dá um prazo a uma operação assíncrona.
 *
 * 1. Cria um cronômetro que rejeita com `TimeoutError` após `ms` milissegundos.
 * 2. `Promise.race` devolve o que terminar primeiro: a operação ou o cronômetro.
 * 3. `finally` sempre limpa o cronômetro, para não deixar lixo na memória.
 *
 * > **Atenção:** a requisição original **não é cancelada**; ela só deixa de ser esperada.
 *
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
