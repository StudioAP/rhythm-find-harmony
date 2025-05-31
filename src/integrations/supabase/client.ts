// Supabase client configuration with environment variables
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 環境変数からSupabase設定を取得
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 環境変数が設定されていない場合のエラーチェック
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabaseの環境変数 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) が設定されていません。.envファイルとViteの設定を確認してください。');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);