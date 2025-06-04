# Full Flow テストエラー・トラブル詳細報告

## 1) 共通失敗：Register classroom and search as authenticated user
- 発生コンテキスト：chromium-desktop, firefox-desktop, webkit-desktop, mobile-chrome, mobile-safari
- エラー内容：フォーム送信後に `/dashboard` へリダイレクトが行われず、URL が `/classroom/register` のままタイムアウト
  ```
  Error: Timed out 15000ms waiting for expect(locator).toHaveURL(expected)
  Expected string: "http://localhost:3000/dashboard"
  Received string: "http://localhost:3000/classroom/register"
  ```
- 原因仮説：
  1. `navigate('/dashboard')` が実行されていない
  2. `saveDraft`/`onSubmit` 内で例外が発生し、中断している
  3. テストのボタンセレクターが誤っている（クリック対象が異なる）
  4. リダイレクト前にネットワークエラー等で処理が停止している

## 2) Playwright CLI 実行ディレクトリずれによる設定読み込みエラー
- 誤った実行例：
  ```bash
  npx playwright test tests/e2e/fullFlow.spec.ts --reporter=line
  ```
- 表示エラー：
  ```
  Error: Playwright Test did not expect test.describe() to be called here.
  ...
  ```
- 原因：プロジェクトルート（`rhythm-find-harmony`）外でコマンドを実行し、設定ファイル (`playwright.config.ts`) が読み込まれずにテストファイル自体を設定ファイルと誤認
- 対策：
  ```bash
  cd rhythm-find-harmony
  npx playwright test tests/e2e/fullFlow.spec.ts --reporter=line
  ```

## 3) 未解決・要確認ポイント
- `ClassroomRegistration` の `saveDraft` および `onSubmit` 内で必ず `navigate('/dashboard')` が呼ばれているか
- テスト側のセレクター（`data-testid` や `getByRole`）が正しい要素を指しているか
- Supabase へのリクエスト結果が成功しているか（`saveDraft` 内で例外が発生していないか）
- フォーム送信後のネットワークリクエストのステータスやレスポンスを確認し、処理が完了しているか

---

上記を踏まえ、まずはフォーム送信後のリダイレクト動作を重点的にデバッグしてください。 