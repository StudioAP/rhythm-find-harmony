// 本番品質型定義: Classroom & Subscription
// ABEさんの信念に基づく妥協なしの実装

/**
 * Supabaseのsubscriptionsテーブルの厳密な型定義
 */
export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  stripe_payment_intent_id?: string;
  plan_type?: string;
  amount?: number;
  currency?: string;
  trial_end?: string | null;
  canceled_at?: string | null;
}

/**
 * クエリ用の軽量Subscription型（ビジネスロジックに必要な情報のみ）
 */
export interface SubscriptionStatus {
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_end: string;
}

/**
 * 基本的なClassroomインターフェース（下書き機能拡張）
 */
export interface Classroom {
  id: string;
  name: string;
  description: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  thumbnail_url: string | null;
  lesson_types: string[] | null;
  age_range: string | null;
  monthly_fee_min: number | null;
  monthly_fee_max: number | null;
  trial_lesson_available: boolean | null;
  parking_available: boolean | null;
  published: boolean | null;
  draft_saved: boolean | null; // 下書き保存フラグ（無料機能）
  last_draft_saved_at: string | null; // 最後の下書き保存日時
  instructor_info: string | null; // 講師紹介
  pr_points: string | null; // PRポイント
  available_days: string[] | null; // レッスン可能曜日
  available_times: string | null; // レッスン時間帯
  price_range: string | null; // 料金目安
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Supabaseクエリ結果: Classroomとrelationshipを含む型
 */
export interface ClassroomWithSubscriptions extends Classroom {
  subscriptions: SubscriptionStatus[] | null;
}

/**
 * 本番ビジネスロジック: サブスクリプション有効性判定
 */
export const isValidSubscription = (subscription: SubscriptionStatus): boolean => {
  const now = new Date();
  const periodEnd = new Date(subscription.current_period_end);
  
  return subscription.status === 'active' && periodEnd > now;
};

/**
 * 本番ビジネスロジック: 教室表示可否判定（妥協なし）
 */
export const shouldShowClassroom = (classroom: ClassroomWithSubscriptions): boolean => {
  // 必須条件1: published = true
  if (!classroom.published) return false;
  
  // 必須条件2: 有効なサブスクリプション存在（本番では絶対必須）
  if (!classroom.subscriptions || classroom.subscriptions.length === 0) {
    return false; // 妥協なし: サブスクリプションなし = 非表示
  }
  
  // 必須条件3: 少なくとも1つの有効なサブスクリプションが必要
  return classroom.subscriptions.some(isValidSubscription);
};

/**
 * 本番品質エラーメッセージ定義
 */
export const SUBSCRIPTION_ERROR_MESSAGES = {
  NO_SUBSCRIPTION: 'この機能を利用するには有料プランの契約が必要です。',
  EXPIRED_SUBSCRIPTION: 'サブスクリプションの有効期限が切れています。有料プランを更新してください。',
  INACTIVE_SUBSCRIPTION: 'サブスクリプションがアクティブではありません。サポートまでお問い合わせください。',
  GENERAL_ERROR: '教室情報の取得に失敗しました。しばらく時間をおいて再度お試しください。'
} as const;

/**
 * 検索フィルター型定義
 */
export interface ClassroomFilters {
  area?: string;
  keyword?: string;
  ageGroups?: string[];
  features?: string[];
}

/**
 * Hook戻り値型定義
 */
export interface UseClassroomsReturn {
  classrooms: ClassroomWithSubscriptions[];
  loading: boolean;
  error: string | null;
  fetchPublishedClassrooms: (filters?: ClassroomFilters) => Promise<void>;
  getClassroomById: (id: string) => Promise<ClassroomWithSubscriptions | null>;
  getClassroomByIdForPreview: (id: string, currentUserId?: string) => Promise<ClassroomWithSubscriptions | null>;
} 