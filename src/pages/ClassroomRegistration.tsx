
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { 
  School, 
  ImageUp, 
  CalendarDays, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  Info 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

// 都道府県一覧
const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

// 曜日一覧
const weekdays = [
  { id: "monday", label: "月曜日" },
  { id: "tuesday", label: "火曜日" },
  { id: "wednesday", label: "水曜日" },
  { id: "thursday", label: "木曜日" },
  { id: "friday", label: "金曜日" },
  { id: "saturday", label: "土曜日" },
  { id: "sunday", label: "日曜日" }
];

// 対象年齢
const targetAges = [
  { id: "toddler", label: "幼児（0-6歳）" },
  { id: "elementary", label: "小学生" },
  { id: "junior_high", label: "中学生" },
  { id: "high_school", label: "高校生" },
  { id: "adult", label: "大人" },
  { id: "senior", label: "シニア" }
];

// レッスンタイプ
const lessonTypes = [
  { id: "piano", label: "ピアノ" },
  { id: "eurythmics", label: "リトミック" },
  { id: "solfege", label: "ソルフェージュ" },
  { id: "ensemble", label: "アンサンブル" },
  { id: "composition", label: "作曲" }
];

// フォームのバリデーションスキーマ
const formSchema = z.object({
  name: z.string().min(1, { message: "教室名を入力してください" }),
  description: z.string().min(10, { message: "最低10文字以上の説明文を入力してください" }),
  prefecture: z.string({ required_error: "都道府県を選択してください" }),
  city: z.string().min(1, { message: "市区町村を入力してください" }),
  address: z.string().min(1, { message: "住所を入力してください" }),
  phone: z.string().optional(),
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  website_url: z.string().url({ message: "有効なURLを入力してください" }).optional(),
  lesson_types: z.array(z.string()).min(1, { message: "少なくとも1つのレッスンタイプを選択してください" }),
  target_ages: z.array(z.string()).min(1, { message: "少なくとも1つの対象年齢を選択してください" }),
  available_days: z.array(z.string()).min(1, { message: "少なくとも1つの曜日を選択してください" }),
  available_times: z.string().optional(),
  price_range: z.string().min(1, { message: "料金目安を入力してください" }),
  instructor_info: z.string().optional(),
  pr_points: z.string().optional(),
});

type ClassroomFormValues = z.infer<typeof formSchema>;

const ClassroomRegistration = () => {
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フォームの初期化
  const form = useForm<ClassroomFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      prefecture: "",
      city: "",
      address: "",
      phone: "",
      email: "",
      website_url: "",
      lesson_types: [],
      target_ages: [],
      available_days: [],
      available_times: "",
      price_range: "",
      instructor_info: "",
      pr_points: "",
    },
  });

  // 画像アップロード処理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  // 画像削除処理
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // フォーム送信処理
  const onSubmit = async (data: ClassroomFormValues) => {
    setIsSubmitting(true);
    console.log("送信データ:", data);
    console.log("アップロード画像:", images);
    
    try {
      // Supabase連携後に実装予定：教室情報の保存とファイルアップロード
      
      // 模擬遅延
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 完了メッセージ
      alert("教室情報が登録されました。公開には月額料金のお支払いが必要です。");
      
    } catch (error) {
      console.error("エラー:", error);
      alert("登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">教室情報登録</h1>
        <p className="text-muted-foreground">
          あなたの教室情報を登録して、生徒さんとの出会いを広げましょう。
          登録後、月額500円のお支払いで情報が公開されます。
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* 基本情報セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School size={20} />
                基本情報
              </CardTitle>
              <CardDescription>教室の基本的な情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>教室名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例：〇〇ピアノ教室" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>教室の説明 *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="教室の特徴や雰囲気、指導方針などを記入してください" 
                        {...field} 
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <div>
                  <FormLabel>写真アップロード</FormLabel>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageUp className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            クリックまたはドラッグで画像をアップロード
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG (最大5MB)
                          </p>
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {images.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">アップロード済み画像（{images.length}枚）</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`教室画像 ${index + 1}`}
                            className="h-24 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 所在地セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={20} />
                所在地
              </CardTitle>
              <CardDescription>教室の住所情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="prefecture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>都道府県 *</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">選択してください</option>
                        {prefectures.map((pref) => (
                          <option key={pref} value={pref}>
                            {pref}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>市区町村 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例：渋谷区" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>番地・建物名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例：1-2-3 〇〇ビル2F" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 連絡先セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone size={20} />
                連絡先
              </CardTitle>
              <CardDescription>生徒さんが連絡できる方法を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電話番号</FormLabel>
                    <FormControl>
                      <Input placeholder="例：03-1234-5678" {...field} />
                    </FormControl>
                    <FormDescription>
                      公開したくない場合は空欄でも構いません
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス *</FormLabel>
                    <FormControl>
                      <Input placeholder="例：info@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ウェブサイト</FormLabel>
                    <FormControl>
                      <Input placeholder="例：https://www.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* レッスン情報セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info size={20} />
                レッスン情報
              </CardTitle>
              <CardDescription>レッスンの詳細を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="lesson_types"
                render={() => (
                  <FormItem>
                    <FormLabel>レッスンの種類 *</FormLabel>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {lessonTypes.map((type) => (
                        <FormField
                          key={type.id}
                          control={form.control}
                          name="lesson_types"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={type.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(type.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, type.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== type.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {type.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_ages"
                render={() => (
                  <FormItem>
                    <FormLabel>対象年齢 *</FormLabel>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {targetAges.map((age) => (
                        <FormField
                          key={age.id}
                          control={form.control}
                          name="target_ages"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={age.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(age.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, age.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== age.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {age.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available_days"
                render={() => (
                  <FormItem>
                    <FormLabel>レッスン可能曜日 *</FormLabel>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {weekdays.map((day) => (
                        <FormField
                          key={day.id}
                          control={form.control}
                          name="available_days"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={day.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, day.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== day.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {day.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available_times"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>レッスン時間帯</FormLabel>
                    <FormControl>
                      <Input placeholder="例：平日10:00-18:00、土日10:00-15:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>料金目安 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例：月謝8,000円〜12,000円、入会金5,000円" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 追加情報セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                追加情報
              </CardTitle>
              <CardDescription>その他のPR情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="instructor_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>講師紹介</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="講師の経歴や実績、指導方針などを記入してください" 
                        {...field}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pr_points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PRポイント</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="教室の特長や強み、他教室との差別化ポイントなどを記入してください" 
                        {...field}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 送信ボタン */}
          <div className="flex flex-col gap-4 items-center">
            <Button type="submit" className="w-full max-w-md" disabled={isSubmitting}>
              {isSubmitting ? "送信中..." : "教室情報を登録する"}
            </Button>
            <p className="text-sm text-muted-foreground">
              登録後、管理画面から月額500円のお支払いで情報が公開されます
            </p>
            <Link to="/dashboard" className="text-sm text-primary hover:underline">
              すでに登録済みの方はこちら（ダッシュボードへ）
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ClassroomRegistration;
