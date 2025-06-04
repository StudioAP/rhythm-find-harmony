# 🎯 ピアノ教室・リトミック教室検索.com 本格公開前テスト実行計画

## 📋 テスト実行準備チェックリスト

### ✅ Phase 0: 事前準備
- [ ] **フロントエンドにdata-testid属性追加**
  - [ ] Contact.tsx のフォーム要素
  - [ ] Auth.tsx のログイン・登録フォーム
  - [ ] Search.tsx の検索フォーム・結果
  - [ ] Dashboard.tsx のダッシュボード要素
  - [ ] ClassroomRegistration.tsx の登録フォーム

- [ ] **テスト環境設定**
  - [ ] Stripe Test Mode確認
  - [ ] Resend API Key確認（テスト用）
  - [ ] Supabase環境変数確認
  - [ ] ローカル開発サーバー起動

### ✅ Phase 1: 基本機能単体テスト
```bash
# 基本機能のみテスト実行
npx playwright test --grep "🔍 STAGE 1"
```

**確認ポイント:**
- [ ] メール送信機能動作
- [ ] 認証フローの正常動作
- [ ] データベース接続確認

### ✅ Phase 2: ユーザージャーニーテスト
```bash
# ユーザージャーニーのみテスト実行
npx playwright test --grep "🎨 STAGE 2"
```

**確認ポイント:**
- [ ] 一般利用者の検索フロー
- [ ] 教室運営者の登録フロー
- [ ] 決済フローの動作

### ✅ Phase 3: エッジケーステスト
```bash
# エッジケースのみテスト実行
npx playwright test --grep "⚠️ STAGE 3"
```

**確認ポイント:**
- [ ] 異常入力への対応
- [ ] ネットワーク障害シミュレーション
- [ ] セキュリティ脆弱性確認

### ✅ Phase 4: パフォーマンステスト
```bash
# パフォーマンステストのみ実行
npx playwright test --grep "🔒 STAGE 4"
```

**確認ポイント:**
- [ ] ページ読み込み速度
- [ ] レスポンス時間
- [ ] 同時接続負荷

## 🚀 本格テスト実行コマンド

### 全テスト実行（推奨）
```bash
# デスクトップブラウザのみ
npx playwright test --project=chromium-desktop

# モバイルも含む全ブラウザ
npx playwright test

# 失敗時のデバッグ情報付き
npx playwright test --debug

# UIモードで実行
npx playwright test --ui
```

### 特定ブラウザでのテスト
```bash
# Chrome のみ
npx playwright test --project=chromium-desktop

# Firefox のみ
npx playwright test --project=firefox-desktop

# Safari のみ
npx playwright test --project=webkit-desktop

# モバイル Chrome
npx playwright test --project=mobile-chrome

# モバイル Safari
npx playwright test --project=mobile-safari
```

## 📊 テスト結果の確認

### レポート表示
```bash
# HTMLレポート表示
npx playwright show-report test-results/html-report

# JSON結果確認
cat test-results/results.json | jq
```

### ログ確認場所
- **テスト実行ログ**: コンソール出力
- **スクリーンショット**: `test-results/`フォルダ
- **ビデオ録画**: `test-results/`フォルダ
- **トレース**: `test-results/`フォルダ

## 🐛 トラブルシューティング

### よくある問題

#### 1. data-testid要素が見つからない
```bash
Error: locator.click: Error: strict mode violation: multiple elements
```
**解決法**: 該当コンポーネントにユニークなdata-testid属性を追加

#### 2. タイムアウトエラー
```bash
Error: Test timeout of 30000ms exceeded
```
**解決法**: ネットワーク状況確認、待機時間調整

#### 3. 認証エラー
```bash
Error: expect(received).toHaveURL(expected)
```
**解決法**: Supabase認証設定、環境変数確認

## 📝 手動確認チェックリスト

### メール受信確認
- [ ] 一般お問い合わせメール受信
- [ ] 教室問い合わせメール受信
- [ ] 送信者向け確認メール受信
- [ ] 管理者向け通知メール受信

### 決済フロー手動確認
- [ ] Stripe Test Cardでの決済成功
- [ ] Webhook受信確認
- [ ] サブスクリプション状態確認
- [ ] Customer Portal動作確認

### モバイル実機確認
- [ ] iPhone Safari での動作
- [ ] Android Chrome での動作
- [ ] タッチ操作の快適性
- [ ] レスポンシブデザイン

## 🎯 最終確認事項

### 本格公開前の最終チェック
- [ ] **全テストケース PASS**
- [ ] **パフォーマンス要件クリア**
- [ ] **セキュリティ脆弱性なし**
- [ ] **モバイル対応完璧**
- [ ] **メール配信正常**
- [ ] **決済フロー完璧**

### 公開時の設定変更
- [ ] Stripe Live Mode切り替え
- [ ] Resend Production Domain設定  
- [ ] Supabase Production環境
- [ ] CDN設定・キャッシュ設定
- [ ] 監視・アラート設定

---

## 🚨 緊急時対応

### テスト失敗時の対応フロー
1. **エラーログ詳細確認**
2. **スクリーンショット・ビデオ確認**
3. **該当機能の手動確認**
4. **修正・再テスト実行**
5. **全体への影響範囲確認**

### 公開延期判断基準
- **STAGE 1 基本機能**: 1つでも失敗 → 延期必須
- **STAGE 2 ユーザージャーニー**: 2つ以上失敗 → 延期検討
- **STAGE 3 エッジケース**: 3つ以上失敗 → 延期検討
- **STAGE 4 パフォーマンス**: 基準値50%未達 → 延期検討 