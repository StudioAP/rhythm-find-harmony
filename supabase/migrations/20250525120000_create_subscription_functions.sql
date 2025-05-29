-- サブスクリプション状態確認関数を作成
-- ダッシュボードで使用される重要な関数

CREATE OR REPLACE FUNCTION check_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
  has_active_subscription BOOLEAN,
  subscription_end_date TIMESTAMPTZ,
  can_publish BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN s.status = 'active' AND s.current_period_end > NOW() THEN TRUE
      ELSE FALSE
    END as has_active_subscription,
    s.current_period_end as subscription_end_date,
    CASE 
      WHEN s.status = 'active' AND s.current_period_end > NOW() THEN TRUE
      ELSE FALSE
    END as can_publish
  FROM subscriptions s
  WHERE s.user_id = user_uuid
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- サブスクリプションが見つからない場合のデフォルト値
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      FALSE as has_active_subscription,
      NULL::TIMESTAMPTZ as subscription_end_date,
      FALSE as can_publish;
  END IF;
END;
$$;

-- 教室公開可否確認関数を作成
CREATE OR REPLACE FUNCTION can_publish_classroom(classroom_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  classroom_user_id UUID;
  has_active_sub BOOLEAN;
BEGIN
  -- 教室のuser_idを取得
  SELECT user_id INTO classroom_user_id
  FROM classrooms
  WHERE id = classroom_id;
  
  IF classroom_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- サブスクリプション状態を確認
  SELECT has_active_subscription INTO has_active_sub
  FROM check_user_subscription_status(classroom_user_id);
  
  RETURN COALESCE(has_active_sub, FALSE);
END;
$$;

-- 期限切れ教室の自動非公開化関数
CREATE OR REPLACE FUNCTION auto_unpublish_expired_classrooms()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE classrooms 
  SET published = FALSE, updated_at = NOW()
  WHERE published = TRUE
    AND user_id IN (
      SELECT DISTINCT s.user_id
      FROM subscriptions s
      WHERE s.status != 'active' 
         OR s.current_period_end <= NOW()
    );
END;
$$;

-- 関数の実行権限を設定
GRANT EXECUTE ON FUNCTION check_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_publish_classroom(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_unpublish_expired_classrooms() TO service_role; 