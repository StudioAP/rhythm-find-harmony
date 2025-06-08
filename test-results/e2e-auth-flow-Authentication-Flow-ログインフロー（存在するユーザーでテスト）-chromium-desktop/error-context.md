# Test info

- Name: Authentication Flow >> ログインフロー（存在するユーザーでテスト）
- Location: /Users/akipinnote/Downloads/2025-05-25Lovable/rhythm-find-harmony/tests/e2e/auth-flow.spec.ts:70:3

# Error details

```
TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'ダッシュボード' }) to be visible

    at openDashboard (/Users/akipinnote/Downloads/2025-05-25Lovable/rhythm-find-harmony/tests/e2e/helpers/navigation.ts:10:16)
    at /Users/akipinnote/Downloads/2025-05-25Lovable/rhythm-find-harmony/tests/e2e/auth-flow.spec.ts:110:5
```

# Page snapshot

```yaml
- region "Notifications (F8)":
  - list
- banner:
  - link "ピアノ教室・リトミック教室検索.org":
    - /url: /
  - navigation:
    - link "教室を探す":
      - /url: /search
    - link "About":
      - /url: /about
    - link "お問い合わせ":
      - /url: /contact
  - link "ログイン":
    - /url: /auth
  - link "教室を掲載する":
    - /url: /classroom/register
- main:
  - heading "理想のピアノ教室・リトミック教室を見つけよう" [level=2]
  - paragraph: あなたにぴったりの教室がきっと見つかります
  - textbox "エリアまたはキーワードで検索"
  - button "検索":
    - img
    - text: 検索
  - link "ピアノ教室を探す":
    - /url: /search?type=piano
    - img
    - text: ピアノ教室を探す
  - link "リトミック教室を探す":
    - /url: /search?type=eurythmics
    - img
    - text: リトミック教室を探す
  - heading "教室を探す" [level=2]
  - heading "エリアから探す" [level=3]
  - paragraph: お住まいの地域や通いやすいエリアから教室を検索できます
  - link "エリアで探す":
    - /url: /search?type=area
  - heading "年齢から探す" [level=3]
  - paragraph: お子様の年齢や大人向けなど、対象年齢で教室を絞り込めます
  - link "年齢で探す":
    - /url: /search?type=age
  - heading "特徴から探す" [level=3]
  - paragraph: レッスン内容や教室の特徴からあなたに合った教室を見つけられます
  - link "特徴で探す":
    - /url: /search?type=feature
  - heading "教室を運営されている方へ" [level=2]
  - paragraph: あなたの教室をピアノ教室・リトミック教室検索.orgに掲載しませんか？ 月額たった500円で、新しい生徒との出会いをサポートします
  - link "教室情報を掲載する":
    - /url: /classroom/register
- contentinfo:
  - paragraph: © 2025 ピアノ教室・リトミック教室検索.org All rights reserved.
  - link "About":
    - /url: /about
  - link "利用規約":
    - /url: /terms
  - link "プライバシーポリシー":
    - /url: /privacy
  - link "お問い合わせ":
    - /url: /contact
```

# Test source

```ts
   1 | import { Page, expect } from '@playwright/test';
   2 |
   3 | export async function openDashboard(page: Page) {
   4 |   const dash = () => page.getByRole('link', { name: 'ダッシュボード' });
   5 |
   6 |   // ❶ ページ遷移やDOMの準備を待つために少し余裕を持たせる
   7 |   await page.waitForTimeout(500); // 状況に応じて調整
   8 |
   9 |   // 完全にレンダリングされるまで待機
> 10 |   await dash().waitFor({ state: 'visible', timeout: 15000 });  // ❶ appear
     |                ^ TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
  11 |   // await dash().waitFor({ state: 'stable', timeout: 15000 });   // ❷ 動きが止まる (v1.41+) - 型エラーのため一時コメントアウト
  12 |   await expect(dash()).toBeEnabled({ timeout: 10000 });          // ❸ disabled 解除
  13 |
  14 |   await dash().click();                        // ❹ click
  15 |   await expect(page).toHaveURL('/dashboard', { timeout: 20000 });  // ❺ nav 完了
  16 | }
  17 |
  18 | // 他のナビゲーション関連ヘルパー関数もここに追加可能 
```