# デバッグチェックリスト

## 認証エラー (400 Bad Request) の対処手順

### Phase 1: 症状の正確な把握
- [ ] ブラウザのDevToolsでコンソールログを確認
- [ ] Networkタブで実際のHTTPリクエストを確認
- [ ] エラーメッセージの詳細を記録

### Phase 2: 環境設定の検証

#### 2.1 環境変数の実際値確認
```javascript
// 一時的にclient.tsに追加
console.log('Environment Check:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
  env: import.meta.env
});
```

- [ ] VITE_SUPABASE_URLが正しいSupabaseプロジェクトURLか
- [ ] VITE_SUPABASE_ANON_KEYが設定されているか
- [ ] .envファイルの内容と実際の読み込み値が一致するか

#### 2.2 ネットワークリクエストの確認
- [ ] リクエスト送信先URLが期待通りか
- [ ] リクエストヘッダーに適切なAuthorizationが含まれているか
- [ ] HTTPステータスコードと詳細メッセージの確認

### Phase 3: データベース状態の確認

#### 3.1 ユーザーアカウントの存在確認
```sql
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'target@email.com';
```

- [ ] アカウントが存在するか
- [ ] email_confirmed_atがNULLでないか
- [ ] 作成日時が妥当か

#### 3.2 認証状態の修正（開発環境）
```sql
-- メール認証の手動完了
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'target@email.com';
```

- [ ] 更新が正常に実行されたか
- [ ] 更新後の状態確認

### Phase 4: 解決の確認

#### 4.1 デバッグコードの削除
- [ ] 一時的に追加したconsole.logを削除
- [ ] 本番環境に影響しないことを確認

#### 4.2 認証フローのテスト
- [ ] ログイン操作の実行
- [ ] 成功時のリダイレクト確認
- [ ] ダッシュボード機能の動作確認

## 汎用的なデバッグ原則

### 🚫 避けるべき行動
- [ ] エラーメッセージを読まずに推測する
- [ ] 環境変数を確認せずに設定問題と断定する
- [ ] ログを確認せずに原因を特定する
- [ ] 複数の変更を同時に実行する

### ✅ 推奨される行動
- [ ] エラーメッセージを正確に記録する
- [ ] 実際の設定値を確認する
- [ ] 段階的に問題を切り分ける
- [ ] 変更前後の状態を比較する
- [ ] 解決後に振り返りを行う

## 特定技術スタック固有の確認事項

### Supabase + Vite
- [ ] .envファイルの変数がVITE_プレフィックスで始まっているか
- [ ] ローカルSupabaseとリモートSupabaseの設定混在がないか
- [ ] RLSポリシーが適切に設定されているか

### 認証関連
- [ ] メール認証の完了状況
- [ ] パスワードの大文字小文字・特殊文字
- [ ] アカウントのアクティブ状態
- [ ] セッションの有効性

---

## 今回の事例：具体的な解決ログ

### 問題
- ログイン時に400 Bad Requestエラー
- ダッシュボードにアクセスできない

### 検証結果
1. **環境変数**: ✅ 正常 (`https://gftbjdazuhjcvqvssyiu.supabase.co`)
2. **ネットワークリクエスト**: ✅ 正常送信
3. **アカウント存在**: ✅ 存在
4. **メール認証**: ❌ 未完了 (`email_confirmed_at: null`)

### 解決方法
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'abe.tachibana@gmail.com';
```

### 結果
- ✅ ログイン成功
- ✅ ダッシュボードアクセス可能
- ✅ 下書き保存機能動作確認

---

*最終更新: 2025-05-27*
*次回更新: 新しい問題解決事例の蓄積時* 