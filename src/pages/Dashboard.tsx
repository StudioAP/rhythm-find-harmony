import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building, CreditCard, Edit, Eye, EyeOff, LogOut, Settings, Trash, Calendar, RefreshCw, AlertCircle, CheckCircle, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Layout from "@/components/layout/Layout";

interface Classroom {
  id: string;
  name: string;
  area: string;
  description: string;
  published: boolean;
  draft_saved: boolean;
  last_draft_saved_at: string | null;
  image_url: string;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
  image_urls?: string[];
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("classroom");
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { 
    subscription, 
    loading: subscriptionLoading,
    refreshing,
    createCheckoutSession, 
    openCustomerPortal, 
    refreshSubscriptionStatus 
  } = useSubscription();
  const navigate = useNavigate();

  // ログインチェック（認証状態確定後のみ）
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // URLパラメータをチェックして決済結果を表示
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast({
        title: "決済完了",
        description: "サブスクリプションの決済が完了しました",
      });
      // サブスクリプション状態を更新
      setTimeout(() => {
        refreshSubscriptionStatus();
      }, 2000);
      
      // URLパラメータをクリアして無限ループを防ぐ
      navigate('/dashboard', { replace: true });
    } else if (canceled === 'true') {
      toast({
        title: "決済がキャンセルされました",
        description: "決済はキャンセルされました。いつでも再度お試しいただけます。",
        variant: "destructive",
      });
      
      // URLパラメータをクリアして無限ループを防ぐ
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, refreshSubscriptionStatus, navigate]);

  // 教室情報取得
  useEffect(() => {
    const fetchClassroom = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('教室情報取得エラー:', error);
          toast({
            title: "エラー",
            description: "教室情報の取得に失敗しました",
            variant: "destructive",
          });
          return;
        }

        setClassroom(data as unknown as Classroom);
      } catch (error) {
        console.error('教室情報取得エラー:', error);
        toast({
          title: "エラー",
          description: "教室情報の取得に失敗しました",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
  }, [user]);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        throw error;
      }
      
      toast({
        title: "ログアウト完了",
        description: "ログアウトしました",
      });
      navigate("/auth");
    } catch (error) {
      console.error('ログアウトエラー:', error);
      toast({
        title: "エラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleSubscription = async () => {
    try {
      await createCheckoutSession();
    } catch (error) {
      // エラーハンドリングはuseSubscription内で処理済み
    }
  };

  const togglePublished = async () => {
    if (!classroom) return;

    // サブスクリプションがない場合は公開できない
    if (!subscription.hasActiveSubscription && !classroom.published) {
      toast({
        title: "公開できません",
        description: "教室を公開するには有効なサブスクリプションが必要です",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('classrooms')
        .update({ 
          published: !classroom.published,
          updated_at: new Date().toISOString()
        })
        .eq('id', classroom.id);

      if (error) throw error;

      setClassroom(prev => prev ? { ...prev, published: !prev.published } : null);
      
      toast({
        title: "更新完了",
        description: `教室を${!classroom.published ? '公開' : '非公開'}にしました`,
      });
    } catch (error) {
      console.error('公開状態更新エラー:', error);
      toast({
        title: "エラー",
        description: (error as Error).message || "公開状態の更新に失敗しました",
        variant: "destructive",
      });
    }
  };

  // ローディング中
  if (loading || subscriptionLoading) {
    return (
      <Layout showBreadcrumb={false}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 未ログインの場合は何も表示しない（リダイレクト処理中）
  if (!user) {
    return null;
  }
  
  // 掲載ステータスに基づいたバッジを表示
  const getStatusBadge = () => {
    if (!classroom) {
      return <Badge variant="outline" className="text-gray-500 border-gray-400">未登録</Badge>;
    }
    if (classroom.draft_saved && !classroom.published && !subscription.hasActiveSubscription) {
      return <Badge variant="outline" className="text-blue-600 border-blue-600">下書き保存済み</Badge>;
    }
    if (!subscription.hasActiveSubscription) {
      return <Badge variant="outline" className="text-amber-600 border-amber-600">未決済</Badge>;
    }
    if (classroom.published) {
      return <Badge className="bg-green-500 hover:bg-green-600">公開中</Badge>;
    }
    return <Badge variant="outline" className="text-gray-600 border-gray-600">非公開</Badge>;
  };

  // 掲載ステータスに基づいたアクション表示
  const getStatusAction = () => {
    // 教室未登録の場合
    if (!classroom) {
      return (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              まず教室情報を登録してください（無料）
            </AlertDescription>
          </Alert>
          <Button className="w-full" asChild>
            <Link to="/classroom/register">
              教室情報を登録する（無料）
            </Link>
          </Button>
        </div>
      );
    }

    // 下書き保存済み、未決済の場合
    if (classroom.draft_saved && !subscription.hasActiveSubscription) {
      return (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              教室情報は保存済みです。公開には月額500円の決済が必要です。
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Button 
              className="flex items-center w-full" 
              onClick={() => handleSubscription()}
              disabled={subscriptionLoading}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              月額500円で掲載を開始する
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/classroom/register">
                下書きを編集する
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    // サブスクリプションなしの場合
    if (!subscription.hasActiveSubscription) {
      return (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              教室を公開するには掲載費のお支払いが必要です。
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Button 
              className="flex items-center w-full" 
              onClick={() => handleSubscription()}
              disabled={subscriptionLoading}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              月額500円で掲載を開始する
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {subscription.subscriptionEndDate && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              次回更新日: {new Date(subscription.subscriptionEndDate).toLocaleDateString('ja-JP')}
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col space-y-2">
          {classroom && (
            <Button 
              variant={classroom.published ? "outline" : "default"}
              size="sm" 
              className="flex items-center"
              onClick={togglePublished}
              disabled={subscriptionLoading}
            >
              {classroom.published ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  非公開にする
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  公開する
                </>
              )}
            </Button>
          )}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center flex-1" 
              onClick={openCustomerPortal}
              disabled={subscriptionLoading}
            >
              <Settings className="mr-2 h-4 w-4" />
              決済管理
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center" 
              onClick={refreshSubscriptionStatus}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout title="教室管理ダッシュボード">
      <div className="flex justify-end items-center mb-8">
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              ホームに戻る
            </Link>
          </Button>
          <Button variant="outline" className="flex items-center" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">掲載ステータス</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="mb-4">
              {getStatusBadge()}
            </div>
            {getStatusAction()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">プラン情報</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-end space-x-2">
              <span className="text-3xl font-bold">
                {subscription.hasActiveSubscription ? '月額500円' : '未契約'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {subscription.hasActiveSubscription ? '契約中' : '契約なし'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">教室情報</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {classroom ? (
              <div>
                <h3 className="font-semibold text-lg">{classroom.name}</h3>
                <p className="text-sm text-gray-500">{classroom.area}</p>
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm" className="flex items-center" asChild>
                    <Link to="/classroom/register">
                      <Edit className="mr-2 h-4 w-4" />
                      編集
                    </Link>
                  </Button>
                  {classroom.published && (
                    <Button variant="outline" size="sm" className="flex items-center" asChild>
                      <Link to={`/classrooms/${classroom.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        確認
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                教室情報が未登録です
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="classroom" className="flex items-center">
            <Building className="mr-2 h-4 w-4" />
            教室管理
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            決済管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classroom">
          <Card>
            <CardHeader>
              <CardTitle>教室情報管理</CardTitle>
              <CardDescription>
                あなたの教室情報の管理や公開設定を行えます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classroom ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold">教室名</h3>
                      <p className="text-gray-600">{classroom.name}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">エリア</h3>
                      <p className="text-gray-600">{classroom.area}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">教室の説明</h3>
                    <p className="text-gray-600 mt-1">{classroom.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="font-semibold">公開ステータス:</span>
                      <span className="ml-2">{classroom.published ? '公開中' : '非公開'}</span>
                    </div>
                    {getStatusBadge()}
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button className="flex items-center" asChild>
                      <Link to="/classroom/register">
                        <Edit className="mr-2 h-4 w-4" />
                        教室情報を編集
                      </Link>
                    </Button>
                    {classroom.published && (
                      <Button variant="outline" className="flex items-center" asChild>
                        <Link to={`/classrooms/${classroom.id}`} target="_blank">
                          <Eye className="mr-2 h-4 w-4" />
                          公開ページを確認
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">教室情報が未登録です</h3>
                  <p className="text-gray-600 mb-6">まずは教室情報を登録しましょう（無料）</p>
                  <Button className="flex items-center mx-auto" asChild>
                    <Link to="/classroom/register">
                      <Building className="mr-2 h-4 w-4" />
                      教室情報を登録する
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>決済・サブスクリプション管理</CardTitle>
              <CardDescription>
                決済状況の確認や支払い方法の変更を行えます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">契約状況</h3>
                    <p className="text-gray-600">
                      {subscription.hasActiveSubscription ? '有効' : '未契約'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">月額料金</h3>
                    <p className="text-gray-600">500円（税込）</p>
                  </div>
                </div>
                
                {subscription.subscriptionEndDate && (
                  <div>
                    <h3 className="font-semibold">次回更新日</h3>
                    <p className="text-gray-600">
                      {new Date(subscription.subscriptionEndDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-4">
                  {!subscription.hasActiveSubscription ? (
                    <Button 
                      className="flex items-center" 
                      onClick={() => handleSubscription()}
                      disabled={subscriptionLoading}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      サブスクリプションを開始
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="flex items-center" 
                      onClick={openCustomerPortal}
                      disabled={subscriptionLoading}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      決済設定を管理
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="flex items-center" 
                    onClick={refreshSubscriptionStatus}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    ステータスを更新
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Dashboard;
