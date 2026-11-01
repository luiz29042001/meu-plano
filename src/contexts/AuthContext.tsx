/**
 * # Contexto de autenticação (`AuthContext.tsx`)
 * "Contexto" é o jeito do React de compartilhar dados com o app inteiro sem passá-los tela por tela. Este guarda **quem está logado**, o **perfil** (programa de treino, dieta) e as ações de entrar e sair.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { configureGoogleSignIn, signInWithGoogle, signOut as authSignOut } from '../services/auth';
import { fetchProfile } from '../services/profile';
import { friendlyError } from '../utils/errors';
import { resolveDietMode } from '../utils/dietAccess';
import type { DietMode, LoginError, Profile, ProfileStatus } from '../types';

/**
 * ## `AuthContextValue`
 * O que qualquer tela pode ler com `useAuth()`: sessão, `userId`, perfil, estado do perfil, modo de dieta, `loading` (sessão inicial) e as ações `signIn`, `signOut` e `refreshProfile`.
 */
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

/**
 * Cria o contexto. O valor real é fornecido pelo `AuthProvider` abaixo.
 */
const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

/**
 * ## `sameSession(a, b)`
 * Compara duas sessões pelo token e pelo usuário. Evita trocar o objeto de sessão (e redesenhar o app inteiro) quando nada relevante mudou.
 */
function sameSession(a: Session | null, b: Session | null): boolean {
  return (a?.access_token ?? null) === (b?.access_token ?? null)
    && (a?.user?.id ?? null) === (b?.user?.id ?? null);
}

/**
 * ## `AuthProvider`
 * Componente que envolve o app e fornece os dados de login a todas as telas.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Estados: sessão, perfil, etapa do perfil, mensagem de erro e se a sessão inicial ainda está sendo lida.
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // `profileReq` numera as cargas de perfil: respostas antigas (de uma carga anterior ou de antes de um logout) são descartadas.
  // Descarta respostas antigas (ex.: duas cargas simultâneas ou logout no meio).
  const profileReq = useRef(0);
  // `profileUid` lembra de qual usuário o perfil já foi carregado com sucesso.
  // Usuário cujo perfil está carregado com sucesso (null = nenhum).
  const profileUid = useRef<string | null>(null);

  // ### `clearProfile()`
  // Esquece o perfil (usado ao sair). Invalida cargas em andamento e volta ao estado "sem sessão".
  const clearProfile = useCallback(() => {
    profileReq.current++;
    profileUid.current = null;
    setProfile(null);
    setProfileStatus('idle');
    setProfileError(null);
  }, []);

  // ### `loadProfile(uid)`
  // Carrega o perfil do usuário. Devolve `true` se deu certo.
  //
  // 1. Numera a carga e verifica se já havia perfil desse mesmo usuário.
  // 2. Se não havia, limpa e entra em `loading`; se havia, **mantém na tela** o perfil atual durante a recarga.
  // 3. Busca no banco.
  // 4. Se outra carga mais nova começou, descarta esta resposta.
  // 5. Perfil inexistente → estado de erro.
  // 6. Sucesso → guarda e marca `ready`.
  // 7. Falha → só mostra erro se não havia perfil válido; senão a tela continua como estava.
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

  // ### Efeito de inicialização
  // 1. Configura o login Google.
  // 2. Lê a sessão salva; se existir, carrega o perfil. Se falhar, vai para o login em vez de travar.
  // 3. Sempre termina o `loading` inicial.
  // 4. Assina mudanças de login (`onAuthStateChange`).
  // 5. Ao sair da conta → limpa o perfil.
  // 6. Em `SIGNED_IN` (se o perfil ainda não está carregado) ou `USER_UPDATED` → recarrega o perfil.
  // 7. A limpeza cancela a assinatura.
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

    // > **Armadilha resolvida (1):** nunca chamar o Supabase *dentro* do callback acima. No navegador, a renovação do token (cerca de 1 h) segura uma trava; uma consulta feita ali dentro espera a trava e **congela todas as requisições seguintes**. Por isso a carga é adiada com `setTimeout(..., 0)`.
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

  // ### `signIn()`
  // Inicia o login com Google e devolve o possível erro.
  const signIn = useCallback(async () => {
    const { error } = await signInWithGoogle();
    return { error };
  }, []);

  // ### `signOut()`
  // Sai da conta, zera a sessão e limpa o perfil.
  const signOut = useCallback(async () => {
    await authSignOut();
    setSession(null);
    clearProfile();
  }, [clearProfile]);

  // `userId`: texto estável, usado como dependência dos efeitos (o objeto `user` muda de identidade à toa).
  const userId = session?.user?.id ?? null;

  // ### `refreshProfile()`
  // Recarrega o perfil (botão "Tentar de novo"). Devolve `false` sem usuário ou se falhar.
  const refreshProfile = useCallback(async () => {
    if (!userId) return false;
    return loadProfile(userId);
  }, [userId, loadProfile]);

  // Entrega os valores a todo o app. `dietMode` é recalculado a cada renderização pela regra de `dietAccess.ts`.
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

/**
 * ## `useAuth()`
 * Atalho para qualquer tela ler o contexto de autenticação.
 */
export const useAuth = () => useContext(AuthContext);
