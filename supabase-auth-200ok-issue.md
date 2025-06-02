# 【再相談】Supabase認証: 既存メールでのsignUpが200 OKで返り、エラー検知できない

## 概要
React + Vite + TypeScript + Supabase で構築した認証システムにおいて、**既に登録・確認済みのメールアドレス**で新規ユーザー登録 (signUp) を試みた際、Supabaseサーバーからエラー (例: 400 Bad Request) ではなく **`200 OK` が返ってきてしまう**問題に直面しています。これにより、フロントエンドでユーザーの重複を適切に検知できず、UXを損ねています。

この現象の原因と、正しいエラーハンドリング方法についてご相談します。

## プロジェクト環境情報

### 技術スタック
- **フロントエンド**: React + Vite + TypeScript
- **認証**: Supabase Auth (supabase-js v2.49.8)
- **デプロイ**: Cloudflare Pages (ローカル開発環境でも同様の現象を確認)
- **バックエンド**: Supabase Edge Functions

### Supabaseプロジェクト詳細 (MCPサーバ実取得情報)

- Project ID: `gftbjdazuhjcvqvssyiu`
- Project Name: `2025-05-25Lovable`
- Region: `ap-northeast-1` (Tokyo)
- Project URL: `https://gftbjdazuhjcvqvssyiu.supabase.co`
- Anon Key (冒頭部分): `eyJhbGciOiJIUzI1NiIs...`

### 実際のユーザーデータ (auth.usersテーブル確認済み)
該当メールアドレス `abe-a@tachibana-u.ac.jp` は、`users` テーブルに存在し、`email_confirmed_at` にも日時が入っており、確認済み状態です。

## 現象の詳細

### 問題の状況
1.  **既存ユーザー**: メールアドレス `abe-a@tachibana-u.ac.jp` は既にSupabaseに登録され、メールアドレスも確認済み。
2.  **新規登録試行**: フロントエンドの新規登録フォームから、再度同じメールアドレス `abe-a@tachibana-u.ac.jp` を使用して新規登録を実行。
3.  **Supabaseサーバーからのレスポンス (Networkタブで確認)**:
    *   **Request URL**: `https://gftbjdazuhjcvqvssyiu.supabase.co/auth/v1/signup?redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback`
    *   **Request Method**: `POST`
    *   **Status Code**: `200 OK`  <-- **問題の核心: 本来400等が期待される**
    *   **apikey / authorizationヘッダー**: 正しいAnonキーが送信されていることを確認済み。
4.  **フロントエンドの挙動**: Supabaseから `error` オブジェクトが `null` で返ってくるため、エラーとして処理されず、成功時のトースト通知（「確認メールを送信しました」など）が表示されてしまう。

### 期待される挙動
- Supabaseサーバーが `400 Bad Request` (または類似の4xxエラー) と共に、`User already registered` のようなエラーメッセージをレスポンスボディに含めて返す。
- フロントエンドがそのエラーを検知し、「このメールアドレスは既に登録されています」という適切なエラーメッセージをユーザーに表示する。

### 開発環境の確認事項
- **環境変数**: `VITE_SUPABASE_URL` (`https://gftbjdazuhjcvqvssyiu.supabase.co`) および `VITE_SUPABASE_ANON_KEY` は、ローカルの `.env.local` およびCloudflare Pagesの環境変数として正しく設定されており、フロントエンドの `client.ts` で `console.log` により読み込まれていることを確認済み。

## 現在の実装コードの抜粋

### 1. 認証フック (`rhythm-find-harmony/src/hooks/useAuth.tsx`)
```typescript
// ...
const signUp = async (email: string, password: string, name: string) => {
  // isE2E は false と想定
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name },
      emailRedirectTo: window.location.origin + "/auth/callback",
    },
  });
  return { data, error };
};
// ...
```

### 2. 認証ページのエラーハンドリング (`rhythm-find-harmony/src/pages/Auth.tsx`)
```typescript
// ...
const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    const { error } = await signUp(signupEmail, signupPassword, name);

    if (error) {
      // Supabaseがエラーを返した場合 (4xx, 5xxなど)
      if (error.status === 400 && /already registered/i.test(error.message)) {
        setError("このメールアドレスは既に登録されています");
      } else if (error.status === 400 && /Password should be/i.test(error.message)) {
        setError("パスワードは6文字以上で入力してください");
      } else if (error.status === 429) {
        setError("リクエストが多すぎます。しばらく時間をおいて再度お試しください。");
      } else {
        console.error("Supabase signUp error:", error);
        setError(`新規登録に失敗しました (エラーコード: ${error.status || '不明'})。`);
      }
      return;
    }

    // Supabaseからのエラーなし (現状、既存メールでもこちらに分岐してしまう)
    toast({
      title: "確認メールを送信しました",
      description: "届かない場合は迷惑メールフォルダもご確認ください。",
    });

  } catch (err) {
    console.error("Network or unexpected signUp error:", err);
    setError("ネットワークエラーが発生しました。時間をおいて再度お試しください。");
  } finally {
    setIsLoading(false);
  }
};
// ...
```

### 3. Supabaseクライアント設定 (`rhythm-find-harmony/src/integrations/supabase/client.ts`)
環境変数が正しく読み込まれていることは `console.log` で確認済み。
```typescript
console.log("[DEBUG] VITE_SUPABASE_URL from client.ts:", import.meta.env.VITE_SUPABASE_URL);
console.log("[DEBUG] VITE_SUPABASE_ANON_KEY from client.ts:", import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT SET');

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabaseの環境変数 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) が設定されていません。');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## 主要な疑問点と求めるアドバイス

1.  **`200 OK` レスポンスの原因**: なぜSupabaseは、**既に登録・確認済みのメールアドレス**に対する `signUp` リクエストに対して、エラーではなく `200 OK` を返すのでしょうか？
    *   これはSupabase Authの特定の条件下での仕様（例: メールアドレス確認が再度トリガーされる等）なのでしょうか？
    *   あるいは、プロジェクト特有の設定や、supabase-jsライブラリの特定バージョンに起因する挙動でしょうか？
    *   この `200 OK` 時の**レスポンスボディの具体的な内容（特に `user` オブジェクトと `session` オブジェクトの状態）**がどうなっているのかが知りたいです。（まだ確認できていません）

2.  **適切なエラーハンドリング**: この `200 OK` が返ってくる状況で、フロントエンド側で「ユーザーは既に登録済みである」という事実を検知し、ユーザーに適切なフィードバック（「このメールアドレスは既に登録されています」など）を表示するための、最も堅牢な方法はどのようなものでしょうか？
    *   現在の `if (error)` という分岐では対応できません。`200 OK` 時のレスポンスボディの内容に基づいて判断する必要がある場合、どのような点を確認すべきでしょうか？

3.  **Supabase Auth の設定確認**: SupabaseダッシュボードのAuth設定項目の中に、この挙動（既存ユーザーのsignUpで200 OKを返す）に関連するようなオプションはありますでしょうか？（例: "Email confirmations" や "Secure email change" の設定など）

## 求める回答

*   上記の疑問点1（`200 OK` の原因）についての考察と、可能であれば原因特定のための次の調査ステップ。
*   疑問点2（適切なエラーハンドリング）に対する具体的なコード修正案、または判断ロジックの提案。
*   疑問点3（Supabase Auth設定）について、確認すべき点があればご教示ください。

お忙しいところ恐縮ですが、ご助力いただけますと幸いです。 