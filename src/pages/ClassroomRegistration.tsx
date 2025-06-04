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
  Star,
  Eye,
  EyeOff
} from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";
import { useSubscription } from "@/hooks/useSubscription";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

// existingClassroom state がDBの published 状態を保持できるように型を拡張
interface ExtendedClassroomFormValues extends ClassroomFormValues {
  publishedDbState?: boolean; // DBから読み込んだ実際の公開状態
  thumbnail_url?: string | null; // DBから読み込んだサムネイルURL
  image_urls?: string[] | null; // DBから読み込んだ画像URLリスト
}

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
  const [existingClassroom, setExistingClassroom] = useState<ExtendedClassroomFormValues | null>(null);
  const [publishStatus, setPublishStatus] = useState<'public' | 'draft'>('draft');
  
  // ObjectURLキャッシュ（メモリリーク防止）
  const objectUrlsRef = useRef<Map<File, string>>(new Map());
  
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading, refreshSubscriptionStatus } = useSubscription();
  const navigate = useNavigate();
  console.log('🔧 navigate function:', typeof navigate, navigate);
  console.log('👤 Current user from AuthProvider:', user);

  // 支払い状況と既存データに基づいて公開ステータスを初期化
  useEffect(() => {
    if (authLoading || subscriptionLoading || loading) {
      return;
    }

    if (existingClassroom) {
      // existingClassroom.publishedDbState を参照するように変更
      if (existingClassroom.publishedDbState) {
        setPublishStatus('public');
      } else {
        setPublishStatus('draft');
      }
    } else {
      if (subscription && subscription.hasActiveSubscription) {
        setPublishStatus('public');
      } else {
        setPublishStatus('draft');
      }
    }
  }, [existingClassroom, subscription, authLoading, subscriptionLoading, loading]);

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
      if (!user) { setLoading(false); return; }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("下書きデータ読み込みエラー:", error);
          toast({ title: "エラー", description: "データの読み込みに失敗しました。", variant: "destructive" });
          setLoading(false);
          return;
        }

        if (data) {
          const prefecture = (data.area && typeof data.area === 'string' && data.area.includes(' ')) ? data.area.split(' ')[0] : (data.area && typeof data.area === 'string' ? data.area : "");
          const city = (data.area && typeof data.area === 'string' && data.area.includes(' ')) ? data.area.split(' ').slice(1).join(' ') : "";
          
          const parseStringToArray = (value: unknown): string[] => {
            if (Array.isArray(value)) return value.filter(s => typeof s === 'string');
            if (value && typeof value === 'string' && value.trim().length > 0) {
              return value.split(',').map(s => s.trim()).filter(Boolean);
            }
            return [];
          };

          const lessonTypes = parseStringToArray(data.lesson_types);
          const targetAges = parseStringToArray(data.age_range);
          const availableDays = parseStringToArray(data.available_days);
          
          const formData: ClassroomFormValues = {
            name: data.name || "",
            description: data.description || "",
            prefecture: prefecture,
            city: city,
            address: data.address || "",
            phone: data.phone || "",
            email: data.email || "",
            website_url: data.website_url || "",
            lesson_types: lessonTypes,
            target_ages: targetAges,
            available_days: availableDays,
            available_times: data.available_times || "",
            price_range: data.price_range || "",
            instructor_info: data.instructor_info || "",
            pr_points: data.pr_points || "",
          };

          setExistingClassroom({ 
            ...formData, 
            publishedDbState: data.published,
            thumbnail_url: data.thumbnail_url,
            image_urls: data.image_urls
          });
          
          form.reset(formData);

          if (data.image_urls && Array.isArray(data.image_urls)) {
            setExistingImageUrls(data.image_urls);
            if (data.thumbnail_url && data.image_urls.includes(data.thumbnail_url)) {
                setThumbnailIndex(data.image_urls.indexOf(data.thumbnail_url));
            } else if (data.image_urls.length > 0) {
                setThumbnailIndex(0);
            }
              } else {
            setExistingImageUrls([]);
                setThumbnailIndex(0);
              }
          toast({ title: "下書き読み込み完了", description: "以前保存したデータを読み込みました。" });
        }
      } catch (error) {
        console.error("下書きデータ読み込み中に予期せぬエラー:", error);
        toast({ title: "エラー", description: "データの読み込み中に問題が発生しました。", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (user) { 
    loadDraftData();
    } else {
        setLoading(false); 
    }
  }, [user, form]);

  const uploadFileToSupabase = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const bucketName = 'classrooms';
      const filePath = `${userId}/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        toast({title: "画像アップロードエラー", description: `ファイル名: ${file.name} - ${uploadError.message}`, variant: "destructive"});
        return null;
      }
      if (!uploadData || !uploadData.path) {
        console.error('Storage upload error: No path returned');
        toast({title: "画像アップロードエラー", description: `ファイル名: ${file.name} - パス取得失敗`, variant: "destructive"});
        return null;
      }
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);
      return urlData.publicUrl;
    } catch (e) {
      console.error('File upload failed unexpectedly:', e);
      let desc = "予期せぬエラーが発生しました。";
      if (e instanceof Error) desc = e.message;
      toast({title: "画像アップロード例外", description: desc, variant: "destructive"});
      return null;
    }
  };

  // 統合された画像リストの取得 (JSX表示用)
  const getAllImages = (): (string | File)[] => {
    return [...existingImageUrls, ...images];
  };
      
  // 画像表示のためのURL取得（メモリリーク防止対応済み）
  const getImageUrl = (index: number): string => {
    const totalExistingImages = existingImageUrls.length;
    if (index < 0 || index >= getAllImages().length) {
      console.error(`getImageUrl: Invalid image index ${index}`);
      return ""; // Return a placeholder or empty string
    }
    
    if (index < totalExistingImages) {
      return existingImageUrls[index];
    } else {
      const file = images[index - totalExistingImages];
      if (!(file instanceof File)) {
        console.error(`getImageUrl: Invalid file object at new image index ${index - totalExistingImages}`);
        return "";
      }
      if (!objectUrlsRef.current.has(file)) {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.set(file, url);
      }
      return objectUrlsRef.current.get(file)!;
    }
  };

  const handleRemoveImage = (indexToRemove: number) => { // 'type' argument removed as it's implicit
    const totalExistingImages = existingImageUrls.length;
    const totalImages = getAllImages().length;
    
    if (indexToRemove < 0 || indexToRemove >= totalImages) {
      console.error(`handleRemoveImage: Invalid image index: ${indexToRemove}`);
      toast({ title: "エラー", description: "無効な画像インデックスです", variant: "destructive" });
      return;
    }
    
    try {
      if (indexToRemove < totalExistingImages) {
        setExistingImageUrls(prev => prev.filter((_, i) => i !== indexToRemove));
      } else {
        const newImageIndex = indexToRemove - totalExistingImages;
        const fileToRemove = images[newImageIndex];
        if (objectUrlsRef.current.has(fileToRemove)) {
          URL.revokeObjectURL(objectUrlsRef.current.get(fileToRemove)!);
          objectUrlsRef.current.delete(fileToRemove);
        }
        setImages(prev => prev.filter((_, i) => i !== newImageIndex));
      }
      
      if (thumbnailIndex === indexToRemove) {
        setThumbnailIndex(totalImages - 1 > 0 ? 0 : 0);
      } else if (thumbnailIndex > indexToRemove) {
        setThumbnailIndex(prev => Math.max(0, prev - 1));
      }
      if (totalImages === 1) { // If the last image was removed
        setThumbnailIndex(0); // Reset thumbnail index
      }
    } catch (error) {
      console.error('Image removal error:', error);
      toast({ title: "エラー", description: "画像の削除に失敗しました", variant: "destructive" });
    }
  };

  const handleThumbnailSelect = (index: number) => {
    const totalImages = getAllImages().length;
    if (index >= 0 && index < totalImages) {
      setThumbnailIndex(index);
    } else {
      console.warn('handleThumbnailSelect: Invalid index ' + index + ' for ' + totalImages + ' images.');
    }
  };
  
  const onSubmit = async (data: ClassroomFormValues) => {
    if (!user) {
      toast({ title: "エラー", description: "ログインが必要です", variant: "destructive" });
      return;
    }

    if (publishStatus === 'public' && !(subscription && subscription.hasActiveSubscription)) {
      toast({
        title: "公開できません",
        description: "教室情報を公開するには、料金プランへのお支払いが必要です。",
      });
      return;
    }

    setIsSubmitting(true);
    console.log("フォーム送信データ:", data);
    console.log("選択された公開ステータス:", publishStatus);

    try {
      let newUploadedUrls: string[] = [];
      if (images.length > 0) {
        const uploadPromises: Promise<string | null>[] = images.map(file => uploadFileToSupabase(file, user.id)); 
        const newlyUploadedNullable = await Promise.all(uploadPromises);
        newUploadedUrls = newlyUploadedNullable.filter(url => url !== null) as string[];
      }
      
      const finalImageUrls = [...existingImageUrls, ...newUploadedUrls]; 
      let currentThumbnailUrl: string | null = existingClassroom?.thumbnail_url || null;
      
      if (finalImageUrls.length > 0) {
        if (thumbnailIndex < existingImageUrls.length) {
          currentThumbnailUrl = existingImageUrls[thumbnailIndex];
      } else {
          const newImageBaseIndex = existingImageUrls.length;
          const newImageSelectionIndex = thumbnailIndex - newImageBaseIndex;
          if (newImageSelectionIndex >= 0 && newImageSelectionIndex < newUploadedUrls.length) {
            currentThumbnailUrl = newUploadedUrls[newImageSelectionIndex];
          } else {
            currentThumbnailUrl = finalImageUrls[0]; 
      }
    }
      } else { currentThumbnailUrl = null; }

      const classroomDataToSave = {
        user_id: user.id,
        name: data.name,
        description: data.description,
        area: `${data.prefecture} ${data.city}`,
        address: data.address,
        phone: data.phone || null,
        email: data.email,
        website_url: data.website_url || null,
        lesson_types: data.lesson_types,
        age_range: data.target_ages.join(', '),
        image_urls: finalImageUrls.length > 0 ? finalImageUrls : null,
        thumbnail_url: currentThumbnailUrl,
        available_days: data.available_days,
        available_times: data.available_times || null,
        price_range: data.price_range,
        instructor_info: data.instructor_info || null,
        pr_points: data.pr_points || null,
        published: publishStatus === 'public',
        draft_saved: publishStatus === 'draft',
      };
      console.log("保存する教室データ:", classroomDataToSave);

      let supabaseError = null;
      if (existingClassroom) {
        const { error } = await supabase
          .from('classrooms')
          .update(classroomDataToSave)
          .eq('user_id', user.id); // 既存の教室はuser_idで一意に特定
        supabaseError = error;
      } else {
        const { error } = await supabase
          .from('classrooms')
          .insert(classroomDataToSave);
        supabaseError = error;
      }

      if (supabaseError) {
        throw supabaseError;
      }

      toast({
        title: "成功",
        description: `教室情報が${publishStatus === 'public' ? '公開' : '下書き保存'}されました。`,
      });
      await refreshSubscriptionStatus();
      images.forEach(file => { // 新規アップロードした画像のObjectURLを解放
        const url = objectUrlsRef.current.get(file);
        if (url) {
          URL.revokeObjectURL(url);
          objectUrlsRef.current.delete(file);
        }
      });
      setImages([]); // 新規画像リストをクリア
      navigate('/dashboard');
      
    } catch (error: unknown) {
      console.error("教室情報の保存エラー:", error);
      let errorMessage = "教室情報の保存に失敗しました。";
      if (error instanceof Error) {
        errorMessage = `教室情報の保存に失敗しました: ${error.message}`;
      }
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!user) {
    return null;
  }

  const canPublish = subscription && subscription.hasActiveSubscription;

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
                      <Input placeholder="例：ABC音楽教室" {...field} data-testid="classroom-name" />
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
                      <Textarea placeholder="教室の特徴やレッスン内容などを詳しく説明してください" {...field} rows={8} data-testid="classroom-description" />
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
                          onChange={(e) => { // This onChange handles file selection
                            if (e.target.files) {
                              const newFiles = Array.from(e.target.files);
                              const currentTotalImages = getAllImages().length; // Use getAllImages here
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
                          }}
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
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleThumbnailSelect(index); }}
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
                      <select {...field} className="w-full p-2 border border-gray-300 rounded-md" data-testid="classroom-prefecture">
                        <option value="">選択してください</option>
                        {prefectures.map(pref => (
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
                      <Input placeholder="例：渋谷区" {...field} data-testid="classroom-city" />
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
                    <FormLabel>番地以降の住所 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例：神南1-1-1 ABCビル2F" {...field} data-testid="classroom-address" />
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
                      <Input placeholder="例：03-1234-5678" {...field} data-testid="classroom-phone" />
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
                      <Input placeholder="info@example.com" {...field} data-testid="classroom-email" />
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
                    <FormLabel>ウェブサイトURL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} data-testid="classroom-website" />
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
                                    data-testid={`lesson-type-${type.id}`}
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
                                    data-testid={`target-age-${age.id}`}
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
                    <FormLabel>料金目安（月謝など）*</FormLabel>
                    <FormControl>
                      <Input placeholder="例：月謝8,000円〜12,000円" {...field} data-testid="classroom-price-range" />
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

          {/* 公開ステータス選択UI */} 
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <Eye className="mr-2 h-5 w-5 text-sky-600" /> 公開設定
            </h3>
            <div className="flex items-center space-x-2 p-4 border rounded-md bg-gray-50">
              <Switch
                id="publish-status-switch"
                checked={publishStatus === 'public'}
                onCheckedChange={(checked) => {
                  setPublishStatus(checked ? 'public' : 'draft');
                }}
                disabled={!canPublish && publishStatus === 'draft'} // 未払いで下書き状態の場合、公開への変更を不可
                data-testid="publish-status-switch"
              />
              <Label htmlFor="publish-status-switch" className="flex-grow">
                {publishStatus === 'public' ? "教室を公開する" : "下書きとして保存"}
              </Label>
              {!canPublish && (
                <p className="text-xs text-orange-600 bg-orange-100 p-2 rounded-md">
                  <Info className="inline mr-1 h-4 w-4" />
                  教室を公開するには、まず料金プランへのお支払いが必要です。
                  {existingClassroom && publishStatus === 'public' && (
                      " 現在は公開されていますが、下書きにすると再公開には支払いが必要です。"
                  )}
                </p>
              )}
          </div>
            {canPublish && publishStatus === 'draft' && (
               <p className="text-xs text-gray-500 pl-1">
                  これをオンにすると、保存時に教室情報が公開されます。
               </p>
            )}
            {canPublish && publishStatus === 'public' && (
               <p className="text-xs text-gray-500 pl-1">
                  これをオフにすると、保存時に教室情報は下書き（非公開）になります。
               </p>
            )}
          </div>

          <Separator />

          <Button 
            type="submit" 
            disabled={isSubmitting || !form.formState.isValid}
            data-testid="submit-classroom-registration"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white text-lg py-3 rounded-lg transition duration-150 ease-in-out flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-5 w-5 animate-spin" /> 送信中...
              </>
            ) : (
              <>
                <School className="mr-2 h-5 w-5" /> 
                {publishStatus === 'public' ? (existingClassroom ? "更新して公開" : "登録して公開") : (existingClassroom ? "更新して下書き保存" : "登録して下書き保存")}
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
    </Layout>
  );
};

export default ClassroomRegistration;
