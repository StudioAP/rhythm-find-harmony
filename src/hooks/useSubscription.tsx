
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

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
  const [refreshing, setRefreshing] = useState(false);

  const checkSubscriptionStatus = async (showToast = false) => {
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

    const wasRefreshing = refreshing;
    if (!wasRefreshing) {
      setRefreshing(true);
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
        .maybeSingle();

      const newSubscription = {
        hasActiveSubscription: result.has_active_subscription,
        subscriptionEndDate: result.subscription_end_date,
        canPublish: result.can_publish,
        planType: subscriptionData?.plan_type || null,
      };

      setSubscription(newSubscription);

      if (showToast) {
        toast({
          title: "更新完了",
          description: "サブスクリプション状態を更新しました",
        });
      }
    } catch (error) {
      console.error('サブスクリプション状態の確認エラー:', error);
      
      if (showToast) {
        toast({
          title: "エラー",
          description: "サブスクリプション状態の更新に失敗しました",
          variant: "destructive",
        });
      }
      
      setSubscription({
        hasActiveSubscription: false,
        subscriptionEndDate: null,
        canPublish: false,
        planType: null,
      });
    } finally {
      setLoading(false);
      if (!wasRefreshing) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  const createCheckoutSession = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      toast({
        title: "エラー",
        description: "ログインが必要です",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan }
      });

      if (error) throw error;

      // 新しいタブでStripe Checkoutを開く
      window.open(data.url, '_blank');
      
      toast({
        title: "決済ページを開きました",
        description: "新しいタブで決済を完了してください",
      });
    } catch (error) {
      console.error('決済セッション作成エラー:', error);
      toast({
        title: "エラー",
        description: "決済処理の開始に失敗しました",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast({
        title: "エラー",
        description: "ログインが必要です",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      // 新しいタブでCustomer Portalを開く
      window.open(data.url, '_blank');
      
      toast({
        title: "決済管理ページを開きました",
        description: "新しいタブで決済情報を管理できます",
      });
    } catch (error) {
      console.error('Customer Portal作成エラー:', error);
      toast({
        title: "エラー",
        description: "決済管理ページの表示に失敗しました",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscriptionStatus = () => {
    checkSubscriptionStatus(true);
  };

  return {
    subscription,
    loading,
    refreshing,
    checkSubscriptionStatus,
    refreshSubscriptionStatus,
    createCheckoutSession,
    openCustomerPortal,
  };
};
