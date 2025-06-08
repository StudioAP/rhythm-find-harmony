# 【相談】Supabase認証における「登録済みメールアドレスでの新規登録試行」がはじかれない問題

## 概要
React + Vite + TypeScript + Supabase認証システムにおいて、既に登録済みのメールアドレスで新規登録を試みても適切にエラーが表示されず、「メール確認してください」的なメッセージが表示される問題について相談します。

## プロジェクト環境情報

### 技術スタック
- **フロントエンド**: React + Vite + TypeScript
- **認証**: Supabase Auth
- **デプロイ**: Cloudflare Pages (成功済み)
- **バックエンド**: Supabase Edge Functions

### Supabaseプロジェクト詳細 (MCPサーバ実取得情報)

**プロジェクト基本情報**:
- Project ID: `gftbjdazuhjcvqvssyiu`
- Project Name: `2025-05-25Lovable`
- Region: `ap-northeast-1` (Tokyo)
- Status: `ACTIVE_HEALTHY`
- Database Version: `15.8.1.093`
- Project URL: `https://gftbjdazuhjcvqvssyiu.supabase.co`
- Created: `2025-05-24T22:09:58.025375Z`

**認証キー情報**:
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdGJqZGF6dWhqY3ZxdnNzeWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMjQ1OTgsImV4cCI6MjA2MzcwMDU5OH0.RJqAGoNmboA5zCdQWDQ1yi3rOWCW3Sk5aFDpg8o6yL8`

### 実際のユーザーデータ (auth.usersテーブル確認済み)

現在Supabaseに登録されているユーザー (最新5件):
```sql
email                          | status    | created_at                     | email_confirmed_at
piano.rythmique.find@gmail.com | confirmed | 2025-06-01 09:01:49.638909+00 | 2025-06-01 09:02:31.648569+00
abe-a@tachibana-u.ac.jp       | confirmed | 2025-05-30 02:38:29.982969+00 | 2025-05-30 02:41:15.774837+00
akipinnoteinstagram@gmail.com | confirmed | 2025-05-29 12:32:56.609378+00 | 2025-05-29 12:33:13.649731+00
abe.tachibana@gmail.com       | confirmed | 2025-05-27 03:09:00.351846+00 | 2025-05-27 12:14:17.631133+00
akipinnote@gmail.com          | confirmed | 2025-05-25 00:41:22.089558+00 | 2025-05-25 00:41:36.319225+00
```

## 現象の詳細

### 問題の状況
1. **既存ユーザー**: `abe-a@tachibana-u.ac.jp` が既にSupabaseに登録済み（メール確認済み）
2. **同じメールアドレスで新規登録試行**: 本番環境で再度 `abe-a@tachibana-u.ac.jp` での新規登録を試行
3. **期待する挙動**: 「このメールアドレスは既に登録されています」エラーが表示される
4. **実際の挙動**: 「メールを確認してください」的なメッセージが表示されるが、メールは届かない

### コンソールログ情報 (本番環境で確認)
```
index-Dp98S8v4.js:416 Attempting to sign up with: abe-a@tachibana-u.ac.jp oooooooooooooooooo 大学　PC男
auth:1 Failed to load resource: the server responded with a status of 404 ()
```

### 開発環境設定の課題
- ローカル `.env` ファイルが存在しない状況 (または `.gitignore` されている)
- 環境変数 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` がCloudflare Pagesおよびローカル開発環境で正しく設定・読み込まれているか不明確。

## 現在の実装コード

### 1. 認証フック (`rhythm-find-harmony/src/hooks/useAuth.tsx`)

**signUp関数の実装**:
```typescript
const signUp = async (email: string, password: string, name: string) => {
  if (isE2E) return { data: null, error: null }; // E2Eテスト用スキップ
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
      },
      // 重要: callback URLはデプロイ先のドメインに合わせて設定
      emailRedirectTo: window.location.origin + "/auth/callback",
    },
  });
  return { data, error };
};
```

### 2. 認証ページのエラーハンドリング (`rhythm-find-harmony/src/pages/Auth.tsx`)

**現在のsignUp処理部分**:
```typescript
const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  console.log("Attempting to sign up with:", signupEmail, signupPassword, name);

  const { error } = await signUp(signupEmail, signupPassword, name);
  
  if (error) {
    if (error.message.includes("User already registered")) {
      setError("このメールアドレスは既に登録されています");
    } else if (error.message.includes("Password should be")) {
      setError("パスワードは6文字以上で入力してください");
    } else {
      setError("新規登録に失敗しました。もう一度お試しください。");
    }
  } else {
    toast({
      title: "新規登録成功",
      description: "確認メールを送信しました。メールをご確認ください。",
    });
    // メール確認が必要な場合は登録成功後にリダイレクトしない
    // navigate("/dashboard");
  }
  
  setIsLoading(false);
};
```

### 3. Supabaseクライアント設定 (`rhythm-find-harmony/src/integrations/supabase/client.ts`)

```typescript
// 環境変数からSupabase設定を取得
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 環境変数が設定されていない場合のエラーチェック
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabaseの環境変数 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) が設定されていません。');
  // アプリケーションの初期化段階でエラーを投げるか、適切に処理する
  throw new Error('Supabaseの環境変数 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) が設定されていません。.envファイルとVite/Cloudflare Pagesの設定を確認してください。');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## 専門家からのアドバイス（ABEさんによる分析と提案）

以下は、本件に関してユーザー(ABEさん)から提供された詳細な分析と具体的な解決策案です。

### 0️⃣ 要点先取り

| 症状                            | もっとも多い原因                                                           | １行 Fix                                                                             |
| ----------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| **① `/auth/v1/signup` が 404** | `VITE_SUPABASE_URL` に **`/rest/v1` 付き / 空文字 / 別プロジェクト URL** を入れている | Cloudflare Pages と `.env.local` を **`https://<ref>.supabase.co`** に統一              |
| **② 成功 toast が出てしまう**         | 404 は `supabase-js` では **例外 throw** → `error` が `undefined` になる    | `try { … } catch (err) { setError(...) }` でネットワーク例外を捕捉                             |
| **③ 既登録メールでも成功扱いになる**         | エラーメッセージ判定が文字列ベタ打ち＋ `status` 未使用                                   | `if (error?.status === 400 && error.message?.includes("User already registered"))` |

---

### 1️⃣ 404 を確実に消す ― Supabase URL を揃える

1.  **Cloudflare Pages → Settings → Environment Variables**
    ```txt
    VITE_SUPABASE_URL        https://gftbjdazuhjcvqvssyiu.supabase.co
    VITE_SUPABASE_ANON_KEY   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdGJqZGF6dWhqY3ZxdnNzeWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMjQ1OTgsImV4cCI6MjA2MzcwMDU5OH0.RJqAGoNmboA5zCdQWDQ1yi3rOWCW3Sk5aFDpg8o6yL8
    ```
2.  **開発用 `.env.local`**（Vite は自動読込、無ければ作成）
    ```dotenv
    VITE_SUPABASE_URL=https://gftbjdazuhjcvqvssyiu.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdGJqZGF6dWhqY3ZxdnNzeWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMjQ1OTgsImV4cCI6MjA2MzcwMDU5OH0.RJqAGoNmboA5zCdQWDQ1yi3rOWCW3Sk5aFDpg8o6yL8
    ```
3.  **ビルドし直しと確認**
    *   ローカル: `npm run dev` を実行し、ブラウザの開発者ツールNetworkタブで `/auth/v1/signup` へのリクエストが **200 OK** または **400 Bad Request** (メール重複などの場合) で返ることを確認。
    *   Cloudflare Pages: 上記環境変数を設定後、再デプロイを実行（環境変数変更時は通常フルビルドが必要）。

> **チェックポイント**
>
> *   リクエストURLが `https://gftbjdazuhjcvqvssyiu.supabase.co/rest/v1/auth/v1/signup` のように `/rest/v1` を含んでしまっている場合、`VITE_SUPABASE_URL` の設定ミスです。正しくは `https://gftbjdazuhjcvqvssyiu.supabase.co` です。
> *   404が解消しない場合は、ブラウザの開発者ツールで実際に送信されているリクエストURLをコピーし、`curl`コマンドなどで直接叩いてみて、Supabaseのエンドポイントが正しく疎通できているか確認します。

---

### 2️⃣ `signUp` のハンドリングを網羅 (Auth.tsx の修正案)

```typescript
const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    // signUp関数を呼び出し (useAuth.tsxからインポートされたもの)
    const { error } = await signUp(signupEmail, signupPassword, name);

    if (error) {
      // ---- Supabase が 4xx/5xx エラーを返したケース ----
      if (error.status === 400 && error.message?.includes("User already registered")) {
        setError("このメールアドレスは既に登録されています");
      } else if (error.status === 400 && error.message?.includes("Password should be")) {
        setError("パスワードは6文字以上で入力してください");
      } else if (error.status === 429) { // レート制限の考慮
        setError("リクエストが多すぎます。しばらくしてから再度お試しください。");
      } else {
        // その他のSupabaseからのエラー
        console.error("Supabase signUp error:", error);
        setError(`新規登録に失敗しました (エラー: ${error.message})`);
      }
      return; // エラー発生時はここで処理を終了
    }

    // ---- 正常時 (Supabaseからエラーが返らなかった場合) ----
    toast({
      title: "新規登録成功",
      description: "確認メールを送信しました。メールをご確認ください。",
    });
    // 必要であれば、ここで signupEmail, signupPassword, name のステートをクリア
    // setSignupEmail('');
    // setSignupPassword('');
    // setName('');

  } catch (err) {
    // ---- fetch自体が失敗した例外（URL間違いによる404、ネットワーク接続断、CORSエラーなど） ----
    // このcatchブロックは supabase-js が内部で fetch を使い、それが失敗した場合に発生
    console.error("Network or signUp invocation error:", err);
    setError("ネットワークエラーが発生しました。URL設定を確認するか、時間をおいて再度お試しください。");
  } finally {
    setIsLoading(false);
  }
};
```

**ポイント**

| エラーの発生源         | `error` オブジェクトの内容例                                    | 意味                                                                 |
| ------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| Supabase API       | `error.status` (数値), `error.message` (文字列)             | バリデーションエラー (400)、レート制限 (429)、サーバーエラー (500) など           |
| `fetch` レベルの例外 | `err` (FetchError, TypeErrorなど、 `status`プロパティを持たない可能性あり) | DNS解決失敗、URL不正による404 Not Found、ネットワーク切断、CORSポリシー違反など |

---

### 3️⃣ Supabase Auth の仕様（v2 系）- signUp 時の代表的なレスポンス

| 状態                                     | HTTP Status | `error` オブジェクト (`supabase.auth.signUp`の返り値)             | `data.session` (`supabase.auth.signUp`の返り値) |
| ---------------------------------------- | ----------- | ----------------------------------------------------------------- | --------------------------------------------- |
| 新規登録成功（メール確認待ち、確認不要設定の場合も含む） | 200 OK      | `null`                                                            | `null` (メール確認前はセッションなし) または有効なセッションオブジェクト (確認不要設定時) |
| **メールアドレス重複**                       | **400 Bad Request** | `{status: 400, message: "User already registered", ...}`          | `null`                                        |
| パスワードが短い (ポリシー違反)                  | 400 Bad Request | `{status: 400, message: "Password should be at least 6 characters"}` | `null`                                        |
| Auth URL/エンドポイント自体が間違っている          | **N/A (fetchが例外をthrow)** | `undefined` (try-catchで捕捉される `err` に詳細が入る)                 | N/A                                           |
| 必須パラメータ不足 (例: emailなし)           | 400 Bad Request | `{status: 400, message: "Unable to validate email address: invalid format"}` or similar | `null`                                        |

---

### 4️⃣ ベストプラクティスに関する提案

1.  **環境変数の管理**: `VITE_` プレフィックス付きの環境変数はクライアントサイドにバンドルされるため、公開可能な情報（Supabase URL, Anon Key）のみに限定する。Service Role Keyなどの機密情報は `VITE_` を付けず、サーバーサイド（Edge Functionsなど）でのみ使用する。
2.  **エラーハンドリング**: `error.status` (HTTPステータスコード) や `error.code` (Supabaseが独自に定義するエラーコード、あれば) を優先的に評価し、`error.message` は補助的に（UI表示やログ記録に）使用する。これにより、エラーメッセージの文言変更に強いコードになる。
3.  **ユーザーへのフィードバック**: メール確認が必要なフローの場合、「確認メールを送信しました。届かない場合は迷惑メールフォルダもご確認ください」といった、より親切な案内を検討する。
4.  **レート制限への対応**: `error.status === 429` の場合に、ユーザーに適切な待機時間を促すUIを表示する。
5.  **ログ収集**: クライアントサイドで発生した認証エラー（特に予期せぬもの）は、Sentry、Logflare、Supabaseのログ機能などを活用して収集・監視し、問題の早期発見と対応に繋げる。

---

## 疑問点・調査したい点 (更新・集約)

1.  **根本原因の特定**: `auth:1 Failed to load resource: the server responded with a status of 404 ()` のログは、やはり `VITE_SUPABASE_URL` の設定ミスが原因か？ ABEさんの分析通り、これを修正することで解消するか？
2.  **エラーハンドリングの改善**: ABEさん提案の `try-catch` と `error.status` を利用したエラーハンドリングを実装することで、既存メールアドレスでの登録試行時に「このメールアドレスは既に登録されています」という正しいエラーメッセージを表示できるようになるか？
3.  **Supabase Auth設定**: Supabase管理画面のAuth設定で、「メール確認を必須にする(Secure email changeがON)」はデフォルトで有効だが、これが今回の「登録済みでも確認メールが行く（ように見える）」挙動に間接的に関連している可能性はあるか？（通常は重複エラーが優先されるはずだが念のため）
4.  **RLS (Row Level Security) ポリシーの競合**: `profiles` テーブルや関連テーブル（`users` など、Supabase Authが内部的に使用するものも含む）のRLSポリシーが、意図せず新規ユーザー登録時の書き込みや既存ユーザー情報の参照を妨げている可能性。
    *   特に `INSERT` や `SELECT` のポリシーで、`auth.uid()` がまだ存在しない、または期待通りでない場合のフォールバックが考慮されているか。
5.  **クライアント側ロジック**: `Auth.tsx` 内の `handleSignUp` や `handleSignInWithPassword` 関数で、エラーハンドリングやセッション管理、リダイレクト処理に微妙なタイミングの問題や条件分岐の漏れがないか。

## 求める回答 (更新)

1.  **上記ABEさんの分析・提案に対する妥当性の評価**: 特にURL設定とエラーハンドリングの修正案について、これが最適解であるか、他に考慮すべき点はあるか？
2.  **実装上の具体的なアドバイス**: 提示された修正コードを実際のプロジェクトに適用する上での注意点や、さらなる改善提案があれば。
3.  **`auth:1 ... 404` のログについて**: このログが具体的にどのリクエストに対する404なのか、ブラウザの開発者ツールでより詳細に特定する方法は？（ABEさんの提案通り、Networkタブで確認が基本だが、さらに深掘りするポイントなどあれば）

## 追加情報

### Edge Functions
現在、以下のEdge Functionsが稼働中:
- `send-contact-email`: メール送信機能
- `send-general-contact`: 一般問い合わせ機能
- `create-checkout`: Stripe決済連携
- `customer-portal`: カスタマーポータル
- `handle-stripe-webhook`: Stripe Webhook処理

### 環境
- **開発環境**: ローカル (環境変数設定に課題あり、`.env.local` の作成と設定を推奨)
- **本番環境**: Cloudflare Pages (デプロイ成功、実際に問題が発生している環境、環境変数の再確認を推奨)

## 質問
この問題について、ABEさんから頂いた詳細な分析と提案を踏まえ、技術的に正しい解決アプローチと、実装上の具体的な修正案、そして今後のためのベストプラクティスについて、改めてご意見・ご助言をいただけますでしょうか？ 