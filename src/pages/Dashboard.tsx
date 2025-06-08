import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building, CreditCard, Edit, Eye, EyeOff, LogOut, Settings, Trash, Calendar, RefreshCw, AlertCircle, CheckCircle, Home } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
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
  const { user, loading: authLoading, signOut } = useAuth();
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
    // user === null の場合はまだロード中として扱う
    if (authLoading) {
      return; // ローディング中は何もしない
    }
    
    if (!user) {
      // ローディング完了後にユーザーが null の場合のみリダイレクト
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // URLパラメータをチェックして決済結果を表示
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast({
        title: "決済完了",
        description: "月額プランのお支払いが完了しました",
      });
      // ご契約情報を更新
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
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          if (error.code !== 'PGRST116') {
            console.error('教室情報取得エラー:', error);
            toast({
              title: "エラー",
              description: "教室情報の取得に失敗しました",
              variant: "destructive",
            });
            return;
          }
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
      await signOut();
      
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

    // 月額プランのご契約がない場合は公開できません
    if (!subscription.hasActiveSubscription && !classroom.published) {
      toast({
        title: "公開できません",
        description: "教室を公開するには有効な月額プランのご契約が必要です",
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

  // ローディング中の表示
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>読み込み中...</p>
        </div>
      </div>
      </Layout>
    );
  }

  // 認証されていない場合は何も表示しない（リダイレクト処理中）
  if (!user) {
    return null;
  }
  
  // 掲載状況に応じたバッジを表示
  const getStatusBadge = () => {
    if (!classroom) {
      return <Badge variant="outline" className="text-gray-500 border-gray-400">教室情報：未登録</Badge>;
    }
    if (classroom.published) {
      return <Badge className="bg-green-500 hover:bg-green-600">公開中</Badge>;
    }
    if (classroom.draft_saved && subscription.hasActiveSubscription) {
      return <Badge variant="outline" className="text-blue-600 border-blue-600">下書き（公開可能）</Badge>;
    }
    if (classroom.draft_saved && !subscription.hasActiveSubscription) {
      return <Badge variant="outline" className="text-amber-600 border-amber-600">下書き（要プラン契約）</Badge>;
    }
    // 下書き保存されておらず、公開もされていない (過去に公開していてキャンセルしたなど)
    if (!subscription.hasActiveSubscription) {
        return <Badge variant="outline" className="text-destructive border-destructive">非公開（要プラン契約）</Badge>;
    }
    return <Badge variant="outline" className="text-gray-600 border-gray-600">非公開</Badge>; // 基本は下書きか公開
  };

  // 掲載状況に応じた操作を表示
  const getStatusAction = () => {
    // 教室未登録の場合
    if (!classroom) {
      return (
        <div className="space-y-4 mt-4">
          <Alert data-testid="alert-no-classroom" className="border-blue-500 text-blue-700 bg-blue-50">
            <AlertCircle className="h-4 w-4 mt-1" />
            <AlertDescription>
              あなたの教室情報を登録して、生徒募集を始めましょう。
            </AlertDescription>
          </Alert>
          <Button className="w-full" asChild data-testid="register-classroom-button">
            <Link to="/classroom/register">
              <Edit className="mr-2 h-4 w-4" /> 教室情報を登録する
            </Link>
          </Button>
        </div>
      );
    }

    // 下書き保存済み、月額プラン契約済みの場合 (公開可能)
    if (classroom.draft_saved && !classroom.published && subscription.hasActiveSubscription) {
      return (
        <div className="space-y-4 mt-4">
          <Alert data-testid="alert-draft-can-publish" className="border-green-500 text-green-700 bg-green-50">
            <CheckCircle className="h-4 w-4 mt-1" />
            <AlertDescription>
              教室情報は下書き保存されています。準備ができたら公開しましょう。
            </AlertDescription>
          </Alert>
          <Button className="w-full" onClick={togglePublished} data-testid="publish-classroom-button">
            <Eye className="mr-2 h-4 w-4" /> 教室を公開する
          </Button>
        </div>
      );
    }

    // 下書き保存済み、月額プラン未契約の場合
    if (classroom.draft_saved && !subscription.hasActiveSubscription) {
      return (
        <div className="space-y-4 mt-4">
          <Alert data-testid="alert-draft-needs-plan" className="border-amber-500 text-amber-700 bg-amber-50">
            <AlertCircle className="h-4 w-4 mt-1" />
            <AlertDescription>
              教室情報は下書き保存されています。公開するには月額プランのご契約が必要です。
            </AlertDescription>
          </Alert>
          <Button className="w-full" onClick={handleSubscription} data-testid="start-plan-for-draft-button">
            <CreditCard className="mr-2 h-4 w-4" /> 月額プランを見てみる
          </Button>
        </div>
      );
    }

    // 公開中の場合
    if (classroom.published && subscription.hasActiveSubscription) {
      return (
        <div className="space-y-4 mt-4">
          <Alert data-testid="alert-published" className="border-green-500 text-green-700 bg-green-50">
            <CheckCircle className="h-4 w-4 mt-1" />
            <AlertDescription>
              教室は現在公開中です。生徒さんからの連絡があるかもしれません。
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="w-full" onClick={togglePublished} data-testid="unpublish-classroom-button">
            <EyeOff className="mr-2 h-4 w-4" /> 一時的に非公開にする
            </Button>
        </div>
      );
    }

    // 非公開（過去に公開していたがプラン切れなどで非公開になった）
    if (!classroom.published && !subscription.hasActiveSubscription && classroom.id) { // classroom.id で一度は登録されたことを確認
    return (
        <div className="space-y-4 mt-4">
          <Alert data-testid="alert-unpublished-needs-plan" className="border-destructive text-destructive-700 bg-destructive-50">
            <AlertCircle className="h-4 w-4 mt-1" />
            <AlertDescription>
              教室は現在非公開です。再度公開するには月額プランのご契約が必要です。
            </AlertDescription>
          </Alert>
          <Button className="w-full" onClick={handleSubscription} data-testid="restart-plan-button">
            <CreditCard className="mr-2 h-4 w-4" /> 月額プランを再契約する
            </Button>
        </div>
      );
    }

    return null; // その他のケース（基本的には上記で網羅されるはず）
  };

  const ClassroomInfoCard = () => {
    if (authLoading || loading) { // classroomの読み込みも考慮
      return (
        <Card>
          <CardHeader><CardTitle>教室情報</CardTitle></CardHeader>
          <CardContent><p>情報を読み込んでいます...</p></CardContent>
        </Card>
      );
    }
    
    if (!classroom) {
      // getStatusAction が教室未登録時のボタンとメッセージを表示するので、ここではシンプルに
      return (
         <Card data-testid="no-classroom-card-placeholder">
          <CardHeader>
            <CardTitle>教室情報</CardTitle>
            <CardDescription>教室情報を登録して、生徒募集を始めましょう。</CardDescription>
          </CardHeader>
          <CardContent>
             {getStatusAction()} 
          </CardContent>
        </Card>
      );
    }

    return (
      <Card data-testid="classroom-summary-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-2 sm:mb-0">
              <CardTitle className="text-2xl font-bold">{classroom.name}</CardTitle>
              <div className="text-xs text-gray-500 mt-1">
                最終更新: {classroom.updated_at ? new Date(classroom.updated_at).toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
                {getStatusBadge()} 
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-1">教室の紹介</h4>
            <p className="text-sm text-gray-800 truncate_description" title={classroom.description}>{classroom.description || '未設定'}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-1">活動エリア</h4>
            <p className="text-sm text-gray-800">{classroom.area || '未設定'}</p>
        </div>
          {classroom.last_draft_saved_at && !classroom.published && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-1">最終下書き保存日時</h4>
              <p className="text-sm text-gray-800">{new Date(classroom.last_draft_saved_at).toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
          )}
          {getStatusAction()} 
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to={`/classroom/register`}>
              <Edit className="mr-2 h-4 w-4" /> 教室情報を編集する
            </Link>
          </Button>
          <Button variant="ghost" asChild className="w-full sm:w-auto text-primary hover:bg-primary/10" disabled={!classroom.published && !classroom.draft_saved}>
            <Link to={`/classroom/${classroom.id}`} target="_blank" rel="noopener noreferrer">
              <Eye className="mr-2 h-4 w-4" /> プレビュー
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <Layout title="教室管理画面">
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
            <CardTitle className="text-xl">掲載準備状況</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="mb-4">
              {!classroom ? <Badge variant="outline" className="text-gray-500 border-gray-400">教室情報：未登録</Badge> : getStatusBadge()}
            </div>
            {getStatusAction()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">ご契約プラン</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-end space-x-2">
              <span className="text-3xl font-bold">
                {subscription.hasActiveSubscription ? '月額500円' : '現在プラン未契約です'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {subscription.hasActiveSubscription ? '契約中' : '教室を公開するにはプラン契約が必要です。'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">あなたの教室</CardTitle>
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
                まだ教室情報が登録されていません。上の「掲載準備状況」から登録を開始してください。
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="classroom" className="flex items-center">
            <Home className="mr-2 h-4 w-4" /> 教室情報
          </TabsTrigger>
          <TabsTrigger value="plan-details" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" /> ご契約情報
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" /> アカウント設定
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classroom">
          <Card>
            <CardHeader>
              <CardTitle>教室情報の編集・公開設定</CardTitle>
              <CardDescription>
                登録済みの教室情報を編集したり、検索結果への公開・非公開を設定したりできます。
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
                      <h3 className="font-semibold">現在の掲載状況</h3>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">教室情報がまだ登録されていません。</h3>
                  <Button className="mt-4" asChild>
                    <Link to="/classroom/register">
                      <Edit className="mr-2 h-4 w-4" />
                      教室情報を登録する（無料ではじめる）
                    </Link>
                  </Button>
                </div>
              )}
              </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan-details">
          <Card data-testid="subscription-card">
            <CardHeader>
              <CardTitle>決済・ご契約情報</CardTitle>
              <CardDescription>
                月額プランの状況確認やお手続きはこちらで行えます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                  <div>
                <h3 className="text-lg font-semibold mb-2">現在のプラン状況</h3>
                <div className="space-y-1">
                  <p>契約状態: <Badge variant={subscription.hasActiveSubscription ? "default" : "outline"} className={subscription.hasActiveSubscription ? "bg-green-500 hover:bg-green-600" : "border-destructive text-destructive"}>{subscription.hasActiveSubscription ? '有効' : '未契約'}</Badge></p>
                  {subscription.subscriptionEndDate && (
                    <p>
                      次回更新日: {new Date(subscription.subscriptionEndDate).toLocaleDateString('ja-JP')}
                    </p>
                  )}
                  <p>料金: 月額500円</p>
                </div>
              </div>

                  {!subscription.hasActiveSubscription ? (
                <div className="border p-4 rounded-md bg-yellow-50 border-yellow-300">
                   <h4 className="font-semibold text-yellow-800 mb-2">月額プラン未契約</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    教室を公開し続けるには、月額プランのご契約が必要です。
                  </p>
                  <Button 
                    onClick={() => handleSubscription()} 
                    disabled={subscriptionLoading}
                    data-testid="start-plan-button-in-card"
                  >
                    {refreshing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    月額プランを開始する
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={openCustomerPortal} 
                    disabled={subscriptionLoading || refreshing}
                    className="w-full md:w-auto"
                    data-testid="manage-plan-button"
                  >
                    {refreshing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    ご契約内容の確認・変更 (外部サイト)
                  </Button>
                  <p className="text-xs text-gray-500">Stripe社の安全なページに移動します。</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:items-center">
              <Button 
                variant="ghost" 
                onClick={refreshSubscriptionStatus} 
                disabled={subscriptionLoading || refreshing}
                className="text-sm"
                data-testid="refresh-plan-status-button"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                最新の契約情報を取得
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card data-testid="account-settings-card">
            {/* アカウント設定コンテンツ */}
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Dashboard;
