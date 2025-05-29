# 🚀 デプロイ前必須実装チェックリスト

## 📋 **現在の実装状況サマリー**
- ✅ **核心機能**: 教室検索・登録・問い合わせフォーム（完全実装）
- ✅ **技術基盤**: React + TypeScript + Vite + Supabase（完全実装）
- ✅ **認証システム**: Supabase Auth（動作確認済み）
- ✅ **画像管理**: 5枚制限・サムネイル選択（完全実装）
- ✅ **UI/UX**: レスポンシブデザイン・モーダル・キーボード操作（完全実装）

---

## 🚨 **デプロイ前必須項目**

### **1. 環境変数管理** 【最高優先度】
- [ ] `.env.example`ファイル作成 ✅ 
- [ ] 本番環境用`.env`ファイル設定
  - [ ] `VITE_SUPABASE_URL`（本番Supabaseプロジェクト）
  - [ ] `VITE_SUPABASE_ANON_KEY`（本番環境Key）
- [ ] デプロイ先での環境変数設定
  - [ ] Netlify: Site settings > Environment variables
  - [ ] Vercel: Project settings > Environment Variables

### **2. Stripe決済システム完全修正** 【高優先度】
現在の問題: `STRIPE_WEBHOOK_ISSUE.md`参照

#### **修正が必要な箇所:**
- [ ] **Webhook到達確認**: Stripe → Supabase Edge Function
- [ ] **署名検証問題**: 現在のDeno環境での実装不具合
- [ ] **無限ループ問題**: 決済完了後のフロントエンド処理
- [ ] **データベース未挿入**: subscriptions/payment_historyテーブル

#### **具体的な修正手順:**
1. [ ] Stripe CLI `listen`でのリアルタイム検証
2. [ ] Edge Function署名検証ロジック修正
3. [ ] 冪等性処理の強化
4. [ ] フロントエンド決済フロー改善

### **3. エラーハンドリング・ロギング強化** 【中優先度】
- [ ] 本番環境用エラー処理追加
- [ ] ユーザーフレンドリーエラーメッセージ
- [ ] Edge Functions詳細ログ追加
- [ ] 問い合わせメール送信失敗時の処理

### **4. セキュリティ強化** 【中優先度】
- [ ] CORS設定の本番環境対応
- [ ] RLS（Row Level Security）ポリシー再確認
- [ ] API Key露出防止確認
- [ ] XSS・CSRF対策確認

### **5. パフォーマンス最適化** 【低優先度】
- [ ] バンドルサイズ最適化（現在951KB → 推奨500KB以下）
  ```
  考慮事項: Code splitting, Dynamic imports
  ```
- [ ] 画像最適化・CDN対応
- [ ] キャッシュ戦略設定

### **6. SEO・アクセシビリティ** 【低優先度】
- [ ] メタタグ設定（title, description, og:image）
- [ ] robots.txt作成
- [ ] sitemap.xml生成
- [ ] アクセシビリティ監査

---

## 🔧 **デプロイ手順（推奨）**

### **Step 1: ローカル環境での最終テスト**
```bash
# 本番ビルドテスト
npm run build

# プレビューサーバーでの動作確認  
npm run preview
```

### **Step 2: 環境変数の本番設定**
- Supabase本番プロジェクトの設定
- StripeキーのLive環境への切り替え
- Resend API Keyの設定

### **Step 3: デプロイ先選択肢**
1. **Netlify**（推奨）
   - 自動デプロイ設定
   - SPA用リダイレクト設定
   
2. **Vercel**
   - Zero-configuration deployment
   - Edge Functions対応

3. **AWS Amplify / CloudFlare Pages**
   - 高パフォーマンス要求時

### **Step 4: 本番環境でのテスト**
- [ ] ユーザー登録・ログイン
- [ ] 教室登録・編集
- [ ] 検索機能
- [ ] 決済フロー（Stripe）
- [ ] 問い合わせメール送信

---

## ⚠️ **既知の問題・制限事項**

### **Stripe Webhook問題**
```
症状: 決済完了後の無限ループ、データベース未挿入
影響度: 高（ビジネス機能に直接影響）
修正予定: デプロイ前必須
```

### **バンドルサイズ**
```
現在: 951KB（推奨500KB以下）
影響度: 中（初回読み込み速度）
修正予定: デプロイ後最適化可能
```

---

## 📞 **デプロイ後の監視項目**

### **技術監視**
- [ ] アプリケーションエラー率
- [ ] API応答時間
- [ ] Supabase接続状況
- [ ] Edge Functions実行ログ

### **ビジネス監視**
- [ ] ユーザー登録数
- [ ] 教室掲載数
- [ ] 決済成功率
- [ ] 問い合わせ送信成功率

---

**💡 総評**: 
核心機能は完全実装済み。**Stripe Webhook問題の解決**と**環境変数設定**が最優先。それ以外はデプロイ後の段階的改善で対応可能。

**推定デプロイ準備期間**: Stripe問題修正込みで1-2日 