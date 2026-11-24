import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import {
  isProbablyOfflineError,
  makeLocalId,
  queueOfflineAction,
} from '@/lib/offlineStore';
import { flushOutbox } from '@/lib/offlineSync';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/tako';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  passwordRecoveryPending: boolean;
  setPasswordRecoveryPending: (pending: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signInAsGuest: (displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    updates: Partial<
      Pick<Profile, 'display_name' | 'avatar_color' | 'avatar_url' | 'payment_handle'>
    >
  ) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const profileCacheKey = `tako_profile_v1_${userId}`;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        const p = data as Profile;
        setProfile(p);
        await AsyncStorage.setItem(profileCacheKey, JSON.stringify(p)).catch(() => {});
        return;
      }
    } catch {
      // fall back to cached profile below
    }

    try {
      const cached = await AsyncStorage.getItem(profileCacheKey);
      if (cached) {
        setProfile(JSON.parse(cached) as Profile);
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-flush offline outbox when app returns to foreground or browser regains connectivity
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void flushOutbox(uid);
      }
    });

    const handleOnline = () => {
      void flushOutbox(uid);
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    return () => {
      sub.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
    };
  }, [session?.user?.id]);

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
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryPending(true);
      }
      setSession(nextSession);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setPasswordRecoveryPending(false);
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
    setProfile(null);
    setPasswordRecoveryPending(false);
    setSession(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  const updateProfile = useCallback(
    async (
      updates: Partial<
        Pick<Profile, 'display_name' | 'avatar_color' | 'avatar_url' | 'payment_handle'>
      >
    ) => {
      if (!session?.user) return { error: 'Not signed in' };
      const uid = session.user.id;
      const profileCacheKey = `tako_profile_v1_${uid}`;

      // Optimistically update local profile & cache
      setProfile((prev) => {
        const next = prev
          ? { ...prev, ...updates }
          : ({
              id: uid,
              display_name: updates.display_name ?? 'Tako Friend',
              avatar_color: updates.avatar_color ?? '#FF7A8A',
              avatar_url: updates.avatar_url ?? null,
              payment_handle: updates.payment_handle ?? null,
              created_at: new Date().toISOString(),
            } as Profile);
        void AsyncStorage.setItem(profileCacheKey, JSON.stringify(next)).catch(() => {});
        return next;
      });

      const queueProfileOffline = async () => {
        const { payment_handle: _ph, ...syncable } = updates;
        await queueOfflineAction(uid, {
          id: makeLocalId('act'),
          createdAt: new Date().toISOString(),
          type: 'update_profile',
          payload: { userId: uid, updates: syncable },
        });
        return { error: null };
      };

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return queueProfileOffline();
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', uid);
        if (error) {
          if (isProbablyOfflineError(error.message)) {
            return queueProfileOffline();
          }
          return { error: error.message };
        }
        await fetchProfile(uid);
        return { error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (isProbablyOfflineError(msg)) {
          return queueProfileOffline();
        }
        return { error: msg };
      }
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
        passwordRecoveryPending,
        setPasswordRecoveryPending,
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
