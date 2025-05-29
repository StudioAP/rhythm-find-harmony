import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
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
  Info,
  Star
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AGE_GROUPS, LESSON_TYPES, WEEKDAYS } from "@/constants/classroomData";
import Layout from "@/components/layout/Layout";

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

// 型定義の追加
interface DatabaseClassroom {
  id: string;
  name: string;
  description: string;
  area: string;
  address: string;
  phone: string | null;
  email: string;
  website_url: string | null;
  lesson_types: string[];
  age_range: string;
  image_urls: string[] | null;
  thumbnail_url: string | null;
  available_days: string[];
  available_times: string | null;
  price_range: string;
  instructor_info: string | null;
  pr_points: string | null;
  monthly_fee_min: number | null;
  monthly_fee_max: number | null;
  trial_lesson_available: boolean;
  parking_available: boolean;
  published: boolean;
  draft_saved: boolean;
  last_draft_saved_at: string | null;
  updated_at: string;
  user_id: string;
}

const ClassroomRegistration = () => {
  const [images, setImages] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingClassroom, setExistingClassroom] = useState<ClassroomFormValues | null>(null);
  
  // ObjectURLキャッシュ（メモリリーク防止）
  const objectUrlsRef = useRef<Map<File, string>>(new Map());
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // 認証チェック（認証状態確定後のみ）
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "ログインが必要です",
        description: "教室登録にはアカウントが必要です",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      // 全てのObjectURLをクリーンアップ
      objectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      objectUrlsRef.current.clear();
    };
  }, []);

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

  // 既存の下書きデータを読み込み
  useEffect(() => {
    const loadDraftData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('下書きデータ取得エラー:', error);
          toast({
            title: "データ読み込みエラー",
            description: "下書きデータの読み込みに失敗しました",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          // データベースのカラム名をフォーム形式に変換
          const formData: ClassroomFormValues = {
            name: data.name || "",
            description: data.description || "",
            prefecture: data.area?.split(' ')[0] || "", // "東京都 渋谷区" → "東京都"
            city: data.area?.split(' ').slice(1).join(' ') || "", // "東京都 渋谷区" → "渋谷区"
            address: data.address || "",
            phone: data.phone || "",
            email: data.email || "",
            website_url: data.website_url || "",
            lesson_types: Array.isArray(data.lesson_types) ? data.lesson_types : [],
            target_ages: data.age_range ? data.age_range.split(', ').map((age: string) => age.trim()).filter(Boolean) : [],
            available_days: Array.isArray(data.available_days) ? data.available_days : [],
            available_times: data.available_times || "",
            price_range: data.price_range || (data.monthly_fee_min && data.monthly_fee_max 
              ? `月謝${data.monthly_fee_min}円〜${data.monthly_fee_max}円`
              : ""),
            instructor_info: data.instructor_info || "",
            pr_points: data.pr_points || "",
          };

          setExistingClassroom(formData);
          
          // フォームに既存データを設定
          form.reset(formData);

          // 既存画像データを復元
          if (data.image_urls && Array.isArray(data.image_urls) && data.image_urls.length > 0) {
            // 有効な画像URLのみを保存
            const validImageUrls = data.image_urls.filter(url => typeof url === 'string' && url.length > 0);
            setExistingImageUrls(validImageUrls);
            
            // サムネイル選択状態を復元
            if (data.thumbnail_url && typeof data.thumbnail_url === 'string') {
              const thumbnailIdx = validImageUrls.findIndex(url => url === data.thumbnail_url);
              if (thumbnailIdx !== -1) {
                setThumbnailIndex(thumbnailIdx);
              } else {
                // サムネイルURLが配列に見つからない場合は最初の画像をサムネイルに
                setThumbnailIndex(0);
              }
            }
          }

          toast({
            title: "下書きデータを読み込みました",
            description: "保存済みの教室情報を表示しています",
          });
        }
      } catch (error) {
        console.error('下書きデータ読み込みエラー:', error);
        toast({
          title: "エラー",
          description: "データの読み込み中にエラーが発生しました",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDraftData();
  }, [user, form]);

  // 画像アップロード処理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const currentTotalImages = existingImageUrls.length + images.length;
      
      // 5枚制限チェック
      if (currentTotalImages + newFiles.length > 5) {
        toast({
          title: "画像枚数制限",
          description: `画像は最大5枚まで登録できます。現在${currentTotalImages}枚登録済みです。`,
          variant: "destructive",
        });
        return;
      }
      
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  // 画像削除処理
  const handleRemoveImage = (index: number) => {
    const totalExistingImages = existingImageUrls.length;
    const totalImages = getAllImages().length;
    
    // 境界チェック
    if (index < 0 || index >= totalImages) {
      console.error(`Invalid image index for removal: ${index}`);
      toast({
        title: "エラー",
        description: "無効な画像インデックスです",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (index < totalExistingImages) {
        // 既存画像の削除
        const removedUrl = existingImageUrls[index];
        setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
        
        console.log(`Removed existing image at index ${index}: ${removedUrl}`);
        
      } else {
        // 新規画像の削除
        const newImageIndex = index - totalExistingImages;
        if (newImageIndex < 0 || newImageIndex >= images.length) {
          throw new Error(`Invalid new image index: ${newImageIndex}`);
        }
        
        const fileToRemove = images[newImageIndex];
        
        // ObjectURLクリーンアップ
        if (objectUrlsRef.current.has(fileToRemove)) {
          const url = objectUrlsRef.current.get(fileToRemove)!;
          URL.revokeObjectURL(url);
          objectUrlsRef.current.delete(fileToRemove);
          console.log(`Cleaned up ObjectURL for file: ${fileToRemove.name}`);
        }
        
        setImages(prev => prev.filter((_, i) => i !== newImageIndex));
      }
      
      // サムネイルインデックスの適切な調整
      if (thumbnailIndex === index) {
        // 削除された画像がサムネイルの場合、最初の画像をサムネイルに
        const newTotalImages = totalImages - 1;
        setThumbnailIndex(newTotalImages > 0 ? 0 : 0);
      } else if (thumbnailIndex > index) {
        // サムネイルより前の画像が削除された場合、インデックスを1つ前に
        setThumbnailIndex(prev => Math.max(0, prev - 1));
      }
      
      // 全画像削除時の処理
      if (totalImages === 1) {
        setThumbnailIndex(0);
      }
      
    } catch (error) {
      console.error('Image removal error:', error);
      toast({
        title: "エラー",
        description: "画像の削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  // 統合された画像リストの取得
  const getAllImages = (): (string | File)[] => {
    return [...existingImageUrls, ...images];
  };

  // 画像表示のためのURL取得（メモリリーク防止）
  const getImageUrl = (index: number): string => {
    const totalExistingImages = existingImageUrls.length;
    if (index < 0 || index >= getAllImages().length) {
      throw new Error(`Invalid image index: ${index}`);
    }
    
    if (index < totalExistingImages) {
      return existingImageUrls[index];
    } else {
      const file = images[index - totalExistingImages];
      if (!(file instanceof File)) {
        throw new Error(`Invalid file object at index: ${index}`);
      }
      
      // キャッシュから取得、なければ新しく作成
      if (!objectUrlsRef.current.has(file)) {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.set(file, url);
      }
      return objectUrlsRef.current.get(file)!;
    }
  };

  // Supabase Storage に画像をアップロードし、公開URLを取得する関数を追加
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    // 'classroom-images' バケットにアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('classroom-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage
      .from('classroom-images')
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  // 下書き保存処理（無料機能）
  const saveDraft = async (data: ClassroomFormValues) => {
    if (!user) {
      toast({
        title: "エラー",
        description: "ログインが必要です",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log("下書き保存データ:", data);
    
    // 画像処理：既存画像URLsと新規画像アップロードを統合
    let image_urls: string[] = [...existingImageUrls]; // 既存画像URLをベースに
    let thumbnail_url: string | null = null;
    
    // 新規画像があればアップロード
    if (images.length > 0) {
      try {
        const newUrls = await Promise.all(images.map(uploadImage));
        image_urls = [...image_urls, ...newUrls];
      } catch (error) {
        toast({
          title: "画像アップロードに失敗しました",
          description: "画像をアップロードできませんでした。",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }
    
    // サムネイル設定（境界チェック強化）
    if (image_urls.length > 0) {
      // thumbnailIndexが有効範囲内かチェック
      if (thumbnailIndex >= 0 && thumbnailIndex < image_urls.length) {
        thumbnail_url = image_urls[thumbnailIndex];
      } else {
        // 無効な場合は最初の画像をサムネイルに
        thumbnail_url = image_urls[0];
        setThumbnailIndex(0);
      }
    }

    try {
      // フォームデータをデータベース形式に変換
      const classroomData = {
        user_id: user.id,
        name: data.name,
        description: data.description,
        area: `${data.prefecture} ${data.city}`, // "東京都 渋谷区"
        address: data.address,
        phone: data.phone || null,
        email: data.email,
        website_url: data.website_url || null,
        lesson_types: data.lesson_types,
        age_range: data.target_ages.join(', '), // 配列を文字列に変換
        image_urls: image_urls.length > 0 ? image_urls : null,
        thumbnail_url,
        available_days: data.available_days,
        available_times: data.available_times || null,
        price_range: data.price_range,
        instructor_info: data.instructor_info || null,
        pr_points: data.pr_points || null,
        monthly_fee_min: null, // 後で料金解析実装予定
        monthly_fee_max: null,
        trial_lesson_available: false,
        parking_available: false,
        published: false, // 下書きは非公開
        draft_saved: true, // 下書き保存フラグ
        last_draft_saved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 既存レコードがあるかチェック
      const { data: existingData } = await supabase
        .from('classrooms')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingData) {
        // 更新
        const { error } = await supabase
          .from('classrooms')
          .update(classroomData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await supabase
          .from('classrooms')
          .insert([classroomData]);

        if (error) throw error;
      }

      toast({
        title: "保存完了",
        description: "下書きとして保存しました。いつでも編集・公開できます。",
      });

      // 新規画像のObjectURLをクリーンアップ
      images.forEach(file => {
        if (objectUrlsRef.current.has(file)) {
          const url = objectUrlsRef.current.get(file)!;
          URL.revokeObjectURL(url);
          objectUrlsRef.current.delete(file);
        }
      });
      
      // 保存成功後、新規画像をexistingImageUrlsに移行
      if (images.length > 0) {
        setExistingImageUrls(image_urls);
        setImages([]);
      }

      // ダッシュボードへリダイレクト
      navigate("/dashboard");
      
    } catch (error) {
      console.error("下書き保存エラー:", error);
      toast({
        title: "エラー",
        description: "下書き保存に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // フォーム送信処理（下書き保存として扱う）
  const onSubmit = async (data: ClassroomFormValues) => {
    await saveDraft(data);
  };

  // サムネイル選択処理（境界チェック付き）
  const handleThumbnailSelect = (index: number) => {
    const totalImages = getAllImages().length;
    if (index >= 0 && index < totalImages) {
      setThumbnailIndex(index);
    }
  };

  // ローディング中の表示
  if (loading || authLoading) {
    return (
      <Layout showBreadcrumb={false}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 未認証の場合は何も表示しない（リダイレクト処理中）
  if (!user) {
    return null;
  }

  return (
    <Layout title={existingClassroom ? '教室情報編集' : '教室情報登録'}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-muted-foreground">
            {existingClassroom 
              ? '保存済みの教室情報を編集できます。' 
              : 'あなたの教室情報を登録して、生徒さんとの出会いを広げましょう。'
            }
            {!existingClassroom && '登録後、月額500円のお支払いで情報が公開されます。'}
          </p>
          {existingClassroom && (
            <p className="text-sm text-blue-600 mt-2">
              💡 下書きが保存されています。公開するには管理画面で決済を完了してください。
          </p>
          )}
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

                  {getAllImages().length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">登録画像（{getAllImages().length}枚）</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {getAllImages().map((_, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={getImageUrl(index)}
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
                            {/* サムネイル選択ボタン */}
                            <button
                              type="button"
                              onClick={() => handleThumbnailSelect(index)}
                              className={`absolute bottom-1 left-1 p-1 rounded-full transition-opacity ${index === thumbnailIndex ? 'bg-blue-500' : 'bg-gray-500/70'}`}
                            >
                              <Star className="h-4 w-4 text-white" />
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
                        {LESSON_TYPES.map((type) => (
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
                        {AGE_GROUPS.map((age) => (
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
                        {WEEKDAYS.map((day) => (
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
                {isSubmitting ? "保存中..." : existingClassroom ? "変更を保存" : "下書きとして保存"}
              </Button>
              <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                  💡 無料で下書き保存できます。公開は管理画面から月額500円でスタート！
                </p>
                <p className="text-xs text-gray-400">
                  保存後はいつでも編集・修正が可能です
              </p>
              </div>
              <Link to="/dashboard" className="text-sm text-primary hover:underline">
                管理画面へ戻る
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
};

export default ClassroomRegistration;
