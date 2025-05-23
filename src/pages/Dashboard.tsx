
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  School, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  Plus, 
  Edit, 
  Eye, 
  EyeOff,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

// モックデータ（実際にはSupabaseから取得）
const mockClassrooms = [
  {
    id: "cls1",
    name: "さくらピアノ教室",
    status: "published", // published, draft, pending
    address: "東京都渋谷区〇〇1-2-3",
    inquiryCount: 5,
    createdAt: "2023-05-15",
    lastUpdated: "2023-06-10",
    mainImage: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=2670&auto=format&fit=crop"
  },
  {
    id: "cls2",
    name: "みどりリトミック教室",
    status: "draft",
    address: "東京都新宿区〇〇4-5-6",
    inquiryCount: 0,
    createdAt: "2023-06-20",
    lastUpdated: "2023-06-20",
    mainImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2670&auto=format&fit=crop"
  }
];

const mockInquiries = [
  {
    id: "inq1",
    classroomId: "cls1",
    classroomName: "さくらピアノ教室",
    senderName: "佐藤 花子",
    senderEmail: "hanako@example.com",
    message: "5歳の子供のためのレッスンについて詳しく知りたいです。初心者でも大丈夫でしょうか？",
    createdAt: "2023-06-15",
    isRead: true
  },
  {
    id: "inq2",
    classroomId: "cls1",
    classroomName: "さくらピアノ教室",
    senderName: "山田 太郎",
    senderEmail: "taro@example.com",
    message: "大人向けのレッスンはありますか？仕事帰りに通える時間帯を教えていただけますか？",
    createdAt: "2023-06-18",
    isRead: false
  },
  {
    id: "inq3",
    classroomId: "cls1",
    classroomName: "さくらピアノ教室",
    senderName: "鈴木 一郎",
    senderEmail: "ichiro@example.com",
    message: "体験レッスンは可能でしょうか？料金と日程の調整方法を教えてください。",
    createdAt: "2023-06-20",
    isRead: false
  }
];

const mockSubscription = {
  status: "active", // active, canceled, past_due
  currentPeriodEnd: "2023-07-20",
  cardInfo: "**** **** **** 4242",
  amount: "500"
};

// ステータスバッジのスタイル定義
const statusStyles = {
  published: "bg-green-100 text-green-800 hover:bg-green-200",
  draft: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  past_due: "bg-red-100 text-red-800 hover:bg-red-200"
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("classrooms");
  const [selectedInquiry, setSelectedInquiry] = useState<string | null>(null);
  
  // ダッシュボードデータの状態（実際にはSupabaseから取得）
  const [classrooms] = useState(mockClassrooms);
  const [inquiries] = useState(mockInquiries);
  const [subscription] = useState(mockSubscription);
  
  // 問い合わせの詳細を表示
  const handleShowInquiryDetail = (id: string) => {
    setSelectedInquiry(id === selectedInquiry ? null : id);
  };
  
  // クラス公開状態の切り替え（モック）
  const handleToggleClassroomStatus = (id: string) => {
    console.log(`教室ID: ${id}の公開状態を切り替えます`);
    // Supabase連携後に実装
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">マイダッシュボード</h1>
          <p className="text-muted-foreground mt-1">教室情報と問い合わせを管理できます</p>
        </div>
        <Link to="/classroom/register">
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            新しい教室を登録
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="classrooms" className="flex items-center gap-2">
            <School size={16} />
            <span className="hidden sm:inline">教室管理</span>
            <span className="sm:hidden">教室</span>
          </TabsTrigger>
          <TabsTrigger value="inquiries" className="flex items-center gap-2">
            <MessageSquare size={16} />
            <span className="hidden sm:inline">問い合わせ</span>
            <span className="sm:hidden">問合せ</span>
            {inquiries.filter(i => !i.isRead).length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {inquiries.filter(i => !i.isRead).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard size={16} />
            <span className="hidden sm:inline">サブスクリプション</span>
            <span className="sm:hidden">支払い</span>
          </TabsTrigger>
        </TabsList>

        {/* 教室管理タブ */}
        <TabsContent value="classrooms">
          {classrooms.length === 0 ? (
            <div className="text-center py-12">
              <School className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">教室が登録されていません</h3>
              <p className="mt-2 text-sm text-muted-foreground mb-4">
                新しい教室を登録して生徒さんとの出会いを広げましょう
              </p>
              <Link to="/classroom/register">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  教室を登録する
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {classrooms.map((classroom) => (
                <Card key={classroom.id}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-1/4 h-48 md:h-auto">
                        <img
                          src={classroom.mainImage}
                          alt={classroom.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6 flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold">{classroom.name}</h3>
                          <Badge className={statusStyles[classroom.status as keyof typeof statusStyles]}>
                            {classroom.status === "published" ? "公開中" : classroom.status === "draft" ? "下書き" : "審査中"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{classroom.address}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <span>登録日: {classroom.createdAt}</span>
                          <span>•</span>
                          <span>最終更新: {classroom.lastUpdated}</span>
                          <span>•</span>
                          <span>問い合わせ: {classroom.inquiryCount}件</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/classrooms/${classroom.id}`}>
                              <Eye size={14} className="mr-1" />
                              プレビュー
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/classroom/edit/${classroom.id}`}>
                              <Edit size={14} className="mr-1" />
                              編集
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleClassroomStatus(classroom.id)}
                          >
                            {classroom.status === "published" ? (
                              <>
                                <EyeOff size={14} className="mr-1" />
                                非公開にする
                              </>
                            ) : (
                              <>
                                <Eye size={14} className="mr-1" />
                                公開する
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 size={14} className="mr-1" />
                            削除
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 問い合わせタブ */}
        <TabsContent value="inquiries">
          {inquiries.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">問い合わせはありません</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                教室が公開されると、ここに問い合わせが表示されます
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {inquiries.map((inquiry) => (
                <Card key={inquiry.id} className={inquiry.isRead ? "" : "border-primary"}>
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {!inquiry.isRead && (
                          <Badge className="bg-primary text-primary-foreground">新着</Badge>
                        )}
                        <CardTitle className="text-base">{inquiry.senderName}さんからの問い合わせ</CardTitle>
                      </div>
                      <CardDescription>{inquiry.createdAt}</CardDescription>
                    </div>
                    <CardDescription>教室: {inquiry.classroomName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-start mb-2">
                      <p className={`line-clamp-2 ${selectedInquiry === inquiry.id ? 'line-clamp-none' : ''}`}>
                        {inquiry.message}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleShowInquiryDetail(inquiry.id)}
                        className="ml-2 shrink-0"
                      >
                        {selectedInquiry === inquiry.id ? "閉じる" : "詳細"}
                      </Button>
                    </div>
                    
                    {selectedInquiry === inquiry.id && (
                      <div className="mt-4 space-y-4">
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium">連絡先情報:</p>
                          <p className="text-sm">メール: {inquiry.senderEmail}</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button className="flex-1" size="sm">
                            メールで返信
                          </Button>
                          <Button variant="outline" size="sm">
                            既読にする
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* サブスクリプションタブ */}
        <TabsContent value="subscription">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>サブスクリプション状況</CardTitle>
                <CardDescription>月額料金のお支払い状況と管理</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">ステータス:</p>
                  <Badge className={
                    subscription.status === "active" 
                      ? "bg-green-100 text-green-800" 
                      : subscription.status === "past_due" 
                        ? "bg-red-100 text-red-800" 
                        : "bg-gray-100 text-gray-800"
                  }>
                    {subscription.status === "active" ? "有効" : subscription.status === "canceled" ? "キャンセル済み" : "支払い失敗"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <p>次回更新日:</p>
                  <p>{subscription.currentPeriodEnd}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <p>支払い方法:</p>
                  <p>{subscription.cardInfo}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <p>料金:</p>
                  <p>{subscription.amount}円/月</p>
                </div>

                {subscription.status === "past_due" && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">お支払いに問題があります</h4>
                      <p className="text-sm text-red-700 mt-1">
                        支払い方法を更新して、教室情報の公開を継続してください。
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <Button className="w-full" disabled={subscription.status !== "active"}>
                    支払い方法を更新
                  </Button>
                  
                  {subscription.status === "active" ? (
                    <Button variant="outline" className="w-full text-destructive">
                      サブスクリプションをキャンセル
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full">
                      サブスクリプションを再開
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>お支払い履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">2023年6月の支払い</p>
                      <p className="text-sm text-muted-foreground">2023/06/20</p>
                    </div>
                    <p>500円</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">2023年5月の支払い</p>
                      <p className="text-sm text-muted-foreground">2023/05/20</p>
                    </div>
                    <p>500円</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
