# Test info

- Name: Full Flow: Classroom registration and search (auth skipped) >> Register classroom and search as authenticated user
- Location: /Users/akipinnote/Downloads/2025-05-25Lovable/rhythm-find-harmony/tests/e2e/fullFlow.spec.ts:24:3

# Error details

```
Error: page.fill: Target page, context or browser has been closed
Call log:
  - waiting for locator('textarea[placeholder*="教室の特徴や雰囲気"]')
    - locator resolved to <textarea name="description" id=":r1:-form-item" aria-invalid="false" data-lov-name="Textarea" data-component-line="608" data-component-name="Textarea" placeholder="教室の特徴や雰囲気、指導方針などを記入してください" aria-describedby=":r1:-form-item-description" data-component-file="ClassroomRegistration.tsx" data-lov-id="src/pages/ClassroomRegistration.tsx:608:22" data-component-path="src/pages/ClassroomRegistration.tsx" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background …></textarea>
    - fill("これはテスト教室の説明文です。十分な長さがあります。")
  - attempting fill action
    - waiting for element to be visible, enabled and editable

    at /Users/akipinnote/Downloads/2025-05-25Lovable/rhythm-find-harmony/tests/e2e/fullFlow.spec.ts:34:16
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Full Flow: Classroom registration and search (auth skipped)', () => {
   4 |   let consoleMessages: string[] = [];
   5 |
   6 |   test.beforeEach(async ({ page }) => {
   7 |     // 認証をスキップ: E2EフラグとSupabaseセッションをlocalStorageにセット
   8 |     await page.addInitScript(() => {
   9 |       localStorage.setItem('e2eAuth', '1');
  10 |       localStorage.setItem('supabase.auth.token', JSON.stringify({
  11 |         access_token: 'token',
  12 |         refresh_token: 'token',
  13 |         provider_token: null,
  14 |         token_type: 'bearer',
  15 |         expires_in: 3600,
  16 |         expires_at: Math.floor(Date.now() / 1000) + 3600,
  17 |         user: { id: 'user-id', email: 'teacher@example.com' }
  18 |       }));
  19 |     });
  20 |     consoleMessages = [];
  21 |     page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));
  22 |   });
  23 |
  24 |   test('Register classroom and search as authenticated user', async ({ page }) => {
  25 |     // 認証済み状態でダッシュボードにアクセス
  26 |     await page.goto('/dashboard');
  27 |     await expect(page).toHaveURL('/dashboard');
  28 |
  29 |     // 教室登録ページにアクセス
  30 |     await page.goto('/classroom/register');
  31 |     // フォームが表示されるまで待機
  32 |     await page.waitForSelector('input[placeholder="例：〇〇ピアノ教室"]', { timeout: 10000 });
  33 |     await page.fill('input[placeholder="例：〇〇ピアノ教室"]', 'テスト教室A');
> 34 |     await page.fill('textarea[placeholder*="教室の特徴や雰囲気"]', 'これはテスト教室の説明文です。十分な長さがあります。');
     |                ^ Error: page.fill: Target page, context or browser has been closed
  35 |     await page.selectOption('select', '東京都');
  36 |     await page.fill('input[placeholder="例：渋谷区"]', '渋谷区');
  37 |     await page.fill('input[placeholder="例：1-2-3 〇〇ビル2F"]', '1-2-3');
  38 |     await page.fill('input[placeholder="例：03-1234-5678"]', '03-1234-5678');
  39 |     await page.fill('input[placeholder="例：info@example.com"]', 'info-teach@example.com');
  40 |     await page.fill('input[placeholder="例：https://www.example.com"]', 'https://example.com');
  41 |     await page.click('label:has-text("ピアノ")');
  42 |     await page.click('label:has-text("幼児（0-6歳）")');
  43 |     await page.click('label:has-text("月曜日")');
  44 |     await page.fill('input[placeholder="例：平日10:00-18:00、土日10:00-15:00"]', '平日10:00-18:00');
  45 |     await page.fill('input[placeholder="例：月謝8,000円〜12,000円、入会金5,000円"]', '月謝8000円〜12000円、入会金5000円');
  46 |     // フォーム送信で下書き保存
  47 |     await page.click('form >> button[type="submit"]');
  48 |     await expect(page).toHaveURL('/dashboard');
  49 |
  50 |     // 検索画面で教室を検索
  51 |     await page.goto('/search');
  52 |     await page.fill('input[placeholder="教室名、エリア、特徴などで検索"]', 'テスト教室A');
  53 |     await page.click('button:has-text("検索")');
  54 |     await expect(page.locator('text=テスト教室A')).toBeVisible();
  55 |
  56 |     // Assert no console errors
  57 |     const errors = consoleMessages.filter(msg => msg.startsWith('error') || msg.includes('Failed'));
  58 |     expect(errors).toEqual([]);
  59 |   });
  60 | }); 
```