import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { configureGoogleSignIn, signInWithGoogle, signOut as authSignOut } from '../services/auth';
import { fetchProfile, upsertProfile } from '../services/profile';
import type { Profile } from '../types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
    } catch {}
  }, []);

useEffect(() => {
  configureGoogleSignIn();

  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
    if (data.session?.user) loadProfile(data.session.user.id);
    setLoading(false);
  });

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    if (session?.user) {
      loadProfile(session.user.id);
    } else {
      setProfile(null);
    }
  });

  return () => listener.subscription.unsubscribe();
}, []);

  const signIn = useCallback(async () => {
    const { data, error } = await signInWithGoogle();
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session]);

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
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
