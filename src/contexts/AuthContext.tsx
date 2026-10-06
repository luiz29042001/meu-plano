import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { configureGoogleSignIn, signInWithGoogle, signOut as authSignOut } from '../services/auth';
import { fetchProfile } from '../services/profile';
import { friendlyError } from '../utils/errors';
import { resolveDietMode } from '../utils/dietAccess';
import type { DietMode, LoginError, Profile, ProfileStatus } from '../types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** Use este (string estável) como dependência de efeitos, nunca o objeto `user`. */
  userId: string | null;
  profile: Profile | null;
  /** 'loading' só quando ainda não há perfil; recarregar um perfil já carregado mantém 'ready'. */
  profileStatus: ProfileStatus;
  /** Mensagem em pt-BR quando profileStatus === 'error'. */
  profileError: string | null;
  /** Qual dieta mostrar (ver src/utils/dietAccess.ts). */
  dietMode: DietMode;
  /** true só enquanto a sessão inicial é lida. Não espera o perfil. */
  loading: boolean;
  signIn: () => Promise<{ error: LoginError | null }>;
  signOut: () => Promise<void>;
  /** Recarrega o perfil. Devolve false se falhar. Serve para "Tentar de novo". */
  refreshProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

// Evita trocar o objeto de sessão (e re-renderizar tudo) quando nada relevante mudou.
function sameSession(a: Session | null, b: Session | null): boolean {
  return (a?.access_token ?? null) === (b?.access_token ?? null)
    && (a?.user?.id ?? null) === (b?.user?.id ?? null);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Descarta respostas antigas (ex.: duas cargas simultâneas ou logout no meio).
  const profileReq = useRef(0);
  // Usuário cujo perfil está carregado com sucesso (null = nenhum).
  const profileUid = useRef<string | null>(null);

  const clearProfile = useCallback(() => {
    profileReq.current++;
    profileUid.current = null;
    setProfile(null);
    setProfileStatus('idle');
    setProfileError(null);
  }, []);

  const loadProfile = useCallback(async (uid: string): Promise<boolean> => {
    const req = ++profileReq.current;
    const hadProfile = profileUid.current === uid;
    if (!hadProfile) {
      setProfile(null);
      setProfileStatus('loading');
    }
    setProfileError(null);
    try {
      const p = await fetchProfile(uid);
      if (req !== profileReq.current) return false;
      if (!p) {
        profileUid.current = null;
        setProfile(null);
        setProfileStatus('error');
        setProfileError('Não encontramos o seu perfil. Tente de novo.');
        return false;
      }
      profileUid.current = uid;
      setProfile(p);
      setProfileStatus('ready');
      return true;
    } catch (e) {
      if (req !== profileReq.current) return false;
      // Já havia perfil válido: mantém o que está na tela (falha só da recarga).
      if (!hadProfile) {
        setProfileStatus('error');
        setProfileError(friendlyError(e, 'Não foi possível carregar o seu perfil.'));
      }
      return false;
    }
  }, []);

  useEffect(() => {
    configureGoogleSignIn();

    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(prev => (sameSession(prev, data.session) ? prev : data.session));
        if (data.session?.user) loadProfile(data.session.user.id);
      })
      .catch(() => {
        // Sem sessão legível: cai na tela de login em vez de travar no loader.
        setSession(null);
      })
      .finally(() => setLoading(false));

    // Importante (armadilha 1): não chamar o Supabase diretamente dentro deste callback.
    // No navegador, a renovação automática da sessão (≈ a cada 1h) segura uma trava
    // interna; uma consulta feita aqui dentro fica esperando essa trava e todas as
    // requisições seguintes congelam. Por isso a carga do perfil é adiada (setTimeout).
    // Na web o supabase-js emite SIGNED_IN toda vez que a aba volta a ficar visível:
    // se o perfil desse usuário já está carregado, não recarrega.
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(prev => (sameSession(prev, newSession) ? prev : newSession));
      if (!newSession?.user) {
        clearProfile();
        return;
      }
      const uid = newSession.user.id;
      const alreadyLoaded = profileUid.current === uid;
      if (event === 'USER_UPDATED' || (event === 'SIGNED_IN' && !alreadyLoaded)) {
        setTimeout(() => { loadProfile(uid); }, 0);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile, clearProfile]);

  const signIn = useCallback(async () => {
    const { error } = await signInWithGoogle();
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setSession(null);
    clearProfile();
  }, [clearProfile]);

  const userId = session?.user?.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) return false;
    return loadProfile(userId);
  }, [userId, loadProfile]);

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      userId,
      profile,
      profileStatus,
      profileError,
      dietMode: resolveDietMode(profile, profileStatus),
      loading,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
