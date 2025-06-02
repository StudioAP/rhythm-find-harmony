# Supabase認証の重複メールアドレス問題：詳細レポート

## 概要
React + Vite + TypeScript + Supabase で構築したWebアプリケーションにおいて、**既に登録・確認済みのメールアドレス**で新規ユーザー登録 (`supabase.auth.signUp`) を試みた際に、適切なエラー処理ができない問題が発生しています。

**核心的な問題**: Supabaseが既存メールアドレスでのsignUpリクエストに対して、エラー（4xx）ではなく **`200 OK`** を返すため、フロントエンドで重複を検知できません。

## プロジェクト環境

### 技術スタック
- **フロントエンド**: React 18.2.0 + Vite 5.0.8 + TypeScript
- **認証**: Supabase Auth (supabase-js v2.49.8)
- **デプロイ**: Cloudflare Pages
- **開発環境**: macOS (ローカル開発サーバー: http://localhost:3000)

### Supabaseプロジェクト詳細
- **Project ID**: `gftbjdazuhjcvqvssyiu`
- **Project Name**: `2025-05-25Lovable`
- **Region**: `ap-northeast-1` (Tokyo)
- **Project URL**: `https://gftbjdazuhjcvqvssyiu.supabase.co`
- **Anon Key (先頭部分)**: `eyJhbGciOiJIUzI1NiIs...`

### 確認済みユーザーデータ
- **既存ユーザーメール**: `abe-a@tachibana-u.ac.jp`
- **データベース状態**: `auth.users` テーブルに存在し、`email_confirmed_at` に日時が設定済み（確認済み状態）
- **実際のパスワード**: `Pvc35294` （実在する登録済みユーザーの正しいパスワード）

## 問題の詳細

### 期待される動作 vs 実際の動作

| ケース | 期待される動作 | 実際の動作 |
|--------|----------------|------------|
| 既存メール + 正しいパスワード | エラー表示 または ログイン扱い | 「確認メールを送信しました」表示（誤） |
| 既存メール + 間違ったパスワード | 「既に登録されています」エラー | 期待通り（未確認） |
| 新規メール + 任意パスワード | 「確認メールを送信しました」 | 期待通り |

### 実際のネットワーク通信（開発者ツールで確認済み）

**リクエスト**:
```
POST https://gftbjdazuhjcvqvssyiu.supabase.co/auth/v1/signup?redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIs... [正しいAnonキー]
authorization: Bearer eyJhbGciOiJIUzI1NiIs... [正しいAnonキー]

{
  "email": "abe-a@tachibana-u.ac.jp",
  "password": "Pvc35294",
  "data": {
    "name": "aaa"
  }
}
```

**レスポンス**:
```
Status: 200 OK  ← 問題の核心: 本来なら400等のエラーが期待される
Content-Type: application/json

{
  "user": { ... },
  "session": null  ← またはセッション情報（要確認）
}
```

### 実際のコンソールログ（テスト実行結果）

```
client.ts:1 [DEBUG] VITE_SUPABASE_URL from client.ts: https://gftbjdazuhjcvqvssyiu.supabase.co
client.ts:2 [DEBUG] VITE_SUPABASE_ANON_KEY from client.ts: eyJhbGciOiJIUzI1NiIs...
Auth.tsx:72 Attempting to sign up with: abe-a@tachibana-u.ac.jp Pvc35294 aaa
```

**注目すべき点**: 
- 環境変数は正しく設定されている
- ネットワークエラーは発生していない（404等は見られない）
- supabase.auth.signUpの呼び出しは正常に完了している
- しかし期待されるエラーハンドリングが動作していない

### UI上の実際の動作

1. **フォーム入力**: 既存メール（`abe-a@tachibana-u.ac.jp`）+ 正しいパスワード（`Pvc35294`）+ 名前（`aaa`）
2. **「新規登録」ボタンクリック**
3. **結果**: 
   - ✅ ローディング状態は正常に動作
   - ❌ エラーメッセージは表示されない
   - ❌ 「確認メールを送信しました」というトーストが表示される（誤った案内）
   - ❌ 実際にはメールは送信されない（受信ボックス確認済み）
   - ❌ 画面遷移は発生しない

## 現在の実装コード

### 1. 認証フック (`src/hooks/useAuth.tsx`)
```typescript
const signUp = async (email: string, password: string, name: string) => {
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
```

### 2. 認証ページ (`src/pages/Auth.tsx`)
```typescript
const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  console.log("Attempting to sign up with:", signupEmail, signupPassword, name);

  try {
    const { error } = await signUp(signupEmail, signupPassword, name);

    if (error) {
      // エラーハンドリング（400, 429等）
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

    // ここに到達する = Supabaseからエラーが返らなかった
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
```

### 3. Supabaseクライアント設定 (`src/integrations/supabase/client.ts`)
```typescript
console.log("[DEBUG] VITE_SUPABASE_URL from client.ts:", import.meta.env.VITE_SUPABASE_URL);
console.log("[DEBUG] VITE_SUPABASE_ANON_KEY from client.ts:", import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT SET');

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabaseの環境変数が設定されていません。');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## 検証済み事項

### ✅ 正しく動作している部分
1. **環境変数設定**: `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` は正しく読み込まれている
2. **ネットワーク接続**: Supabaseサーバーとの通信は正常
3. **他のエラーケース**: 不正なメール形式（`aaa@gmail.com`）では適切に400エラーが返り、「Email address "aaa@gmail.com" is invalid」エラーが捕捉される
4. **新規メールアドレス**: 未登録のメールアドレスでは正常に動作すると推定される

### ❌ 問題が発生している部分
1. **既存メール + 正しいパスワードのケース**: 200 OKが返るため `error` オブジェクトが `null` となり、成功分岐に進んでしまう
2. **UX問題**: ユーザーに「確認メールを送信しました」という誤った案内が表示される
3. **重複検知失敗**: 既存ユーザーであることを検知できていない

## 主要な疑問点

1. **Supabaseの仕様について**: 
   - なぜ既存・確認済みメールアドレスでのsignUpに対して200 OKが返るのか？
   - これはSupabase Auth v2の正常な動作なのか、それとも設定や実装の問題なのか？

2. **レスポンスボディの内容**:
   - 200 OK時の `data` オブジェクトにはどのような情報が含まれているのか？
   - `data.user` や `data.session` の状態はどうなっているのか？

3. **適切な対処法**:
   - フロントエンド側でこの状況を検知し、適切なUXを提供する方法はあるのか？
   - Supabaseの設定で変更できる項目はあるのか？

## 期待される解決策

1. **理想的な解決**: Supabaseが既存メールアドレスでのsignUpに対して適切なエラー（400等）を返すようになる
2. **現実的な解決**: 200 OK時のレスポンスボディの内容を分析し、既存ユーザーかどうかを判定する方法を確立する
3. **UX改善**: 重複メールアドレスの場合に適切なメッセージ（「このメールアドレスは既に登録されています」）を表示する

## 追加情報

- **パッケージバージョン**: `@supabase/supabase-js: ^2.49.8`
- **開発サーバー**: Vite dev server (http://localhost:3000)
- **ブラウザ**: Chrome/Safari （複数ブラウザで同様の現象を確認）
- **タイムゾーン**: JST (Asia/Tokyo)

## 次のステップ

1. `supabase.auth.signUp` の200 OKレスポンス時の詳細なレスポンスボディ確認
2. Supabase公式ドキュメントでの類似ケース調査  
3. Supabaseコミュニティでの情報収集
4. 必要に応じて代替実装方法の検討

---

**作成日**: 2025年1月27日  
**作成者**: ABE  
**プロジェクト**: Piano Search (2025-05-25Lovable) 