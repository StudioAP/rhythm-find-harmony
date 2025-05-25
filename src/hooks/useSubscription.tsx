
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionEndDate: string | null;
  canPublish: boolean;
  planType: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    subscriptionEndDate: null,
    canPublish: false,
    planType: null,
  });
  const [loading, setLoading] = useState(true);

  const checkSubscriptionStatus = async () => {
    if (!user) {
      setSubscription({
        hasActiveSubscription: false,
        subscriptionEndDate: null,
        canPublish: false,
        planType: null,
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('check_user_subscription_status', {
        user_uuid: user.id
      });

      if (error) throw error;

      const result = data[0] || {
        has_active_subscription: false,
        subscription_end_date: null,
        can_publish: false
      };

      // サブスクリプション詳細情報も取得
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('plan_type')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setSubscription({
        hasActiveSubscription: result.has_active_subscription,
        subscriptionEndDate: result.subscription_end_date,
        canPublish: result.can_publish,
        planType: subscriptionData?.plan_type || null,
      });
    } catch (error) {
      console.error('サブスクリプション状態の確認エラー:', error);
      setSubscription({
        hasActiveSubscription: false,
        subscriptionEndDate: null,
        canPublish: false,
        planType: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  const createCheckoutSession = async (plan: 'monthly' | 'yearly') => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan }
      });

      if (error) throw error;

      // 新しいタブでStripe Checkoutを開く
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('決済セッション作成エラー:', error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      // 新しいタブでCustomer Portalを開く
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Customer Portal作成エラー:', error);
      throw error;
    }
  };

  return {
    subscription,
    loading,
    checkSubscriptionStatus,
    createCheckoutSession,
    openCustomerPortal,
  };
};
