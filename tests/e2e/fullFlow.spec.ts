import { test, expect } from '@playwright/test';

test.describe('Full Flow: Classroom registration and search (auth skipped)', () => {
  let consoleMessages: string[] = [];

  test.beforeEach(async ({ page }) => {
    // 認証をスキップ: E2EフラグとSupabaseセッションをlocalStorageにセット
    await page.addInitScript(() => {
      localStorage.setItem('e2eAuth', '1');
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'token',
        refresh_token: 'token',
        provider_token: null,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'user-id', email: 'teacher@example.com' }
      }));
    });
    consoleMessages = [];
    page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));
  });

  test('Register classroom and search as authenticated user', async ({ page }) => {
    // 認証済み状態でダッシュボードにアクセス
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');

    // 教室登録ページにアクセス
    await page.goto('/classroom/register');
    // フォームが表示されるまで待機
    await page.waitForSelector('input[placeholder="例：〇〇ピアノ教室"]', { timeout: 10000 });
    await page.fill('input[placeholder="例：〇〇ピアノ教室"]', 'テスト教室A');
    await page.fill('textarea[placeholder*="教室の特徴や雰囲気"]', 'これはテスト教室の説明文です。十分な長さがあります。');
    await page.selectOption('select', '東京都');
    await page.fill('input[placeholder="例：渋谷区"]', '渋谷区');
    await page.fill('input[placeholder="例：1-2-3 〇〇ビル2F"]', '1-2-3');
    await page.fill('input[placeholder="例：03-1234-5678"]', '03-1234-5678');
    await page.fill('input[placeholder="例：info@example.com"]', 'info-teach@example.com');
    await page.fill('input[placeholder="例：https://www.example.com"]', 'https://example.com');
    await page.click('label:has-text("ピアノ")');
    await page.click('label:has-text("幼児（0-6歳）")');
    await page.click('label:has-text("月曜日")');
    await page.fill('input[placeholder="例：平日10:00-18:00、土日10:00-15:00"]', '平日10:00-18:00');
    await page.fill('input[placeholder="例：月謝8,000円〜12,000円、入会金5,000円"]', '月謝8000円〜12000円、入会金5000円');
    // フォーム送信で下書き保存
    await page.click('form >> button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // 検索画面で教室を検索
    await page.goto('/search');
    await page.fill('input[placeholder="教室名、エリア、特徴などで検索"]', 'テスト教室A');
    await page.click('button:has-text("検索")');
    await expect(page.locator('text=テスト教室A')).toBeVisible();

    // Assert no console errors
    const errors = consoleMessages.filter(msg => msg.startsWith('error') || msg.includes('Failed'));
    expect(errors).toEqual([]);
  });
}); 