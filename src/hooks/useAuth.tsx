import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // E2Eテスト用認証スキップフラグ
  const isE2E = typeof window !== 'undefined' && localStorage.getItem('e2eAuth') === '1';

  useEffect(() => {
    if (isE2E) {
      // E2Eテストでは疑似ユーザーで認証済みとみなす
      setUser({ id: 'user-id', email: 'teacher@example.com' } as User);
      setSession({ access_token: 'token', refresh_token: 'token', user: { id: 'user-id', email: 'teacher@example.com' } } as Session);
      setLoading(false);
      return;
    }
    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // 既存のセッションを確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isE2E]);

  const signIn = async (email: string, password: string) => {
    if (isE2E) return { data: null, error: null };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (isE2E) return { data: null, error: null };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    if (isE2E) {
      setUser(null);
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
