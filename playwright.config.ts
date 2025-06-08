import { defineConfig, devices } from '@playwright/test';

/**
 * ピアノ教室・リトミック教室検索.org
 * 本格公開前テスト設定
 */
export default defineConfig({
  testDir: './tests',
  /* テスト成果物の出力ディレクトリ */
  outputDir: 'test-results',
  /* 並列実行設定 */
  fullyParallel: true,
  /* テスト失敗時の再試行回数 */
  retries: process.env.CI ? 2 : 0,
  /* 並列ワーカー数 */
  workers: process.env.CI ? 1 : undefined,
  /* レポート設定 */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line']
  ],
  /* テストタイムアウト */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  /* すべてのテストで共通設定 */
  use: {
    /* ベースURL設定 */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    /* スクリーンショット設定 */
    screenshot: 'only-on-failure',
    /* ビデオ録画設定 */
    video: 'retain-on-failure',
    /* ブラウザ設定 */
    actionTimeout: 0,
    trace: 'on-first-retry',
  },

  /* テスト対象プロジェクト設定 */
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* ローカル開発サーバー設定 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
}); 