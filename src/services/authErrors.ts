import type { LoginError, LoginErrorCode } from '../types';
import { isNetworkError } from '../utils/errors';

const MESSAGES: Record<LoginErrorCode, string> = {
  cancelled: 'Login cancelado.',
  in_progress: 'O login já está em andamento. Aguarde um instante.',
  play_services: 'O Google Play Services não está disponível ou precisa ser atualizado.',
  network: 'Sem conexão com a internet. Confira e tente de novo.',
  unknown: 'Não foi possível entrar. Tente de novo.',
};

export function loginError(code: LoginErrorCode): LoginError {
  return { code, message: MESSAGES[code] };
}

/** Qualquer erro desconhecido do Google/Supabase vira mensagem genérica em pt-BR. */
export function toLoginError(e: unknown): LoginError {
  return loginError(isNetworkError(e) ? 'network' : 'unknown');
}
