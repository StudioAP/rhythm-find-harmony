import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search as SearchIcon, MapPin, Clock, Users, Star, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useClassrooms } from "@/hooks/useClassrooms";
import { AGE_GROUPS, FEATURES, LESSON_TYPES, WEEKDAYS, translateAgeGroup, translateLessonType, translateFeature, translateWeekday, LESSON_TYPES_MAP, AGE_GROUPS_MAP } from "@/constants/classroomData";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";

const prefectures = [
  "", "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

// 翻訳ヘルパー関数
const translateAgeGroup = (ageGroup: string): string => {
  return AGE_GROUPS_MAP[ageGroup] || ageGroup;
};

const translateFeature = (feature: string): string => {
  const featureMap: Record<string, string> = {
    beginner: "初心者歓迎",
    advanced: "上級者向け",
    online: "オンラインレッスン",
    recital: "発表会あり",
    group: "グループレッスン",
    individual: "個人レッスン"
  };
  return featureMap[feature] || feature;
};

const translateWeekday = (day: string): string => {
  return translateDay(day);
};

const Search = () => {
  const [keyword, setKeyword] = useState("");
  const [selectedPrefecture, setSelectedPrefecture] = useState("");
  const [selectedLessonTypes, setSelectedLessonTypes] = useState<string[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [selectedTrialLesson, setSelectedTrialLesson] = useState<boolean | null>(null);

  const filters = useMemo(() => ({
    prefecture: selectedPrefecture || undefined,
    lessonTypes: selectedLessonTypes.length > 0 ? selectedLessonTypes : undefined,
    ageGroups: selectedAgeGroups.length > 0 ? selectedAgeGroups : undefined,
    features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
    weekdays: selectedWeekdays.length > 0 ? selectedWeekdays : undefined,
    trialLesson: selectedTrialLesson ?? undefined,
  }), [selectedPrefecture, selectedLessonTypes, selectedAgeGroups, selectedFeatures, selectedWeekdays, selectedTrialLesson]);

  const { classrooms, loading, fetchPublishedClassrooms } = useClassrooms();

  const handleSearch = () => {
    fetchPublishedClassrooms({
      area: selectedPrefecture,
      lessonTypes: selectedLessonTypes.length > 0 ? selectedLessonTypes : undefined,
      ageGroups: selectedAgeGroups.length > 0 ? selectedAgeGroups : undefined,
      features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
    });
  };

  return (
    <Layout title="ピアノ教室・リトミック教室を探す" className="bg-gray-50">
      {/* 検索フォーム */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>検索条件を選択してください</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* レッスンタイプ選択 */}
          <div>
            <h3 className="text-lg font-medium mb-3">レッスンタイプ</h3>
            <div className="flex flex-wrap gap-2">
              {LESSON_TYPES.map(type => (
                <Button
                  key={type.id}
                  variant={selectedLessonTypes.includes(type.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedLessonTypes(prev => 
                      prev.includes(type.id)
                        ? prev.filter(t => t !== type.id)
                        : [...prev, type.id]
                    );
                  }}
                  className="cursor-pointer"
                >
                  {translateLessonType(type.id)}
                </Button>
              ))}
            </div>
          </div>

          {/* 都道府県選択 */}
          <div>
            <h3 className="text-lg font-medium mb-3">都道府県</h3>
            <select 
              value={selectedPrefecture}
              onChange={(e) => setSelectedPrefecture(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">すべての都道府県</option>
              <option value="東京都">東京都</option>
              <option value="神奈川県">神奈川県</option>
              <option value="千葉県">千葉県</option>
              <option value="埼玉県">埼玉県</option>
              <option value="大阪府">大阪府</option>
              <option value="愛知県">愛知県</option>
              <option value="福岡県">福岡県</option>
              <option value="北海道">北海道</option>
              <option value="宮城県">宮城県</option>
              <option value="広島県">広島県</option>
            </select>
          </div>

          {/* 対象年齢選択 */}
          <div>
            <h3 className="text-lg font-medium mb-3">対象年齢</h3>
            <div className="flex flex-wrap gap-2">
              {AGE_GROUPS.map(group => (
                <Button
                  key={group.id}
                  variant={selectedAgeGroups.includes(group.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedAgeGroups(prev => 
                      prev.includes(group.id)
                        ? prev.filter(id => id !== group.id)
                        : [...prev, group.id]
                    );
                  }}
                  className="cursor-pointer"
                >
                  {translateAgeGroup(group.id)}
                </Button>
              ))}
            </div>
          </div>

          {/* 特徴選択 */}
          <div>
            <h3 className="text-lg font-medium mb-3">教室の特徴</h3>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map(feature => (
                <Button
                  key={feature.id}
                  variant={selectedFeatures.includes(feature.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedFeatures(prev => 
                      prev.includes(feature.id)
                        ? prev.filter(id => id !== feature.id)
                        : [...prev, feature.id]
                    );
                  }}
                  className="cursor-pointer"
                >
                  {translateFeature(feature.id)}
                </Button>
              ))}
            </div>
          </div>

          {/* 開講曜日選択 */}
          <div>
            <h3 className="text-lg font-medium mb-3">開講曜日</h3>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(day => (
                <Button
                  key={day.id}
                  variant={selectedWeekdays.includes(day.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedWeekdays(prev => 
                      prev.includes(day.id)
                        ? prev.filter(id => id !== day.id)
                        : [...prev, day.id]
                    );
                  }}
                  className="cursor-pointer"
                >
                  {translateWeekday(day.id)}
                </Button>
              ))}
            </div>
          </div>

          {/* 体験レッスン */}
          <div>
            <h3 className="text-lg font-medium mb-3">体験レッスン</h3>
            <div className="flex gap-2">
              <Button
                variant={selectedTrialLesson === true ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTrialLesson(selectedTrialLesson === true ? null : true)}
                className="cursor-pointer"
              >
                体験レッスンあり
              </Button>
              <Button
                variant={selectedTrialLesson === false ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTrialLesson(selectedTrialLesson === false ? null : false)}
                className="cursor-pointer"
              >
                体験レッスンなし
              </Button>
            </div>
          </div>

          {/* 検索ボタン */}
          <Button onClick={handleSearch} className="w-full">
            この条件で検索する
          </Button>
        </CardContent>
      </Card>

      {/* 検索結果 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">
          検索結果 {loading ? "読み込み中..." : `${classrooms?.length || 0}件`}
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>教室を検索中...</p>
        </div>
      ) : classrooms && classrooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <Card key={classroom.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">{classroom.name}</h3>
                
                {/* レッスンタイプ表示 */}
                {classroom.lesson_types && classroom.lesson_types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {classroom.lesson_types.map(type => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {translateLessonType(type)}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2 mb-4">
                  {classroom.area && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {classroom.area}
                    </div>
                  )}
                  
                  {classroom.available_days && classroom.available_days.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {classroom.available_days.map(day => translateWeekday(day)).join(", ")}
                    </div>
                  )}
                  
                  {classroom.age_range && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      {classroom.age_range}
                    </div>
                  )}
                  
                  {classroom.phone_number && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-1" />
                      {classroom.phone_number}
                    </div>
                  )}
                </div>
                
                {classroom.trial_lesson_available && (
                  <Badge className="bg-green-100 text-green-700 mb-3">
                    体験レッスンあり
                  </Badge>
                )}
                
                <Button asChild className="w-full cursor-pointer">
                  <Link to={`/classrooms/${classroom.id}`}>
                    詳細を見る
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              条件に合う教室が見つかりませんでした。
            </p>
            <p className="text-sm text-gray-500">
              検索条件を変更してお試しください。
            </p>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
};

export default Search;
