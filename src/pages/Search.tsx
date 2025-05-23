
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search as SearchIcon, MapPin, Music, Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";

// 仮のデータ（実際の実装ではSupabaseから取得）
const DUMMY_CLASSROOMS = [
  {
    id: "1",
    name: "ヤマハ音楽教室 新宿校",
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    area: "東京都新宿区",
    description: "ピアノとリトミックのクラスを提供する歴史ある音楽教室です",
    features: ["子供向け", "大人向け", "初心者歓迎"]
  },
  {
    id: "2",
    name: "メロディピアノ教室",
    image: "https://images.unsplash.com/photo-1552422535-c45813c61732?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    area: "東京都渋谷区",
    description: "アットホームな雰囲気で、一人ひとりに合わせたレッスンを提供します",
    features: ["子供向け", "リトミック", "発表会あり"]
  },
  {
    id: "3",
    name: "ソナタ音楽教室",
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    area: "東京都世田谷区",
    description: "クラシックから現代音楽まで幅広いジャンルに対応しています",
    features: ["大人向け", "上級者向け", "オンラインレッスン"]
  }
];

const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const ageGroups = [
  { id: "toddler", label: "未就学児" },
  { id: "elementary", label: "小学生" },
  { id: "junior", label: "中学生" },
  { id: "high", label: "高校生" },
  { id: "adult", label: "大人" }
];

const features = [
  { id: "beginner", label: "初心者歓迎" },
  { id: "advanced", label: "上級者向け" },
  { id: "online", label: "オンラインレッスン" },
  { id: "recital", label: "発表会あり" },
  { id: "group", label: "グループレッスン" },
  { id: "individual", label: "個人レッスン" },
  { id: "eurythmics", label: "リトミック" }
];

const Search = () => {
  const [keyword, setKeyword] = useState("");
  const [selectedPrefecture, setSelectedPrefecture] = useState("東京都");
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  const toggleAge = (id: string) => {
    setSelectedAges(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
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
        <h1 className="text-3xl font-bold mb-6">ピアノ教室・リトミック教室を探す</h1>

        {/* 検索フォーム */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="prefecture" className="mb-2 block">エリア</Label>
              <select 
                id="prefecture"
                className="w-full border rounded-md h-10 px-3"
                value={selectedPrefecture}
                onChange={(e) => setSelectedPrefecture(e.target.value)}
              >
                {prefectures.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label htmlFor="keyword" className="mb-2 block">キーワード</Label>
              <div className="relative">
                <Input
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="教室名・最寄り駅など"
                  className="pr-10"
                />
                <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>

          {/* フィルター */}
          <div className="space-y-4">
            {/* 対象年齢 */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">対象年齢</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {ageGroups.map(age => (
                  <div key={age.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`age-${age.id}`}
                      checked={selectedAges.includes(age.id)}
                      onCheckedChange={() => toggleAge(age.id)}
                    />
                    <Label htmlFor={`age-${age.id}`} className="text-sm font-medium cursor-pointer">
                      {age.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 特徴 */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">特徴</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {features.map(feature => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`feature-${feature.id}`}
                      checked={selectedFeatures.includes(feature.id)}
                      onCheckedChange={() => toggleFeature(feature.id)}
                    />
                    <Label htmlFor={`feature-${feature.id}`} className="text-sm font-medium cursor-pointer">
                      {feature.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button className="mt-6 w-full md:w-auto" size="lg">
            <SearchIcon className="mr-2 h-4 w-4" />
            この条件で検索する
          </Button>
        </div>

        {/* 検索結果 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">検索結果</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DUMMY_CLASSROOMS.map((classroom) => (
              <Link to={`/classrooms/${classroom.id}`} key={classroom.id}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img 
                      src={classroom.image} 
                      alt={classroom.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="text-xl font-bold mb-2">{classroom.name}</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{classroom.area}</span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{classroom.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {classroom.features.map(feature => (
                        <span 
                          key={feature} 
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
