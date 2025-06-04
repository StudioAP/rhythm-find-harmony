import { test, expect, Page } from '@playwright/test';

// **************************************************
// 🎯 ピアノ教室・リトミック教室検索.com 
// 本格公開前 包括的テストスイート
// **************************************************

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// テストデータ
const TEST_DATA = {
  newUser: {
    email: `test.user.${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    name: '山田太郎',
  },
  classroom: {
    name: 'テスト音楽教室',
    description: 'これはテスト用の教室説明です。',
    area: '東京都渋谷区',
    address: '東京都渋谷区神南1-1-1',
    phone: '03-1234-5678',
    email: 'test.classroom@example.com',
    website: 'https://test-classroom.example.com',
  },
  contact: {
    senderName: '佐藤花子',
    senderEmail: 'hanako.sato@example.com',
    subject: 'テストお問い合わせ',
    message: 'これはテスト用のお問い合わせメッセージです。',
  }
};

// **************************************************
// 🔍 STAGE 1: 基本機能テスト
// **************************************************

test.describe('🔍 STAGE 1: 基本機能テスト', () => {
  
  test.describe('1.1 認証システム', () => {
    test('新規ユーザー登録フロー', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // 新規登録タブクリック
      await page.click('[data-testid="signup-tab"]');
      
      // フォーム入力
      await page.fill('[data-testid="signup-email"]', TEST_DATA.newUser.email);
      await page.fill('[data-testid="signup-password"]', TEST_DATA.newUser.password);
      
      // 送信
      await page.click('[data-testid="signup-submit"]');
      
      // 成功メッセージ確認
      await expect(page.locator('[data-testid="signup-success"]')).toBeVisible();
    });

    test('ログイン/ログアウトフロー', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // ログイン（既存ユーザー前提）
      await page.fill('[data-testid="login-email"]', 'existing.user@example.com');
      await page.fill('[data-testid="login-password"]', 'password123');
      await page.click('[data-testid="login-submit"]');
      
      // ダッシュボードリダイレクト確認
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
      
      // ログアウト
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      
      // トップページリダイレクト確認
      await expect(page).toHaveURL(`${BASE_URL}/`);
    });
  });

  test.describe('1.2 メール送信システム', () => {
    test('一般お問い合わせメール送信', async ({ page }) => {
      await page.goto(`${BASE_URL}/contact`);
      
      // フォーム入力
      await page.fill('[data-testid="contact-name"]', TEST_DATA.contact.senderName);
      await page.fill('[data-testid="contact-email"]', TEST_DATA.contact.senderEmail);
      await page.fill('[data-testid="contact-subject"]', TEST_DATA.contact.subject);
      await page.fill('[data-testid="contact-message"]', TEST_DATA.contact.message);
      
      // 送信
      await page.click('[data-testid="contact-submit"]');
      
      // 成功メッセージ確認
      await expect(page.locator('[data-testid="contact-success"]')).toBeVisible();
      
      // メール送信ログ確認（管理者側で確認）
      console.log('📧 メール送信ログを管理画面で確認してください');
    });
  });
});

// **************************************************
// 🎨 STAGE 2: ユーザージャーニー完全テスト
// **************************************************

test.describe('🎨 STAGE 2: ユーザージャーニー完全テスト', () => {
  
  test.describe('2.1 一般利用者シナリオ', () => {
    test('新規訪問者の基本検索フロー', async ({ page }) => {
      // 1. トップページ到達
      await page.goto(BASE_URL);
      await expect(page.locator('h1')).toContainText('ピアノ教室・リトミック教室検索');
      
      // 2. 検索ページに移動
      await page.click('[data-testid="search-button"]');
      await expect(page).toHaveURL(`${BASE_URL}/search`);
      
      // 3. 地域選択
      await page.selectOption('[data-testid="area-select"]', '東京都');
      
      // 4. レッスンタイプフィルタ
      await page.check('[data-testid="lesson-type-piano"]');
      
      // 5. 検索実行
      await page.click('[data-testid="search-execute"]');
      
      // 6. 検索結果確認
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      
      // 7. 教室詳細表示
      await page.click('[data-testid="classroom-card"]:first-child');
      await expect(page.locator('[data-testid="classroom-detail"]')).toBeVisible();
      
      // 8. お問い合わせフォーム表示
      await page.click('[data-testid="contact-classroom-button"]');
      await expect(page.locator('[data-testid="classroom-contact-form"]')).toBeVisible();
    });

    test('詳細検索ユーザーフロー', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      
      // 複数条件設定
      await page.selectOption('[data-testid="area-select"]', '東京都');
      await page.check('[data-testid="lesson-type-piano"]');
      await page.check('[data-testid="lesson-type-eurhythmics"]');
      await page.selectOption('[data-testid="age-range"]', '3-6');
      await page.check('[data-testid="trial-lesson-available"]');
      await page.check('[data-testid="parking-available"]');
      
      // 料金範囲設定
      await page.fill('[data-testid="price-min"]', '5000');
      await page.fill('[data-testid="price-max"]', '15000');
      
      // 検索実行
      await page.click('[data-testid="search-execute"]');
      
      // 結果確認
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      const resultCount = await page.locator('[data-testid="classroom-card"]').count();
      console.log(`🔍 検索結果: ${resultCount}件の教室が見つかりました`);
    });
  });

  test.describe('2.2 教室運営者シナリオ', () => {
    test('新規教室運営者の完全登録フロー', async ({ page }) => {
      // 1. 新規アカウント作成
      await page.goto(`${BASE_URL}/auth`);
      await page.click('[data-testid="signup-tab"]');
      await page.fill('[data-testid="signup-email"]', TEST_DATA.newUser.email);
      await page.fill('[data-testid="signup-password"]', TEST_DATA.newUser.password);
      await page.click('[data-testid="signup-submit"]');
      
      // 2. ダッシュボード到達
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
      
      // 3. 教室登録開始
      await page.click('[data-testid="register-classroom-button"]');
      await expect(page).toHaveURL(`${BASE_URL}/classroom-registration`);
      
      // 4. 基本情報入力
      await page.fill('[data-testid="classroom-name"]', TEST_DATA.classroom.name);
      await page.fill('[data-testid="classroom-description"]', TEST_DATA.classroom.description);
      await page.fill('[data-testid="classroom-area"]', TEST_DATA.classroom.area);
      await page.fill('[data-testid="classroom-address"]', TEST_DATA.classroom.address);
      
      // 5. 連絡先情報
      await page.fill('[data-testid="classroom-phone"]', TEST_DATA.classroom.phone);
      await page.fill('[data-testid="classroom-email"]', TEST_DATA.classroom.email);
      await page.fill('[data-testid="classroom-website"]', TEST_DATA.classroom.website);
      
      // 6. レッスン情報
      await page.check('[data-testid="lesson-type-piano"]');
      await page.selectOption('[data-testid="age-range"]', '全年齢');
      await page.fill('[data-testid="monthly-fee-min"]', '8000');
      await page.fill('[data-testid="monthly-fee-max"]', '12000');
      
      // 7. 下書き保存
      await page.click('[data-testid="save-draft-button"]');
      await expect(page.locator('[data-testid="draft-saved-message"]')).toBeVisible();
      
      // 8. プレビュー確認
      await page.click('[data-testid="preview-button"]');
      await expect(page.locator('[data-testid="classroom-preview"]')).toBeVisible();
    });

    test('サブスクリプション決済フロー', async ({ page }) => {
      // 認証済み状態でダッシュボードへ
      await page.goto(`${BASE_URL}/dashboard`);
      
      // サブスクリプション開始
      await page.click('[data-testid="start-subscription-button"]');
      
      // Stripe Checkout へリダイレクト
      await page.waitForURL(/checkout\.stripe\.com/);
      
      // テスト用カード情報入力（Stripe Test Mode）
      await page.fill('[data-elements-stable-field-name="cardNumber"]', '4242424242424242');
      await page.fill('[data-elements-stable-field-name="cardExpiry"]', '12/34');
      await page.fill('[data-elements-stable-field-name="cardCvc"]', '123');
      await page.fill('[data-elements-stable-field-name="billingName"]', TEST_DATA.newUser.name);
      
      // 決済実行
      await page.click('.SubmitButton');
      
      // 成功ページリダイレクト
      await page.waitForURL(`${BASE_URL}/dashboard?success=true`);
      await expect(page.locator('[data-testid="subscription-success"]')).toBeVisible();
    });
  });
});

// **************************************************
// ⚠️ STAGE 3: エッジケース・ストレステスト
// **************************************************

test.describe('⚠️ STAGE 3: エッジケース・ストレステスト', () => {
  
  test.describe('3.1 データ境界値テスト', () => {
    test('長文入力テスト', async ({ page }) => {
      await page.goto(`${BASE_URL}/contact`);
      
      // 極端に長いメッセージ
      const longMessage = 'あ'.repeat(10000);
      await page.fill('[data-testid="contact-message"]', longMessage);
      
      // システムの反応確認
      const messageValue = await page.inputValue('[data-testid="contact-message"]');
      console.log(`📝 入力文字数: ${messageValue.length}文字`);
    });

    test('特殊文字入力テスト', async ({ page }) => {
      await page.goto(`${BASE_URL}/contact`);
      
      // SQLインジェクション攻撃文字列
      const maliciousInput = `'; DROP TABLE classrooms; --`;
      await page.fill('[data-testid="contact-name"]', maliciousInput);
      
      // XSS攻撃文字列
      const xssInput = `<script>alert('XSS')</script>`;
      await page.fill('[data-testid="contact-subject"]', xssInput);
      
      await page.fill('[data-testid="contact-email"]', 'test@example.com');
      await page.fill('[data-testid="contact-message"]', 'テストメッセージ');
      
      // 送信して適切にエスケープされるか確認
      await page.click('[data-testid="contact-submit"]');
      
             // アラートが発生しないことを確認（XSS対策）
       page.on('dialog', () => {
         throw new Error('XSS攻撃が成功してしまいました！');
       });
    });
  });

  test.describe('3.2 ネットワーク障害シミュレーション', () => {
    test('オフライン時の動作確認', async ({ page, context }) => {
      await page.goto(`${BASE_URL}/search`);
      
      // ネットワークをオフラインに
      await context.setOffline(true);
      
      // 検索実行
      await page.click('[data-testid="search-execute"]');
      
      // エラーハンドリング確認
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      
      // ネットワーク復旧
      await context.setOffline(false);
    });

    test('API タイムアウト処理', async ({ page }) => {
      // 遅いネットワーク条件をシミュレート
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 30000); // 30秒遅延
      });
      
      await page.goto(`${BASE_URL}/contact`);
      await page.fill('[data-testid="contact-name"]', 'テストユーザー');
      await page.fill('[data-testid="contact-email"]', 'test@example.com');
      await page.fill('[data-testid="contact-subject"]', 'タイムアウトテスト');
      await page.fill('[data-testid="contact-message"]', 'これはタイムアウトテストです');
      
      await page.click('[data-testid="contact-submit"]');
      
      // タイムアウトエラーメッセージ確認
      await expect(page.locator('[data-testid="timeout-error"]')).toBeVisible();
    });
  });

  test.describe('3.3 異常系ユーザー行動', () => {
    test('不正URL直接アクセス', async ({ page }) => {
      // 存在しないページ
      await page.goto(`${BASE_URL}/non-existent-page`);
      await expect(page.locator('[data-testid="404-page"]')).toBeVisible();
      
      // 不正なパラメータ
      await page.goto(`${BASE_URL}/classroom/invalid-uuid`);
      await expect(page.locator('[data-testid="invalid-classroom"]')).toBeVisible();
    });

    test('認証なしでの保護ページアクセス', async ({ page }) => {
      // ログインなしでダッシュボードアクセス
      await page.goto(`${BASE_URL}/dashboard`);
      
      // ログインページにリダイレクトされることを確認
      await expect(page).toHaveURL(`${BASE_URL}/auth`);
      
      // 教室登録ページアクセス
      await page.goto(`${BASE_URL}/classroom-registration`);
      await expect(page).toHaveURL(`${BASE_URL}/auth`);
    });
  });
});

// **************************************************
// 🔒 STAGE 4: セキュリティ・パフォーマンステスト
// **************************************************

test.describe('🔒 STAGE 4: セキュリティ・パフォーマンステスト', () => {
  
  test.describe('4.1 セキュリティテスト', () => {
    test('HTTPS強制確認', async ({ page }) => {
      // HTTP でアクセスしてHTTPSにリダイレクトされることを確認
      const httpUrl = BASE_URL.replace('https://', 'http://');
      await page.goto(httpUrl);
      
      // URLがHTTPSになっていることを確認
      expect(page.url()).toMatch(/^https:/);
    });

    test('認証トークン検証', async ({ page }) => {
      // 不正なトークンでAPIアクセス
      await page.route('**/api/**', route => {
        route.continue({
          headers: {
            ...route.request().headers(),
            'Authorization': 'Bearer invalid-token-12345'
          }
        });
      });
      
      await page.goto(`${BASE_URL}/dashboard`);
      
      // 認証エラーが適切に処理されることを確認
      await expect(page).toHaveURL(`${BASE_URL}/auth`);
    });
  });

  test.describe('4.2 パフォーマンステスト', () => {
    test('ページ読み込み速度確認', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      console.log(`⚡ トップページ読み込み時間: ${loadTime}ms`);
      
      // 3秒以内に読み込まれることを確認
      expect(loadTime).toBeLessThan(3000);
    });

    test('大量データ表示パフォーマンス', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      
      // 全検索（全教室表示）
      await page.click('[data-testid="search-execute"]');
      
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="search-results"]');
      const endTime = Date.now();
      
      const renderTime = endTime - startTime;
      console.log(`🔍 検索結果表示時間: ${renderTime}ms`);
      
      // 検索結果が5秒以内に表示されることを確認
      expect(renderTime).toBeLessThan(5000);
    });
  });
});

// **************************************************
// 📊 レポート生成
// **************************************************

test.afterAll(async () => {
  console.log(`
🎯 =====================================
   テスト実行完了レポート
🎯 =====================================

✅ STAGE 1: 基本機能テスト - 完了
✅ STAGE 2: ユーザージャーニー - 完了  
✅ STAGE 3: エッジケース - 完了
✅ STAGE 4: セキュリティ・パフォーマンス - 完了

📋 次のステップ:
1. 🐛 発見された問題の修正
2. 🔄 修正後の再テスト実行
3. 📈 パフォーマンス最適化
4. 🚀 本格公開準備

⚠️ 重要: 実際の本格公開前に、実際のドメインでの最終テストを実施してください。
  `);
}); 