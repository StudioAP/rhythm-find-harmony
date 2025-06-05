import { test, expect } from '@playwright/test';
import { openDashboard } from './helpers/navigation';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // 各テスト前にセッションをクリア
    await context.clearCookies();
    
    // 未認証の状態を確保するために、明示的にSupabaseのセッションもクリア
    await page.goto('/auth');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // より確実にセッションをクリアするため追加のチェック
        // Supabaseのローカルストレージキーもクリア
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.log('Storage clear failed:', e);
      }
    });

    // ページをリロードして確実に未認証状態にする
    await page.reload();
    
    // 認証ページが表示されることを確認
    await expect(page).toHaveURL('/auth', { timeout: 10000 });
  });

  test('認証が必要なページの保護', async ({ page }) => {
    // 未認証状態でダッシュボードにアクセス
    await page.goto('/dashboard');
    
    // 認証ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/auth', { timeout: 10000 });
  });

  test('新規ユーザー登録フロー（自動ログイン）', async ({ page }) => {
    // beforeEachで既にページに移動している
    
    // 新規登録タブに切り替え
    await page.getByTestId('signup-tab').click();
    
    // フォーム入力（ユニークなメールアドレスを使用）
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    await page.getByTestId('signup-name').fill('テストユーザー');
    await page.getByTestId('signup-email').fill(uniqueEmail);
    await page.getByTestId('signup-password').fill('password123');
    
    console.log(`Testing signup with email: ${uniqueEmail}`);
    
    // 新規登録ボタンをクリック
    await page.getByTestId('signup-submit').click();
    
    // 新規登録が成功して自動的にダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard', { timeout: 20000 });
    
    // ダッシュボードの主要な要素が表示されることを確認
    await expect(page.locator('h1').filter({ hasText: /教室管理ダッシュボード/ })).toBeVisible({ timeout: 10000 });
    
    // 教室未登録のメッセージが表示されることを確認（新規ユーザーなので）
    await expect(page.locator('text=まず教室情報を登録してください（無料）')).toBeVisible();
  });

  test('ログインフロー（存在するユーザーでテスト）', async ({ page }) => {
    // 最初にユーザーを作成
    await page.getByTestId('signup-tab').click();
    
    const testEmail = `test-login-${Date.now()}@example.com`;
    await page.getByTestId('signup-name').fill('ログインテストユーザー');
    await page.getByTestId('signup-email').fill(testEmail);
    await page.getByTestId('signup-password').fill('password123');
    await page.getByTestId('signup-submit').click();
    
    // 登録成功でダッシュボードに移動することを確認
    await expect(page).toHaveURL('/dashboard', { timeout: 20000 });
    
    // 一度ログアウト
    const logoutButton = page.locator('button').filter({ hasText: /ログアウト|logout/i });
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    await logoutButton.click();
    
    // 認証ページに戻ることを確認
    await expect(page).toHaveURL('/auth', { timeout: 10000 });
    
    // ログインタブに切り替え（デフォルトで既にログインタブが選択されている）
    await page.getByTestId('login-tab').click();
    
    // ログイン試行
    await page.getByTestId('login-email').fill(testEmail);
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();
    
    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard', { timeout: 20000 });
    
    // ダッシュボードの主要な要素が表示されることを確認
    await expect(page.locator('h1').filter({ hasText: /教室管理ダッシュボード/ })).toBeVisible({ timeout: 10000 });

    // トップページに一度戻る
    await page.goto('/');
    await page.waitForLoadState('networkidle'); // ページの読み込み完了を待つ

    // ヘッダーの「ダッシュボード」リンクをクリックして再度ダッシュボードへ（ヘルパー関数を使用）
    await openDashboard(page);

    // 再度ダッシュボードの主要な要素が表示されることを確認
    await expect(page.locator('h1').filter({ hasText: /教室管理ダッシュボード/ })).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL('/dashboard', { timeout: 20000 });
  });

  test('ログアウトフロー', async ({ page }) => {
    // まず新規登録
    await page.getByTestId('signup-tab').click();
    
    const testEmail = `test-logout-${Date.now()}@example.com`;
    await page.getByTestId('signup-name').fill('ログアウトテストユーザー');
    await page.getByTestId('signup-email').fill(testEmail);
    await page.getByTestId('signup-password').fill('password123');
    await page.getByTestId('signup-submit').click();
    
    // 登録成功でダッシュボードに移動することを確認
    await expect(page).toHaveURL('/dashboard', { timeout: 20000 });
    
    // ログアウトボタンをクリック
    const logoutButton = page.locator('button').filter({ hasText: /ログアウト|logout/i });
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    await logoutButton.click();
    
    // 認証ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/auth', { timeout: 10000 });
  });
}); 