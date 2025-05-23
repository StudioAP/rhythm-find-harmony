
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Globe, Music, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

// 仮のデータ（後でSupabaseから取得）
const DUMMY_CLASSROOM = {
  id: "1",
  name: "ヤマハ音楽教室 新宿校",
  description: "ピアノとリトミックのクラスを提供する歴史ある音楽教室です。初心者から上級者まで、年齢に関係なく音楽を学べる環境を整えています。定期的な発表会やイベントも開催しており、生徒同士の交流も深められます。",
  area: "東京都新宿区西新宿1-2-3",
  phone: "03-1234-5678",
  email: "info@yamaha-shinjuku.example.com",
  website: "https://www.yamaha-shinjuku.example.com",
  features: ["子供向け", "大人向け", "初心者歓迎", "発表会あり", "駅から徒歩5分"],
  images: [
    "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1520619845716-7d3f9f21a48d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1552422535-c45813c61732?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  ],
  courses: [
    {
      id: "c1",
      name: "子供のためのピアノ入門",
      target: "4歳〜小学生",
      price: "月額8,000円〜",
      description: "楽しく音楽の基礎を学びながらピアノの技術を身につけます。"
    },
    {
      id: "c2",
      name: "大人のピアノレッスン",
      target: "高校生以上",
      price: "月額10,000円〜",
      description: "初心者から経験者まで、それぞれのペースとレベルに合わせたレッスンを提供します。"
    },
    {
      id: "c3",
      name: "幼児リトミッククラス",
      target: "2歳〜6歳",
      price: "月額6,000円〜",
      description: "音楽に合わせて体を動かし、リズム感と表現力を育みます。"
    }
  ],
  instructors: [
    {
      id: "i1",
      name: "山田花子",
      profile: "東京音楽大学卒業。25年以上のピアノ指導経験を持ち、多くの生徒をコンクール入賞へと導いています。"
    },
    {
      id: "i2",
      name: "佐藤太郎",
      profile: "国立音楽大学卒業。リトミック指導の専門家として、幼児教育に力を入れています。"
    }
  ]
};

const ClassroomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  // 本来はidを使ってSupabaseから教室データを取得
  const classroom = DUMMY_CLASSROOM;
  
  const nextImage = () => {
    setCurrentImageIndex(prev => 
      prev === classroom.images.length - 1 ? 0 : prev + 1
    );
  };
  
  const prevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? classroom.images.length - 1 : prev - 1
    );
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("問い合わせ内容:", contactForm);
    // 実際にはSupabaseに保存し、メール通知などを実装
    alert("お問い合わせを送信しました。教室からの返信をお待ちください。");
    setContactForm({
      name: "",
      email: "",
      phone: "",
      message: ""
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary">Piano Search</Link>
          <div className="space-x-2">
            <Button variant="outline" asChild>
              <Link to="/login">ログイン</Link>
            </Button>
            <Button asChild>
              <Link to="/register">教室を掲載する</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/search" className="text-primary hover:underline inline-flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            検索結果に戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {/* 画像スライダー */}
          <div className="relative h-64 sm:h-80 md:h-96">
            <img
              src={classroom.images[currentImageIndex]}
              alt={`${classroom.name} - 画像 ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* ナビゲーションボタン */}
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={prevImage}
                className="rounded-full bg-white/80 hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={nextImage}
                className="rounded-full bg-white/80 hover:bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 画像インジケーター */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {classroom.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-6">
            <h1 className="text-3xl font-bold mb-2">{classroom.name}</h1>
            
            {/* 特徴タグ */}
            <div className="flex flex-wrap gap-2 mb-4">
              {classroom.features.map(feature => (
                <span 
                  key={feature} 
                  className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
            
            {/* 基本情報 */}
            <div className="space-y-2 mb-6">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <span>{classroom.area}</span>
              </div>
              {classroom.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-500 mr-2" />
                  <a href={`tel:${classroom.phone}`} className="text-primary hover:underline">{classroom.phone}</a>
                </div>
              )}
              {classroom.email && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-500 mr-2" />
                  <a href={`mailto:${classroom.email}`} className="text-primary hover:underline">{classroom.email}</a>
                </div>
              )}
              {classroom.website && (
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-gray-500 mr-2" />
                  <a href={classroom.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{classroom.website}</a>
                </div>
              )}
            </div>
            
            {/* 説明 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3">教室について</h2>
              <p className="text-gray-700 whitespace-pre-line">{classroom.description}</p>
            </div>
            
            {/* レッスンコース */}
            {classroom.courses && classroom.courses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">レッスンコース</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {classroom.courses.map(course => (
                    <Card key={course.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 text-sm mb-2">
                          <div><span className="font-medium">対象:</span> {course.target}</div>
                          <div><span className="font-medium">料金:</span> {course.price}</div>
                        </div>
                        <p className="text-gray-600 text-sm">{course.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* 講師紹介 */}
            {classroom.instructors && classroom.instructors.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">講師紹介</h2>
                <div className="space-y-4">
                  {classroom.instructors.map(instructor => (
                    <div key={instructor.id} className="p-4 bg-gray-50 rounded-md">
                      <h3 className="font-semibold mb-1">{instructor.name}</h3>
                      <p className="text-gray-700 text-sm">{instructor.profile}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 問い合わせフォーム */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">この教室に問い合わせる</h2>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">お名前 <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={contactForm.name}
                  onChange={handleContactChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={handleContactChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号（任意）</Label>
              <Input
                id="phone"
                name="phone"
                value={contactForm.phone}
                onChange={handleContactChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">お問い合わせ内容 <span className="text-red-500">*</span></Label>
              <Textarea
                id="message"
                name="message"
                rows={5}
                required
                value={contactForm.message}
                onChange={handleContactChange}
                placeholder="レッスンの空き状況や料金について、体験レッスンの希望など詳しくお書きください。"
              />
            </div>
            <Button type="submit" className="w-full md:w-auto">送信する</Button>
            <p className="text-xs text-gray-500 mt-2">
              ※送信された内容は教室運営者に直接届きます。回答までお時間をいただく場合があります。
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClassroomDetail;
