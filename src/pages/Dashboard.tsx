
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building, CreditCard, Edit, Eye, EyeOff, LogOut, Settings, Trash } from "lucide-react";

// ダミーデータ
const DUMMY_CLASSROOM = {
  id: "1",
  name: "ヤマハ音楽教室 新宿校",
  area: "東京都新宿区",
  description: "ピアノとリトミックのクラスを提供する歴史ある音楽教室です。",
  status: "unpaid", // unpaid, active, suspended
  views: 128,
  image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  publishedAt: null,
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("classroom");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const classroom = DUMMY_CLASSROOM;
  
  // 掲載ステータスに基づいたバッジを表示
  const getStatusBadge = () => {
    switch(classroom.status) {
      case 'active':
        return <Badge className="bg-green-500">掲載中</Badge>;
      case 'unpaid':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">未掲載（掲載費未払い）</Badge>;
      case 'suspended':
        return <Badge variant="destructive">停止中</Badge>;
      default:
        return null;
    }
  };

  // 掲載ステータスに基づいたアクション表示
  const getStatusAction = () => {
    switch(classroom.status) {
      case 'active':
        return (
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-gray-500">
              あなたの教室は現在掲載されています。<br />
              次回の掲載費支払い日: 2025年6月23日
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                掲載費支払い情報を更新する
              </Button>
              <Button variant="outline" size="sm" className="flex items-center text-red-500 hover:text-red-700">
                <EyeOff className="mr-2 h-4 w-4" />
                掲載を停止する
              </Button>
            </div>
          </div>
        );
      case 'unpaid':
        return (
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-gray-500">
              あなたの教室は未掲載です。掲載費のお支払いで公開できます。
            </p>
            <Button className="flex items-center" onClick={() => setPaymentModalOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              掲載費を支払い公開する（月額500円）
            </Button>
          </div>
        );
      case 'suspended':
        return (
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-gray-500">
              あなたの教室の掲載は停止されています。
            </p>
            <Button className="flex items-center" onClick={() => setPaymentModalOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              掲載を再開する
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">教室管理ダッシュボード</h1>
        <Button variant="outline" className="flex items-center">
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
            <CardTitle className="text-xl">閲覧数</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-end space-x-2">
              <span className="text-3xl font-bold">{classroom.views}</span>
              <span className="text-sm text-gray-500 mb-1">表示回数</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              過去30日間の統計
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
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/classrooms/${classroom.id}`} target="_blank">
                      <Eye className="mr-2 h-4 w-4" />
                      プレビュー
                    </Link>
                  </Button>
                  <Button size="sm" className="flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    編集する
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                登録されている教室情報を確認・編集できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1">
                  <img 
                    src={classroom.image} 
                    alt={classroom.name} 
                    className="w-full h-48 object-cover rounded-md" 
                  />
                </div>
                <div className="col-span-2">
                  <h3 className="text-xl font-bold mb-2">{classroom.name}</h3>
                  <p className="text-muted-foreground mb-2">{classroom.area}</p>
                  <p className="mb-4">{classroom.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>最終更新日: 2025年5月15日</span>
                  </div>
                </div>
              </div>
            </CardContent>
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
                アカウント情報やパスワードなどの設定を変更できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">メールアドレス</label>
                    <div>example@example.com</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">名前</label>
                    <div>山田 太郎</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">掲載費支払い設定</h3>
                <div>
                  <label className="text-sm text-gray-500">支払い方法</label>
                  <div className="flex items-center">
                    <div className="mr-2">クレジットカード（**** **** **** 4242）</div>
                    <Button variant="ghost" size="sm">変更する</Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">アカウントセキュリティ</h3>
                <Button variant="outline">パスワードを変更する</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-red-500">危険な操作</CardTitle>
              <CardDescription>
                これらの操作は元に戻すことができません
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div>
                  <Button variant="destructive" className="flex items-center">
                    <Trash className="mr-2 h-4 w-4" />
                    教室情報を削除する
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">
                    この操作を行うと、登録されている教室情報がすべて削除されます
                  </p>
                </div>
                <div>
                  <Button variant="destructive" className="flex items-center">
                    <Trash className="mr-2 h-4 w-4" />
                    アカウントを削除する
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">
                    この操作を行うと、アカウントと関連するすべてのデータが削除されます
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 支払いダイアログはここに実装 */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">掲載費のお支払い</h2>
            <p className="mb-4">
              月額500円の掲載費のお支払いで、あなたの教室情報を公開します。
              キャンセルはいつでも可能です。
            </p>
            <div className="space-y-4">
              <Button className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                クレジットカードで支払う
              </Button>
              <Button variant="outline" onClick={() => setPaymentModalOpen(false)} className="w-full">
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
