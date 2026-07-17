import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from './supabase';

export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: Constants.expoConfig?.extra?.googleWebClientId,
    scopes: ['profile', 'email'],
  });
}

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    if (!idToken) throw new Error('No ID token returned from Google');

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { data: null, error: new Error('Sign in cancelled') };
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return { data: null, error: new Error('Sign in already in progress') };
    }
    return { data: null, error };
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
