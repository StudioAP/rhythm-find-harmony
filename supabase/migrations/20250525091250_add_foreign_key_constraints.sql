-- 外部キー制約を追加してリレーションシップを確立
-- これにより、useClassrooms.tsxのJOINエラーが解決されます

-- 1. classroomsテーブルのuser_idカラムにauth.usersへの外部キー制約を追加
ALTER TABLE public.classrooms 
ADD CONSTRAINT fk_classrooms_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 2. subscriptionsテーブルのuser_idカラムにauth.usersへの外部キー制約を追加
ALTER TABLE public.subscriptions 
ADD CONSTRAINT fk_subscriptions_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 3. インデックスを追加してクエリパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_classrooms_user_id ON public.classrooms(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- 4. RLSポリシーが正しく設定されているか確認するためのコメント
-- classroomsテーブルのRLSポリシー:
-- - ユーザーは自分の教室のみ操作可能
-- - 公開された教室は全員が閲覧可能

-- subscriptionsテーブルのRLSポリシー:
-- - ユーザーは自分のサブスクリプションのみ操作可能
