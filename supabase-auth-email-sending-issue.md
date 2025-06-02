# Supabase認証システム：メール送信機能の不動作問題 - 技術調査レポート

## 概要
React + Vite + TypeScript + Supabase で構築したWebアプリケーションにおいて、**Supabaseの標準認証機能での確認メール送信が動作しない**問題が発生しています。

当初は「既存ユーザーの重複検知問題」として調査を開始しましたが、実際の根本原因は**Supabaseの標準Auth機能でのメール送信機能の不動作**であることが判明しました。

## 問題の詳細

### 当初の想定 vs 実際の状況

| 項目 | 当初の想定 | 実際の状況 |
|------|------------|------------|
| **問題の性質** | 既存ユーザーの重複検知エラー | Supabaseの標準メール送信機能の不動作 |
| **signUp時の挙動** | 既存ユーザー + 正しいパスワード → セッション作成 | 毎回新規ユーザーレコードを作成 |
| **ユーザーの状態** | 確認済み既存ユーザー | 未確認ユーザー（email_confirmed_at: undefined） |
| **メール送信** | カスタムEdge Function使用 | Supabase標準機能を期待 |

### 実際のテスト結果

**テストケース**: メールアドレス `abe-a@tachibana-u.ac.jp` + パスワード `Pvc35294` での新規登録

**実行結果**:
```javascript
// コンソールログ（実際の出力）
Auth.tsx:79 Supabase signUp response: {data: {…}, error: null}
Auth.tsx:80 Detailed data.session: null
Auth.tsx:81 Detailed data.user: {id: '668c0fb8-57f3-4383-97dc-39bcebcd3515', aud: 'authenticated', role: '', email: 'abe-a@tachibana-u.ac.jp', phone: '', …}
Auth.tsx:82 data.session exists? false
Auth.tsx:83 data.user exists? true
Auth.tsx:86 data.user.created_at: 2025-06-01T12:45:30.525979823Z
Auth.tsx:87 data.user.email_confirmed_at: undefined
Auth.tsx:88 data.user.updated_at: 2025-06-01T12:45:30.525979823Z
Auth.tsx:89 data.user.last_sign_in_at: undefined
Auth.tsx:94 Time difference (ms): -92
Auth.tsx:95 Is likely existing user (created more than 5 seconds ago)? false
```

**重要な発見**:
1. **毎回異なるユーザーIDが生成される**（前回: `'b80b9f41-731c-497d-ba18-e135b201d2d1'`、今回: `'668c0fb8-57f3-4383-97dc-39bcebcd3515'）
2. **`email_confirmed_at`が常に`undefined`** → メール確認が完了していない
3. **確認メールが受信ボックスに届かない** → メール送信機能が動作していない
4. **UIでは「確認メールを送信しました」と表示される** → フロントエンドのロジックは正常

## 技術環境

### プロジェクト詳細
- **Project ID**: `gftbjdazuhjcvqvssyiu`
- **Project Name**: `2025-05-25Lovable`
- **Region**: `ap-northeast-1` (Tokyo)
- **Status**: `ACTIVE_HEALTHY`
- **Database Version**: PostgreSQL 15.8.1.093
- **Project URL**: `https://gftbjdazuhjcvqvssyiu.supabase.co`

### フロントエンド技術スタック
- **React**: 18.2.0
- **Vite**: 5.0.8
- **TypeScript**: 最新
- **supabase-js**: v2.49.8
- **開発環境**: macOS (http://localhost:3000)
- **本番環境**: Cloudflare Pages

### 現在の認証実装コード

```typescript
// src/hooks/useAuth.tsx
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

// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## 調査結果

### Edge Functions の状況
プロジェクトには以下のEdge Functionsが存在：

| Function名 | 目的 | 状態 | メール関連 |
|------------|------|------|------------|
| `send-contact-email` | 教室へのお問い合わせメール | ACTIVE | ✅ Resend API使用 |
| `send-general-contact` | 一般お問い合わせメール | ACTIVE | ✅ Resend API使用 |
| `create-checkout` | Stripe決済 | ACTIVE | ❌ |
| `customer-portal` | Stripe顧客ポータル | ACTIVE | ❌ |
| `handle-stripe-webhook` | Stripeウェブフック | ACTIVE | ❌ |
| `ping` | ヘルスチェック | ACTIVE | ❌ |
| `env-check` | 環境変数チェック | ACTIVE | ❌ |

**重要な発見**: 
- カスタムメール送信機能（Resend API使用）は実装済み・動作中
- しかし、**Supabaseの標準Auth認証メール送信とは別の仕組み**
- 標準Auth機能でのメール送信が設定されていない可能性

### ログ調査結果

```javascript
// API ログ (Supabase)
{
  "event_message": "POST | 200 | 60.90.213.36 | 948ecef97bbad3ee | https://gftbjdazuhjcvqvssyiu.supabase.co/auth/v1/signup?redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback | Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "status_code": 200,
  "timestamp": 1748781930536000
}

// Auth ログ
// → 空（ログが取得できない状況）

// Edge Function ログ
// → 空（標準Auth機能は Edge Function 経由ではない）
```

### 環境変数の状況
フロントエンド環境変数は正常に設定されている：
```javascript
VITE_SUPABASE_URL: https://gftbjdazuhjcvqvssyiu.supabase.co
VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs... (正常に読み込み済み)
```

Supabase側環境変数（Edge Functions用）：
```javascript
RESEND_API_KEY: 設定済み（カスタムメール送信で使用中）
SUPABASE_URL: 設定済み
SUPABASE_SERVICE_ROLE_KEY: 設定済み
```

## 想定される原因

### 1. Supabase Auth設定の問題
- **Email confirmations**が無効になっている
- **メール送信プロバイダー**が設定されていない
- **SMTP設定**が不完全

### 2. メール送信プロバイダーの未設定
- Supabaseのデフォルトメール送信機能が制限されている
- カスタムSMTP設定が必要な状況
- Resend API等の外部プロバイダーを認証メール用に設定する必要

### 3. プロジェクト設定の制約
- 無料プランでのメール送信制限
- 地域（ap-northeast-1）固有の制約
- プロジェクト作成時期による設定の違い

### 4. 時刻設定の問題
```javascript
data.user.created_at: 2025-06-01T12:45:30.525979823Z  // 未来の日時（現在は2025年1月）
```
- サーバー時刻設定の問題
- タイムゾーン設定の問題
- これがメール送信タイミングに影響している可能性

## 必要な調査項目

### 1. Supabase Dashboard確認項目
- **Authentication** → **Settings** → **Email confirmations** の状態
- **Authentication** → **Settings** → **SMTP settings** の設定
- **Authentication** → **Templates** → **Confirm signup** テンプレートの設定
- **プロジェクト設定** → **General** → **Time zone** 設定

### 2. メール送信プロバイダー設定
- デフォルトメール送信機能の制限事項確認
- カスタムSMTP設定の必要性
- 既存のResend API設定を認証メールに流用する可能性

### 3. ログ・監視
- Supabase Dashboard上での認証ログ確認
- メール送信ログの確認
- エラーログの詳細調査

### 4. 代替実装の検討
- カスタムEdge Functionでの認証メール送信
- フロントエンド側での明示的なメール送信トリガー

## 検証済み事項

### ✅ 正常に動作している部分
1. **フロントエンド認証フロー**: `supabase.auth.signUp()`の呼び出しは成功
2. **Supabase接続**: プロジェクトとの通信は正常
3. **ユーザーレコード作成**: `auth.users`テーブルへの挿入は成功
4. **カスタムメール機能**: Resend APIを使用したお問い合わせメールは正常動作
5. **環境変数**: フロントエンド・バックエンド共に正常設定

### ❌ 問題が発生している部分
1. **標準Auth認証メール送信**: Supabaseの標準機能でのメール送信が不動作
2. **メールアドレス確認フロー**: `email_confirmed_at`が更新されない
3. **ユーザー認証完了**: メール確認ができないため、認証が完了しない

## 期待される解決策

### 短期的解決策
1. **Email confirmationsの有効化**: Supabase Dashboard設定修正
2. **SMTP設定の追加**: カスタムメールプロバイダーの設定
3. **既存Resend設定の活用**: 認証メール用のEdge Function追加

### 長期的解決策
1. **統合メール送信システム**: 認証・お問い合わせメールの一元化
2. **監視・ログシステム**: メール送信状況の可視化
3. **エラーハンドリング強化**: メール送信失敗時の適切なUX

## 技術仕様

### メール送信要件
- **宛先**: ユーザーのメールアドレス
- **送信者**: Piano Search運営 
- **内容**: アカウント確認リンク付きHTML
- **リダイレクト**: `${origin}/auth/callback`（現在設定済み）

### セキュリティ要件
- **メールアドレス検証**: 必須
- **リンク有効期限**: 適切な期限設定
- **不正利用防止**: レート制限等

## 次のアクションプラン

1. **Supabase Dashboard詳細確認**: Auth設定・メール設定の全項目チェック
2. **メール送信テスト**: 手動でのメール送信機能テスト
3. **設定調整**: 問題箇所の特定・修正
4. **動作検証**: 修正後の全体フロー確認
5. **本番環境反映**: 修正内容のデプロイ・検証

---

**作成日**: 2025年1月27日  
**調査者**: ABE  
**プロジェクト**: Piano Search (2025-05-25Lovable)  
**緊急度**: 高（新規ユーザー登録機能に直接影響） 