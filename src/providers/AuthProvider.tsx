import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthProviderData = {
  user: User | null;
  session: Session | null;
};

type AuthCtx = { 
  user: User | null; 
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: AuthProviderData | null; error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ data: AuthProviderData | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthCtx>({ 
  user: null, 
  loading: true,
  signIn: async () => ({ data: null, error: null }),
  signUp: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null })
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // E2Eテスト用認証スキップフラグ
  const isE2E = typeof window !== 'undefined' && localStorage.getItem('e2eAuth') === '1';
  console.log('🔍 E2E check (providers):', { isE2E, localStorage: localStorage.getItem('e2eAuth') });

  useEffect(() => {
    if (isE2E) {
      // E2Eテストでは疑似ユーザーで認証済みとみなす
      const e2eUser = { id: '550e8400-e29b-41d4-a716-446655440000', email: 'teacher@example.com', role: '', app_metadata: {}, user_metadata: {} } as User;
      const e2eSession = { access_token: 'e2e-token', refresh_token: 'e2e-refresh-token', user: e2eUser, token_type: '', expires_in: 3600, expires_at: Date.now() + 3600000 } as Session;
      console.log('🔧 Setting E2E user & session (providers):', e2eUser);
      setUser(e2eUser);
      setSession(e2eSession);
      setLoading(false);
      return;
    }
    // 既存セッションの取り出し
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setSession(data.session ?? null);
      setLoading(false);
      console.debug("Initial session loaded:", { user: !!data.session?.user, session: !!data.session });
    });

    // onAuthStateChange を単一箇所でリッスン
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug("Auth event:", event, { user: !!session?.user, session: !!session });
      setUser(session?.user ?? null);
      setSession(session ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isE2E]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data: data.user ? { user: data.user, session: data.session } : null, error };
  };

  const signUp = async (email: string, password: string, name: string) => {
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
    return { data: data.user ? { user: data.user, session: data.session } : null, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 使う側
export const useAuth = () => useContext(AuthContext); 