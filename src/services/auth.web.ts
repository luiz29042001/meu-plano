// Versão WEB do login (usada automaticamente no navegador).
// No Android/iOS o arquivo auth.ts usa o SDK nativo do Google; na web
// o login é feito pelo fluxo OAuth do Supabase com redirecionamento.
import { supabase } from './supabase';
import { toLoginError } from './authErrors';
import type { LoginError } from '../types';

export function configureGoogleSignIn() {
  // Nada a configurar na web
}

/** Erros já vêm em pt-BR; a tela deve comparar por `error.code`. */
export async function signInWithGoogle(): Promise<{ error: LoginError | null }> {
  const redirectTo =
    typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : undefined;

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { prompt: 'select_account' } },
    });
    return { error: error ? toLoginError(error) : null };
  } catch (e) {
    return { error: toLoginError(e) };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}
