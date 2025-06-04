import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = { 
  user: User | null; 
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({ 
  user: null, 
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // E2Eテスト用認証スキップフラグ
  const isE2E = typeof window !== 'undefined' && localStorage.getItem('e2eAuth') === '1';
  console.log('🔍 E2E check (providers):', { isE2E, localStorage: localStorage.getItem('e2eAuth') });

  useEffect(() => {
    if (isE2E) {
      // E2Eテストでは疑似ユーザーで認証済みとみなす
      const e2eUser = { id: '550e8400-e29b-41d4-a716-446655440000', email: 'teacher@example.com' } as User;
      console.log('🔧 Setting E2E user (providers):', e2eUser);
      setUser(e2eUser);
      setLoading(false);
      return;
    }
    // 既存セッションの取り出し
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
      console.debug("Initial session loaded:", { user: !!data.session?.user });
    });

    // onAuthStateChange を単一箇所でリッスン
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug("Auth event:", event, { user: !!session?.user });
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isE2E]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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