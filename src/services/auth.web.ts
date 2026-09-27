// Versão WEB do login (usada automaticamente no navegador).
// No Android/iOS o arquivo auth.ts usa o SDK nativo do Google; na web
// o login é feito pelo fluxo OAuth do Supabase com redirecionamento.
import { supabase } from './supabase';

export function configureGoogleSignIn() {
  // Nada a configurar na web
}

export async function signInWithGoogle() {
  const redirectTo =
    typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, queryParams: { prompt: 'select_account' } },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}
