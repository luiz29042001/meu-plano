import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { loginError, toLoginError } from './authErrors';
import type { LoginError } from '../types';

export function configureGoogleSignIn() {
  const extra = Constants.expoConfig?.extra ?? {};
  GoogleSignin.configure({
    webClientId: extra.googleWebClientId,
    // No iOS o SDK do Google exige o client ID próprio da plataforma
    ...(extra.googleIosClientId ? { iosClientId: extra.googleIosClientId } : {}),
    scopes: ['profile', 'email'],
  });
}

/** Erros já vêm em pt-BR; a tela deve comparar por `error.code`. */
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

export async function signOut() {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch {}
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}
