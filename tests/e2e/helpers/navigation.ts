import { Page, expect } from '@playwright/test';

export async function openDashboard(page: Page) {
  const dash = () => page.getByRole('link', { name: 'ダッシュボード' });

  // ❶ ページ遷移やDOMの準備を待つために少し余裕を持たせる
  await page.waitForTimeout(500); // 状況に応じて調整

  // 完全にレンダリングされるまで待機
  await dash().waitFor({ state: 'visible', timeout: 15000 });  // ❶ appear
  // await dash().waitFor({ state: 'stable', timeout: 15000 });   // ❷ 動きが止まる (v1.41+) - 型エラーのため一時コメントアウト
  await expect(dash()).toBeEnabled({ timeout: 10000 });          // ❸ disabled 解除

  await dash().click();                        // ❹ click
  await expect(page).toHaveURL('/dashboard', { timeout: 20000 });  // ❺ nav 完了
}

// 他のナビゲーション関連ヘルパー関数もここに追加可能 