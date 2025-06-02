# Supabase認証システム：確認メール未配信問題の詳細調査レポート

## 📋 問題概要

**プロジェクト**: Piano Search App (React + Vite + TypeScript + Supabase)  
**環境**: 本番環境 (Cloudflare Pages) + Supabase プロジェクト  
**問題**: 新規ユーザー登録時に確認メールが実際に送信されない

**現状**: Supabase Auth API は 200 OK を返し、新規ユーザーレコードは作成されるが、**実際のメールが届かない**

---

## 🔧 実施済み設定・修正

### 1. ✅ Supabase SMTP設定完了
**Authentication → Settings → Email**

| 項目 | 設定値 |
|------|--------|
| **Email service provider** | Custom SMTP |
| **Host** | `smtp.resend.com` |
| **Port** | `587` |
| **Username** | `resend` |
| **Password** | `re_Kxxxxxxxxx（Resend API Key）` |
| **Sender name** | `Piano Search` |
| **Sender email** | `no-reply@pianosearch.com` |

### 2. ✅ フロントエンド認証ロジック改善
**ファイル**: `src/pages/Auth.tsx`

- 既存ユーザー検知ロジックの追加
- 詳細なエラーハンドリングの実装
- デバッグログの追加

---

## 🧪 最新テスト結果（2025-06-01 13:21）

### **テストケース1**: `test-auth-email@example.com`
```javascript
// 結果: 失敗（500エラー）
AuthApiError: Error sending confirmation email
HTTP Status: 500
data.user: null
data.session: null
```

**原因**: Resendの制限により `example.com` ドメインは使用不可

### **テストケース2**: `abe-a@tachibana-u.ac.jp`
```javascript
// 結果: API成功、但しメール未配信
Supabase signUp response: {data: {…}, error: null}
data.session: null
data.user: {
  id: '2e81b228-5fa6-460f-a0e6-d33485c79aba',
  email: 'abe-a@tachibana-u.ac.jp',
  created_at: '2025-06-01T13:21:33.012347546Z',
  email_confirmed_at: undefined,  // ← 未確認状態
  updated_at: '2025-06-01T13:21:33.012347546Z',
  last_sign_in_at: undefined
}
```

**問題**: 
- ✅ API レスポンス: 200 OK
- ✅ ユーザーレコード作成: 成功
- ❌ **実際のメール配信: 失敗（受信ボックスで未確認）**

---

## 📊 Supabaseログ分析

### Auth Service ログ（最新）
```
2025-06-01 13:16:25.528+00:00
[ERROR] Error sending confirmation email: Invalid `to` field. 
Please use our testing email address instead of domains like `example.com`
```

**分析**: 
- `example.com` テストでのエラーは記録されている
- `abe-a@tachibana-u.ac.jp` テストのログは未表示（時間差の可能性）

### API Service ログ
- 特記すべきエラーなし
- 200 OK レスポンスが正常に返されている

---

## 🤔 想定される原因

### 1. **Resend側の設定不備**
- ドメイン認証が未完了
- API Keyの権限不足
- 送信制限に達している

### 2. **Supabase設定の不備**
- From Email Address の検証が未完了
- Email Templates の設定問題
- Rate Limiting の影響

### 3. **メール配信インフラの問題**
- SPF/DKIM設定の不備
- メールプロバイダーでのスパムフィルタリング
- ネットワークの配信遅延

---

## 🛠️ 環境・設定詳細

### Supabase プロジェクト情報
- **Project ID**: `gftbjdazuhjcvqvssyiu`
- **Region**: 未確認
- **Subscription**: 無料プラン

### 既存Edge Functions
- `send-general-contact`: Resend統合済み
- ※`send-contact-email` は削除済み

### フロントエンド環境
- **Framework**: React + Vite + TypeScript
- **Auth Library**: @supabase/supabase-js
- **Deployment**: Cloudflare Pages

---

## 🎯 追加調査が必要な項目

1. **Resend Dashboard確認**
   - ドメイン認証状況
   - API Key使用制限
   - 送信履歴・エラーログ

2. **Supabase設定再確認**
   - Email Templates内容
   - From Email Addressの検証状況
   - Rate Limiting設定

3. **メール配信テスト**
   - 異なるメールアドレスでのテスト
   - 送信者アドレスの変更テスト
   - スパムフォルダの確認

4. **ログ詳細確認**
   - Resend側の送信ログ
   - より詳細なSupabaseログ
   - ネットワークレベルの配信確認

---

## 💡 提案される解決策

### **短期対応**
1. **Resend Dashboardでの送信履歴確認**
2. **異なる送信者メールアドレスでのテスト**
3. **Supabase Email Templatesの確認・修正**

### **中期対応**
1. **ドメイン認証の完全実装**
2. **SPF/DKIM設定の確認・修正**
3. **代替メールプロバイダーの検討**

### **長期対応**
1. **メール送信システムの監視体制構築**
2. **フォールバック機能の実装**
3. **ユーザビリティ改善（メール再送信機能等）**

---

## 🔍 緊急確認事項

**即座に確認すべき項目:**

1. **📧 Resend Dashboard**
   - https://resend.com/dashboard
   - 最近の送信履歴に `abe-a@tachibana-u.ac.jp` 宛のメールがあるか？

2. **🔐 APIキー権限**
   - 使用中のResend APIキーに送信権限があるか？

3. **🌐 ドメイン設定**
   - `pianosearch.com` ドメインがResendで認証済みか？

4. **📝 Email Templates**
   - Supabase Auth Templates に問題はないか？

**この情報により、問題の根本原因を特定し、適切な解決策を決定できます。** 