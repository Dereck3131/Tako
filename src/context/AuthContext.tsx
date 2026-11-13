import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/tako';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signInAsGuest: (displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'display_name' | 'avatar_color' | 'payment_handle'>>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error ? error.message : null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() || 'Tako Friend' },
      },
    });
    if (error) return { error: error.message };
    return { error: null, needsConfirmation: !data.session };
  }, []);

  const signInAsGuest = useCallback(async (displayName: string) => {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: { display_name: displayName.trim() || 'Guest' },
      },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          display_name: displayName.trim() || 'Guest',
        });
      await fetchProfile(data.user.id);
    }
    return { error: null };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<Profile, 'display_name' | 'avatar_color' | 'payment_handle'>>
    ) => {
      if (!session?.user) return { error: 'Not signed in' };
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);
      if (!error) {
        await fetchProfile(session.user.id);
      }
      return { error: error ? error.message : null };
    },
    [session, fetchProfile]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signIn,
        signUp,
        signInAsGuest,
        signOut,
        refreshProfile,
        updateProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
