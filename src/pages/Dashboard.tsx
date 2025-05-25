
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Building, CreditCard, Edit, Eye, EyeOff, LogOut, Settings, Trash, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Classroom {
  id: string;
  name: string;
  area: string;
  description: string;
  published: boolean;
  image_url: string;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("classroom");
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { subscription, createCheckoutSession, openCustomerPortal, checkSubscriptionStatus } = useSubscription();
  const navigate = useNavigate();

  // ログインチェック
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // 教室情報取得
  useEffect(() => {
    const fetchClassroom = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setClassroom(data);
      } catch (error) {
        console.error('教室情報取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "エラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      });
    } else {
      toast({
        title: "ログアウト完了",
        description: "ログアウトしました",
      });
      navigate("/auth");
    }
  };

  const handleSubscription = async (plan: 'monthly' | 'yearly') => {
    try {
      await createCheckoutSession(plan);
    } catch (error) {
      toast({
        title: "エラー",
        description: "決済処理の開始に失敗しました",
        variant: "destructive",
      });
    }
  };

  const togglePublished = async () => {
    if (!classroom) return;

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
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "公開状態の更新に失敗しました",
        variant: "destructive",
      });
    }
  };

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未ログインの場合は何も表示しない（リダイレクト処理中）
  if (!user) {
    return null;
  }
  
  // 掲載ステータスに基づいたバッジを表示
  const getStatusBadge = () => {
    if (!subscription.hasActiveSubscription) {
      return <Badge variant="outline" className="text-amber-500 border-amber-500">未決済</Badge>;
    }
    if (classroom?.published) {
      return <Badge className="bg-green-500">公開中</Badge>;
    }
    return <Badge variant="outline">非公開</Badge>;
  };

  // 掲載ステータスに基づいたアクション表示
  const getStatusAction = () => {
    if (!subscription.hasActiveSubscription) {
      return (
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-gray-500">
            教室を公開するには掲載費のお支払いが必要です。
          </p>
          <div className="space-y-2">
            <Button 
              className="flex items-center w-full" 
              onClick={() => handleSubscription('monthly')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              月額プラン（500円/月）で始める
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center w-full" 
              onClick={() => handleSubscription('yearly')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              年額プラン（5,000円/年）で始める
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-2">
        <p className="text-sm text-gray-500">
          {subscription.subscriptionEndDate && (
            <>次回更新日: {new Date(subscription.subscriptionEndDate).toLocaleDateString('ja-JP')}</>
          )}
        </p>
        <div className="flex space-x-2">
          {classroom && (
            <Button 
              variant={classroom.published ? "outline" : "default"}
              size="sm" 
              className="flex items-center"
              onClick={togglePublished}
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
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center" 
            onClick={openCustomerPortal}
          >
            <Settings className="mr-2 h-4 w-4" />
            決済管理
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">教室管理ダッシュボード</h1>
        <Button variant="outline" className="flex items-center" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
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
                {subscription.planType === 'yearly' ? '年額' : subscription.planType === 'monthly' ? '月額' : '未契約'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {subscription.hasActiveSubscription ? '契約中' : '契約なし'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">サポート</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500 mb-4">
              問題やご質問がございましたらお気軽にお問い合わせください。
            </p>
            <Button variant="outline" className="w-full">
              サポートセンターに問い合わせる
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="classroom">教室情報</TabsTrigger>
          <TabsTrigger value="settings">アカウント設定</TabsTrigger>
        </TabsList>

        <TabsContent value="classroom">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  教室詳細
                </div>
                <div className="flex space-x-2">
                  {classroom && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/classrooms/${classroom.id}`} target="_blank">
                        <Eye className="mr-2 h-4 w-4" />
                        プレビュー
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" asChild>
                    <Link to="/classroom/register">
                      <Edit className="mr-2 h-4 w-4" />
                      {classroom ? '編集する' : '教室を登録する'}
                    </Link>
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {classroom ? '登録されている教室情報を確認・編集できます' : '教室情報を登録してください'}
              </CardDescription>
            </CardHeader>
            {classroom && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1">
                    {classroom.image_url && (
                      <img 
                        src={classroom.image_url} 
                        alt={classroom.name} 
                        className="w-full h-48 object-cover rounded-md" 
                      />
                    )}
                  </div>
                  <div className="col-span-2">
                    <h3 className="text-xl font-bold mb-2">{classroom.name}</h3>
                    <p className="text-muted-foreground mb-2">{classroom.area}</p>
                    <p className="mb-4">{classroom.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>最終更新日: {new Date(classroom.updated_at).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                アカウント設定
              </CardTitle>
              <CardDescription>
                アカウント情報や決済設定を管理できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">メールアドレス</label>
                    <div>{user.email}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">決済設定</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="flex items-center"
                    onClick={openCustomerPortal}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    決済情報を管理する
                  </Button>
                  <p className="text-sm text-gray-500">
                    Stripeの決済管理画面で支払い方法の変更や履歴確認ができます
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
