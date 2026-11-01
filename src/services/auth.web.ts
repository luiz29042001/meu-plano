// Versão WEB do login (usada automaticamente no navegador).
// No Android/iOS o arquivo auth.ts usa o SDK nativo do Google; na web
// o login é feito pelo fluxo OAuth do Supabase com redirecionamento.
import { supabase } from './supabase';
import { toLoginError } from './authErrors';
import type { LoginError } from '../types';

/**
 * ## `configureGoogleSignIn()`
 * Vazia de propósito: na web não há SDK para configurar. Mantém a mesma assinatura do `auth.ts` para o resto do app não precisar saber a plataforma.
 */
export function configureGoogleSignIn() {
  // Nada a configurar na web
}

/**
 * ## `signInWithGoogle()`
 * Login por **redirecionamento** (OAuth).
 *
 * 1. Define para onde o Google deve devolver o usuário: o endereço atual do app.
 * 2. Pede ao Supabase para abrir o login Google, forçando a escolha de conta (`select_account`).
 * 3. A página sai do app e volta já logada; quem captura a sessão é o `detectSessionInUrl` do cliente.
 *
  * Erros já vêm em pt-BR; a tela deve comparar por `error.code`.
  */
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

/**
 * ## `signOut()`
 * Encerra a sessão no Supabase (na web não há conta Google nativa para revogar).
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * ## `getSession()`
 * Lê a sessão salva no navegador.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}
