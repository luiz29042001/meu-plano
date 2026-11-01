/**
 * # Erros de login (`authErrors.ts`)
 * Traduz falhas do login com Google em mensagens em português com um **código** que a tela pode comparar.
 */

import type { LoginError, LoginErrorCode } from '../types';
import { isNetworkError } from '../utils/errors';

/**
 * ## `MESSAGES`
 * Tabela código → mensagem. O código (`cancelled`, `network`...) é o que a tela usa para decidir o comportamento; o texto é só para exibir.
 */
const MESSAGES: Record<LoginErrorCode, string> = {
  cancelled: 'Login cancelado.',
  in_progress: 'O login já está em andamento. Aguarde um instante.',
  play_services: 'O Google Play Services não está disponível ou precisa ser atualizado.',
  network: 'Sem conexão com a internet. Confira e tente de novo.',
  unknown: 'Não foi possível entrar. Tente de novo.',
};

/**
 * ## `loginError(code)`
 * Monta o objeto `{ code, message }` a partir de um código.
 */
export function loginError(code: LoginErrorCode): LoginError {
  return { code, message: MESSAGES[code] };
}

/**
 * ## `toLoginError(e)`
 * Converte um erro desconhecido: se for falta de rede → `network`; qualquer outro → mensagem genérica `unknown`.
 *
  * Qualquer erro desconhecido do Google/Supabase vira mensagem genérica em pt-BR.
  */
export function toLoginError(e: unknown): LoginError {
  return loginError(isNetworkError(e) ? 'network' : 'unknown');
}
