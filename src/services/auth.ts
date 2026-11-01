/**
 * # Login nativo (`auth.ts`)
 * Login com Google em **Android/iOS**: o Google devolve um `idToken` e o Supabase o troca por uma sessão. A versão do navegador é o `auth.web.ts`.
 */

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { loginError, toLoginError } from './authErrors';
import type { LoginError } from '../types';

/**
 * ## `configureGoogleSignIn()`
 * Configura o SDK do Google uma vez, ao abrir o app.
 *
 * 1. Lê os IDs de cliente de `app.json > extra`.
 * 2. Informa o `webClientId` (necessário para obter o `idToken`).
 * 3. Inclui o ID do iOS só se existir.
 * 4. Pede apenas os dados `profile` e `email`.
 */
export function configureGoogleSignIn() {
  const extra = Constants.expoConfig?.extra ?? {};
  GoogleSignin.configure({
    webClientId: extra.googleWebClientId,
    // No iOS o SDK do Google exige o client ID próprio da plataforma
    ...(extra.googleIosClientId ? { iosClientId: extra.googleIosClientId } : {}),
    scopes: ['profile', 'email'],
  });
}

/**
 * ## `signInWithGoogle()`
 * Faz o login completo. Devolve `{ error }`: `null` se deu certo.
 *
 * 1. Confere se o Google Play Services está disponível.
 * 2. Abre a tela de escolha de conta do Google.
 * 3. Versões novas do SDK devolvem `type: 'cancelled'` em vez de lançar erro; tratamos esse caso.
 * 4. Sem `idToken`, não há como autenticar → erro genérico.
 * 5. Entrega o token ao Supabase (`signInWithIdToken`), que cria a sessão.
 * 6. No `catch`, converte os códigos do SDK (cancelado, em andamento, sem Play Services) nas mensagens certas.
 *
  * Erros já vêm em pt-BR; a tela deve comparar por `error.code`.
  */
export async function signInWithGoogle(): Promise<{ error: LoginError | null }> {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    // Versões novas do SDK devolvem { type: 'cancelled' } em vez de lançar erro
    if ((userInfo as { type?: string })?.type === 'cancelled') {
      return { error: loginError('cancelled') };
    }
    const idToken = userInfo.data?.idToken;
    if (!idToken) return { error: loginError('unknown') };

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) return { error: toLoginError(error) };
    return { error: null };
  } catch (error: any) {
    if (error?.code === statusCodes.SIGN_IN_CANCELLED) return { error: loginError('cancelled') };
    if (error?.code === statusCodes.IN_PROGRESS) return { error: loginError('in_progress') };
    if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return { error: loginError('play_services') };
    return { error: toLoginError(error) };
  }
}

/**
 * ## `signOut()`
 * Sai da conta.
 *
 * 1. Revoga o acesso e encerra a sessão no Google (se falhar, segue em frente).
 * 2. Encerra a sessão no Supabase e devolve o possível erro.
 */
export async function signOut() {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch {}
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * ## `getSession()`
 * Lê a sessão salva no aparelho (se a pessoa já estava logada) e devolve `{ session, error }`.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}
